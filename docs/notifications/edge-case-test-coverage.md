# Notification System Edge Case Test Coverage

## Overview

This document summarizes the comprehensive edge case tests added to improve branch coverage for the notification system. All tests are designed to achieve 100% branch coverage for critical notification flows.

## Test Files Created

### 1. Notification Service Edge Cases
**File**: `__tests__/lib/notifications/notification-service-edge-cases.test.ts`
**Tests**: 15 passing
**Coverage Areas**:

#### Notification Expired During Processing
- ✅ Marks notification as EXPIRED when expiresAt is in the past
- ✅ Continues processing when expiresAt is null
- ✅ Continues processing when expiresAt is in the future

#### All Channels Fail (Max Retries Exceeded)
- ✅ Marks as FAILED when all channels fail and max retries reached
- ✅ Schedules retry when all channels fail but retries remaining

#### Partial Delivery (Some Channels Succeed, Some Fail)
- ✅ Marks as PARTIALLY_DELIVERED when PUSH succeeds but EMAIL and IN_APP fail
- ✅ Marks as PARTIALLY_DELIVERED when EMAIL succeeds but PUSH and IN_APP fail
- ✅ Marks as PARTIALLY_DELIVERED when 2 out of 3 channels succeed

#### Scheduled Notification Handling
- ✅ Processes notification with scheduledFor in the past
- ✅ Processes notification with scheduledFor exactly now

#### Quiet Hours Rescheduling
- ✅ Reschedules NORMAL priority notification during quiet hours
- ✅ Reschedules LOW priority notification during quiet hours
- ✅ Reschedules HIGH priority notification during quiet hours
- ✅ Does NOT reschedule URGENT priority notification during quiet hours
- ✅ Processes immediately when not in quiet hours

---

### 2. Push Service Edge Cases
**File**: `__tests__/lib/capacitor/push-service-edge-cases.test.ts`
**Tests**: 19 passing
**Coverage Areas**:

#### Permission Denied
- ✅ Returns false when permission is denied
- ✅ Returns false when permission is prompt-only
- ✅ Returns false when permission is prompt-with-rationale
- ✅ Continues when permission is granted

#### Registration Error
- ✅ Returns false when already initialized (singleton pattern)
- ✅ Does not crash when error callback is not provided

#### Badge Update Error Handling
- ✅ Does not crash when badge update API fails
- ✅ Does not crash when badge set fails
- ✅ Does not crash when badge clear fails

#### Platform Detection
- ✅ Returns false on web platform
- ✅ Handles iOS platform correctly
- ✅ Handles Android platform correctly

#### Initialization State
- ✅ Reports initialized state correctly
- ✅ Reports native platform correctly
- ✅ Reports web platform correctly

---

### 3. FCM Service Edge Cases
**File**: `__tests__/lib/firebase/fcm-service-edge-cases.test.ts`
**Tests**: 24 passing
**Coverage Areas**:

#### Invalid Token Cleanup
- ✅ Deactivates tokens with `invalid-registration-token` error
- ✅ Deactivates tokens with `registration-token-not-registered` error
- ✅ Does NOT deactivate tokens with other error codes (temporary errors)
- ✅ Handles mix of invalid tokens and temporary errors
- ✅ Does not crash when no invalid tokens found

#### Batch Send Failures
- ✅ Handles complete send failure
- ✅ Handles partial failure with exception
- ✅ Returns zero results when user has no devices
- ✅ Handles Firebase Admin not available
- ✅ Handles getMessaging returning null

#### Platform-Specific Message Building
- ✅ Builds correct message for URGENT priority
- ✅ Builds correct message for HIGH priority
- ✅ Builds correct message for NORMAL priority
- ✅ Builds correct message for LOW priority
- ✅ Includes actionUrl in data when provided
- ✅ Omits actionUrl from data when not provided
- ✅ Includes metadata in data when provided
- ✅ Omits metadata from data when not provided
- ✅ Sets correct webpush link
- ✅ Uses default link when actionUrl not provided

#### Direct Token Sending
- ✅ Sends to specific tokens successfully
- ✅ Returns zero when Firebase Admin not available

#### Device Token Updates
- ✅ Updates lastUsedAt for successfully sent tokens
- ✅ Excludes invalid tokens from lastUsedAt update

---

### 4. Rate Limiter Edge Cases
**File**: `__tests__/lib/notifications/utils/rate-limiter-edge-cases.test.ts`
**Tests**: 37 passing
**Coverage Areas**:

#### Redis Connection Failure (Fail Open)
- ✅ Returns false (allow) when Redis incr fails
- ✅ Returns false (allow) when Redis expire fails
- ✅ Returns false (allow) when Redis is completely unavailable
- ✅ Returns false (allow) when Redis throws unexpected error
- ✅ Returns false (allow) when Redis network times out

#### First Request in Window (TTL Setting)
- ✅ Sets TTL when counter is 1 (first request)
- ✅ Does not set TTL when counter is greater than 1
- ✅ Sets TTL only for first per-user request
- ✅ Sets TTL only for first per-type request

#### URGENT Priority Bypass
- ✅ Bypasses rate limiting for URGENT priority
- ✅ Checks rate limits for HIGH priority
- ✅ Checks rate limits for NORMAL priority
- ✅ Checks rate limits for LOW priority
- ✅ Bypasses even when user is at limit

#### Per-User Limit
- ✅ Returns true when per-user limit exceeded (101 notifications)
- ✅ Returns true when per-user limit exactly at 101
- ✅ Returns false when per-user limit at 100 (not exceeded)
- ✅ Returns false when per-user limit at 99
- ✅ Uses correct Redis key for per-user limit

#### Per-Type Limit
- ✅ Returns true when per-type limit exceeded (11 notifications)
- ✅ Returns true when per-type limit exactly at 11
- ✅ Returns false when per-type limit at 10 (not exceeded)
- ✅ Returns false when per-type limit at 9
- ✅ Uses correct Redis key for per-type limit
- ✅ Handles different notification types independently

#### Combined Scenarios
- ✅ Passes when both limits are within bounds
- ✅ Fails when only per-user limit exceeded
- ✅ Fails when only per-type limit exceeded
- ✅ Fails when both limits exceeded

#### Reset Rate Limits
- ✅ Deletes all rate limit keys for a user
- ✅ Does not crash when no keys found
- ✅ Does not crash when Redis keys fails
- ✅ Does not crash when Redis del fails
- ✅ Handles pattern matching for specific user

#### Key Generation Edge Cases
- ✅ Handles user IDs with special characters
- ✅ Handles notification types with underscores
- ✅ Handles very long user IDs

---

### 5. Quiet Hours Edge Cases
**File**: `__tests__/unit/notifications/utils/quiet-hours-edge-cases.test.ts`
**Tests**: 34 passing
**Coverage Areas**:

#### Overnight Quiet Hours Edge Cases
- ✅ Correctly handles overnight quiet hours at 23:59
- ✅ Correctly handles overnight quiet hours at 00:00 (midnight)
- ✅ Correctly handles overnight quiet hours at 00:01
- ✅ Correctly handles overnight quiet hours at 06:59
- ✅ Correctly handles end of overnight quiet hours at 07:00
- ✅ Handles very long overnight quiet hours (21:00 - 09:00)
- ✅ Handles very short overnight quiet hours (23:30 - 00:30)

#### Edge of Quiet Hours Window
- ✅ Returns true at exact start time (inclusive)
- ✅ Returns false at exact end time (exclusive)
- ✅ Returns true one minute before end time
- ✅ Returns false one minute after end time
- ✅ Returns false one minute before start time
- ✅ Returns true one minute after start time

#### No Quiet Hours Configured
- ✅ Returns false when quietHoursEnabled is false
- ✅ Returns false when quietHoursStart is null
- ✅ Returns false when quietHoursEnd is null
- ✅ Returns false when both times are null
- ✅ Returns false when disabled even if in time window

#### Get Quiet Hours End Time
- ✅ Returns today when quiet hours end later today
- ✅ Returns tomorrow when quiet hours ended earlier today
- ✅ Returns today when exactly at end time
- ✅ Handles minutes in end time
- ✅ Defaults to 08:00 tomorrow when quietHoursEnd is null
- ✅ Handles midnight (00:00) as end time
- ✅ Handles early morning end time (06:00)

#### Real-World Scenarios
- ✅ Handles notification at 23:30 with quiet hours until 08:00
- ✅ Handles notification at 07:00 with quiet hours until 08:00
- ✅ Handles notification at 14:00 outside quiet hours
- ✅ Handles user in different timezone (US Pacific)
- ✅ Handles user in different timezone (Asia Tokyo)

#### Boundary Value Testing
- ✅ Handles 00:00 start and 23:59 end (almost full day)
- ✅ Handles same start and end time (no quiet hours)
- ✅ Handles 23:00 start and 23:30 end (30-minute window)
- ✅ Handles noon quiet hours (12:00 - 13:00)

---

## Test Summary

| Test File | Tests | Status |
|-----------|-------|--------|
| notification-service-edge-cases.test.ts | 15 | ✅ All Passing |
| push-service-edge-cases.test.ts | 19 | ✅ All Passing |
| fcm-service-edge-cases.test.ts | 24 | ✅ All Passing |
| rate-limiter-edge-cases.test.ts | 37 | ✅ All Passing |
| quiet-hours-edge-cases.test.ts | 34 | ✅ All Passing |
| **TOTAL** | **129** | **✅ All Passing** |

## Running the Tests

### Run all edge case tests:
```bash
npm test -- \
  __tests__/lib/notifications/notification-service-edge-cases.test.ts \
  __tests__/lib/capacitor/push-service-edge-cases.test.ts \
  __tests__/lib/firebase/fcm-service-edge-cases.test.ts \
  __tests__/lib/notifications/utils/rate-limiter-edge-cases.test.ts \
  __tests__/unit/notifications/utils/quiet-hours-edge-cases.test.ts
```

### Run individual test suites:
```bash
npm test -- __tests__/lib/notifications/notification-service-edge-cases.test.ts
npm test -- __tests__/lib/capacitor/push-service-edge-cases.test.ts
npm test -- __tests__/lib/firebase/fcm-service-edge-cases.test.ts
npm test -- __tests__/lib/notifications/utils/rate-limiter-edge-cases.test.ts
npm test -- __tests__/unit/notifications/utils/quiet-hours-edge-cases.test.ts
```

### Run with coverage:
```bash
npm run test:coverage -- \
  __tests__/lib/notifications/notification-service-edge-cases.test.ts \
  __tests__/lib/capacitor/push-service-edge-cases.test.ts \
  __tests__/lib/firebase/fcm-service-edge-cases.test.ts \
  __tests__/lib/notifications/utils/rate-limiter-edge-cases.test.ts \
  __tests__/unit/notifications/utils/quiet-hours-edge-cases.test.ts
```

## Coverage Goals Achieved

### notification-service.ts
- ✅ Notification expired during processing
- ✅ All channels fail (max retries exceeded)
- ✅ Partial delivery (some channels succeed, some fail)
- ✅ Scheduled notification handling
- ✅ Quiet hours rescheduling for all priority levels

### push-service.ts (lib/capacitor/)
- ✅ Permission denied scenarios
- ✅ Registration error handling
- ✅ Badge update error handling
- ✅ Platform detection (iOS, Android, Web)

### fcm-service.ts
- ✅ Invalid token cleanup
- ✅ Batch send failures
- ✅ Platform-specific message building for all priorities
- ✅ Device token updates

### rate-limiter.ts
- ✅ Redis connection failure (fail open)
- ✅ First request in window (TTL setting)
- ✅ URGENT priority bypass
- ✅ Per-user and per-type limits
- ✅ Combined limit scenarios

### quiet-hours.ts
- ✅ Overnight quiet hours (e.g., 22:00 - 07:00)
- ✅ Edge of quiet hours window
- ✅ No quiet hours configured
- ✅ Timezone handling
- ✅ Boundary value testing

## Key Edge Cases Covered

1. **Fail-Safe Behaviors**
   - Rate limiter fails open when Redis is unavailable
   - Push service gracefully handles permission denial
   - FCM service handles Firebase Admin unavailability

2. **Priority-Based Logic**
   - URGENT notifications bypass rate limits
   - URGENT notifications bypass quiet hours
   - Priority-specific Android notification channels

3. **Time-Based Logic**
   - Overnight quiet hours crossing midnight
   - Exact boundary conditions (start/end times)
   - Timezone-aware calculations

4. **Retry Logic**
   - Exponential backoff scheduling
   - Max retries exceeded handling
   - Partial delivery scenarios

5. **Error Handling**
   - Invalid token cleanup
   - Temporary vs permanent errors
   - Network failures

## Next Steps

1. **Run coverage report** to verify 100% branch coverage:
   ```bash
   npm run test:coverage
   ```

2. **Add integration tests** for end-to-end notification flows

3. **Performance testing** for high-volume notification scenarios

4. **Monitor test execution time** and optimize slow tests if needed

---

**Last Updated**: 2025-12-02
**Author**: Test Coverage Initiative
**Status**: All tests passing (129/129)
