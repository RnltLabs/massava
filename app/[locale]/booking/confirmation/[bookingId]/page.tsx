import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  CheckCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Clock,
  Euro,
  Home,
  Search,
} from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ConfirmationPageProps {
  params: Promise<{
    locale: string
    bookingId: string
  }>
}

/**
 * Booking Confirmation Page
 *
 * Shows booking confirmation after successful booking creation.
 * Displays all booking details and provides next actions.
 *
 * Features:
 * - Success indicator
 * - Complete booking details
 * - Studio contact information
 * - Appointment date/time
 * - Service information
 * - Actions: Return home or book another appointment
 */
export default async function ConfirmationPage({
  params,
}: ConfirmationPageProps) {
  const { bookingId } = await params

  // Fetch Booking with related data
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      studio: true,
      service: true,
    },
  })

  // Error Handling: Booking not found
  if (!booking) {
    notFound()
  }

  // Construct appointment date/time
  const appointmentDate = new Date(
    `${booking.preferredDate}T${booking.preferredTime}:00`
  )

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      {/* Success Indicator */}
      <div className="text-center mb-8 animate-in fade-in zoom-in duration-500">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Buchung erfolgreich!</h1>
        <p className="text-muted-foreground text-lg">
          Ihre Buchung wurde bestätigt. Sie erhalten in Kürze eine
          Bestätigungs-E-Mail.
        </p>
      </div>

      {/* Booking Details Card */}
      <Card className="wellness-shadow mb-6">
        <CardHeader>
          <CardTitle>Ihre Buchungsdetails</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Studio Information */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Studio
            </h3>
            <div className="bg-secondary/10 rounded-lg p-4">
              <p className="text-xl font-medium">{booking.studio.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {booking.studio.address}
                <br />
                {booking.studio.postalCode} {booking.studio.city}
              </p>
              {booking.studio.phone && (
                <div className="flex items-center gap-2 mt-3 text-sm">
                  <Phone className="h-4 w-4" />
                  <a
                    href={`tel:${booking.studio.phone}`}
                    className="hover:underline text-primary"
                  >
                    {booking.studio.phone}
                  </a>
                </div>
              )}
              {booking.studio.email && (
                <div className="flex items-center gap-2 mt-1 text-sm">
                  <Mail className="h-4 w-4" />
                  <a
                    href={`mailto:${booking.studio.email}`}
                    className="hover:underline text-primary"
                  >
                    {booking.studio.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Appointment Date & Time */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Termin
            </h3>
            <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4">
              <p className="text-base font-medium text-muted-foreground">
                {format(appointmentDate, "EEEE, dd. MMMM yyyy", { locale: de })}
              </p>
              <p className="text-4xl font-bold text-primary mt-2">
                {format(appointmentDate, "HH:mm", { locale: de })} Uhr
              </p>
            </div>
          </div>

          <Separator />

          {/* Service Information */}
          {booking.service && (
            <>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  Gebuchte Leistung
                </h3>
                <div className="bg-secondary/10 rounded-lg p-4">
                  <p className="text-xl font-medium">{booking.service.name}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {booking.service.duration} Minuten
                    </span>
                    <span className="flex items-center gap-1">
                      <Euro className="h-4 w-4" />
                      {booking.service.price.toFixed(2)} €
                    </span>
                  </div>
                  {booking.service.description && (
                    <p className="text-sm text-muted-foreground mt-3">
                      {booking.service.description}
                    </p>
                  )}
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Contact Information */}
          <div>
            <h3 className="font-semibold mb-3 text-lg">Ihre Kontaktdaten</h3>
            <div className="bg-secondary/10 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{booking.customerEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{booking.customerPhone}</span>
              </div>
            </div>
          </div>

          {/* Optional Message */}
          {booking.message && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 text-lg">Ihre Nachricht</h3>
                <div className="bg-secondary/10 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">
                    {booking.message}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Booking ID */}
          <div className="bg-secondary/20 rounded-lg p-4 border border-dashed">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Buchungsnummer
            </p>
            <p className="font-mono text-sm font-medium">{booking.id}</p>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Alert className="mb-6">
        <Calendar className="h-4 w-4" />
        <AlertDescription>
          <strong>Wichtig:</strong> Sollten Sie den Termin nicht wahrnehmen
          können, bitten wir Sie, mindestens 24 Stunden vorher abzusagen.
          Kontaktieren Sie das Studio direkt unter den oben genannten
          Kontaktdaten.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild variant="outline" size="lg" className="flex-1">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Zur Startseite
          </Link>
        </Button>

        <Button asChild size="lg" className="flex-1">
          <Link href="/search/appointments">
            <Search className="mr-2 h-4 w-4" />
            Weiteren Termin buchen
          </Link>
        </Button>
      </div>

      {/* Print Hint */}
      <p className="text-xs text-muted-foreground text-center mt-6">
        Tipp: Sie können diese Seite ausdrucken oder als PDF speichern für Ihre
        Unterlagen
      </p>
    </div>
  )
}

/**
 * Metadata for SEO
 */
export async function generateMetadata({ params }: ConfirmationPageProps) {
  const { bookingId } = await params

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { studio: true },
  })

  if (!booking) {
    return {
      title: "Buchungsbestätigung",
    }
  }

  return {
    title: `Buchung bestätigt - ${booking.studio.name} | Massava`,
    description: `Ihre Buchung bei ${booking.studio.name} wurde erfolgreich bestätigt.`,
    robots: {
      index: false, // Don't index confirmation pages
      follow: false,
    },
  }
}
