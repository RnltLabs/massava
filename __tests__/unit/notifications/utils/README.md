# Notification Utils Tests

## Übersicht

Unit Tests für die Notification Utility-Funktionen mit **100% Code Coverage**.

## Test-Dateien

### 1. `idempotency.test.ts`
Tests für `lib/notifications/utils/idempotency.ts`

**Funktionen:**
- `generateIdempotencyKey(input)` - Generiert SHA256-basierte Idempotency Keys

**Test-Kategorien:**
- Konsistenz (gleiche Inputs = gleicher Key)
- Zeitfenster-basierte Keys (1-Minute-Fenster)
- Edge Cases (Sonderzeichen, extreme Timestamps)
- Hash-Format (Hexadezimal, 32 Zeichen)
- Kollisionsresistenz
- Reale Szenarien (Retry-Logik)

**Tests:** 23
**Coverage:** 100%

### 2. `quiet-hours.test.ts`
Tests für `lib/notifications/utils/quiet-hours.ts`

**Funktionen:**
- `isInQuietHours(preferences)` - Prüft ob gerade Ruhezeit ist
- `getQuietHoursEndTime(preferences)` - Gibt Ende der Ruhezeit zurück

**Test-Kategorien:**
- Quiet Hours deaktiviert
- Normale Quiet Hours (innerhalb eines Tages)
- Quiet Hours über Mitternacht (z.B. 22:00 - 07:00)
- Verschiedene Zeitzonen (Europe/Berlin, US/Pacific, Asia/Tokyo, etc.)
- Edge Cases mit Minuten
- Ganztägige Quiet Hours
- Monats-/Jahreswechsel
- Reale Szenarien

**Tests:** 35
**Coverage:** 100%

### 3. `preference-checker.test.ts`
Tests für `lib/notifications/utils/preference-checker.ts`

**Funktionen:**
- `checkUserPreferences(preferences, type)` - Gibt aktive Kanäle zurück
- `shouldSendEmailImmediately(preferences, type)` - Prüft ob Email sofort gesendet wird

**Test-Kategorien:**
- Null Preferences (Defaults)
- Global Toggles (pushEnabled, emailEnabled, inAppEnabled)
- Type-Specific Preferences
- Global Toggle Override (Global hat Vorrang vor Type-Specific)
- Fallback zu IN_APP
- Edge Cases
- Alle 25 Notification Types

**Tests:** 37
**Coverage:** 100% (97.14% Branch Coverage)

## Coverage-Ergebnis

```
-----------------------|---------|----------|---------|---------|-------------------
File                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-----------------------|---------|----------|---------|---------|-------------------
All files              |     100 |    97.14 |     100 |     100 |                   
 idempotency.ts        |     100 |      100 |     100 |     100 |                   
 preference-checker.ts |     100 |    96.61 |     100 |     100 | 60                
 quiet-hours.ts        |     100 |      100 |     100 |     100 |                   
-----------------------|---------|----------|---------|---------|-------------------
```

**Gesamt:**
- **95 Tests** (alle bestanden)
- **100% Statement Coverage**
- **97.14% Branch Coverage**
- **100% Function Coverage**
- **100% Line Coverage**

## Tests ausführen

```bash
# Alle Notification Utils Tests
npm test -- __tests__/unit/notifications/utils/

# Einzelne Test-Datei
npm test -- __tests__/unit/notifications/utils/idempotency.test.ts
npm test -- __tests__/unit/notifications/utils/quiet-hours.test.ts
npm test -- __tests__/unit/notifications/utils/preference-checker.test.ts

# Mit Coverage
npm run test:coverage -- __tests__/unit/notifications/utils/
```

## Besondere Features

### Idempotency Tests
- Mockt keine externen Abhängigkeiten (pure function)
- Testet SHA256-Hash-Generierung
- Verifiziert 1-Minute-Zeitfenster für Retry-Toleranz

### Quiet Hours Tests
- Verwendet `jest.useFakeTimers()` für zeitbasierte Tests
- Testet verschiedene Zeitzonen (Intl.DateTimeFormat)
- Testet Mitternacht-Überschneidungen
- Testet Monats-/Jahreswechsel und Schaltjahre

### Preference Checker Tests
- Testet alle 25 Notification Types
- Testet Global Toggle Override-Logik
- Testet Fallback-Mechanismen
- Testet Email-Preferences (instant/digest/off)

## Test-Konventionen

- Deutsche Test-Beschreibungen (`it('sollte...')`)
- `describe` Blöcke für Gruppierung
- Keine externen Mocks (pure functions)
- Jest als Test-Framework
- TypeScript mit strikten Typen

## Nächste Schritte

Die folgenden Utils könnten noch getestet werden:
- `lib/notifications/utils/rate-limiter.ts` (falls vorhanden)
- `lib/notifications/utils/template-renderer.ts` (falls vorhanden)
- Weitere Utility-Funktionen im Notifications-Modul
