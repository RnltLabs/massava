# Datenschutzerklärung - Änderungsprotokoll

Dieses Dokument dokumentiert alle Änderungen an der Datenschutzerklärung von Massava.

---

## Version 2.0 (2025-11-04)

### Status
**Gültig ab:** 2025-11-04
**Grund:** DSGVO-Compliance-Verbesserungen gemäß Phase 1 der GDPR-Compliance-Initiative

### Zusammenfassung der Änderungen

Umfassende Aktualisierung der Datenschutzerklärung zur Dokumentation aller neuen DSGVO-Compliance-Maßnahmen, die in den Tasks 1.1-1.4 implementiert wurden.

### Neue Abschnitte

#### 4. Verschlüsselung von Gesundheitsdaten (Art. 9 DSGVO)
**Neu hinzugefügt**

- Dokumentation der Verarbeitung besonderer Kategorien personenbezogener Daten (Gesundheitsdaten)
- Rechtsgrundlage: Ausdrückliche Einwilligung gemäß Art. 9 Abs. 2 lit. a DSGVO
- Technische Sicherheitsmaßnahmen:
  - AES-256-GCM Verschlüsselung für alle Buchungsnachrichten
  - Hardware Security Module (HSM) für Schlüsselverwaltung
  - Multi-Faktor-Authentifizierung für Zugriff
  - Audit-Logging aller Zugriffe (90 Tage Aufbewahrung)
- Speicherdauer: 1 Jahr oder bis Widerruf der Einwilligung
- Widerrufsmöglichkeit dokumentiert
- **Referenz:** Task 1.1 (Health Data Encryption)

#### 5. Cookie-Einwilligung (ePrivacy-Richtlinie)
**Neu hinzugefügt**

- Vollständige Liste aller verwendeten Cookies:
  - Notwendige Cookies (session_token, csrf_token, cookie_consent)
  - Analyse-Cookies (Google Analytics) - Optional
  - Marketing-Cookies (Facebook Pixel, Google AdSense) - Optional
- Rechtsgrundlagen für jede Cookie-Kategorie
- Cookie-Einwilligungsmechanismus erklärt:
  - Alle akzeptieren
  - Nur notwendige
  - Einstellungen anpassen
- Link zu Cookie-Einstellungsseite: `/cookie-settings`
- Widerrufsmöglichkeit dokumentiert
- **Referenz:** Task 1.3 (Cookie Consent)

#### 6. Datenaufbewahrungsrichtlinien (Art. 5 Abs. 1 lit. e DSGVO)
**Neu hinzugefügt**

- Detaillierte Aufbewahrungsfristen für jeden Datentyp:
  - **Benutzerkonten:** 3 Jahre nach letzter Aktivität
  - **Gesundheitsdaten:** 1 Jahr oder bis Widerruf
  - **Buchungsdaten:** 3 Jahre nach Buchungstermin
  - **Rechnungen:** 10 Jahre (gesetzliche Pflicht)
  - **Audit-Logs:** 90 Tage
  - **Support-Tickets:** 2 Jahre nach Abschluss
- Automatisierte Löschprozesse dokumentiert:
  - Tägliche Prüfung auf abgelaufene Daten
  - Lösch-Warnungen (7 Tage, 24 Stunden, 30 Tage je nach Datentyp)
  - Irreversible Löschung aus allen Systemen und Backups
  - Protokollierung im Audit-Log
- Rechtsgrundlagen für jede Aufbewahrungsfrist
- **Referenz:** Task 1.4 (Data Retention & Deletion)

#### 7. Ihre Betroffenenrechte (Art. 15-22 DSGVO)
**Erweitert und umstrukturiert**

- Detaillierte Erklärung aller Betroffenenrechte mit praktischen Umsetzungsanleitungen
- **Auskunftsrecht (Art. 15):** Link zu Datenexport-Funktion
- **Datenübertragbarkeit (Art. 20):**
  - JSON-Export für maschinenlesbare Daten
  - CSV-Export für tabellarische Ansicht
  - Direkte Links zu Export-APIs
- **Löschungsrecht (Art. 17):**
  - Link zur Kontolöschung
  - Hinweis auf gesetzliche Aufbewahrungspflichten
  - Warnung vor Irreversibilität
- **Berichtigungsrecht (Art. 16):** Link zu Profileinstellungen
- **Einschränkung der Verarbeitung (Art. 18):** Kontaktinformationen
- **Widerspruchsrecht (Art. 21):** Links zu Cookie-Einstellungen
- **Widerruf der Einwilligung (Art. 7):**
  - Cookie-Einwilligung widerrufen
  - Gesundheitsdaten-Einwilligung widerrufen
- **Beschwerderecht (Art. 77):**
  - Vollständige Kontaktdaten der Berliner Datenschutzbeauftragten
  - Adresse, Telefon, E-Mail, Website
- Kontaktinformationen für Betroffenenanfragen
- Reaktionszeit: 30 Tage gemäß Art. 12 Abs. 3 DSGVO
- **Referenz:** Task 1.4 (GDPR APIs for Data Subject Rights)

#### 8. Drittanbieter und Auftragsverarbeiter (Art. 28 DSGVO)
**Neu hinzugefügt**

- Vollständige Liste aller Auftragsverarbeiter:
  - **Hetzner Online GmbH:** Hosting (Deutschland, AVV unterzeichnet, ISO 27001)
  - **Stripe, Inc.:** Zahlungsabwicklung (USA/EU, DPA unterzeichnet mit SCCs)
  - **Google Analytics:** Website-Analyse (opt-in, AVV unterzeichnet)
  - **SendGrid (Twilio):** E-Mail-Versand (DPA unterzeichnet)
  - **Sentry.io:** Fehlerprotokollierung (DPA unterzeichnet)
- AVV-Status für jeden Dienstleister
- Link zum vollständigen AVV-Register: `/docs/legal/avv-registry`
- Pflichten der Auftragsverarbeiter dokumentiert
- **Referenz:** Task 1.2 (AVV Contracts)

#### 9. Technische und organisatorische Maßnahmen (Art. 32 DSGVO)
**Erweitert**

- **Technische Maßnahmen:**
  - Verschlüsselung (AES-256-GCM, TLS 1.3, HSM, Bcrypt)
  - Zugriffskontrolle (MFA, RBAC, OAuth 2.0, sichere Cookies)
  - Netzwerksicherheit (WAF, DDoS, IDS/IPS, VPN)
  - Logging und Monitoring (Audit-Logs, SIEM, 24/7 Überwachung)
  - Datensicherung (täglich/wöchentlich, verschlüsselt, redundant)
  - Schwachstellenmanagement (wöchentliche Scans, Penetrationstests, Patch Management)

- **Organisatorische Maßnahmen:**
  - Personal und Schulung (NDAs, jährliche Schulungen, Security Awareness)
  - Datenschutz-Management (DSB, DSFA, Verarbeitungsverzeichnis, Privacy by Design)
  - Incident Response (Response Plan, Meldepflicht 72h, Post-Incident-Analyse)
  - Compliance und Audits (halbjährliche interne Audits, jährliche externe Audits)

- **Physische Sicherheit:**
  - Hetzner-Rechenzentren (24/7 Überwachung, biometrische Zugangskontrollen, ISO 27001)

- **Referenz:** Tasks 1.1, 1.2, 1.4 (kombiniert)

#### 10. Datenübermittlung außerhalb der EU
**Erweitert**

- Detaillierte Erklärung zu Stripe (USA):
  - Rechtsgrundlage: Art. 46 DSGVO (SCCs)
  - Zusätzliche Garantien dokumentiert
  - EU-US Data Privacy Framework erwähnt
  - Link zu Stripe's International Data Transfers
- Google Analytics (USA) - Optional:
  - Rechtsgrundlage: Einwilligung + SCCs
  - Schutzmaßnahmen: IP-Anonymisierung, GA4
  - Deaktivierungsmöglichkeit
- Rechte bei Drittlandübermittlungen:
  - Auskunft über Garantien (Kopie der SCCs)
  - Widerspruchsrecht
  - Beschwerderecht
- **Referenz:** Task 1.2 (AVV Contracts - Stripe DPA)

### Aktualisierte Abschnitte

#### 1. Datenschutz auf einen Blick
**Erweitert**

- Klarere Struktur mit Unterüberschriften
- Hinweis auf Betroffenenrechte erweitert
- Verweis auf spezifische Abschnitte

#### 2. Verantwortlicher und Datenschutzbeauftragter
**Unverändert**

- Kontaktdaten aktuell gehalten
- DSB-Kontakt hervorgehoben

#### 3. Datenerfassung auf dieser Website
**Erweitert**

- Hosting-Sektion detaillierter (Hetzner)
- Server-Log-Dateien aufgelistet
- Rechtsgrundlagen präzisiert

#### 11. Analyse-Tools und Werbung
**Erweitert**

- Google Analytics opt-in Mechanismus erklärt
- Verarbeitete Daten aufgelistet
- Marketing-Cookies erwähnt
- Links zu Cookie-Einstellungen

#### 12. Änderungen dieser Datenschutzerklärung
**Erweitert**

- Versionshistorie hinzugefügt
- Link zu diesem Changelog-Dokument
- Benachrichtigungspflicht bei wesentlichen Änderungen

### Neue Links und Verweise

Die folgenden internen Links wurden hinzugefügt:

- `/cookie-settings` - Cookie-Einstellungsseite
- `/account/settings#data-export` - Datenexport-Funktion
- `/account/settings#delete-account` - Kontolöschung
- `/account/settings#health-data-consent` - Gesundheitsdaten-Einwilligung widerrufen
- `/api/gdpr/export-data?format=json` - JSON-Datenexport
- `/api/gdpr/export-data?format=csv` - CSV-Datenexport
- `/docs/legal/avv-registry` - AVV-Register
- `/docs/legal/privacy-policy-changelog` - Dieses Dokument

### Rechtliche Referenzen

Folgende DSGVO-Artikel werden explizit referenziert:

- **Art. 5 Abs. 1 lit. e DSGVO:** Speicherbegrenzung (Aufbewahrungsfristen)
- **Art. 6 Abs. 1 lit. a DSGVO:** Einwilligung
- **Art. 6 Abs. 1 lit. b DSGVO:** Vertragserfüllung
- **Art. 6 Abs. 1 lit. f DSGVO:** Berechtigtes Interesse
- **Art. 7 Abs. 3 DSGVO:** Widerruf der Einwilligung
- **Art. 9 DSGVO:** Besondere Kategorien personenbezogener Daten
- **Art. 9 Abs. 2 lit. a DSGVO:** Ausdrückliche Einwilligung für Gesundheitsdaten
- **Art. 12 Abs. 3 DSGVO:** Reaktionszeit (30 Tage)
- **Art. 15 DSGVO:** Auskunftsrecht
- **Art. 16 DSGVO:** Recht auf Berichtigung
- **Art. 17 DSGVO:** Recht auf Löschung
- **Art. 18 DSGVO:** Recht auf Einschränkung der Verarbeitung
- **Art. 20 DSGVO:** Recht auf Datenübertragbarkeit
- **Art. 21 DSGVO:** Widerspruchsrecht
- **Art. 28 DSGVO:** Auftragsverarbeiter
- **Art. 30 DSGVO:** Verzeichnis von Verarbeitungstätigkeiten
- **Art. 32 DSGVO:** Sicherheit der Verarbeitung
- **Art. 46 DSGVO:** Datenübermittlung mit geeigneten Garantien (SCCs)
- **Art. 77 DSGVO:** Beschwerderecht

### Deutsche Gesetze

- **§ 147 AO:** Aufbewahrungsfrist für Rechnungen (10 Jahre)
- **§ 257 HGB:** Aufbewahrungsfrist für Handelsbücher (10 Jahre)

### Technische Verbesserungen

- Verschlüsselungsalgorithmus AES-256-GCM dokumentiert
- Hardware Security Module (HSM) erwähnt
- Multi-Faktor-Authentifizierung (MFA) dokumentiert
- Role-Based Access Control (RBAC) erklärt
- TLS 1.3 als Verschlüsselungsstandard
- Bcrypt-Hashing für Passwörter
- Audit-Logging-System beschrieben
- SIEM-System erwähnt

### Benutzerfreundlichkeit

- Inhaltsverzeichnis mit Sprungmarken (auf Website)
- Druckfunktion hinzugefügt (auf Website)
- Farbcodierung für wichtige Hinweise (Website)
- Direkte Links zu Aktionen (Datenexport, Löschung, Cookie-Einstellungen)
- Mobile-First-Design (Website)

---

## Version 1.0 (2024-01-15)

### Status
**Gültig ab:** 2024-01-15
**Grund:** Erstveröffentlichung

### Zusammenfassung

Erste Version der Datenschutzerklärung für Massava mit grundlegenden DSGVO-Anforderungen.

### Enthaltene Abschnitte

1. Datenschutz auf einen Blick
2. Verantwortlicher
3. Datenerfassung auf dieser Website
   - Hosting
   - Kontaktformular
   - Registrierung
4. Allgemeine Hinweise zu Datenschutz
5. Ihre Rechte (Basisversion)
6. Analyse-Tools (Basisversion)

### Umfang

- Grundlegende Informationspflichten gemäß Art. 13/14 DSGVO
- Verantwortlicher und Kontaktdaten
- Hosting-Informationen (Hetzner)
- Grundlegende Betroffenenrechte
- Cookie-Hinweis (rudimentär)

### Defizite (behoben in v2.0)

- Keine detaillierten Informationen zu Gesundheitsdaten
- Kein Cookie-Consent-Mechanismus
- Keine Aufbewahrungsfristen dokumentiert
- Keine praktischen Links zu DSGVO-Tools
- Keine AVV-Dokumentation
- Keine detaillierten technischen Sicherheitsmaßnahmen

---

## Dokumentationshinweise

### Versionsnummerierung

- **Major-Version (X.0):** Wesentliche Änderungen, die neue Rechte oder Pflichten betreffen
- **Minor-Version (1.X):** Kleinere Ergänzungen, Klarstellungen ohne materielle Änderungen

### Änderungsprozess

1. Änderungen werden vom Datenschutzbeauftragten geprüft
2. Legal Review durch Rechtsabteilung
3. Benachrichtigung der Nutzer bei wesentlichen Änderungen (E-Mail + Banner)
4. Veröffentlichung mit 30 Tagen Vorlaufzeit
5. Dokumentation im Changelog

### Zuständigkeiten

- **Datenschutzbeauftragter:** Max Mustermann (dsb@massava.com)
- **Legal:** Rechtsabteilung Massava GmbH
- **Technical Lead:** Entwicklungsteam
- **Approval:** Geschäftsführung

---

**Dokumentversion:** 1.0
**Letzte Aktualisierung dieses Changelogs:** 2025-11-04
**Verantwortlich:** Datenschutzbeauftragter
