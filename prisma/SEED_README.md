# Test-Daten für Karlsruhe

## Überblick

Dieses Seed-Script erstellt realistische Test-Daten für die lokale Entwicklung und Testing der Booking-Flow-Funktionalität.

## Verwendung

```bash
npm run seed:karlsruhe
```

## Was wird erstellt?

### Studios (6-8)
- Verschiedene Stadtteile in Karlsruhe (Innenstadt, Durlach, Mühlburg, Südstadt, Weststadt, Nordstadt)
- Realistische Namen und Beschreibungen auf Deutsch
- Echte Straßenadressen in Karlsruhe
- Geo-Koordinaten für Radius-Suche
- Telefonnummern im Format: +49 721 xxx xxx xxx
- Email-Adressen im Format: info@studio-name.de
- Opening Hours (JSON-Format mit Öffnungszeiten)
- Capacity: 1-3 parallele Behandlungsplätze

**Beispiel-Studios:**
- Thai Wellness Oase (Innenstadt)
- Bamboo Spa Karlsruhe (Durlach)
- Sabai Massage Studio (Mühlburg)
- Lotus Spa & Wellness (Südstadt)
- und weitere...

### Services (3-5 pro Studio)
Realistische Massage-Services, die mit den `SERVICE_TYPES` aus `/lib/constants/serviceTypes.ts` matchen:

- **Thai-Massage** (60-90 Min, €50-75)
- **Traditionelle Thai-Massage** (60-120 Min, €55-75)
- **Ölmassage** (60-90 Min, €60-85)
- **Sportmassage** (45-60 Min, €50-70)
- **Hot Stone Massage** (90 Min, €80-100)
- **Aromatherapie-Massage** (60-90 Min, €65-90)
- **Fußreflexzonenmassage** (45 Min, €45-60)
- **Schwedische Massage** (60 Min, €55-70)
- **Wellness-Massage** (60-90 Min, €60-80)
- **Deep Tissue Massage** (60-90 Min, €70-95)

### TimeSlots (50-100 pro Studio)
Zeitslots für die nächsten 14 Tage:

**Status-Verteilung:**
- **60%** verfügbar (`isAvailable: true, isBooked: false`)
- **20%** gebucht (`isAvailable: false, isBooked: true`)
- **20%** geblockt (`isAvailable: false, isBooked: false`)

**Zeitplan:**
- Täglich von 8:00 bis 21:00 Uhr (je nach Studio)
- Slots alle 30 oder 60 Minuten
- Mittagspause: 12:00-13:00 (keine Slots)
- Nur Slots innerhalb der Opening Hours

### Bookings (10-15)
Demo-Buchungen für bereits gebuchte TimeSlots:

**Kunden:**
- Deutsche Namen (Max Müller, Anna Schmidt, etc.)
- Email: vorname.nachname@example.com
- Telefon: +49 721 xxx xxx xxx

**Status:**
- 75% `CONFIRMED`
- 25% `PENDING`

**Nachrichten (optional):**
- "Bitte warmes Öl verwenden"
- "Erste Massage - bin etwas nervös"
- "Fokus bitte auf Schultern und Nacken"
- etc.

### BlockedTimes (5-10)
Blockierte Zeiträume mit Gründen:

- "Mittagspause"
- "Teammeeting"
- "Fortbildung"
- "Wartung"
- "Privat"
- "Inventur"
- "Reinigung"

## Daten-Reset

Das Script löscht **alle bestehenden Studios in Karlsruhe** vor dem Seed, um eine saubere Test-Umgebung zu garantieren.

**Wichtig:** Nur Studios mit `city: "Karlsruhe"` werden gelöscht. Produktions-Daten aus anderen Städten bleiben erhalten.

## Testing-Workflow

Nach dem Seed:

### 1. Datenbank prüfen (Prisma Studio)
```bash
npx prisma studio
```

Überprüfe:
- ✅ 6-8 Studios in Karlsruhe
- ✅ 3-5 Services pro Studio
- ✅ 50-100 TimeSlots pro Studio
- ✅ 10-15 Bookings
- ✅ 5-10 BlockedTimes

### 2. Landing Page testen
```bash
npm run dev
```

Navigiere zu: http://localhost:3000

**Test-Schritte:**
1. Suche nach "Karlsruhe"
2. Wähle Radius: 20km
3. Du solltest 6-8 Studios sehen
4. Jedes Studio sollte verfügbare Services haben

### 3. Booking-Flow testen
1. Wähle ein Studio aus
2. Wähle einen Service
3. Prüfe verfügbare TimeSlots im Kalender
4. Teste Buchung (wenn Booking-Flow implementiert)

## Technische Details

### Opening Hours Format (JSON)
```json
{
  "monday": { "open": "09:00", "close": "20:00" },
  "tuesday": { "open": "09:00", "close": "20:00" },
  "wednesday": { "open": "09:00", "close": "20:00" },
  "thursday": { "open": "09:00", "close": "20:00" },
  "friday": { "open": "09:00", "close": "20:00" },
  "saturday": { "open": "10:00", "close": "18:00" },
  "sunday": { "closed": true }
}
```

### TimeSlot-Generierung
- Nutzt `date-fns` für Date-Manipulation
- Generiert nur Slots innerhalb Opening Hours
- Keine Slots während Mittagspause (12:00-13:00)
- Berücksichtigt Wochentag (Sonntag oft geschlossen)

### Geo-Koordinaten für Karlsruhe
```typescript
const karlsruheLocations = [
  { name: 'Innenstadt', lat: 49.0094, lng: 8.4044 },
  { name: 'Durlach', lat: 49.0047, lng: 8.4724 },
  { name: 'Mühlburg', lat: 49.0158, lng: 8.3803 },
  { name: 'Südstadt', lat: 48.9918, lng: 8.3986 },
  { name: 'Weststadt', lat: 49.0025, lng: 8.3803 },
  { name: 'Nordstadt', lat: 49.0194, lng: 8.4103 },
];
```

## Fehlerbehandlung

Das Script ist **idempotent** – kann mehrfach ausgeführt werden ohne Fehler:

1. Löscht bestehende Test-Daten
2. Erstellt neue Daten
3. Bei Fehler: Rollback durch Prisma-Transaction

**Mögliche Fehler:**
- `Database connection failed` → Prüfe DATABASE_URL in .env
- `Prisma client not generated` → Run `npx prisma generate`
- `Foreign key constraint` → Run `npx prisma migrate dev`

## Dependencies

Das Script nutzt:
- `@prisma/client` (Database ORM)
- `date-fns` (Date manipulation)
- `../app/generated/prisma` (Generated Prisma Client)
- `../lib/constants/serviceTypes` (Service Type Constants)

## Entwicklung

### Script erweitern
Füge neue Daten hinzu in:
- `STUDIO_TEMPLATES` (neue Studio-Typen)
- `SERVICE_TEMPLATES` (neue Service-Typen)
- `CUSTOMER_NAMES` (mehr Test-Kunden)

### Debug-Modus
Füge Console.logs hinzu für detaillierte Ausgabe:
```typescript
console.log('Created slot:', { slotStart, slotEnd, isAvailable, isBooked });
```

## Nächste Schritte

Nach erfolgreichem Seed:

1. ✅ Teste Landing Page (Search Widget)
2. ✅ Teste Studio-Detail-Seiten
3. ✅ Teste Kalender-Ansicht (TimeSlots)
4. ✅ Teste Booking-Flow
5. ✅ Teste Admin-Dashboard (Studio-Besitzer)

## Support

Bei Problemen:
1. Prüfe Console-Ausgabe
2. Öffne Prisma Studio (`npx prisma studio`)
3. Check Database-Schema (`npx prisma db pull`)
4. Reset Database (`npx prisma migrate reset`)

---

**Last Updated:** 2025-11-02
**Maintained By:** Development Team
