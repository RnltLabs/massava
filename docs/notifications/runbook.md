# Notification System Troubleshooting Runbook

**Last Updated**: December 2, 2025
**Version**: 1.0
**Maintainers**: Development Team

## Table of Contents
1. [Common Issues](#common-issues)
2. [Monitoring Queries](#monitoring-queries)
3. [Health Checks](#health-checks)
4. [Escalation Path](#escalation-path)
5. [Recovery Procedures](#recovery-procedures)
6. [Quick Reference](#quick-reference)

---

## Common Issues

### Issue 1: Notifications Not Being Delivered

#### Symptoms
- Users report not receiving notifications they should have
- Notification appears in database with status `PENDING` or `SENT` but user didn't receive it
- Large number of notifications stuck in queue
- Backend logs show successful creation but no delivery events

#### Possible Causes
1. **User preferences disabled** - User has disabled notification type
2. **Quiet hours active** - Notification scheduled during user's quiet hours
3. **QStash queue issue** - Messages not being processed from queue
4. **SSE connection issue** - Real-time delivery stream disconnected
5. **User not logged in** - User session expired, SSE stream closed
6. **Rate limiting** - Notifications being rejected due to rate limits
7. **Database query timeout** - Slow queries preventing notification retrieval
8. **Invalid channel configuration** - Email/Push channel not properly configured

#### Diagnostic Steps

**Step 1: Check notification status in database**
```sql
-- Find notifications for a specific user that haven't been delivered
SELECT
  id,
  type,
  status,
  channels,
  "createdAt",
  "updatedAt",
  metadata
FROM "Notification"
WHERE "userId" = 'USER_ID'
  AND status != 'DELIVERED'
  AND "createdAt" > NOW() - INTERVAL '24 hours'
ORDER BY "createdAt" DESC
LIMIT 20;

-- Count by status to see distribution
SELECT
  status,
  COUNT(*) as count
FROM "Notification"
WHERE "userId" = 'USER_ID'
GROUP BY status;
```

**Step 2: Check user notification preferences**
```sql
-- Check if user has disabled notification types
SELECT
  "userId",
  type,
  "isEnabled",
  channels,
  "quietHoursStart",
  "quietHoursEnd",
  timezone,
  "createdAt"
FROM "NotificationPreference"
WHERE "userId" = 'USER_ID';

-- Check if specific type is disabled
SELECT "isEnabled"
FROM "NotificationPreference"
WHERE "userId" = 'USER_ID'
  AND type = 'BOOKING_REQUEST_RECEIVED';
```

**Step 3: Check if notification is in quiet hours**
```sql
-- Check user's timezone and quiet hours
SELECT
  timezone,
  "quietHoursStart",
  "quietHoursEnd"
FROM "NotificationPreference"
WHERE "userId" = 'USER_ID';
```

**Step 4: Check QStash queue status**
```bash
# Check queue metrics via QStash API
curl -X GET "https://api.upstash.io/v2/publish/stats" \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN" \
  -H "Content-Type: application/json"

# Check for failed messages in QStash
curl -X GET "https://api.upstash.io/v2/publish/failed" \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN" \
  -H "Content-Type: application/json"
```

**Step 5: Check application logs for errors**
```bash
# Look for notification processing errors
grep -r "NOTIFICATION.*ERROR\|QUEUE_ERROR\|DELIVERY_ERROR" logs/ --include="*.log"

# Check for specific notification ID
grep "NOTIFICATION_ID" logs/ -r

# Check for rate limiting errors
grep "RATE_LIMITED" logs/ -r | grep "USER_ID"
```

**Step 6: Check SSE stream connectivity**
```bash
# Check if SSE connections are being established
grep "createSSEStream\|GET /api/notifications/stream" logs/ -r | tail -20

# Look for SSE connection drops
grep "SSE.*disconnected\|stream.*closed" logs/ -r
```

#### Resolution Steps

**If notification preferences are disabled:**
```bash
# Enable notifications for user (via database)
UPDATE "NotificationPreference"
SET "isEnabled" = true
WHERE "userId" = 'USER_ID'
  AND type = 'NOTIFICATION_TYPE';

# Or via API (recommended)
curl -X PUT "http://localhost:3000/api/notifications/preferences" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "BOOKING_REQUEST_RECEIVED",
    "isEnabled": true
  }'
```

**If notifications are stuck in queue:**
1. Check QStash dashboard for failed messages
2. Verify QStash API token is valid and has correct permissions
3. Check that webhook URL is accessible from QStash
4. If messages are dead-lettered:
   ```bash
   # Move messages from dead-letter queue back to main queue
   # Via QStash API (contact support if needed)
   ```

**If SSE connection is dropping:**
1. Check network connectivity between client and server
2. Verify server is not rate limiting SSE endpoints
3. Check for WebSocket/SSE proxy issues in CDN configuration
4. Increase heartbeat interval if connections are flaky:
   ```typescript
   // In app/api/notifications/stream/route.ts
   const stream = createSSEStream(
     session.user.id,
     request.signal,
     { heartbeatInterval: 60000, pollInterval: 2000 } // Increased from 30000
   );
   ```

**If rate limiting is blocking notifications:**
1. Check rate limit configuration in `/lib/middleware/api-rate-limiter.ts`
2. Verify limits are appropriate for your user base
3. If limits are too strict, adjust:
   ```typescript
   export const NOTIFICATION_RATE_LIMITS = {
     createNotification: {
       limit: 100,  // Adjust this
       window: '1h',
     },
   };
   ```

#### Prevention Measures

1. **Monitor notification delivery pipeline**
   - Set up alerts for notifications stuck in `PENDING` status > 5 minutes
   - Monitor QStash API response times
   - Track delivery success rates per channel

2. **User education**
   - Remind users to check notification preferences
   - Document quiet hours feature in help center

3. **Queue resilience**
   - Implement exponential backoff for retries
   - Set appropriate TTL for failed messages
   - Monitor dead-letter queue regularly

4. **Logging and monitoring**
   - Log all notification state transitions
   - Include correlation IDs in all logs
   - Set up dashboards for delivery metrics

---

### Issue 2: Push Notifications Not Received on Device

#### Symptoms
- Notifications created and marked as `DELIVERED` in database
- No push notification appears on user's mobile device
- Push notification received on some devices but not others
- Device token appears valid but messages aren't reaching the device

#### Possible Causes
1. **Invalid or expired device token** - Firebase token no longer valid
2. **Firebase connectivity issue** - Firebase service unreachable
3. **Push notification disabled on device** - User disabled notifications in OS
4. **Incorrect Firebase credentials** - Wrong project or credentials
5. **Device offline** - Device not connected to network at delivery time
6. **Token mismatch** - Token registered for different Firebase project
7. **Payload too large** - Push notification payload exceeds Firebase limits (4KB)
8. **Invalid TTL** - Message already expired before reaching device

#### Diagnostic Steps

**Step 1: Check device tokens in database**
```sql
-- Find all devices for a user
SELECT
  id,
  "userId",
  token,
  "deviceType",
  "isActive",
  "lastUsedAt",
  "createdAt",
  "updatedAt"
FROM "NotificationDevice"
WHERE "userId" = 'USER_ID'
ORDER BY "lastUsedAt" DESC;

-- Check if token looks valid (Firebase tokens are long base64 strings)
SELECT
  token,
  LENGTH(token) as token_length,
  "deviceType"
FROM "NotificationDevice"
WHERE "userId" = 'USER_ID'
  AND token ~ '^[A-Za-z0-9_-]+$'
ORDER BY "lastUsedAt" DESC;

-- Find inactive or potentially expired tokens
SELECT
  id,
  token,
  "deviceType",
  "lastUsedAt",
  NOW() - "lastUsedAt" as days_inactive
FROM "NotificationDevice"
WHERE "userId" = 'USER_ID'
  AND "lastUsedAt" < NOW() - INTERVAL '30 days';
```

**Step 2: Check Firebase delivery logs**
```bash
# Check Firebase Cloud Messaging API quota and errors
# Via Firebase Console:
# 1. Go to your Firebase project
# 2. Navigate to "Cloud Messaging" > "Metrics"
# 3. Check for recent errors and delivery failures

# Or check application logs for Firebase errors
grep "Firebase\|FCM\|PUSH.*ERROR" logs/ -r | tail -50
```

**Step 3: Verify Firebase credentials**
```bash
# Check if Firebase credentials are loaded
grep -i "firebase.*credential\|serviceAccountKey" logs/ -r

# Test Firebase connectivity
curl -X POST "https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send" \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "TEST_DEVICE_TOKEN",
      "notification": {
        "title": "Test",
        "body": "Testing connectivity"
      }
    }
  }'
```

**Step 4: Check notification payload**
```sql
-- Check payload size of notifications sent to this device
SELECT
  n.id,
  n.type,
  n.title,
  n.body,
  n.metadata,
  LENGTH(n.metadata::text) as metadata_size,
  nd.token
FROM "Notification" n
JOIN "NotificationDevice" nd ON nd."userId" = n."userId"
WHERE nd.id = 'DEVICE_ID'
ORDER BY n."createdAt" DESC
LIMIT 5;

-- Calculate total payload (Firebase limit is 4096 bytes)
SELECT
  LENGTH(
    CONCAT(
      title, body,
      COALESCE(metadata::text, ''),
      COALESCE('actionUrl' || COALESCE(metadata->>'actionUrl', ''), '')
    )
  ) as total_payload_bytes
FROM "Notification"
WHERE id = 'NOTIFICATION_ID';
```

**Step 5: Check delivery delivery status**
```sql
-- Find delivery attempts for a specific notification
SELECT
  id,
  "notificationId",
  "deviceId",
  channel,
  status,
  "errorCode",
  "errorMessage",
  "attemptCount",
  "nextRetryAt",
  "createdAt",
  "updatedAt"
FROM "NotificationDelivery"
WHERE "notificationId" = 'NOTIFICATION_ID'
ORDER BY "createdAt" DESC;

-- Find failed delivery attempts for a user in last 24 hours
SELECT
  nd.id,
  n.type,
  nd.channel,
  nd.status,
  nd."errorCode",
  nd."errorMessage",
  nd."attemptCount",
  n."createdAt"
FROM "NotificationDelivery" nd
JOIN "Notification" n ON n.id = nd."notificationId"
WHERE n."userId" = 'USER_ID'
  AND n."createdAt" > NOW() - INTERVAL '24 hours'
  AND nd.status = 'FAILED'
ORDER BY nd."createdAt" DESC
LIMIT 20;
```

#### Resolution Steps

**If device token is invalid:**
1. Delete the invalid token from database:
   ```sql
   DELETE FROM "NotificationDevice"
   WHERE id = 'DEVICE_ID';
   ```

2. Instruct user to:
   - Close and reopen the app
   - This will trigger token refresh
   - New token will be registered

**If Firebase is unreachable:**
1. Check Firebase service status: https://status.firebase.google.com/
2. Verify network connectivity from server to Firebase
3. Test with `curl` command above
4. If temporarily down, wait and retry (automatic retries should handle this)

**If payload is too large:**
1. Reduce payload size:
   ```typescript
   // Limit metadata included in push notification
   const pushPayload = {
     title: notification.title,
     body: notification.body.substring(0, 200), // Limit body
     // Don't include full metadata, just essential IDs
   };
   ```

**If token is for wrong Firebase project:**
1. Check `.env` variables:
   ```bash
   echo $NEXT_PUBLIC_FIREBASE_PROJECT_ID
   echo $FIREBASE_ADMIN_SDK_KEY
   ```

2. Verify they match your Firebase Console project
3. If wrong project, either:
   - Update environment variables
   - Or delete token and let user re-register in correct project

#### Prevention Measures

1. **Token lifecycle management**
   - Implement token refresh mechanism every 7 days
   - Mark tokens as inactive if not used for 30 days
   - Automatically delete tokens older than 90 days without use

2. **Firebase monitoring**
   - Enable Firebase Cloud Messaging quotas in project
   - Set up alerts for high error rates (>5%)
   - Monitor daily quota usage

3. **Payload validation**
   - Validate payload size before sending (keep under 4KB)
   - Strip unnecessary data from notifications
   - Test with various payload sizes in staging

4. **Device token validation**
   - Verify token format when registering
   - Test token with Firebase API on registration
   - Implement automatic token cleanup for invalid tokens

---

### Issue 3: Emails Not Sending

#### Symptoms
- Email notifications created but not received by users
- Email service returns success but user never receives email
- Emails sent from service but marked as bounced
- Emails going to spam folder

#### Possible Causes
1. **Email service credentials invalid** - SendGrid/email provider credentials expired
2. **Sender domain not verified** - Domain not authenticated with email provider
3. **Email on blocklist** - User's email address on provider's blocklist
4. **Template rendering error** - Email HTML template has errors
5. **Rate limiting on email service** - Too many emails sent in short time
6. **DKIM/SPF/DMARC issues** - Email authentication problems
7. **User unsubscribed** - User previously unsubscribed from emails
8. **Invalid email address** - Email address format invalid or doesn't exist

#### Diagnostic Steps

**Step 1: Check email delivery status**
```sql
-- Find email delivery attempts for a user
SELECT
  nd.id,
  n.type,
  nd.channel,
  nd.status,
  nd."errorCode",
  nd."errorMessage",
  nd."attemptCount",
  nd."nextRetryAt",
  n."createdAt"
FROM "NotificationDelivery" nd
JOIN "Notification" n ON n.id = nd."notificationId"
WHERE n."userId" = 'USER_ID'
  AND nd.channel = 'EMAIL'
  AND n."createdAt" > NOW() - INTERVAL '24 hours'
ORDER BY nd."createdAt" DESC
LIMIT 20;

-- Check if user is on unsubscribe list
SELECT
  "userId",
  type,
  "unsubscribedAt"
FROM "NotificationUnsubscribe"
WHERE "userId" = 'USER_ID'
  AND type = 'EMAIL';
```

**Step 2: Check email provider logs**
```bash
# For SendGrid (if configured)
curl -X GET "https://api.sendgrid.com/v3/mail_settings" \
  -H "Authorization: Bearer $SENDGRID_API_KEY"

# Check bounce list
curl -X GET "https://api.sendgrid.com/v3/suppression/bounces" \
  -H "Authorization: Bearer $SENDGRID_API_KEY"

# Check email delivery events
curl -X GET "https://api.sendgrid.com/v3/email_activity?query=subject%20%3D%20%27YOUR_SUBJECT%27" \
  -H "Authorization: Bearer $SENDGRID_API_KEY"
```

**Step 3: Verify sender configuration**
```bash
# Check environment variables for email configuration
env | grep -i email
env | grep -i sendgrid
env | grep -i "mail"

# Verify sender email is correct
grep -r "from.*email\|sender" lib/notifications/ --include="*.ts"
```

**Step 4: Check email template rendering**
```sql
-- Find which template was used
SELECT
  n.type,
  n.metadata,
  n.title,
  n.body
FROM "Notification"
WHERE id = 'NOTIFICATION_ID';
```

**Step 5: Check application logs**
```bash
# Look for email sending errors
grep -i "email.*error\|sendgrid\|mail.*failed" logs/ -r | tail -50

# Check for template errors
grep -i "template.*error\|render.*error" logs/ -r
```

#### Resolution Steps

**If email credentials are invalid:**
1. Verify credentials in environment variables:
   ```bash
   echo $SENDGRID_API_KEY
   echo $SENDGRID_FROM_EMAIL
   ```

2. If missing or invalid:
   - Get new API key from SendGrid dashboard
   - Update `.env.local` with new credentials
   - Restart application

3. Test with simple email:
   ```bash
   curl -X POST "https://api.sendgrid.com/v3/mail/send" \
     -H "Authorization: Bearer $SENDGRID_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "personalizations": [{
         "to": [{"email": "test@example.com"}]
       }],
       "from": {"email": "noreply@massava.com"},
       "subject": "Test Email",
       "content": [{"type": "text/plain", "value": "Test"}]
     }'
   ```

**If user bounced:**
1. Check SendGrid suppression list
2. If hard bounce (invalid address):
   ```sql
   -- Mark notification as undeliverable
   UPDATE "NotificationDelivery"
   SET status = 'FAILED', "errorCode" = 'INVALID_EMAIL'
   WHERE "notificationId" = 'NOTIFICATION_ID'
     AND channel = 'EMAIL';
   ```

3. Contact user to verify email address

**If user unsubscribed:**
1. Don't send more notifications to this user
2. Check if user wants to resubscribe:
   ```sql
   -- Check unsubscribe record
   SELECT * FROM "NotificationUnsubscribe"
   WHERE "userId" = 'USER_ID';
   ```

3. Provide resubscribe link in your app settings

**If on blocklist:**
1. Contact SendGrid support to remove from blocklist
2. Investigate why they were added (bounces, complaints)
3. Fix underlying issue (invalid emails, spam complaints)

#### Prevention Measures

1. **Email verification**
   - Verify email addresses during account creation
   - Implement double opt-in for marketing emails
   - Remove bounced addresses automatically

2. **Domain authentication**
   - Set up DKIM signing for all emails
   - Configure SPF records correctly
   - Implement DMARC policy

3. **Email provider monitoring**
   - Monitor bounce rates (should be < 1%)
   - Track complaint rates (should be < 0.1%)
   - Set up alerts for rate limiting

4. **Template management**
   - Test all email templates before deployment
   - Include plaintext fallback in emails
   - Keep HTML payloads under 100KB

---

### Issue 4: SSE Connection Dropping

#### Symptoms
- Real-time notifications not appearing in web app
- Connection closes after a few minutes
- Browser shows "reconnecting" messages in console
- Notifications delayed or missing for connected users
- 503 Service Unavailable errors on SSE endpoint

#### Possible Causes
1. **Network timeout** - Connection idle for too long
2. **Server restart** - Application restarted, dropping all connections
3. **Load balancer timeout** - Proxy/load balancer has idle timeout
4. **Memory leak** - Server running out of memory, killing connections
5. **Database connection pool exhausted** - Can't service new requests
6. **CDN buffering** - CDN buffering SSE responses
7. **Browser tab inactive** - Browser suspending inactive tabs
8. **WebSocket upgrade fallback** - Fallback to polling with issues

#### Diagnostic Steps

**Step 1: Check active SSE connections**
```bash
# Monitor active connections on server
lsof -i :3000 | grep ESTABLISHED | wc -l

# Check for many CLOSE_WAIT connections (resource leak)
netstat -an | grep CLOSE_WAIT | wc -l

# Monitor connection churn
watch -n 1 'lsof -i :3000 | grep ESTABLISHED | wc -l'
```

**Step 2: Check server logs for disconnections**
```bash
# Look for SSE disconnection errors
grep -i "disconnected\|closed\|timeout" logs/ -r | grep -i "stream\|sse" | tail -50

# Look for error conditions during SSE streaming
grep -i "error.*stream\|stream.*error" logs/ -r | tail -50

# Check correlation IDs for a specific user's connections
grep "USER_ID.*stream\|stream.*USER_ID" logs/ -r
```

**Step 3: Check server resource usage**
```bash
# Check memory usage
ps aux | grep "node\|next" | head -5

# Check if running out of file descriptors
cat /proc/sys/fs/file-max
cat /proc/sys/fs/file-nr

# Check database connection pool status
grep -i "connection.*pool\|pool.*exhausted" logs/ -r
```

**Step 4: Check load balancer/proxy configuration**
```bash
# If using nginx, check idle timeout
grep -i "keepalive\|timeout" /etc/nginx/nginx.conf

# If using HAProxy, check connection settings
grep -i "timeout.*connect\|timeout.*idle" /etc/haproxy/haproxy.cfg

# Check Cloudflare settings (if used)
# - Domain > Network > Grayed Out Resources
# - Cache Rules > SSE configuration
```

**Step 5: Check client browser behavior**
```javascript
// In browser console, check connection status
// Add this to monitoring:
const eventSource = new EventSource('/api/notifications/stream');
eventSource.addEventListener('open', () => console.log('SSE opened'));
eventSource.addEventListener('error', (e) => {
  console.error('SSE error:', e.readyState); // 0=CONNECTING, 1=OPEN, 2=CLOSED
});

// Check for browser suspension in DevTools
// Developer Tools > Console > check for messages about tab suspension
```

#### Resolution Steps

**If connection timing out:**
1. Verify heartbeat is being sent frequently:
   ```typescript
   // Ensure heartbeat interval is reasonable (30 seconds)
   const stream = createSSEStream(userId, request.signal, {
     heartbeatInterval: 30000, // 30 seconds
     pollInterval: 2000,
   });
   ```

2. Check that heartbeats are being received:
   ```javascript
   // Browser DevTools Network tab
   // Should see ': ' (heartbeat) messages every 30 seconds
   ```

**If memory leak suspected:**
1. Check memory usage over time:
   ```bash
   # Monitor memory every 5 seconds
   while true; do
     ps aux | grep node | grep -v grep | awk '{print $6, "KB"}';
     sleep 5;
   done
   ```

2. Look for unclosed resources in code:
   ```bash
   grep -r "createSSEStream\|new EventSource" lib/ --include="*.ts"
   # Ensure stream cleanup in finally blocks
   ```

3. Check for event listener leaks:
   ```bash
   grep -r "addEventListener\|removeEventListener" lib/ --include="*.ts"
   # Verify removeEventListener is called
   ```

**If load balancer timeout:**
1. Adjust idle timeout (if accessible):
   ```nginx
   # In nginx.conf
   proxy_read_timeout 600s;  # 10 minutes
   keepalive_timeout 600s;
   ```

   ```
   # In HAProxy
   timeout client 600000
   timeout server 600000
   ```

2. Or adjust heartbeat to prevent idle:
   ```typescript
   // Send heartbeat more frequently
   { heartbeatInterval: 15000 } // 15 seconds instead of 30
   ```

**If too many connections:**
1. Check connection limits:
   ```bash
   ulimit -n  # File descriptor limit
   # Increase if needed: ulimit -n 65536
   ```

2. Check database pool:
   ```typescript
   // In lib/prisma.ts
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: `${DATABASE_URL}?connection_limit=100&socket_timeout=5`
       }
     }
   });
   ```

3. Implement connection cleanup:
   ```bash
   # Manual cleanup of old connections
   psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < now() - interval '30 minutes';"
   ```

#### Prevention Measures

1. **Connection monitoring**
   - Alert if active SSE connections > 1000
   - Alert if mean connection duration < 2 minutes
   - Monitor heartbeat delivery rate

2. **Load balancer tuning**
   - Set idle timeout to at least 10 minutes
   - Implement connection draining for restarts
   - Use reverse proxy compression carefully (can interfere with SSE)

3. **Resource limits**
   - Set application-level connection limits
   - Implement graceful shutdown procedures
   - Monitor memory growth over time

4. **Client-side resilience**
   - Implement automatic reconnection with exponential backoff
   - Show "reconnecting..." UI when disconnected
   - Fetch full notification list when reconnected

---

### Issue 5: Rate Limiting Errors

#### Symptoms
- 429 Too Many Requests responses
- Users unable to create/update notifications
- Errors include "Rate limited, retry after X seconds"
- Legitimate users getting rate limited incorrectly
- Rate limit resets not happening

#### Possible Causes
1. **Redis connectivity issue** - Rate limit storage unreachable
2. **Rate limit configuration too strict** - Limits set too low
3. **Rate limit window not resetting** - Window calculation error
4. **Burst of requests from user/IP** - Legitimate spike in traffic
5. **Shared IP address** - Multiple users behind same IP (corporate, mobile carrier)
6. **Test/staging environment hitting production limits** - Wrong env config
7. **Redis data corruption** - Stale keys not expiring

#### Diagnostic Steps

**Step 1: Check Redis connectivity**
```bash
# Test Redis connection
redis-cli -u $UPSTASH_REDIS_URL ping
# Should return: PONG

# Check if Redis is available
curl -u "${UPSTASH_REDIS_TOKEN}:" https://api.upstash.io/v2/redis/health
```

**Step 2: Check rate limit keys in Redis**
```bash
# List all rate limit keys for a user
redis-cli -u $UPSTASH_REDIS_URL KEYS "rate_limit:user:USER_ID:*"

# Check specific rate limit key
redis-cli -u $UPSTASH_REDIS_URL GET "rate_limit:user:USER_ID:createNotification"

# Check TTL on rate limit key
redis-cli -u $UPSTASH_REDIS_URL TTL "rate_limit:user:USER_ID:createNotification"
# -1 means no expiry (problem!)
# -2 means key doesn't exist
# Positive number is seconds remaining
```

**Step 3: Check rate limit configuration**
```bash
# View current limits
grep -A 20 "NOTIFICATION_RATE_LIMITS\|RATE_LIMITS" lib/middleware/api-rate-limiter.ts

# Check environment-specific overrides
grep -i "rate.*limit" .env.local .env
```

**Step 4: Check request volume**
```bash
# Count requests per user in last hour
grep "USER_ID.*POST.*notifications\|POST.*notifications.*USER_ID" logs/ -r | wc -l

# Count requests per IP in last hour
grep "IP_ADDRESS.*POST.*notifications\|POST.*notifications.*IP_ADDRESS" logs/ -r | wc -l
```

**Step 5: Check rate limit error logs**
```bash
# Find rate limit errors
grep -i "rate.*limit\|429\|too many request" logs/ -r | tail -50

# Find errors with correlation IDs
grep "RATE_LIMITED" logs/ -r | tail -20
```

#### Resolution Steps

**If Redis unreachable:**
1. Check Redis service status:
   ```bash
   redis-cli -u $UPSTASH_REDIS_URL ping
   ```

2. Verify Upstash credentials:
   ```bash
   echo $UPSTASH_REDIS_URL
   echo $UPSTASH_REDIS_TOKEN
   ```

3. If credentials invalid:
   - Update in `.env.local`
   - Restart application

4. If Upstash service down:
   - Check Upstash status: https://status.upstash.com/
   - Implement fallback (bypass rate limiting temporarily):
     ```typescript
     // In api-rate-limiter.ts
     let redis: Redis | null = null;

     if (process.env.UPSTASH_REDIS_URL) {
       redis = new Redis({/* ... */});
     } else {
       console.warn('Rate limiting disabled - Redis unavailable');
     }
     ```

**If rate limits too strict:**
1. Review current limits:
   ```bash
   grep -A 5 "createNotification.*limit" lib/middleware/api-rate-limiter.ts
   ```

2. Adjust limits if appropriate:
   ```typescript
   export const NOTIFICATION_RATE_LIMITS = {
     createNotification: {
       limit: 100,    // Increase if too many rejections
       window: '1h',
     },
     updateNotification: {
       limit: 200,
       window: '1h',
     },
     listNotifications: {
       limit: 1000,
       window: '1h',
     },
   };
   ```

3. Deploy updated config
4. Test with load testing tool

**If rate limit not resetting:**
1. Check Redis key expiry:
   ```bash
   redis-cli -u $UPSTASH_REDIS_URL TTL "rate_limit:user:USER_ID:action"
   # If -1, key has no expiry (bug)
   ```

2. Manually delete stuck key:
   ```bash
   redis-cli -u $UPSTASH_REDIS_URL DEL "rate_limit:user:USER_ID:action"
   # User can now make requests again
   ```

3. Check for code bug in window calculation:
   ```bash
   grep -A 10 "setex\|psetex" lib/middleware/api-rate-limiter.ts
   # Ensure TTL is being set when creating key
   ```

**If legitimate spike in requests:**
1. Temporarily increase limits:
   ```bash
   # Option 1: Increase limit in code and deploy
   # Option 2: Add user to whitelist (bypass rate limiting)
   ```

2. Add user/IP to whitelist (if implemented):
   ```typescript
   const RATE_LIMIT_WHITELIST = [
     'USER_ID_1',
     'USER_ID_2',
     'TRUSTED_IP',
   ];

   if (RATE_LIMIT_WHITELIST.includes(userId || ip)) {
     return handleRequest(); // Skip rate limiting
   }
   ```

3. Monitor after adjustment to ensure legitimate

#### Prevention Measures

1. **Rate limit tuning**
   - Set limits based on historical usage patterns
   - Implement tiered limits (higher for premium users)
   - Monitor 95th percentile request rate

2. **User communication**
   - Document rate limits clearly
   - Provide clear error messages with retry-after time
   - Offer API documentation about limits

3. **Monitoring and alerting**
   - Alert if rate limit rejections > 5% of requests
   - Monitor rate limit key expiry times
   - Track user complaints about rate limiting

4. **Redis resilience**
   - Implement circuit breaker for Redis failures
   - Fall back to in-memory rate limiting if Redis down
   - Monitor Redis performance and availability

---

## Monitoring Queries

### Key Metrics Dashboard

```sql
-- Notifications created in last 24 hours
SELECT
  DATE(created_at) as date,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered,
  COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
  COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending
FROM "Notification"
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Delivery rate by channel
SELECT
  channel,
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered,
  ROUND(100.0 * COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) / COUNT(*), 2) as success_rate
FROM "NotificationDelivery"
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY channel
ORDER BY total_attempts DESC;

-- Failed deliveries analysis
SELECT
  channel,
  "errorCode",
  COUNT(*) as count,
  MAX("updatedAt") as last_occurrence
FROM "NotificationDelivery"
WHERE status = 'FAILED'
  AND "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY channel, "errorCode"
ORDER BY count DESC;

-- Notification latency (time to delivery)
SELECT
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))) as p50_seconds,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))) as p95_seconds,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))) as p99_seconds,
  MAX(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))) as max_seconds
FROM "NotificationDelivery"
WHERE status = 'DELIVERED'
  AND "createdAt" > NOW() - INTERVAL '24 hours';

-- Rate limiting incidents
SELECT
  DATE("createdAt") as date,
  COUNT(*) as rate_limited_requests
FROM "AuditLog"
WHERE action = 'RATE_LIMITED'
  AND "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;

-- User notification preferences (disabled types)
SELECT
  type,
  COUNT(CASE WHEN "isEnabled" = false THEN 1 END) as disabled_count,
  ROUND(100.0 * COUNT(CASE WHEN "isEnabled" = false THEN 1 END) / COUNT(*), 2) as disabled_percentage
FROM "NotificationPreference"
GROUP BY type
ORDER BY disabled_count DESC;

-- Stuck notifications (pending > 1 hour)
SELECT
  id,
  "userId",
  type,
  status,
  AGE(NOW(), "createdAt") as time_pending,
  "createdAt"
FROM "Notification"
WHERE status = 'PENDING'
  AND "createdAt" < NOW() - INTERVAL '1 hour'
ORDER BY "createdAt" ASC
LIMIT 100;

-- Device token health
SELECT
  "deviceType",
  COUNT(*) as total_devices,
  COUNT(CASE WHEN "lastUsedAt" > NOW() - INTERVAL '7 days' THEN 1 END) as active_7d,
  COUNT(CASE WHEN "lastUsedAt" > NOW() - INTERVAL '30 days' THEN 1 END) as active_30d,
  COUNT(CASE WHEN "isActive" = false THEN 1 END) as inactive
FROM "NotificationDevice"
GROUP BY "deviceType"
ORDER BY total_devices DESC;
```

### Real-time Monitoring

```bash
# Watch notification creation rate
watch -n 1 "psql $DATABASE_URL -tc \"
  SELECT
    COUNT(*),
    COUNT(CASE WHEN status='DELIVERED' THEN 1 END),
    COUNT(CASE WHEN status='PENDING' THEN 1 END),
    COUNT(CASE WHEN status='FAILED' THEN 1 END)
  FROM \\\"Notification\\\"
  WHERE \\\"createdAt\\\" > NOW() - INTERVAL '1 hour'
\""

# Watch active SSE connections
watch -n 1 'lsof -i :3000 | grep -c "node"'

# Watch Redis rate limit keys
watch -n 5 "redis-cli -u $UPSTASH_REDIS_URL KEYS 'rate_limit:*' | wc -l"

# Watch error rate in logs
watch -n 5 "tail -100 logs/app.log | grep -i 'error\|failed' | wc -l"
```

---

## Health Checks

### Automated Health Check Script

```bash
#!/bin/bash
# save as: scripts/notification-health-check.sh

set -e

echo "=== Notification System Health Check ==="
echo

# 1. Database connectivity
echo "1. Database Connectivity..."
psql $DATABASE_URL -c "SELECT NOW();" > /dev/null && echo "✓ Database OK" || echo "✗ Database FAILED"

# 2. Redis connectivity
echo
echo "2. Redis Connectivity..."
redis-cli -u $UPSTASH_REDIS_URL ping > /dev/null && echo "✓ Redis OK" || echo "✗ Redis FAILED"

# 3. Firebase connectivity
echo
echo "3. Firebase Connectivity..."
curl -s -X POST "https://fcm.googleapis.com/v1/projects/$FIREBASE_PROJECT_ID/messages:send" \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{"message":{"webpush":{"headers":{"TTL":"0"}}}}' > /dev/null && echo "✓ Firebase OK" || echo "✗ Firebase FAILED"

# 4. QStash connectivity
echo
echo "4. QStash Connectivity..."
curl -s -H "Authorization: Bearer $QSTASH_TOKEN" https://api.upstash.io/v2/publish/stats | grep -q "messageCount" && echo "✓ QStash OK" || echo "✗ QStash FAILED"

# 5. API endpoint (requires running server)
echo
echo "5. API Endpoint Health..."
curl -s http://localhost:3000/api/notifications/health | grep -q "ok" && echo "✓ API OK" || echo "✗ API FAILED"

# 6. Database pool health
echo
echo "6. Database Connection Pool..."
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;" | tail -1 | awk '{print "✓ Active connections: " $1}'

# 7. Pending notifications
echo
echo "7. Notification Queue Health..."
PENDING=$(psql $DATABASE_URL -tc "SELECT COUNT(*) FROM \"Notification\" WHERE status='PENDING' AND \"createdAt\" > NOW() - INTERVAL '1 hour';" | tr -d ' ')
if [ "$PENDING" -gt 100 ]; then
  echo "⚠ WARNING: $PENDING pending notifications in last hour"
else
  echo "✓ Notification queue healthy ($PENDING pending)"
fi

# 8. Failed notifications
echo
echo "8. Failed Notifications..."
FAILED=$(psql $DATABASE_URL -tc "SELECT COUNT(*) FROM \"NotificationDelivery\" WHERE status='FAILED' AND \"createdAt\" > NOW() - INTERVAL '1 hour';" | tr -d ' ')
if [ "$FAILED" -gt 10 ]; then
  echo "⚠ WARNING: $FAILED failed deliveries in last hour"
else
  echo "✓ Delivery failures acceptable ($FAILED)"
fi

# 9. Rate limiting health
echo
echo "9. Rate Limiting Health..."
RATE_LIMITED=$(grep -c "RATE_LIMITED" logs/app.log 2>/dev/null || echo "0")
if [ "$RATE_LIMITED" -gt 0 ]; then
  echo "⚠ INFO: $RATE_LIMITED rate limited requests in last hour"
else
  echo "✓ No recent rate limiting"
fi

echo
echo "=== Health Check Complete ==="
```

### Manual Health Checks

**Check 1: Database**
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) as total_notifications FROM \"Notification\";"
```

**Check 2: Redis**
```bash
redis-cli -u $UPSTASH_REDIS_URL INFO stats | grep total_commands_processed
```

**Check 3: Firebase**
```bash
curl -X POST "https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"YOUR_PROJECT_ID"}' | grep -q "projectId" && echo "Firebase OK"
```

**Check 4: QStash**
```bash
curl -H "Authorization: Bearer $QSTASH_TOKEN" https://api.upstash.io/v2/publish/stats | jq '.data'
```

**Check 5: API Availability**
```bash
curl -I http://localhost:3000/api/notifications -H "Authorization: Bearer TEST_TOKEN"
# Should return 200 or 401, not 500
```

---

## Escalation Path

### Severity Levels

#### Level 1: Minor (No User Impact)
- Single user unable to access notifications
- Low rate of delivery failures (< 1%)
- Rate limiting a few legitimate users
- One device token invalid

**Action**: Monitor, no immediate escalation needed

**Response time**: Within 24 hours

**On-call**: Check during business hours

#### Level 2: Moderate (Limited User Impact)
- Multiple users (< 100) not receiving notifications
- Delivery success rate 95-99%
- SSE connections dropping for some users
- Email service rate limiting

**Action**: Investigate and implement workaround

**Response time**: Within 4 hours

**On-call**: Can wait until morning if after hours

**Escalation**: Lead Engineer, Database Team

#### Level 3: Severe (Widespread Impact)
- Large number of users (100+) affected
- Delivery success rate < 95%
- Push notifications completely broken
- All SSE connections dropping

**Action**: Initiate incident response, rollback if needed

**Response time**: Immediate (< 30 minutes)

**On-call**: Immediate page

**Escalation**: Incident Commander, All Teams

#### Level 4: Critical (Complete Outage)
- All notifications broken
- Service completely unavailable
- Data loss or corruption

**Action**: All hands on deck, public communication

**Response time**: Immediate (< 15 minutes)

**On-call**: Emergency page

**Escalation**: Engineering Leadership, DevOps, Communications

### Escalation Contacts

**Lead Engineer (Notifications)**
- Name: [TBD]
- Email: [TBD]
- Phone: [TBD]

**DevOps/Infrastructure**
- Name: [TBD]
- Email: [TBD]
- Slack: #devops-oncall

**Database Team**
- Name: [TBD]
- Email: [TBD]
- Slack: #database-team

**Product Manager**
- Name: [TBD]
- Email: [TBD]
- For user communication

### Escalation Decision Tree

```
Issue reported
    |
    +---> Can be fixed in < 30 min?
    |     YES -> Handle immediately, escalate if blocked
    |     NO  -> Escalate to Lead Engineer
    |
    +---> Affects > 10% of users?
    |     YES -> Escalate to Incident Commander
    |     NO  -> Page on-call engineer if Level 2+
    |
    +---> Complete outage?
    |     YES -> Emergency all-hands
    |     NO  -> Continue diagnosis
    |
    +---> Need database changes?
    |     YES -> Notify Database Team
    |     NO  -> Proceed with resolution
    |
    +---> Customer-facing issue?
    |     YES -> Notify Product/Communications
    |     NO  -> No external communication needed
```

---

## Recovery Procedures

### Procedure 1: Recover Failed Notifications

**Situation**: Large number of notifications failed delivery

**Steps**:
1. Identify root cause (see Common Issues above)
2. Fix underlying issue
3. Retry failed notifications:

```bash
#!/bin/bash
# Retry failed notifications from last hour

NOTIFICATION_IDS=$(psql $DATABASE_URL -tc "
  SELECT DISTINCT n.id
  FROM \"Notification\" n
  JOIN \"NotificationDelivery\" nd ON nd.\"notificationId\" = n.id
  WHERE nd.status = 'FAILED'
    AND nd.\"createdAt\" > NOW() - INTERVAL '1 hour'
  LIMIT 100
" | tr -d ' ')

for ID in $NOTIFICATION_IDS; do
  curl -X POST "http://localhost:3000/api/notifications/retry/$ID" \
    -H "Authorization: Bearer ADMIN_TOKEN" \
    -H "Content-Type: application/json"
  sleep 1  # Rate limit retries
done

echo "Retry initiated for $NOTIFICATION_IDS"
```

**Verification**:
```sql
-- Check delivery status after retry
SELECT
  status,
  COUNT(*) as count
FROM "NotificationDelivery"
WHERE "notificationId" IN ('ID1', 'ID2', 'ID3')
GROUP BY status;
```

### Procedure 2: Clear Rate Limiting

**Situation**: Users incorrectly rate limited

**Steps**:
1. Identify affected user/IP
2. Clear rate limit key:

```bash
# For specific user
redis-cli -u $UPSTASH_REDIS_URL DEL "rate_limit:user:USER_ID:*"

# For specific IP
redis-cli -u $UPSTASH_REDIS_URL DEL "rate_limit:ip:IP_ADDRESS:*"

# Clear all rate limiting (use with caution)
redis-cli -u $UPSTASH_REDIS_URL FLUSHDB
```

**Verification**:
```bash
# User should now be able to make requests
curl -X POST "http://localhost:3000/api/notifications" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"TEST","userId":"USER_ID"}'
```

### Procedure 3: Reprocess Stuck Notifications

**Situation**: Notifications stuck in PENDING status

**Steps**:
1. Find stuck notifications:

```sql
SELECT
  id,
  "userId",
  type,
  AGE(NOW(), "createdAt") as age
FROM "Notification"
WHERE status = 'PENDING'
  AND "createdAt" < NOW() - INTERVAL '1 hour'
ORDER BY "createdAt" ASC;
```

2. Check if still relevant (not expired):

```sql
SELECT
  id,
  "expiresAt",
  NOW() < "expiresAt" as still_valid
FROM "Notification"
WHERE id = 'NOTIFICATION_ID';
```

3. Reprocess notification:

```bash
curl -X POST "http://localhost:3000/api/notifications/reprocess" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notificationId": "NOTIFICATION_ID",
    "force": true
  }'
```

4. Or manually update status:

```sql
UPDATE "Notification"
SET status = 'FAILED', "updatedAt" = NOW()
WHERE id = 'NOTIFICATION_ID'
  AND status = 'PENDING'
  AND "expiresAt" < NOW();
```

### Procedure 4: Clean Up Invalid Device Tokens

**Situation**: Many push notifications failing due to invalid tokens

**Steps**:
1. Find invalid tokens:

```sql
SELECT DISTINCT
  nd.id,
  nd."userId",
  nd.token
FROM "NotificationDevice" nd
JOIN "NotificationDelivery" ndel ON ndel."deviceId" = nd.id
WHERE ndel.status = 'FAILED'
  AND ndel."errorCode" = 'INVALID_TOKEN'
  AND ndel."createdAt" > NOW() - INTERVAL '24 hours'
LIMIT 100;
```

2. Delete tokens:

```bash
# Mark inactive
UPDATE "NotificationDevice"
SET "isActive" = false
WHERE id = 'DEVICE_ID';

# Or delete
DELETE FROM "NotificationDevice"
WHERE id = 'DEVICE_ID';
```

3. Notify users (optional):

```sql
-- Identify affected users
SELECT DISTINCT "userId"
FROM "NotificationDevice"
WHERE "isActive" = false
ORDER BY "userId";
```

### Procedure 5: Restart SSE Connections

**Situation**: SSE connections frequently dropping

**Steps**:
1. Verify issue is widespread:

```bash
lsof -i :3000 | grep "notification/stream" | wc -l
# If low (< 10), may indicate widespread disconnections
```

2. Check application logs for errors:

```bash
tail -f logs/app.log | grep -i "stream\|disconn"
```

3. Restart application (gracefully):

```bash
# If using PM2
pm2 restart notification-service --wait-ready --listen-timeout 3000

# If using Docker
docker-compose restart notification-api

# If using systemd
systemctl restart notification-service

# Graceful reload (if running multiple instances)
# - Remove instance from load balancer
# - Wait for existing connections to close (max 5 minutes)
# - Restart instance
# - Add back to load balancer
```

4. Verify connections reestablished:

```bash
watch -n 1 'lsof -i :3000 | grep -c "notification/stream"'
# Should return to normal levels after 30 seconds
```

### Procedure 6: Database Maintenance

**Situation**: Database running slow, connection pool issues

**Steps**:
1. Check database health:

```sql
-- Connection status
SELECT
  datname,
  COUNT(*) as connections,
  MAX(EXTRACT(EPOCH FROM (NOW() - query_start))) as longest_query_seconds
FROM pg_stat_activity
GROUP BY datname
ORDER BY connections DESC;

-- Long-running queries
SELECT
  pid,
  usename,
  query,
  EXTRACT(EPOCH FROM (NOW() - query_start)) as duration_seconds
FROM pg_stat_activity
WHERE query_start < NOW() - INTERVAL '5 minutes'
ORDER BY query_start ASC;

-- Idle connections
SELECT
  pid,
  usename,
  state,
  EXTRACT(EPOCH FROM (NOW() - query_start)) as idle_seconds
FROM pg_stat_activity
WHERE state = 'idle'
ORDER BY query_start ASC;
```

2. Kill long-running queries (if safe):

```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid != pg_backend_pid()
  AND query_start < NOW() - INTERVAL '30 minutes'
  AND state != 'idle';
```

3. Clean up idle connections:

```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND query_start < NOW() - INTERVAL '1 hour'
  AND datname = 'massava';
```

4. Vacuum and analyze:

```bash
psql $DATABASE_URL -c "VACUUM ANALYZE \"Notification\";"
psql $DATABASE_URL -c "VACUUM ANALYZE \"NotificationDelivery\";"
```

---

## Quick Reference

### Common Commands

```bash
# Check notification service logs
tail -f logs/app.log | grep -i notification

# Check specific notification
psql $DATABASE_URL -c "
  SELECT * FROM \"Notification\" WHERE id = 'NOTIFICATION_ID';"

# Check delivery attempts
psql $DATABASE_URL -c "
  SELECT * FROM \"NotificationDelivery\"
  WHERE \"notificationId\" = 'NOTIFICATION_ID'
  ORDER BY \"createdAt\" DESC;"

# Count pending notifications
psql $DATABASE_URL -c "
  SELECT COUNT(*) FROM \"Notification\" WHERE status = 'PENDING';"

# Find rate limit errors
grep "RATE_LIMITED" logs/ -r

# Clear rate limit for user
redis-cli -u $UPSTASH_REDIS_URL DEL "rate_limit:user:USER_ID:*"

# Restart service
systemctl restart notification-service

# Check service status
systemctl status notification-service

# View environment variables
env | grep -i notification
```

### Environment Variables Checklist

```bash
# Required for operation
UPSTASH_REDIS_URL
UPSTASH_REDIS_TOKEN
DATABASE_URL
FIREBASE_PROJECT_ID
FIREBASE_ADMIN_SDK_KEY
QSTASH_TOKEN
QSTASH_CURRENT_SIGNING_KEY
SENDGRID_API_KEY
SENDGRID_FROM_EMAIL

# Optional but recommended
NODE_ENV=production
LOG_LEVEL=info
NOTIFICATION_TIMEOUT=30000
NOTIFICATION_MAX_RETRIES=3
```

### Status Codes and Meanings

| Code | Meaning | Action |
|------|---------|--------|
| PENDING | Queued for delivery | Monitor, should progress |
| PROCESSING | Being sent to service | Normal, wait |
| SENT | Sent to service (email) | Verify if user received |
| DELIVERED | Confirmed delivered | Success |
| FAILED | Delivery failed | Check error code |
| EXPIRED | TTL exceeded | Notification too old |

### Error Codes Reference

| Error Code | Meaning | Retryable |
|-----------|---------|-----------|
| INVALID_TOKEN | Device token invalid | No |
| INVALID_EMAIL | Email invalid/bounced | No |
| RATE_LIMITED | Too many requests | Yes (after delay) |
| SERVICE_UNAVAILABLE | QStash/Firebase down | Yes |
| TIMEOUT | Request timeout | Yes |
| INVALID_INPUT | Validation failed | No |
| PERMISSION_DENIED | User unauthorized | No |

---

## Contacts and Resources

### Documentation
- Architecture: `/docs/notifications/01-architecture-overview.md`
- Database Schema: `/docs/notifications/02-database-schema.md`
- Backend Services: `/docs/notifications/03-backend-services.md`
- Push Notifications: `/docs/notifications/04-push-notifications.md`
- API Reference: `/docs/notifications/API_QUICK_REFERENCE.md`

### External Services
- **QStash**: https://console.upstash.com/
- **Firebase Console**: https://console.firebase.google.com/
- **SendGrid**: https://app.sendgrid.com/
- **Upstash Redis**: https://console.upstash.com/redis/

### Team Slack Channels
- #notifications (general discussion)
- #notifications-alerts (automated alerts)
- #incidents (incident coordination)
- #devops-oncall (infrastructure issues)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-02 | Development Team | Initial runbook creation |

---

**Last Tested**: 2025-12-02
**Next Review**: 2025-01-02
