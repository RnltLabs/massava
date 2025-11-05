import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BookingPageClient } from "./_components/BookingPageClient"

interface BookingPageProps {
  params: Promise<{
    locale: string
    studioId: string
    slotId: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/**
 * Booking Page (Mobile-First Redesign)
 *
 * Server component that fetches booking data and renders a mobile-first
 * booking experience using Sheet (mobile) / Dialog (desktop).
 *
 * Architecture:
 * - Server Component: Data fetching + validation
 * - Client Component: Interactive booking flow (BookingPageClient)
 *
 * Flow:
 * 1. Fetch studio + services
 * 2. Fetch time slot
 * 3. Validate availability
 * 4. Open booking sheet automatically
 * 5. 3-step progressive flow (review → service → confirm → success)
 *
 * Mobile-First Design:
 * - Sheet component slides from bottom (mobile)
 * - Dialog centered modal (desktop)
 * - Touch-optimized (56px buttons)
 * - Wellness aesthetic with terracotta colors
 *
 * Error Cases:
 * - Studio not found → 404
 * - Time slot not found → 404
 * - Time slot unavailable/booked → Show error message + redirect
 */
export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const { locale, studioId, slotId } = await params
  const search = await searchParams

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
      <div className="container mx-auto py-12 max-w-2xl px-4">
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
      <div className="container mx-auto py-12 max-w-2xl px-4">
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

  // Render Mobile-First Booking Sheet
  return (
    <BookingPageClient
      studio={studio}
      services={studio.services}
      timeSlot={timeSlot}
      studioId={studioId}
      slotId={slotId}
    />
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
