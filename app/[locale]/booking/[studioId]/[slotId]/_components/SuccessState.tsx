/**
 * @fileoverview Success state component for booking confirmation
 * @module app/[locale]/booking/[studioId]/[slotId]/_components/SuccessState
 */

"use client"

import { useEffect, useState, useCallback } from "react"
import type { JSX } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Calendar, Check, Info, MapPin, Clock, Sparkles, Mail } from "lucide-react"
import type { BookingStatus } from "@/app/generated/prisma"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { generateBookingIcs, downloadIcs, ICSGenerationError, type BookingDetails, type StudioDetails } from "@/lib/ical/generateBookingIcs"
import { logger, generateCorrelationId } from "@/lib/logger"

// Constants
const ANIMATION_DURATION_MS = 400;

interface SuccessStateProps {
  bookingNumber: string
  customerEmail: string
  bookingStatus: BookingStatus | null
  isGuest: boolean
  locale: string
  bookingDetails: BookingDetails
  studioDetails: StudioDetails
  isJustRegistered?: boolean
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
  bookingStatus,
  isGuest,
  locale,
  bookingDetails,
  studioDetails,
  isJustRegistered = false,
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
    <div className="flex flex-col py-4 px-2">
      {/* Screen reader announcement for success state */}
      <div className="sr-only" role="status" aria-live="polite">
        {isPending
          ? `Buchungsanfrage erhalten. Buchungsnummer: ${bookingNumber}`
          : `Buchung erfolgreich bestätigt. Buchungsnummer: ${bookingNumber}`
        }
      </div>

      {/* Animated Success Checkmark - Compact */}
      <div className="flex justify-center mb-3">
        <div
          className={cn(
            "w-16 h-16 rounded-full bg-green-600 flex items-center justify-center transition-all duration-400",
            isAnimating ? "scale-0 opacity-0" : "scale-100 opacity-100"
          )}
          role="img"
          aria-label={isPending ? "Buchungsanfrage erhalten" : "Buchung erfolgreich"}
        >
          <Check
            className="w-8 h-8 text-white"
            strokeWidth={3}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Status-Based Success Message - Compact */}
      <div className="text-center mb-4">
        {isPending ? (
          <>
            <h2 className="text-xl font-bold mb-1">
              Buchungsanfrage erhalten!
            </h2>
            <p className="text-sm text-muted-foreground">
              Das Studio wird sich bei Ihnen melden.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-1">
              Buchung bestätigt!
            </h2>
            <p className="text-sm text-muted-foreground">
              Bestätigung an {customerEmail}
            </p>
          </>
        )}
      </div>

      {/* Pending Alert - Compact */}
      {isPending && (
        <Alert className="mb-3 py-2">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Ihr Termin ist reserviert und für andere gesperrt.
          </AlertDescription>
        </Alert>
      )}

      {/* Email Verification Alert - Only for newly registered users */}
      {isJustRegistered && (
        <Alert className="mb-3 py-2 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
          <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
            Wir haben Ihnen eine E-Mail zur Verifizierung gesendet. Bitte bestätigen Sie Ihre E-Mail-Adresse um alle Funktionen zu nutzen.
          </AlertDescription>
        </Alert>
      )}

      {/* Booking Summary - Context Badge Style (matching StepConfirm) */}
      <div className="bg-accent/10 border-l-4 border-primary p-3 mb-3 rounded-lg">
        {/* Studio */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="font-medium truncate">{studioDetails.name}</span>
          {studioDetails.city && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground truncate">{studioDetails.city}</span>
            </>
          )}
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-2 text-sm mt-1.5">
          <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
          <span>{format(new Date(bookingDetails.startDateTime), "EEE, dd. MMM yyyy", { locale: de })}</span>
          <span className="text-muted-foreground">•</span>
          <Clock className="h-4 w-4 text-primary flex-shrink-0" />
          <span>{format(new Date(bookingDetails.startDateTime), "HH:mm", { locale: de })} Uhr</span>
        </div>

        {/* Service */}
        <div className="flex items-center gap-2 text-sm mt-1.5">
          <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="font-medium">{bookingDetails.serviceName}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            {Math.round((new Date(bookingDetails.endDateTime).getTime() - new Date(bookingDetails.startDateTime).getTime()) / 60000)} min
          </span>
        </div>
      </div>

      {/* Booking Number - Compact */}
      <div className="flex items-center justify-between p-3 bg-card border-2 border-border/50 rounded-xl mb-3">
        <span className="text-sm text-muted-foreground">Buchungsnummer</span>
        <span className="font-mono font-bold text-primary">
          {bookingNumber}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {/* Add to Calendar - Always shown */}
        <Button
          variant="outline"
          className="w-full h-11"
          onClick={handleAddToCalendar}
          aria-label={`Buchung ${bookingNumber} zum Kalender hinzufügen`}
        >
          <Calendar className="mr-2 h-4 w-4" aria-hidden="true" />
          Zum Kalender hinzufügen
        </Button>

        {/* View All Bookings - Only for logged in users */}
        {!isGuest && (
          <Button
            className="w-full h-11 bg-primary hover:bg-primary/90"
            onClick={handleViewBookings}
            aria-label="Alle meine Buchungen anzeigen"
          >
            Meine Buchungen
          </Button>
        )}

        {/* Guest: Create Account CTA - Opens signup dialog on homepage */}
        {isGuest && !isJustRegistered && (
          <Button
            className="w-full h-11 bg-primary hover:bg-primary/90"
            onClick={() => router.push(`/${locale}?openAuth=signup`)}
            aria-label="Kostenloses Konto erstellen"
          >
            Konto erstellen
          </Button>
        )}
      </div>

      {/* Guest Benefits - Subtle hint below buttons */}
      {isGuest && !isJustRegistered && (
        <p className="text-xs text-center text-muted-foreground mt-3">
          Mit einem Konto: Erinnerungen • Alle Termine • Schneller buchen
        </p>
      )}
    </div>
  )
}