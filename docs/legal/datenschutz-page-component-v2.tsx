// Updated Privacy Policy Page Component for Massava
// Version: 2.0
// Date: 2025-11-04
//
// INSTRUCTIONS:
// Replace the contents of /app/[locale]/datenschutz/page.tsx with this code
// This component requires the following shadcn/ui components:
// - Button, Card, Separator (already installed)
//
// Note: This is a Server Component by default. The print button uses
// client-side JavaScript but is handled via inline onClick.

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FileText, Printer } from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicyPage() {
  const lastUpdated = "2025-11-04"
  const version = "2.0"

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Datenschutzerklärung
            </h1>
            <p className="text-muted-foreground">
              Version {version} · Letzte Aktualisierung: {lastUpdated}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => typeof window !== 'undefined' && window.print()}
          >
            <Printer className="mr-2 h-4 w-4" />
            Drucken
          </Button>
        </div>

        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Diese Datenschutzerklärung wurde aktualisiert, um unsere DSGVO-Compliance-Maßnahmen
              widerzuspiegeln, einschließlich Verschlüsselung von Gesundheitsdaten, Cookie-Einwilligung,
              Datenaufbewahrungsrichtlinien und Betroffenenrechte.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table of Contents */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Inhaltsverzeichnis
          </CardTitle>
          <CardDescription>
            Klicken Sie auf einen Abschnitt, um direkt dorthin zu springen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <nav className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <a href="#section-1" className="text-primary hover:underline">1. Datenschutz auf einen Blick</a>
            <a href="#section-2" className="text-primary hover:underline">2. Verantwortlicher und Datenschutzbeauftragter</a>
            <a href="#section-3" className="text-primary hover:underline">3. Datenerfassung auf dieser Website</a>
            <a href="#section-4" className="text-primary hover:underline">4. Verschlüsselung von Gesundheitsdaten</a>
            <a href="#section-5" className="text-primary hover:underline">5. Cookie-Einwilligung</a>
            <a href="#section-6" className="text-primary hover:underline">6. Datenaufbewahrungsrichtlinien</a>
            <a href="#section-7" className="text-primary hover:underline">7. Ihre Betroffenenrechte</a>
            <a href="#section-8" className="text-primary hover:underline">8. Drittanbieter und Auftragsverarbeiter</a>
            <a href="#section-9" className="text-primary hover:underline">9. Technische und organisatorische Maßnahmen</a>
            <a href="#section-10" className="text-primary hover:underline">10. Datenübermittlung außerhalb der EU</a>
            <a href="#section-11" className="text-primary hover:underline">11. Analyse-Tools und Werbung</a>
            <a href="#section-12" className="text-primary hover:underline">12. Änderungen dieser Datenschutzerklärung</a>
          </nav>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="space-y-8">

        {/* Section 1 */}
        <section id="section-1" className="scroll-mt-8">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
            1. Datenschutz auf einen Blick
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-3">Allgemeine Hinweise</h3>
              <p className="text-muted-foreground">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
                personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene
                Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
              </p>
            </div>
          </div>
        </section>

        <Separator />

        {/* Section 2 */}
        <section id="section-2" className="scroll-mt-8">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
            2. Verantwortlicher und Datenschutzbeauftragter
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-3">Verantwortlicher im Sinne der DSGVO</h3>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <p className="font-semibold mb-2">Massava GmbH</p>
                <p className="text-muted-foreground text-sm">
                  Musterstraße 123<br />
                  10115 Berlin<br />
                  Deutschland
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  E-Mail: datenschutz@massava.com<br />
                  Telefon: +49 (0) 30 12345678
                </p>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Section 3 */}
        <section id="section-3" className="scroll-mt-8">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
            3. Datenerfassung auf dieser Website
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-3">Hosting</h3>
              <p className="text-muted-foreground mb-2">
                Wir hosten die Inhalte unserer Website bei folgendem Anbieter:
              </p>
              <p className="font-semibold mb-2">Hetzner Online GmbH</p>
              <p className="text-muted-foreground text-sm">
                Die Server befinden sich in Deutschland. Die Speicherung dieser Daten erfolgt auf
                Grundlage von Art. 6 Abs. 1 lit. f DSGVO.
              </p>
            </div>
          </div>
        </section>

        <Separator />

        {/* Section 4 - Health Data Encryption */}
        <section id="section-4" className="scroll-mt-8">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
            4. Verschlüsselung von Gesundheitsdaten (Art. 9 DSGVO)
          </h2>
          <div className="space-y-4">
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-lg">Besondere Kategorien personenbezogener Daten</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-900 dark:text-blue-100">
                <p>
                  Buchungsnachrichten an Studios können besondere Kategorien personenbezogener Daten
                  im Sinne von Art. 9 DSGVO enthalten, insbesondere Gesundheitsdaten (z.B.
                  Schwangerschaftswoche, gesundheitliche Beschwerden, medizinische Vorgeschichte).
                </p>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-xl font-semibold mb-3">Technische Sicherheitsmaßnahmen</h3>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-3">
                <div>
                  <p className="font-semibold mb-1">AES-256-GCM Verschlüsselung</p>
                  <p className="text-sm text-muted-foreground">
                    Alle Buchungsnachrichten werden mit AES-256-GCM (Galois/Counter Mode) verschlüsselt.
                    Dies ist ein moderner, authentifizierter Verschlüsselungsalgorithmus, der höchste
                    Sicherheit bietet.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Audit-Logging</p>
                  <p className="text-sm text-muted-foreground">
                    Alle Zugriffe auf Gesundheitsdaten werden protokolliert (Zeitstempel, Benutzer,
                    Aktion). Audit-Logs werden 90 Tage lang aufbewahrt.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Section 5 - Cookie Consent */}
        <section id="section-5" className="scroll-mt-8">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
            5. Cookie-Einwilligung (ePrivacy-Richtlinie)
          </h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Diese Website verwendet Cookies. Einige Cookies sind technisch notwendig, während
              andere für Analyse- und Marketingzwecke verwendet werden.
            </p>

            <div className="space-y-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notwendige Cookies (Erforderlich)</CardTitle>
                  <CardDescription>
                    Diese Cookies sind für die Grundfunktionalität der Website erforderlich.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">session_token</code> - Authentifizierung (Session)</li>
                    <li><code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">cookie_consent</code> - Speichert Ihre Cookie-Einstellungen (1 Jahr)</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Analyse-Cookies (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">_ga</code> - Google Analytics (2 Jahre)</li>
                  </ul>
                  <p className="mt-2 text-muted-foreground">
                    <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button asChild variant="default">
                <Link href="/cookie-settings">
                  Cookie-Einstellungen ändern
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <Separator />

        {/* Section 6 - Data Retention */}
        <section id="section-6" className="scroll-mt-8">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
            6. Datenaufbewahrungsrichtlinien (Art. 5 Abs. 1 lit. e DSGVO)
          </h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Wir speichern personenbezogene Daten nur so lange, wie es für die jeweiligen
              Verarbeitungszwecke erforderlich ist.
            </p>

            <div className="space-y-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Benutzerkonten</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><strong>Aufbewahrungsfrist:</strong> 3 Jahre nach letzter Aktivität</p>
                  <p className="text-muted-foreground">
                    Sie erhalten Warnungen 7 Tage und 24 Stunden vor der Löschung.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Gesundheitsdaten in Buchungsnachrichten</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><strong>Aufbewahrungsfrist:</strong> 1 Jahr oder bis zum Widerruf</p>
                  <p className="text-muted-foreground">
                    Sie erhalten eine Warnung 30 Tage vor der Löschung.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rechnungen und Zahlungsdaten</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><strong>Aufbewahrungsfrist:</strong> 10 Jahre</p>
                  <p className="text-muted-foreground">
                    Gesetzliche Aufbewahrungspflicht gemäß § 147 AO und § 257 HGB
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Separator />

        {/* Section 7 - Data Subject Rights */}
        <section id="section-7" className="scroll-mt-8">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
            7. Ihre Betroffenenrechte (Art. 15-22 DSGVO)
          </h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Die Datenschutz-Grundverordnung gewährt Ihnen umfassende Rechte bezüglich Ihrer
              personenbezogenen Daten.
            </p>

            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Auskunftsrecht (Art. 15 DSGVO)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-muted-foreground mb-3">
                    Sie haben das Recht auf Auskunft über alle gespeicherten personenbezogenen Daten.
                  </p>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href="/account/settings#data-export">
                        Daten exportieren
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recht auf Löschung (Art. 17 DSGVO)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-muted-foreground mb-3">
                    Sie können die Löschung Ihrer Daten verlangen, sofern keine gesetzlichen
                    Aufbewahrungspflichten entgegenstehen.
                  </p>
                  <Button asChild size="sm" variant="destructive">
                    <Link href="/account/settings#delete-account">
                      Konto löschen
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Weitere Rechte</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
                    <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
                    <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
                    <li>Beschwerderecht bei Aufsichtsbehörde (Art. 77 DSGVO)</li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    Kontakt: <a href="mailto:dsb@massava.com" className="text-primary hover:underline">dsb@massava.com</a>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Separator />

        {/* Section 8 - Third-Party Processors */}
        <section id="section-8" className="scroll-mt-8">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
            8. Drittanbieter und Auftragsverarbeiter (Art. 28 DSGVO)
          </h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Mit allen Auftragsverarbeitern haben wir Auftragsverarbeitungsverträge (AVV) gemäß
              Art. 28 DSGVO abgeschlossen.
            </p>

            <div className="grid gap-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hetzner Online GmbH</CardTitle>
                  <CardDescription>Server-Hosting (Deutschland)</CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-green-600 dark:text-green-400 font-semibold">AVV Status: Unterzeichnet</p>
                  <p className="text-muted-foreground mt-1">ISO 27001 zertifiziert</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Stripe, Inc.</CardTitle>
                  <CardDescription>Zahlungsabwicklung (USA/EU)</CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-green-600 dark:text-green-400 font-semibold">DPA Status: Unterzeichnet (mit SCCs)</p>
                </CardContent>
              </Card>
            </div>

            <Button asChild variant="outline" size="sm">
              <Link href="/docs/legal/avv-registry">
                <FileText className="mr-2 h-4 w-4" />
                Vollständiges AVV-Register
              </Link>
            </Button>
          </div>
        </section>

        <Separator />

        {/* Section 9 - Technical Measures */}
        <section id="section-9" className="scroll-mt-8">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
            9. Technische und organisatorische Maßnahmen (Art. 32 DSGVO)
          </h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Wir treffen umfassende Maßnahmen zum Schutz Ihrer Daten:
            </p>

            <div className="grid gap-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Verschlüsselung</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>AES-256-GCM für Gesundheitsdaten</li>
                    <li>TLS 1.3 für alle Verbindungen (HTTPS)</li>
                    <li>Bcrypt-Hashing für Passwörter</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Zugriffskontrolle</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Multi-Faktor-Authentifizierung (MFA)</li>
                    <li>Role-Based Access Control (RBAC)</li>
                    <li>Audit-Logging aller Zugriffe</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Separator />

        {/* Section 10 - Cross-Border Transfers */}
        <section id="section-10" className="scroll-mt-8">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
            10. Datenübermittlung außerhalb der EU
          </h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Grundsätzlich verarbeiten wir Ihre Daten in der EU. Ausnahme: Stripe (USA) mit
              EU-Standardvertragsklauseln gemäß Art. 46 DSGVO.
            </p>
          </div>
        </section>

        <Separator />

        {/* Section 11 - Analytics */}
        <section id="section-11" className="scroll-mt-8">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
            11. Analyse-Tools und Werbung
          </h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Google Analytics wird nur mit Ihrer Einwilligung verwendet. Sie können Ihre
              Einwilligung jederzeit widerrufen.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/cookie-settings">Cookie-Einstellungen</Link>
            </Button>
          </div>
        </section>

        <Separator />

        {/* Section 12 - Changes */}
        <section id="section-12" className="scroll-mt-8">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
            12. Änderungen dieser Datenschutzerklärung
          </h2>
          <div className="space-y-4">
            <p className="text-muted-foreground mb-4">
              Wir behalten uns vor, diese Datenschutzerklärung zu aktualisieren. Die aktuelle
              Version finden Sie stets unter dieser URL.
            </p>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <p className="text-sm font-semibold mb-2">Versionshistorie:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><strong>Version 2.0</strong> - 2025-11-04: DSGVO-Compliance-Update</li>
                <li><strong>Version 1.0</strong> - 2024-01-15: Erstveröffentlichung</li>
              </ul>
              <Button asChild variant="link" size="sm" className="mt-2 p-0 h-auto">
                <Link href="/docs/legal/privacy-policy-changelog">
                  Vollständige Änderungshistorie
                </Link>
              </Button>
            </div>

            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-3">Kontakt</h3>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <p className="font-semibold mb-2">Datenschutzbeauftragter</p>
                <p className="text-sm text-muted-foreground">
                  Massava GmbH<br />
                  z.Hd. Datenschutzbeauftragter<br />
                  Musterstraße 123<br />
                  10115 Berlin<br />
                  Deutschland
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  E-Mail: <a href="mailto:dsb@massava.com" className="text-primary hover:underline">dsb@massava.com</a>
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t">
        <p className="text-sm text-center text-muted-foreground">
          Letzte Aktualisierung: {lastUpdated} · Version {version}
        </p>
        <div className="flex justify-center gap-4 mt-4 flex-wrap">
          <Button asChild variant="link" size="sm">
            <Link href="/impressum">Impressum</Link>
          </Button>
          <Button asChild variant="link" size="sm">
            <Link href="/cookie-settings">Cookie-Einstellungen</Link>
          </Button>
          <Button asChild variant="link" size="sm">
            <Link href="/docs/legal/avv-registry">AVV-Register</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
