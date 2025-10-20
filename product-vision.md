# Massava - Product Vision

## Problem

**Massage-Studios kämpfen mit teuren Buchungssystemen und hohen Provisionen:**

- Treatwell verlangt 30-50€/Monat + Provisionen bei Online-Zahlung
- Zentrale Zahlungsabwicklung = Kontrolle über Einnahmen
- Kompliziert für Studios mit hohem Cash-Anteil (84% Thai-Massage-Studios)
- Kaum Digitalisierung: Telefon & WhatsApp dominieren
- Hoher Preisdruck: Geringe Margen, Marketing zu teuer

**Treatwell verpasst Branchen mit hohem Cash-Anteil:**
- Massage (Thai, Wellness, klassische Studios)
- Nagelstudios
- Waxingstudios
- Kosmetikstudios

---

## Target Users

### Primary: Studio-Betreiber (B2B)
- Massage-Studios (Fokus: Thai-Massage, Wellness)
- Kleine bis mittelgroße Studios (1-5 Mitarbeiter)
- Hoher Cash-Anteil in der Abrechnung
- Wenig digitale Affinität
- Preissensitiv

### Secondary: Endkunden (B2C)
- Lokale Kunden in Karlsruhe (Pilot)
- Spontane Buchungen
- Mobile-first Nutzung
- Preisbewusst

---

## Core Value Proposition

**"Mind your own business. You run your studio – we make it easy."**

### Für Studios:
- **Kostenlos starten** - Keine Einstiegshürde (Freemium)
- **Keine Provisionen** - Studios behalten 100% ihrer Einnahmen
- **Keine Abhängigkeit** - Kein Eingriff in Finanzen oder Abläufe
- **Mobile-optimiert** - Alles vom Handy steuerbar
- **Multilingual** - Deutsch, Englisch, Thai (wichtig für 84% Thai-Studios)

### Für Endkunden:
- Schnell & spontan buchen - mobil, einfach
- Angebote entdecken (Rabatte, freie Slots)
- 24/7 verfügbar

---

## MVP Features (Phase 1 - Version 0.1.0)

**Absolutes Minimum für 2-Stunden-Launch:**

### Landing Page
- Info über Massava
- Value Proposition für Studios
- Call-to-Action: Studio registrieren

### Studio Registration
- Einfaches Formular (Name, Adresse, Telefon, Email, Beschreibung)
- Leistungen hinzufügen (Service-Liste)
- Registrierung in ~3 Klicks

### Studio Listing
- Browse Studios nach Stadt (Start: Karlsruhe)
- Filter: Stadt, Service-Art
- Mobile-responsive Grid

### Studio Profile
- Studio-Name, Adresse, Telefon
- Beschreibung
- Service-Liste mit Preisen
- Öffnungszeiten

### Booking Form
- Einfaches Formular:
  - Kundenname, Email, Telefon
  - Gewünschter Service (Dropdown)
  - Wunsch-Datum & -Zeit (Textfeld)
  - Nachricht/Anmerkungen
- Submit → Email an Studio-Betreiber

### Email Notifications
- Studio erhält Email bei neuer Buchungsanfrage
- Kunde erhält Bestätigung

---

## NOT in MVP (Add Later)

- ❌ Kalender-Integration & Verfügbarkeits-Check
- ❌ Mitarbeiter-Scheduling
- ❌ Studio-Dashboard (Buchungen verwalten)
- ❌ Kunden-Accounts
- ❌ Push-Benachrichtigungen
- ❌ Premium-Features (Top-Listing, Push-Angebote)
- ❌ Payment Processing (Stripe Abos)
- ❌ iCal Sync
- ❌ Bewertungssystem

---

## Tech Stack

### Frontend
- **Next.js 14** (App Router) - SEO, SSR, API routes
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - UI components
- **PWA** - Progressive Web App (später für Push)

### Backend (MVP: Simplified)
- **Next.js API Routes** - No separate backend needed
- **PostgreSQL** - Database (via Vercel Postgres or Supabase)
- **Prisma** - ORM for type-safe queries

### Infrastructure
- **Hetzner Server** - 91.98.69.15
- **Docker** - Containerization
- **Nginx** - Reverse proxy + SSL
- **GitHub Actions** - CI/CD pipeline
- **Discord** - Deployment notifications

### Email
- **Resend** or **SendGrid** - Transactional emails

---

## Monetization Model

**Freemium** - Free-to-start, premium for visibility

### Free Tier (100% kostenlos)
- ✅ Studio-Profil
- ✅ Buchungsformular
- ✅ Email-Benachrichtigungen
- ✅ Service-Liste
- ✅ Basis-Listing

### Premium Tier (49€/Monat) - *Not in MVP*
- ⭐ Top-Listing (höhere Sichtbarkeit)
- 💬 Push-Angebote an Kunden senden
- 📊 Erweiterte Statistiken
- ✅ Premium-Badge (Vertrauenssignal)
- 🔄 Automatisierte Leerzeit-Rabatte

**Conversion Strategy (später):**
- FOMO durch Vergleichsstatistiken
- Verlorenes Potenzial visualisieren
- Social Proof (Erfolgsgeschichten)
- Progressive Feature-Unlocks

---

## Market Analysis

### Pilot: Karlsruhe
- **56 Studios total**
- **36 Thai-Massage (64%)**
- **14 Massage**
- **4 Chinesische Massage**
- **1 Medizinische Massage**
- **1 Sport-Massage**

**Studios ohne Buchungssystem: ~85% (48 Studios)**

### Deutschland (Top 56 Städte >150k Einwohner)
- **4.663 Studios gesamt**
- **2.998 Thai-Massage (64%)**
- **~4.000 ohne Buchungssystem**

### Revenue Projection (Conservative)

**40% Marktdurchdringung, 10% Abo-Quote:**
- Deutschland: 4.663 Studios → 1.865 on platform → 186 paying → **9.139€/Monat**
- Karlsruhe: 56 Studios → 22 on platform → 2 paying → **110€/Monat**

**100% Marktdurchdringung, 40% Abo-Quote:**
- Deutschland: 4.663 Studios → 1.865 paying → **91.385€/Monat**

---

## Go-to-Market Strategy

### Phase 1: Karlsruhe Pilot (Week 1-4)
1. **Kaltakquise** - Persönlich Studios besuchen
2. **Gratis Onboarding** - 5-10 Studios registrieren
3. **QR-Code Visitenkarten** - Kostenlos für Studios
4. **Erste Buchungen** - Konzept validieren

### Phase 2: Lokale Dominanz (Week 5-12)
1. **Domino-Effekt** - Studios werben Studios
2. **Studiodichte maximieren** - "Kunden-Konkurrenzkampf" auf Plattform
3. **Premium Testing** - Erste Conversions testen

### Phase 3: Expansion (Month 4+)
1. **Nachbarstädte** - Mannheim, Heidelberg, Stuttgart
2. **Multi-Brand Launch** - massage.massava.de, nails.massava.de
3. **SEO-Optimierung** - Organisches Wachstum

---

## Multi-Brand Strategy (Later)

**Konzept: 1 Backend, N Frontends**

- `massage.massava.de` - Massage-Studios
- `nails.massava.de` - Nagelstudios
- `waxing.massava.de` - Waxing-Studios
- `kosmetik.massava.de` - Kosmetik-Studios

**Vorteile:**
- Reduzierte Komplexität für Nutzer
- Perfekt für SEO (Branch-spezifische Keywords)
- "Wir verstehen EURE Branche"
- Shared Backend = Effizienz

---

## Success Metrics (MVP)

### Week 1-2
- ✅ MVP deployed to staging (massava-staging.rnltlabs.de)
- ✅ 5 Studios onboarded in Karlsruhe
- ✅ 10 Buchungsanfragen über Plattform

### Month 1
- 15 Studios on platform (Karlsruhe)
- 50+ Buchungen
- 1-2 Studios interested in Premium (validation)

### Month 3
- 30 Studios (Karlsruhe + neighbors)
- 200+ Buchungen/month
- 3-5 paying Premium subscriptions

---

## Key Principles

### Win-Win-Win Strategy
1. **Studios gewinnen** - Mehr Buchungen, weniger Arbeit, gratis Start
2. **Kunden gewinnen** - Schnell buchen, Angebote finden
3. **Plattform gewinnt** - Masse → Relevanz → Premium-Conversions

### Platform Philosophy
- **Freemium first** - Keine Einstiegshürde
- **No commissions** - Studios behalten ihre Einnahmen
- **Mobile-first** - Alles vom Handy steuerbar
- **Multilingual** - Barrieren abbauen
- **Lokale Dichte** - Stadt für Stadt erobern

### Psychological Triggers (Premium Conversion)
- FOMO durch Vergleichsstatistiken
- Verlorenes Potenzial visualisieren
- Social Proof & Success Stories
- Progressive Feature Unlocks

---

## Timeline: Idee → MVP in 2 Hours

- ✅ **Phase 1**: Idea Discussion (30 min) - DONE
- ⏳ **Phase 2**: Project Setup (20 min) - NEXT
- ⏳ **Phase 3**: Configure CI/CD & Server (30 min)
- ⏳ **Phase 4**: Build MVP Core (40 min)
- ⏳ **Phase 5**: Deploy to Production (10 min)

**Total: ~2h 10min from idea to live staging environment**

---

**Copyright © 2025 Roman Reinelt / RNLT Labs. All rights reserved.**

This documentation is proprietary and confidential. Unauthorized use, reproduction, or distribution is prohibited.
