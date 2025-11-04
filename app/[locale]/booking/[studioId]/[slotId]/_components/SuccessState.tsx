"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Calendar, MapPin, Search, Check, Info } from "lucide-react"
import type { BookingStatus } from "@/app/generated/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface SuccessStateProps {
  bookingNumber: string
  customerEmail: string
  onViewBooking: () => void
  onNewSearch: () => void
  bookingStatus: BookingStatus | null
  isGuest: boolean
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
 * - Success message announced to screen readers
 * - Clear action labels
 * - Keyboard navigation support
 */
export function SuccessState({
  bookingNumber,
  customerEmail,
  onViewBooking,
  onNewSearch,
  bookingStatus,
  isGuest,
}: SuccessStateProps) {
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    // Trigger animation
    const timer = setTimeout(() => setIsAnimating(false), 400)
    return () => clearTimeout(timer)
  }, [])

  const isPending = bookingStatus === 'PENDING'

  // Generate calendar link (generic ICS format)
  const handleAddToCalendar = () => {
    // This would generate an ICS file or use calendar APIs
    // For now, just a placeholder
    alert("Kalenderfunktion wird noch implementiert")
  }

  const handleShowDirections = () => {
    // This would open maps with studio location
    alert("Routenfunktion wird noch implementiert")
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      {/* Animated Success Checkmark */}
      <div
        className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-400",
          isAnimating ? "scale-0 opacity-0" : "scale-100 opacity-100",
          isPending ? "bg-amber-100" : "bg-green-100"
        )}
        role="img"
        aria-label={isPending ? "Buchungsanfrage erhalten" : "Buchung erfolgreich"}
      >
        <Check
          className={cn(
            "w-10 h-10",
            isPending ? "text-amber-600" : "text-green-600"
          )}
          strokeWidth={2}
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
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Alle Termine an einem Ort</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Automatische Erinnerungen</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Schnellere zukünftige Buchungen</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline">
              Jetzt kostenloses Konto erstellen
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="w-full max-w-md space-y-3">
        {/* Add to Calendar */}
        <Button
          size="lg"
          variant="outline"
          className="w-full h-12"
          onClick={handleAddToCalendar}
        >
          <Calendar className="mr-2 h-5 w-5" />
          Zum Kalender hinzufügen
        </Button>

        {/* Show Directions */}
        <Button
          size="lg"
          variant="outline"
          className="w-full h-12"
          onClick={handleShowDirections}
        >
          <MapPin className="mr-2 h-5 w-5" />
          Route anzeigen
        </Button>

        {/* View Booking Details */}
        <Button
          size="lg"
          className="w-full h-12 bg-primary hover:bg-primary/90"
          onClick={onViewBooking}
        >
          Buchung anzeigen
        </Button>

        {/* New Search (Secondary) */}
        <Button
          size="lg"
          variant="ghost"
          className="w-full h-12"
          onClick={onNewSearch}
        >
          <Search className="mr-2 h-5 w-5" />
          Weitere Termine suchen
        </Button>
      </div>
    </div>
  )
}
