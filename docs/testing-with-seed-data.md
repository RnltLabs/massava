# Testing Guide: Karlsruhe Seed Data

## Überblick

Dieser Guide beschreibt, wie du die Karlsruhe-Test-Daten für lokales Testing der Booking-Flow-Funktionalität verwendest.

## Quick Start

```bash
# 1. Seed-Daten erstellen
npm run seed:karlsruhe

# 2. Dev-Server starten
npm run dev

# 3. Browser öffnen
open http://localhost:3000
```

## Test-Szenarien

### 1. Landing Page - Studio-Suche

**Ziel:** Prüfe, ob Studios korrekt gefunden und angezeigt werden.

**Schritte:**
1. Navigiere zu: `http://localhost:3000`
2. Gib ein: **"Karlsruhe"** im Suchfeld
3. Wähle Radius: **20 km**
4. Optional: Wähle Service-Typ (z.B. "Thai-Massage")
5. Klicke **"Studios finden"**

**Erwartetes Ergebnis:**
- ✅ 6-8 Studios werden angezeigt
- ✅ Jedes Studio zeigt Name, Adresse, Entfernung
- ✅ Geo-Koordinaten funktionieren (Karte/Entfernung)
- ✅ Filter nach Service-Typ funktioniert

**Debug:**
```typescript
// Check in DevTools Console:
console.log('Found studios:', studios.length);
console.log('Studios:', studios.map(s => ({ name: s.name, city: s.city })));
```

---

### 2. Studio-Detail-Seite

**Ziel:** Prüfe Studio-Informationen und verfügbare Services.

**Schritte:**
1. Klicke auf ein Studio aus den Suchergebnissen
2. Prüfe Studio-Details:
   - Name, Beschreibung
   - Adresse, Telefon, Email
   - Opening Hours
   - Services-Liste

**Erwartetes Ergebnis:**
- ✅ Alle Studio-Informationen korrekt angezeigt
- ✅ Opening Hours im richtigen Format
- ✅ 3-5 Services pro Studio
- ✅ Services zeigen Preis und Dauer

**Example Studio:**
```
Name: Thai Wellness Oase
Address: Kaiserstraße 123, 76133 Karlsruhe
Phone: +49 721 xxx xxx xxx
Opening Hours:
  Mo-Fr: 09:00-20:00
  Sa: 10:00-18:00
  So: Geschlossen

Services:
- Traditionelle Thai-Massage 60 Min (€65)
- Thai-Massage 90 Min (€70)
- Entspannende Ölmassage 60 Min (€75)
```

---

### 3. Kalender-Ansicht (TimeSlots)

**Ziel:** Prüfe verfügbare Termine im Kalender.

**Schritte:**
1. Wähle einen Service aus
2. Öffne Kalender-Ansicht
3. Prüfe TimeSlots für die nächsten 14 Tage

**Erwartetes Ergebnis:**
- ✅ TimeSlots für 14 Tage sichtbar
- ✅ **60% verfügbare** Slots (grün/aktiv)
- ✅ **20% gebuchte** Slots (rot/disabled)
- ✅ **20% geblockte** Slots (grau/disabled)
- ✅ Keine Slots während Mittagspause (12:00-13:00)
- ✅ Keine Slots außerhalb Opening Hours
- ✅ Slots nur an Wochentagen mit Opening Hours

**Debug:**
```sql
-- Prisma Studio: Check TimeSlots
SELECT
  studioId,
  COUNT(*) as total,
  SUM(CASE WHEN isAvailable = true THEN 1 ELSE 0 END) as available,
  SUM(CASE WHEN isBooked = true THEN 1 ELSE 0 END) as booked
FROM time_slots
GROUP BY studioId;
```

---

### 4. Booking-Details

**Ziel:** Prüfe bestehende Buchungen.

**Schritte:**
1. Öffne Prisma Studio: `npx prisma studio`
2. Navigiere zu **Booking** Tabelle
3. Prüfe Booking-Details

**Erwartetes Ergebnis:**
- ✅ 10-15 Bookings vorhanden
- ✅ Realistische Kundennamen (deutsch)
- ✅ Email-Format: vorname.nachname@example.com
- ✅ Telefon-Format: +49 721 xxx xxx xxx
- ✅ Status: 75% CONFIRMED, 25% PENDING
- ✅ Optional: Nachricht vorhanden

**Example Booking:**
```json
{
  "id": "clxyz123...",
  "customerName": "Max Müller",
  "customerEmail": "max.mueller@example.com",
  "customerPhone": "+49 721 123 456 789",
  "preferredDate": "15.11.2025",
  "preferredTime": "14:00",
  "message": "Bitte warmes Öl verwenden",
  "status": "CONFIRMED"
}
```

---

### 5. BlockedTimes

**Ziel:** Prüfe geblockte Zeiträume.

**Schritte:**
1. Öffne Prisma Studio: `npx prisma studio`
2. Navigiere zu **BlockedTime** Tabelle
3. Prüfe blocked time entries

**Erwartetes Ergebnis:**
- ✅ 5-10 BlockedTimes vorhanden
- ✅ Realistische Gründe (Mittagspause, Meeting, etc.)
- ✅ Start/End-Zeiten korrekt
- ✅ Optional: isAllDay = true für Ganztages-Blocks

**Example BlockedTime:**
```json
{
  "id": "clxyz456...",
  "studioId": "clxyz789...",
  "startTime": "2025-11-15T12:00:00Z",
  "endTime": "2025-11-15T13:00:00Z",
  "reason": "Mittagspause",
  "isAllDay": false
}
```

---

## Integration Tests

### Test 1: Radius-Suche
```typescript
// Test: All studios within 20km of Karlsruhe center
const center = { lat: 49.0094, lng: 8.4044 }; // Karlsruhe
const radius = 20; // km

const studios = await searchStudios({
  city: 'Karlsruhe',
  latitude: center.lat,
  longitude: center.lng,
  radiusKm: radius,
});

expect(studios.length).toBeGreaterThanOrEqual(6);
expect(studios.length).toBeLessThanOrEqual(8);
```

### Test 2: Service-Filter
```typescript
// Test: Filter by service type
const studiosWithThai = await searchStudios({
  city: 'Karlsruhe',
  serviceType: 'Thai-Massage',
});

for (const studio of studiosWithThai) {
  const hasThaiService = studio.services.some(
    s => s.name.includes('Thai')
  );
  expect(hasThaiService).toBe(true);
}
```

### Test 3: Available TimeSlots
```typescript
// Test: Studio has available slots
const studio = await prisma.studio.findFirst({
  where: { city: 'Karlsruhe' },
  include: { timeSlots: true },
});

const availableSlots = studio.timeSlots.filter(
  slot => slot.isAvailable && !slot.isBooked
);

// Should have ~60% available slots
const availablePercentage =
  (availableSlots.length / studio.timeSlots.length) * 100;

expect(availablePercentage).toBeGreaterThan(50);
expect(availablePercentage).toBeLessThan(70);
```

---

## E2E Tests (Playwright)

### Test 1: Search Flow
```typescript
test('User can search for studios in Karlsruhe', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Fill search form
  await page.fill('input[name="city"]', 'Karlsruhe');
  await page.selectOption('select[name="radius"]', '20');

  // Submit search
  await page.click('button[type="submit"]');

  // Check results
  const studios = await page.locator('[data-testid="studio-card"]').count();
  expect(studios).toBeGreaterThanOrEqual(6);
  expect(studios).toBeLessThanOrEqual(8);
});
```

### Test 2: Booking Flow
```typescript
test('User can view available time slots', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Search for Karlsruhe
  await page.fill('input[name="city"]', 'Karlsruhe');
  await page.click('button[type="submit"]');

  // Click first studio
  await page.click('[data-testid="studio-card"]:first-child');

  // Select service
  await page.click('[data-testid="service-card"]:first-child');

  // Check calendar
  const availableSlots = await page
    .locator('[data-testid="time-slot"][data-available="true"]')
    .count();

  expect(availableSlots).toBeGreaterThan(0);
});
```

---

## Troubleshooting

### Problem: Keine Studios gefunden

**Lösung:**
1. Prüfe ob Seed erfolgreich war:
   ```bash
   npx prisma studio
   # Check Studios table → should have 6-8 entries with city="Karlsruhe"
   ```

2. Prüfe Geo-Koordinaten:
   ```sql
   SELECT name, city, latitude, longitude
   FROM studios
   WHERE city = 'Karlsruhe';
   ```

3. Re-run Seed:
   ```bash
   npm run seed:karlsruhe
   ```

---

### Problem: Keine verfügbaren TimeSlots

**Lösung:**
1. Prüfe TimeSlots in Prisma Studio:
   ```sql
   SELECT
     studioId,
     COUNT(*) as total,
     SUM(CASE WHEN isAvailable = true THEN 1 ELSE 0 END) as available
   FROM time_slots
   WHERE studioId = 'xxx'
   GROUP BY studioId;
   ```

2. Prüfe Opening Hours Format:
   ```json
   // Should be valid JSON
   {
     "monday": { "open": "09:00", "close": "20:00" },
     ...
   }
   ```

3. Re-run Seed:
   ```bash
   npm run seed:karlsruhe
   ```

---

### Problem: Booking-Status falsch

**Lösung:**
1. Prüfe Booking-Service-Mapping:
   ```sql
   SELECT b.*, ts.isBooked
   FROM bookings b
   LEFT JOIN time_slots ts ON ts.bookingId = b.id
   WHERE b.studioId = 'xxx';
   ```

2. Prüfe Foreign Keys:
   ```sql
   -- Should have matching IDs
   SELECT COUNT(*)
   FROM bookings b
   WHERE NOT EXISTS (
     SELECT 1 FROM time_slots ts
     WHERE ts.bookingId = b.id
   );
   ```

---

## Performance-Tests

### Test: Seed Performance
```bash
time npm run seed:karlsruhe

# Expected: < 10 seconds for full seed
```

### Test: Query Performance
```typescript
// Test: Search performance
console.time('search');
const studios = await searchStudios({
  city: 'Karlsruhe',
  radiusKm: 20,
});
console.timeEnd('search');

// Expected: < 100ms
```

---

## Cleanup

### Reset Test Data
```bash
# Delete all Karlsruhe test data
npm run seed:karlsruhe

# Or manually in Prisma Studio:
# 1. Delete Studios where city = "Karlsruhe"
# 2. Cascade delete will remove related data
```

### Reset Database (Nuclear Option)
```bash
# WARNING: Deletes ALL data
npx prisma migrate reset

# Then re-seed
npm run seed:karlsruhe
```

---

## Next Steps

Nach erfolgreichem Testing:

1. ✅ Implementiere Booking-Flow UI
2. ✅ Teste Payment-Integration
3. ✅ Teste Email-Notifications
4. ✅ Teste Admin-Dashboard
5. ✅ Deploy zu Staging

---

**Last Updated:** 2025-11-02
**Maintained By:** Development Team
