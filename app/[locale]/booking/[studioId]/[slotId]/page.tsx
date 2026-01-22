import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BookingPageClient } from "./_components/BookingPageClient"
import { calculateAvailableSlots } from "@/lib/slots"
import { parseISO, format, isBefore } from "date-fns"
import { toZonedTime } from "date-fns-tz"

interface BookingPageProps {
  params: Promise<{
    locale: string
    studioId: string
    slotId: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/**
 * Booking Page (Mobile-First Redesign) - DYNAMIC SLOTS VERSION
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
 * 2. Parse and validate slot DateTime (NO DB lookup - Dynamic Slots!)
 * 3. Validate availability using calculateAvailableSlots()
 * 4. Open booking sheet automatically
 * 5. 3-step progressive flow (review → service → confirm → success)
 *
 * DYNAMIC SLOTS:
 * - slotId is now an ISO DateTime string (e.g., "2025-11-18T12:15:00.000Z")
 * - No TimeSlot table lookup needed
 * - Real-time availability calculation based on opening hours + existing bookings
 *
 * Mobile-First Design:
 * - Sheet component slides from bottom (mobile)
 * - Dialog centered modal (desktop)
 * - Touch-optimized (56px buttons)
 * - Wellness aesthetic with terracotta colors
 *
 * Error Cases:
 * - Studio not found → 404
 * - Invalid DateTime format → 404
 * - Time slot unavailable/booked → Show error message + redirect
 */
export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const { locale, studioId, slotId } = await params
  const search = await searchParams

  // Fetch Studio with Services and Timezone
  const studio = await prisma.studio.findUnique({
    where: { id: studioId },
    include: {
      services: {
        orderBy: { price: "asc" },
      },
    },
  })

  // Error Handling: Studio Not Found
  if (!studio) {
    notFound()
  }

  // Parse slotId as ISO DateTime (Dynamic Slots)
  let slotDateTime: Date
  try {
    slotDateTime = parseISO(decodeURIComponent(slotId))
    if (isNaN(slotDateTime.getTime())) {
      throw new Error("Invalid date")
    }
  } catch (error) {
    // Invalid DateTime format
    notFound()
  }

  // Validate slot is in the future
  const now = new Date()
  if (isBefore(slotDateTime, now)) {
    return (
      <div className="container mx-auto py-12 max-w-2xl px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Termin in der Vergangenheit</AlertTitle>
          <AlertDescription>
            Der ausgewählte Termin liegt in der Vergangenheit. Bitte wählen Sie einen zukünftigen Zeitslot aus.
          </AlertDescription>
        </Alert>

        <Button asChild variant="outline">
          <Link href={`/${locale}/search/appointments`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Terminsuche
          </Link>
        </Button>
      </div>
    )
  }

  // Calculate availability for the slot's date (Dynamic Slots)
  const searchDate = format(slotDateTime, 'yyyy-MM-dd')
  const slotsResult = await calculateAvailableSlots(
    studioId,
    searchDate,
    undefined,
    { includeUnavailable: false, minCapacity: 1 }
  )

  // Error Handling: Slot calculation failed
  if (!slotsResult.ok) {
    return (
      <div className="container mx-auto py-12 max-w-2xl px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Verfügbarkeit konnte nicht geprüft werden</AlertTitle>
          <AlertDescription>
            Die Verfügbarkeit dieses Termins konnte nicht geprüft werden. Bitte versuchen Sie es später erneut.
          </AlertDescription>
        </Alert>

        <Button asChild variant="outline">
          <Link href={`/${locale}/search/appointments`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Terminsuche
          </Link>
        </Button>
      </div>
    )
  }

  // Find the specific slot in the calculated slots
  const slotTimeStr = format(toZonedTime(slotDateTime, studio.timezone), 'HH:mm')
  const selectedSlot = slotsResult.value.find((s) => {
    const slotStart = format(toZonedTime(s.startTime, studio.timezone), 'HH:mm')
    return slotStart === slotTimeStr
  })

  // Error Handling: TimeSlot Unavailable
  if (!selectedSlot || !selectedSlot.available) {
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
          <Link href={`/${locale}/search/appointments`}>
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

  // Create a timeSlot-compatible object from the selected dynamic slot
  // This maintains backward compatibility with BookingPageClient
  const timeSlot = {
    startTime: selectedSlot.startTime, // Date object (UTC)
    endTime: selectedSlot.endTime,     // Date object (UTC)
  }

  // Render Mobile-First Booking Sheet
  return (
    <BookingPageClient
      studio={studio}
      services={studio.services}
      timeSlot={timeSlot}
      studioId={studioId}
      slotId={slotId}
      preferredDateTime={selectedSlot.startTime.toISOString()} // ISO DateTime for booking creation
      locale={locale}
      searchParams={search}
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
