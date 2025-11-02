import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { StudioInfoCard } from "@/components/booking/StudioInfoCard"
import { BookingForm } from "@/components/booking/BookingForm"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface BookingPageProps {
  params: Promise<{
    locale: string
    studioId: string
    slotId: string
  }>
}

/**
 * Booking Page
 *
 * Main booking page where customers complete their booking.
 * Shows studio information and booking form side-by-side on desktop.
 *
 * Flow:
 * 1. Fetch studio + services
 * 2. Fetch time slot
 * 3. Validate availability
 * 4. Show booking form
 * 5. On submit → createBooking action → redirect to confirmation
 *
 * Error Cases:
 * - Studio not found → 404
 * - Time slot not found → 404
 * - Time slot unavailable/booked → Show error message
 */
export default async function BookingPage({ params }: BookingPageProps) {
  const { locale, studioId, slotId } = await params

  // Fetch Studio with Services
  const studio = await prisma.studio.findUnique({
    where: { id: studioId },
    include: {
      services: {
        orderBy: { price: "asc" },
      },
    },
  })

  // Fetch TimeSlot
  const timeSlot = await prisma.timeSlot.findUnique({
    where: { id: slotId },
  })

  // Error Handling: Not Found
  if (!studio || !timeSlot) {
    notFound()
  }

  // Error Handling: TimeSlot Unavailable
  if (!timeSlot.isAvailable || timeSlot.isBooked) {
    return (
      <div className="container mx-auto py-12 max-w-2xl">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Zeitslot nicht verfügbar</AlertTitle>
          <AlertDescription>
            Der ausgewählte Termin ist leider nicht mehr verfügbar. Bitte
            wählen Sie einen anderen Zeitslot aus.
          </AlertDescription>
        </Alert>

        <Button asChild variant="outline">
          <Link href="/search/appointments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Terminsuche
          </Link>
        </Button>
      </div>
    )
  }

  // Error Handling: No Services Available
  if (studio.services.length === 0) {
    return (
      <div className="container mx-auto py-12 max-w-2xl">
        <Alert variant="default" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Keine Leistungen verfügbar</AlertTitle>
          <AlertDescription>
            Dieses Studio hat derzeit keine buchbaren Leistungen. Bitte
            kontaktieren Sie das Studio direkt oder wählen Sie ein anderes
            Studio.
          </AlertDescription>
        </Alert>

        <Button asChild variant="outline">
          <Link href="/search/appointments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Terminsuche
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back Button */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/search/appointments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Terminsuche
          </Link>
        </Button>
      </div>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Termin buchen</h1>
        <p className="text-muted-foreground mt-2">
          Bitte bestätigen Sie Ihre Buchung bei {studio.name}
        </p>
      </div>

      {/* Two-Column Layout (responsive) */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Studio Info (sticky on desktop) */}
        <div>
          <StudioInfoCard studio={studio} timeSlot={timeSlot} />
        </div>

        {/* Right: Booking Form */}
        <div>
          <BookingForm
            studioId={studioId}
            slotId={slotId}
            services={studio.services}
            preselectedTime={new Date(timeSlot.startTime)}
          />
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="mt-8 text-xs text-muted-foreground text-center max-w-3xl mx-auto">
        <p>
          Durch die Buchung akzeptieren Sie unsere{" "}
          <Link href="/terms" className="underline hover:text-primary">
            Allgemeinen Geschäftsbedingungen
          </Link>{" "}
          und{" "}
          <Link href="/privacy" className="underline hover:text-primary">
            Datenschutzerklärung
          </Link>
          . Ihre Daten werden gemäß DSGVO verarbeitet.
        </p>
      </div>
    </div>
  )
}

/**
 * Metadata for SEO
 */
export async function generateMetadata({ params }: BookingPageProps) {
  const { studioId } = await params

  const studio = await prisma.studio.findUnique({
    where: { id: studioId },
    select: { name: true, city: true },
  })

  if (!studio) {
    return {
      title: "Termin buchen",
    }
  }

  return {
    title: `Termin buchen bei ${studio.name} | Massava`,
    description: `Buchen Sie jetzt Ihren Massage-Termin bei ${studio.name} in ${studio.city}. Einfach, schnell und sicher.`,
  }
}
