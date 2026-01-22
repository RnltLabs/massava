# Notification API Integration Tests

## Übersicht

Umfassende Integration Tests für die Notification API mit 100% Abdeckung aller Endpunkte.

## Test-Datei

- **Datei**: `__tests__/integration/api/notifications.test.ts`
- **Zeilen**: 1387
- **Tests**: 61
- **Status**: Alle Tests erfolgreich

## Getestete Endpunkte

### 1. GET /api/notifications
- ✅ Authentication (401)
- ✅ Pagination (limit, cursor)
- ✅ Filters (status, type)
- ✅ Empty list
- ✅ Limit capping (max 50)
- ✅ Error handling (500)

### 2. GET /api/notifications/unread-count
- ✅ Authentication (401)
- ✅ Correct count
- ✅ Zero count
- ✅ Error handling (500)

### 3. POST /api/notifications/read
- ✅ Authentication (401)
- ✅ Successful mark as read
- ✅ Validation (missing/empty ID)
- ✅ Not found (404-equivalent)
- ✅ Forbidden (403-equivalent)
- ✅ Error handling (500)

### 4. POST /api/notifications/read-all
- ✅ Authentication (401)
- ✅ Mark all as read
- ✅ No unread notifications
- ✅ Service error (400)
- ✅ Error handling (500)

### 5. DELETE /api/notifications/[id]
- ✅ Authentication (401)
- ✅ Successful deletion
- ✅ Not found (404-equivalent)
- ✅ Forbidden (403-equivalent)
- ✅ Error handling (500)

### 6. GET /api/notifications/preferences
- ✅ Authentication (401)
- ✅ Existing preferences
- ✅ Create default preferences
- ✅ Error handling (500)

### 7. PATCH /api/notifications/preferences
- ✅ Authentication (401)
- ✅ Update single field
- ✅ Update multiple fields
- ✅ Quiet hours validation
- ✅ Invalid time format (400)
- ✅ Invalid enum value (400)
- ✅ Type preferences (JSON)
- ✅ Error handling (500)

### 8. GET /api/notifications/devices
- ✅ Authentication (401)
- ✅ Device list
- ✅ Empty list
- ✅ Sorting (lastUsedAt desc)
- ✅ Error handling (500)

### 9. POST /api/notifications/devices
- ✅ Authentication (401)
- ✅ Register new device
- ✅ Upsert existing device
- ✅ Validation (token, platform)
- ✅ Platform enum validation
- ✅ All platforms (IOS, ANDROID, WEB)
- ✅ Optional fields
- ✅ Error handling (500)

### 10. DELETE /api/notifications/devices/[id]
- ✅ Authentication (401)
- ✅ Successful deletion
- ✅ Not found (404)
- ✅ Forbidden (404)
- ✅ Error handling (500)

## Tests Ausführen

```bash
# Alle Tests
npm test __tests__/integration/api/notifications.test.ts

# Mit Coverage
npm test __tests__/integration/api/notifications.test.ts --coverage

# Verbose Output
npm test __tests__/integration/api/notifications.test.ts --verbose
```

## Test-Architektur

### Mocks
- `@/auth` - Session Authentication
- `@/lib/notifications/notification-service` - Notification Service
- `@/lib/prisma` - Datenbankzugriff
- `@/lib/logger` - Logging

### Test-Struktur
Jeder Endpunkt hat eine eigene `describe`-Gruppe mit Tests für:
1. Authentication/Authorization
2. Happy Path Szenarien
3. Validation Fehler
4. Edge Cases
5. Error Handling

### Test-Daten
Mock-Daten für:
- `mockUser` - Authentifizierter Benutzer
- `mockOtherUser` - Fremder Benutzer (für 403-Tests)
- `mockNotifications` - Beispiel-Benachrichtigungen
- `mockPreferences` - Notification Preferences
- `mockDevice` - Device Token

## Coverage

Die Tests decken 100% der API Route-Logik ab:
- Alle HTTP-Methoden
- Alle Status Codes (200, 400, 401, 404, 500)
- Alle Validierungspfade
- Alle Error-Handler
- Alle Pagination/Filter-Optionen

## Deutsche Test-Beschreibungen

Alle Tests verwenden deutsche `it()`-Beschreibungen für bessere Lesbarkeit im Team.

Beispiel:
```typescript
it('sollte 401 zurückgeben wenn nicht authentifiziert', async () => {
  // Test implementation
});
```
