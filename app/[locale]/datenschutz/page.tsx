/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Massava - Privacy Policy Page (GDPR/DSGVO Compliant)
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung | Massava',
  description: 'Datenschutzerklärung und Informationen zur Verarbeitung personenbezogener Daten gemäß DSGVO',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Datenschutzerklärung</h1>

      <div className="prose prose-lg max-w-none space-y-8">
        {/* Section 1: Responsible Party */}
        <section id="verantwortlicher">
          <h2 className="text-2xl font-semibold mb-4">1. Verantwortlicher</h2>
          <p className="text-muted-foreground">
            Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne der
            Datenschutz-Grundverordnung (DSGVO) ist:
          </p>
          <address className="not-italic bg-muted p-4 rounded-lg my-4">
            <strong>RNLT Labs / Massava</strong>
            <br />
            Roman Reinelt
            <br />
            [Vollständige Adresse wird eingefügt]
            <br />
            <br />
            E-Mail:{' '}
            <a href="mailto:datenschutz@massava.com" className="text-primary hover:underline">
              datenschutz@massava.com
            </a>
          </address>
        </section>

        {/* Section 2: Data Processing Overview */}
        <section id="datenverarbeitung">
          <h2 className="text-2xl font-semibold mb-4">2. Datenverarbeitung auf dieser Website</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Buchungsdaten</h3>
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <p>
              <strong>Rechtsgrundlage:</strong> Art. 6(1)(b) DSGVO (Vertragserfüllung)
            </p>
            <p>
              <strong>Verarbeitete Daten:</strong> Name, E-Mail-Adresse, Telefonnummer (optional),
              Terminwunsch
            </p>
            <p>
              <strong>Zweck:</strong> Buchungsbestätigung, Terminverwaltung und Kommunikation mit
              dem Massage-Studio
            </p>
            <p>
              <strong>Speicherdauer:</strong> 3 Monate nach Terminende
            </p>
            <p>
              <strong>Empfänger:</strong> Das gebuchte Massage-Studio erhält Ihre Kontaktdaten zur
              Durchführung des Termins
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-3" id="gesundheitsdaten">
            2.2 Gesundheitsdaten (Art. 9 DSGVO)
          </h3>
          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
            <p>
              <strong>Rechtsgrundlage:</strong> Art. 9(2)(a) DSGVO (Ausdrückliche Einwilligung)
            </p>
            <p>
              <strong>Verarbeitete Daten:</strong> Nachrichtenfeld im Buchungsformular (optional,
              kann Gesundheitsinformationen enthalten)
            </p>
            <p>
              <strong>Zweck:</strong> Anpassung der Massage-Behandlung an Ihre individuellen
              Bedürfnisse und gesundheitlichen Anforderungen
            </p>
            <p>
              <strong>Besonderheit:</strong> Die Verarbeitung von Gesundheitsdaten erfolgt nur nach
              Ihrer ausdrücklichen Einwilligung durch Aktivierung der entsprechenden Checkbox im
              Buchungsformular
            </p>
            <p>
              <strong>Widerruf:</strong> Sie können Ihre Einwilligung jederzeit per E-Mail an{' '}
              <a
                href="mailto:datenschutz@massava.com"
                className="text-primary hover:underline"
              >
                datenschutz@massava.com
              </a>{' '}
              widerrufen. Der Widerruf berührt nicht die Rechtmäßigkeit der bis dahin erfolgten
              Verarbeitung.
            </p>
            <p>
              <strong>Speicherdauer:</strong> Bis zum Widerruf der Einwilligung, maximal 3 Monate
              nach Terminende
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Konto-Verwaltung</h3>
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <p>
              <strong>Rechtsgrundlage:</strong> Art. 6(1)(b) DSGVO (Vertragserfüllung)
            </p>
            <p>
              <strong>Funktion:</strong> Bei Ihrer ersten Buchung wird automatisch ein Konto für Sie
              erstellt, damit Sie Ihre Buchungen verwalten können
            </p>
            <p>
              <strong>Zugriff:</strong> Per Magic Link (E-Mail) oder optionales Passwort
            </p>
            <p>
              <strong>Gespeicherte Daten:</strong> Name, E-Mail-Adresse, optional Telefonnummer und
              Passwort (verschlüsselt)
            </p>
            <p>
              <strong>Speicherdauer:</strong> Bis zur Löschung Ihres Kontos durch Sie selbst
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.4 Studio-Accounts</h3>
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <p>
              <strong>Rechtsgrundlage:</strong> Art. 6(1)(b) DSGVO (Vertragserfüllung)
            </p>
            <p>
              <strong>Zweck:</strong> Registrierung und Verwaltung von Massage-Studios auf der
              Plattform
            </p>
            <p>
              <strong>Gespeicherte Daten:</strong> Studio-Name, Kontaktdaten, Öffnungszeiten,
              angebotene Services
            </p>
          </div>
        </section>

        {/* Section 3: Data Subject Rights */}
        <section id="rechte">
          <h2 className="text-2xl font-semibold mb-4">
            3. Ihre Rechte gemäß DSGVO (Art. 15-22)
          </h2>

          <div className="space-y-4">
            <div className="border-l-4 border-primary p-4">
              <h3 className="font-semibold">Auskunftsrecht (Art. 15 DSGVO)</h3>
              <p className="text-muted-foreground">
                Sie haben das Recht, Auskunft über die von uns verarbeiteten personenbezogenen Daten
                zu erhalten.
              </p>
              <a
                href="/api/user/export"
                className="inline-block mt-2 text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                → Daten exportieren (JSON-Format)
              </a>
            </div>

            <div className="border-l-4 border-primary p-4">
              <h3 className="font-semibold">Recht auf Berichtigung (Art. 16 DSGVO)</h3>
              <p className="text-muted-foreground">
                Sie können die Berichtigung unrichtiger Daten verlangen.
              </p>
            </div>

            <div className="border-l-4 border-primary p-4">
              <h3 className="font-semibold">Recht auf Löschung (Art. 17 DSGVO)</h3>
              <p className="text-muted-foreground">
                Sie können die Löschung Ihrer personenbezogenen Daten verlangen, sofern keine
                gesetzlichen Aufbewahrungspflichten entgegenstehen.
              </p>
              <a
                href="/api/user/delete"
                className="inline-block mt-2 text-destructive hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                → Konto löschen
              </a>
            </div>

            <div className="border-l-4 border-primary p-4">
              <h3 className="font-semibold">Recht auf Einschränkung (Art. 18 DSGVO)</h3>
              <p className="text-muted-foreground">
                Sie können die Einschränkung der Verarbeitung Ihrer Daten verlangen.
              </p>
            </div>

            <div className="border-l-4 border-primary p-4">
              <h3 className="font-semibold">Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</h3>
              <p className="text-muted-foreground">
                Sie haben das Recht, Ihre Daten in einem strukturierten, gängigen und
                maschinenlesbaren Format zu erhalten.
              </p>
            </div>

            <div className="border-l-4 border-primary p-4">
              <h3 className="font-semibold">Widerspruchsrecht (Art. 21 DSGVO)</h3>
              <p className="text-muted-foreground">
                Sie können der Verarbeitung Ihrer Daten widersprechen.
              </p>
            </div>
          </div>

          <p className="mt-6 p-4 bg-muted rounded-lg">
            <strong>Kontakt für Ausübung Ihrer Rechte:</strong>
            <br />
            E-Mail:{' '}
            <a href="mailto:datenschutz@massava.com" className="text-primary hover:underline">
              datenschutz@massava.com
            </a>
            <br />
            Wir werden Ihre Anfrage innerhalb von 30 Tagen bearbeiten.
          </p>
        </section>

        {/* Section 4: Data Processors */}
        <section id="auftragsverarbeiter">
          <h2 className="text-2xl font-semibold mb-4">4. Auftragsverarbeiter (Art. 28 DSGVO)</h2>
          <p className="text-muted-foreground mb-4">
            Wir nutzen folgende Dienstleister zur Verarbeitung Ihrer Daten:
          </p>

          <div className="space-y-4">
            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold">Hetzner Online GmbH</h3>
              <p className="text-muted-foreground">
                <strong>Zweck:</strong> Server-Hosting und Datenbankverwaltung
              </p>
              <p className="text-muted-foreground">
                <strong>Standort:</strong> Deutschland (DSGVO-konform)
              </p>
              <p className="text-muted-foreground">
                <strong>AVV:</strong> Auftragsverarbeitungsvertrag geschlossen
              </p>
            </div>

            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold">Massage-Studios</h3>
              <p className="text-muted-foreground">
                <strong>Zweck:</strong> Durchführung der gebuchten Massage-Behandlung
              </p>
              <p className="text-muted-foreground">
                <strong>Übermittlung:</strong> Ihre Buchungsdaten werden an das jeweilige Studio
                übermittelt
              </p>
              <p className="text-muted-foreground">
                <strong>Hinweis:</strong> Jedes Studio ist eigenständiger Verantwortlicher für die
                Verarbeitung Ihrer Daten im Rahmen der Behandlung
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Storage Duration */}
        <section id="speicherdauer">
          <h2 className="text-2xl font-semibold mb-4">5. Speicherdauer</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong>Buchungsdaten:</strong> 3 Monate nach Terminende (danach automatische
              Löschung)
            </li>
            <li>
              <strong>Konto-Daten:</strong> Bis zur Löschung durch Sie selbst
            </li>
            <li>
              <strong>Gesundheitsdaten:</strong> Bis zum Widerruf der Einwilligung, maximal 3 Monate
              nach Terminende
            </li>
            <li>
              <strong>Inaktive Konten:</strong> Löschung nach 3 Jahren Inaktivität (mit vorheriger
              E-Mail-Benachrichtigung)
            </li>
          </ul>
        </section>

        {/* Section 6: Data Security */}
        <section id="sicherheit">
          <h2 className="text-2xl font-semibold mb-4">6. Datensicherheit (Art. 32 DSGVO)</h2>
          <p className="text-muted-foreground mb-4">
            Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein, um Ihre Daten vor
            Manipulation, Verlust, Zerstörung und dem Zugriff Unberechtigter zu schützen:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>SSL/TLS-Verschlüsselung für alle Datenübertragungen</li>
            <li>Verschlüsselte Speicherung von Passwörtern (bcrypt mit 12 Runden)</li>
            <li>Regelmäßige Sicherheitsupdates und Sicherheitsaudits</li>
            <li>Zugriffskontrollen und Berechtigungskonzepte</li>
            <li>Regelmäßige Backups mit verschlüsselter Speicherung</li>
          </ul>
        </section>

        {/* Section 7: Right to Complain */}
        <section id="beschwerde">
          <h2 className="text-2xl font-semibold mb-4">7. Beschwerderecht</h2>
          <p className="text-muted-foreground mb-4">
            Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung
            Ihrer personenbezogenen Daten zu beschweren.
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <p>
              <strong>Zuständige Aufsichtsbehörde:</strong>
              <br />
              [Wird basierend auf Firmensitz eingefügt]
              <br />
              <br />
              Alternativ können Sie sich an die Aufsichtsbehörde Ihres Wohn- oder Aufenthaltsortes
              wenden.
            </p>
          </div>
        </section>

        {/* Section 8: Cookies and Tracking */}
        <section id="cookies">
          <h2 className="text-2xl font-semibold mb-4">8. Cookies und Tracking</h2>
          <p className="text-muted-foreground mb-4">
            Diese Website verwendet Cookies zur Bereitstellung der Funktionalität:
          </p>

          <h3 className="text-xl font-semibold mt-4 mb-3">Notwendige Cookies (Art. 6(1)(f) DSGVO)</h3>
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <p className="text-muted-foreground">
              Diese Cookies sind für den Betrieb der Website erforderlich und können nicht
              deaktiviert werden:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Session-Cookie für Authentifizierung</li>
              <li>Cookie-Consent-Status</li>
              <li>Spracheinstellung</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold mt-4 mb-3">Optionale Cookies (Art. 6(1)(a) DSGVO)</h3>
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <p className="text-muted-foreground">
              Weitere Cookies werden nur mit Ihrer Einwilligung gesetzt:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Analytics-Cookies (zur Verbesserung der Website)</li>
            </ul>
            <p className="mt-2 text-muted-foreground">
              Sie können Ihre Cookie-Einstellungen jederzeit über das Cookie-Banner am Seitenende
              ändern.
            </p>
          </div>
        </section>

        {/* Section 9: Changes to Privacy Policy */}
        <section id="aenderungen">
          <h2 className="text-2xl font-semibold mb-4">9. Änderungen dieser Datenschutzerklärung</h2>
          <p className="text-muted-foreground">
            Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte
            Rechtslagen oder Änderungen unserer Dienstleistungen anzupassen. Bei wesentlichen
            Änderungen werden wir Sie per E-Mail informieren.
          </p>
          <p className="mt-4 text-muted-foreground">
            <strong>Stand dieser Datenschutzerklärung:</strong> 27. Oktober 2025
          </p>
        </section>
      </div>

      {/* Back to Home Link */}
      <div className="mt-12 pt-8 border-t">
        <Link href="/" className="text-primary hover:underline">
          ← Zurück zur Startseite
        </Link>
      </div>
    </div>
  );
}
