/**
 * @fileoverview Success state component for booking confirmation
 * @module app/[locale]/booking/[studioId]/[slotId]/_components/SuccessState
 */

"use client"

import { useEffect, useState, useCallback } from "react"
import type { JSX } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Calendar, Search, Check, Info } from "lucide-react"
import type { BookingStatus } from "@/app/generated/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { generateBookingIcs, downloadIcs, ICSGenerationError, type BookingDetails, type StudioDetails } from "@/lib/ical/generateBookingIcs"
import { logger, generateCorrelationId } from "@/lib/logger"

// Constants
const ANIMATION_DURATION_MS = 400;

interface SuccessStateProps {
  bookingNumber: string
  customerEmail: string
  onNewSearch: () => void
  bookingStatus: BookingStatus | null
  isGuest: boolean
  locale: string
  bookingDetails: BookingDetails
  studioDetails: StudioDetails
}

/**
 * Success State Component
 *
 * Displays success animation and booking confirmation after successful booking.
 * Shows different messaging based on booking status (CONFIRMED vs PENDING).
 * Offers guest users to create an account for better experience.
 *
 * Features:
 * - Animated checkmark (scale + fade in)
 * - Status-based messaging (CONFIRMED vs PENDING)
 * - Booking confirmation number (prominent, monospace)
 * - Email confirmation message
 * - Guest account creation offer (for non-authenticated users)
 * - Action buttons (calendar, directions, view booking)
 * - Return to search option
 *
 * Animation:
 * - Checkmark scales from 0 to 1 with bounce
 * - Fades in over 400ms
 * - Green for CONFIRMED, Amber for PENDING
 *
 * Accessibility:
 * - Success message announced to screen readers via ARIA live regions
 * - Clear action labels with context
 * - Keyboard navigation support
 * - Focus management for screen readers
 *
 * @param props - Component properties
 * @returns Success state JSX element
 */
export function SuccessState({
  bookingNumber,
  customerEmail,
  onNewSearch,
  bookingStatus,
  isGuest,
  locale,
  bookingDetails,
  studioDetails,
}: SuccessStateProps): JSX.Element {
  const router = useRouter()
  const { toast } = useToast()
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    // Trigger animation
    const timer = setTimeout(() => setIsAnimating(false), ANIMATION_DURATION_MS)
    return () => clearTimeout(timer)
  }, [])

  const isPending = bookingStatus === 'PENDING'

  /**
   * Generate and download iCal file for booking
   * Handles all error cases with specific error messages
   */
  const handleAddToCalendar = useCallback((): void => {
    const correlationId = generateCorrelationId();

    try {
      // Generate ICS content
      const icsContent = generateBookingIcs(bookingDetails, studioDetails)

      if (!icsContent) {
        logger.error("ICS content generation returned null", {
          correlationId,
          bookingNumber
        });
        toast({
          title: "Fehler",
          description: "Kalendereintrag konnte nicht erstellt werden",
          variant: "destructive",
        })
        return
      }

      // Trigger download
      downloadIcs(icsContent, bookingNumber)

      logger.info("Calendar download triggered successfully", {
        correlationId,
        bookingNumber
      });

      toast({
        title: "Kalendereintrag erstellt",
        description: "Die .ics Datei wurde heruntergeladen",
      })
    } catch (error) {
      let errorMessage = "Download fehlgeschlagen";

      if (error instanceof ICSGenerationError) {
        logger.error("Calendar export failed with known error", {
          correlationId: error.correlationId,
          code: error.code,
          bookingNumber,
          error: error.message
        });

        // Provide specific error messages based on error code
        if (error.code === 'VALIDATION_FAILED') {
          errorMessage = "Ungültige Buchungsdaten";
        } else if (error.message.includes("Speicherplatz")) {
          errorMessage = error.message;
        } else if (error.message.includes("Browser")) {
          errorMessage = error.message;
        }
      } else {
        logger.error("Calendar export failed with unexpected error", {
          correlationId,
          bookingNumber,
          error: error instanceof Error ? error.message : String(error)
        });
      }

      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [bookingDetails, studioDetails, bookingNumber, toast]);

  /**
   * Navigate to customer bookings page
   */
  const handleViewBookings = useCallback((): void => {
    router.push(`/${locale}/customer/bookings`)
  }, [router, locale]);

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      {/* Screen reader announcement for success state */}
      <div className="sr-only" role="status" aria-live="polite">
        {isPending
          ? `Buchungsanfrage erhalten. Buchungsnummer: ${bookingNumber}`
          : `Buchung erfolgreich bestätigt. Buchungsnummer: ${bookingNumber}`
        }
      </div>

      {/* Animated Success Checkmark - Enhanced: Larger, Greener, More Prominent */}
      <div
        className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-400",
          isAnimating ? "scale-0 opacity-0" : "scale-100 opacity-100",
          isPending ? "bg-amber-100" : "bg-green-600"
        )}
        role="img"
        aria-label={isPending ? "Buchungsanfrage erhalten" : "Buchung erfolgreich"}
      >
        <Check
          className={cn(
            "w-12 h-12",
            isPending ? "text-amber-600" : "text-white"
          )}
          strokeWidth={3}
          aria-hidden="true"
        />
      </div>

      {/* Status-Based Success Message */}
      {isPending ? (
        <>
          <h2 className="text-2xl font-bold mb-2">
            Buchungsanfrage erhalten!
          </h2>
          <p className="text-muted-foreground mb-6">
            Das Studio wird Ihre Buchung prüfen und sich bei Ihnen melden.
            Sie erhalten eine E-Mail, sobald Ihre Buchung bestätigt wurde.
          </p>
          <Alert className="mb-6 max-w-md">
            <Info className="h-4 w-4" />
            <AlertTitle>Wartet auf Bestätigung</AlertTitle>
            <AlertDescription>
              Ihr Termin ist reserviert und für andere gesperrt.
            </AlertDescription>
          </Alert>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-2">
            Buchung bestätigt!
          </h2>
          <p className="text-muted-foreground mb-6">
            Ihre Buchung wurde erfolgreich bestätigt.
            Sie erhalten eine Bestätigungs-E-Mail an {customerEmail}.
          </p>
        </>
      )}

      {/* Booking Confirmation Card */}
      <Card className="w-full max-w-md mb-8 wellness-shadow">
        <CardContent className="pt-6 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Ihre Buchungsnummer
            </p>
            <p className="text-2xl font-mono font-bold tracking-wide text-primary">
              {bookingNumber}
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Eine Bestätigungsemail wurde an{" "}
              <span className="font-medium text-foreground">
                {customerEmail}
              </span>{" "}
              gesendet
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Guest Account Creation Offer */}
      {isGuest && (
        <Card className="w-full max-w-md mb-6 bg-accent/10">
          <CardHeader>
            <CardTitle className="text-lg">Konto erstellen?</CardTitle>
            <CardDescription>
              Verwalten Sie Ihre Buchungen und erhalten Sie automatische Erinnerungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>Alle Termine an einem Ort</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>Automatische Erinnerungen</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>Schnellere zukünftige Buchungen</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              variant="outline"
              aria-label="Kostenloses Konto erstellen um Buchungen zu verwalten"
            >
              Jetzt kostenloses Konto erstellen
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Action Buttons - Streamlined: 3 buttons instead of 4 */}
      <div className="w-full max-w-md space-y-3">
        {/* Add to Calendar - Now Functional */}
        <Button
          size="lg"
          variant="outline"
          className="w-full h-12"
          onClick={handleAddToCalendar}
          aria-label={`Buchung ${bookingNumber} zum Kalender hinzufügen`}
        >
          <Calendar className="mr-2 h-5 w-5" aria-hidden="true" />
          Zum Kalender hinzufügen
        </Button>

        {/* View All Bookings - Renamed and Redirects to /customer/bookings */}
        <Button
          size="lg"
          className="w-full h-12 bg-primary hover:bg-primary/90"
          onClick={handleViewBookings}
          aria-label="Alle meine Buchungen anzeigen"
        >
          Meine Buchungen
        </Button>

        {/* New Search (Secondary) */}
        <Button
          size="lg"
          variant="ghost"
          className="w-full h-12"
          onClick={onNewSearch}
          aria-label="Nach weiteren verfügbaren Terminen suchen"
        >
          <Search className="mr-2 h-5 w-5" aria-hidden="true" />
          Weitere Termine suchen
        </Button>
      </div>
    </div>
  )
}