# Cron Jobs Setup - Massava Email Notifications

**Status**: ⚠️ Dokumentiert, nicht implementiert für MVP
**Deployment**: Wird bei Migration zu Vercel automatisch aktiviert

---

## 📧 Email Notification Cron Jobs

Die folgenden Cron Jobs wurden implementiert aber **noch nicht deployed**:

| Zeit (UTC) | Endpoint | Zweck | Status |
|------------|----------|-------|--------|
| 02:00 | `/api/cron/data-retention` | Datenbereinigung | ⚠️ Existiert, nicht scheduled |
| 10:00 | `/api/cron/booking-reminders` | Erinnerung 24h vorher | ⚠️ Existiert, nicht scheduled |
| 11:00 | `/api/cron/review-requests` | Review-Anfrage 24h danach | ⚠️ Existiert, nicht scheduled |

---

## 🚀 Deployment Options

### Option 1: Vercel (Empfohlen für Production)

**Vorteile:**
- ✅ Cron Jobs funktionieren automatisch via `vercel.json`
- ✅ Kein zusätzliches Setup nötig
- ✅ Monitoring & Logs integriert
- ✅ Skaliert automatisch

**Migration Steps:**

1. **Vercel Project erstellen**
   ```bash
   npm install -g vercel
   vercel login
   vercel link
   ```

2. **Environment Variables setzen**
   ```bash
   vercel env add CRON_SECRET production
   # Paste: <generierter secret>

   vercel env add DATABASE_URL production
   # Paste: <postgresql connection string>

   # Alle anderen Secrets auch setzen:
   # - AUTH_SECRET
   # - RESEND_API_KEY
   # - GOOGLE_CLIENT_ID
   # - GOOGLE_CLIENT_SECRET
   # - etc.
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Cron Jobs Status prüfen**
   - Vercel Dashboard → Project → Cron
   - Sollte 3 Jobs zeigen (automatically detected from vercel.json)

**Das war's!** Cron Jobs laufen automatisch.

---

### Option 2: Self-Hosted Server (Current MVP Setup)

Wenn du auf deinem eigenen Server bleibst, musst du Cron Jobs manuell einrichten.

#### 2a. System Crontab

**Auf Production Server via SSH:**

```bash
# 1. CRON_SECRET Environment Variable setzen
export CRON_SECRET="<generierter-secret>"
echo 'export CRON_SECRET="<generierter-secret>"' >> ~/.bashrc

# 2. Crontab editieren
crontab -e

# 3. Diese Zeilen hinzufügen:
# Massava Email Notifications
0 2 * * * curl -s -X GET "http://localhost:3004/api/cron/data-retention" -H "Authorization: Bearer $CRON_SECRET" >/dev/null 2>&1
0 10 * * * curl -s -X GET "http://localhost:3004/api/cron/booking-reminders" -H "Authorization: Bearer $CRON_SECRET" >/dev/null 2>&1
0 11 * * * curl -s -X GET "http://localhost:3004/api/cron/review-requests" -H "Authorization: Bearer $CRON_SECRET" >/dev/null 2>&1
```

**Oder automatisches Setup Script:**

```bash
# Setup Script nutzen
export CRON_SECRET="<generierter-secret>"
bash scripts/setup-cron-jobs.sh
```

#### 2b. Docker Cron Container

Erstelle `docker-compose.cron.yml`:

```yaml
version: '3.8'

services:
  cron:
    image: alpine:3.18
    container_name: massava-cron
    restart: unless-stopped
    environment:
      - APP_URL=http://massava:3004
      - CRON_SECRET=${CRON_SECRET}
    volumes:
      - ./scripts/crontab:/etc/crontabs/root:ro
    command: crond -f -l 2
    depends_on:
      - massava
```

Dann `scripts/crontab` erstellen:
```
0 2 * * * curl -s -X GET "$APP_URL/api/cron/data-retention" -H "Authorization: Bearer $CRON_SECRET"
0 10 * * * curl -s -X GET "$APP_URL/api/cron/booking-reminders" -H "Authorization: Bearer $CRON_SECRET"
0 11 * * * curl -s -X GET "$APP_URL/api/cron/review-requests" -H "Authorization: Bearer $CRON_SECRET"
```

Starten:
```bash
docker-compose -f docker-compose.cron.yml up -d
```

---

## 🔒 Security

### CRON_SECRET generieren

```bash
openssl rand -base64 32
```

**Beispiel Output:**
```
2XkOm+VlDTn1h/mWOYqii/PxpUiQ8wFocW8cLmc0S6M=
```

### Environment Variables

Setze in deinem Deployment:

```bash
# Für Self-Hosted (GitHub Secrets)
CRON_SECRET=<generierter-secret>

# Für Vercel
vercel env add CRON_SECRET
```

### Authorization

Alle Cron Endpoints prüfen den `Authorization: Bearer <CRON_SECRET>` Header:

```typescript
const authHeader = request.headers.get('authorization');
const cronSecret = process.env.CRON_SECRET;

if (authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## 🧪 Testing

### Manuell testen (lokal)

```bash
# 1. CRON_SECRET in .env setzen
echo 'CRON_SECRET="test-secret-12345"' >> .env

# 2. App starten
npm run dev

# 3. Cron Job manuell triggern
curl -X GET "http://localhost:3000/api/cron/booking-reminders" \
  -H "Authorization: Bearer test-secret-12345"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Booking reminders cron job completed",
  "processedBookings": 3,
  "successCount": 3,
  "failureCount": 0
}
```

### Monitoring

**Logs prüfen:**
```bash
# Self-Hosted
docker logs massava | grep CRON_BOOKING_REMINDERS

# Vercel
vercel logs --prod | grep booking-reminders
```

**Datenbank prüfen:**
```sql
-- Anzahl gesendeter Reminders
SELECT COUNT(*) FROM new_bookings WHERE "reminderSent" = true;

-- Anzahl gesendeter Review Requests
SELECT COUNT(*) FROM new_bookings WHERE "reviewRequestSent" = true;
```

---

## 📊 Cron Job Details

### Booking Reminders

**Wann**: 10:00 UTC (täglich)
**Was**: Findet Bookings für morgen (status=CONFIRMED, reminderSent=false)
**Email**: Sendet Erinnerung an Kunden 24h vorher
**Database**: Setzt `reminderSent = true`

### Review Requests

**Wann**: 11:00 UTC (täglich)
**Was**: Findet Bookings von gestern (status=CONFIRMED, reviewRequestSent=false)
**Email**: Sendet Review-Anfrage an Kunden 24h danach
**Database**: Setzt `reviewRequestSent = true`

### Data Retention

**Wann**: 02:00 UTC (täglich)
**Was**: Bereinigt alte Daten gemäß GDPR
**Details**: Siehe `lib/data-retention/retention-policy.ts`

---

## 🎯 MVP vs Production

### MVP (Current)
- ⚠️ Cron Jobs **existieren**, aber **nicht scheduled**
- ⚠️ Email Templates **funktionieren**, aber keine automatischen Erinnerungen
- ✅ Manuelle Trigger möglich (für Testing)

### Production (Vercel Migration)
- ✅ Cron Jobs **laufen automatisch**
- ✅ Email Templates **senden automatisch**
- ✅ Monitoring & Logs in Vercel Dashboard

---

## 📝 Migration Checklist

Wenn du zu Vercel migrierst:

- [ ] Vercel Project erstellen
- [ ] GitHub Repo verbinden
- [ ] Environment Variables setzen (siehe .env.example)
  - [ ] CRON_SECRET
  - [ ] DATABASE_URL
  - [ ] AUTH_SECRET
  - [ ] RESEND_API_KEY
  - [ ] GOOGLE_CLIENT_ID
  - [ ] GOOGLE_CLIENT_SECRET
  - [ ] UPSTASH_REDIS_URL
  - [ ] UPSTASH_REDIS_TOKEN
  - [ ] HEALTH_DATA_ENCRYPTION_KEY
- [ ] Deploy zu Vercel
- [ ] Cron Jobs Status prüfen (sollte automatisch erkannt werden)
- [ ] Test Booking erstellen und auf Reminder warten
- [ ] Logs monitoren

---

## 🔗 Referenzen

- **Cron Job Endpoints**:
  - `app/api/cron/booking-reminders/route.ts`
  - `app/api/cron/review-requests/route.ts`
  - `app/api/cron/data-retention/route.ts`

- **Email Templates**:
  - `lib/email/templates.tsx` (BookingReminderTemplate, ReviewRequestTemplate)

- **Email Sending**:
  - `lib/email/send.ts` (sendBookingReminderEmail, sendReviewRequestEmail)

- **Database Schema**:
  - `prisma/schema.prisma` (reminderSent, reviewRequestSent fields)

- **Vercel Configuration**:
  - `vercel.json` (cron schedule definition)

---

**Erstellt**: 2025-11-17
**Status**: Dokumentiert für zukünftige Production Deployment
**Next Steps**: Migration zu Vercel bei Production Launch
