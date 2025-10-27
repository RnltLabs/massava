# GDPR Compliance Documentation

## Auftragsverarbeitungsverträge (AVV / DPA)

Dieses Dokument enthält Informationen zu allen Auftragsverarbeitern, die im Rahmen von Massava personenbezogene Daten verarbeiten.

---

## 1. Hetzner Online GmbH

**Status:** ✅ GDPR-konform (Deutschland)

### Unternehmensdetails
- **Unternehmen:** Hetzner Online GmbH
- **Adresse:** Industriestr. 25, 91710 Gunzenhausen, Deutschland
- **Website:** https://www.hetzner.com
- **Support:** support@hetzner.com

### Zweck der Verarbeitung
- Hosting der Massava-Webanwendung
- Datenbankspeicherung (PostgreSQL)
- Server-Infrastruktur

### Rechenzentrumsstandort
- **Primär:** Falkenstein, Deutschland
- **Sekundär:** Nürnberg, Deutschland
- **Alle Server:** EU/EWR-Gebiet

### AVV (Auftragsverarbeitungsvertrag)

**Wichtig:** Der AVV muss vom Kunden (Massava-Betreiber) bei Hetzner beantragt und unterzeichnet werden.

#### So erhalten Sie den AVV:

1. **Im Hetzner Robot/Konsole:**
   - Login: https://robot.hetzner.com oder https://console.hetzner.cloud
   - Navigieren Sie zu "Verträge" oder "Compliance"
   - Laden Sie den AVV-Standardvertrag herunter

2. **Per E-Mail:**
   - Kontakt: support@hetzner.com
   - Betreff: "Auftragsverarbeitungsvertrag (AVV) für Massava"
   - Geben Sie Ihre Kundennummer an

3. **Standardvorlage:**
   - Hetzner bietet einen Standard-AVV gemäß DSGVO Art. 28
   - Keine individuellen Verhandlungen erforderlich
   - Kann elektronisch oder per Post unterzeichnet werden

#### AVV-Details (nach Unterzeichnung auszufüllen):
```
AVV unterzeichnet am: [TBD - DATUM EINTRAGEN]
AVV-Dokumentnummer: [TBD - REFERENZNUMMER EINTRAGEN]
Unterzeichnet von: [TBD - NAME EINTRAGEN]
Gespeicherter Standort: [TBD - z.B. "docs/gdpr/avv-hetzner-signed.pdf"]
```

### Datenschutzinformationen
- **DSGVO-konform:** Ja (deutscher Anbieter, deutsche Datenzentren)
- **Datenschutzerklärung:** https://www.hetzner.com/rechtliches/datenschutz
- **AGB:** https://www.hetzner.com/rechtliches/agb
- **Zertifizierungen:** ISO 27001

### Technische und organisatorische Maßnahmen (TOM)
Hetzner dokumentiert umfassende TOMs gemäß DSGVO Art. 32:
- Zugangskontrollen
- Zutrittskontrolle zu Rechenzentren
- Verschlüsselung
- Datensicherheit
- Verfügbarkeitskontrolle

Details: https://www.hetzner.com/rechtliches/datenschutz

---

## 2. Resend Inc.

**Status:** ✅ GDPR-konform (DPA verfügbar)

### Unternehmensdetails
- **Unternehmen:** Resend Inc.
- **Standort:** USA (mit EU-Datenverarbeitung)
- **Website:** https://resend.com
- **Support:** support@resend.com

### Zweck der Verarbeitung
- E-Mail-Versand (Verifizierung, Benachrichtigungen)
- Transaktionale E-Mails

### Datenschutz & Compliance
- **DPA verfügbar:** Ja (automatisch für EU-Kunden)
- **DPA-Link:** https://resend.com/legal/dpa
- **Privacy Policy:** https://resend.com/legal/privacy-policy
- **GDPR Art. 28:** Erfüllt

### EU-Datenverarbeitung
- **EU-Region verfügbar:** Ja
- **Datenstandort:** Konfigurierbar (EU-Server)
- **Standard Contractual Clauses (SCC):** Ja

### Datenkategorien
- E-Mail-Adressen
- Benutzernamen (optional)
- Temporäre Verifizierungstokens

### Datenspeicherung
- **E-Mail-Logs:** 30 Tage (konfigurierbar)
- **Keine dauerhafte Speicherung** von E-Mail-Inhalten
- **Metadaten:** Versandstatus, Zeitstempel

---

## 3. Sentry/GlitchTip (Error Tracking)

**Status:** ⚠️ Zu konfigurieren

### Unternehmensdetails
- **Option 1:** Sentry (USA, GDPR-konform mit DPA)
- **Option 2:** GlitchTip (Open Source, selbst-gehostet möglich)

### Zweck der Verarbeitung
- Fehler-Tracking
- Performance-Monitoring
- Anwendungsdiagnose

### Datenkategorien
- Error-Logs
- User-IDs (anonymisiert)
- IP-Adressen (anonymisiert)
- Browser-/System-Informationen

### GDPR-Konfiguration
**Wichtig:** Folgende Einstellungen aktivieren:
- IP-Anonymisierung aktiviert ✅
- Keine PII (Personally Identifiable Information) in Logs
- Data Scrubbing aktiviert
- Datenspeicherung: EU-Region

### Sentry DPA
Falls Sentry verwendet wird:
- **DPA:** https://sentry.io/legal/dpa/
- **Privacy Policy:** https://sentry.io/privacy/
- **EU-Region:** Verfügbar (eu.sentry.io)

---

## 4. Weitere Auftragsverarbeiter

### Zukünftige Services (geplant)
Folgende Services könnten hinzugefügt werden:

1. **Stripe (Zahlungsabwicklung)**
   - DPA: https://stripe.com/de/privacy-center/legal#data-processing-agreement
   - GDPR-konform

2. **Google OAuth (Login)**
   - DPA: Teil der Google Cloud Platform DPA
   - GDPR-konform

3. **Cloudflare (CDN/DDoS Protection)**
   - DPA: https://www.cloudflare.com/cloudflare-customer-dpa/
   - GDPR-konform

---

## Checkliste für neue Auftragsverarbeiter

Vor der Integration eines neuen Services:

- [ ] GDPR-Compliance geprüft
- [ ] DPA/AVV verfügbar und unterzeichnet
- [ ] Datenverarbeitungsort (EU vs. Drittland)
- [ ] Standard Contractual Clauses (SCC) falls Drittland
- [ ] Technische und organisatorische Maßnahmen (TOM) dokumentiert
- [ ] Datenkategorien definiert
- [ ] Datenspeicherdauer festgelegt
- [ ] Datenschutzerklärung aktualisiert
- [ ] Sub-Processor-Liste aktualisiert

---

## Kontakt & Support

Bei Fragen zur GDPR-Compliance:
- **E-Mail:** datenschutz@massava.de
- **Datenschutzbeauftragter:** [TBD - falls erforderlich]

---

**Letzte Aktualisierung:** 2025-10-27
**Nächste Überprüfung:** 2026-04-27 (halbjährlich)

---

## Anhänge

- [ ] `avv-hetzner-signed.pdf` - Unterzeichneter Hetzner AVV (noch ausstehend)
- [ ] `dpa-resend.pdf` - Resend DPA (automatisch über Platform)
- [ ] `tom-hetzner.pdf` - Technische und organisatorische Maßnahmen (Hetzner)
