"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Calendar, MapPin, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SuccessStateProps {
  bookingNumber: string
  customerEmail: string
  onViewBooking: () => void
  onNewSearch: () => void
}

/**
 * Success State Component
 *
 * Displays success animation and booking confirmation after successful booking.
 * Provides next steps and action buttons.
 *
 * Features:
 * - Animated checkmark (scale + fade in)
 * - Booking confirmation number (prominent, monospace)
 * - Email confirmation message
 * - Action buttons (calendar, directions, view booking)
 * - Return to search option
 *
 * Animation:
 * - Checkmark scales from 0 to 1 with bounce
 * - Fades in over 400ms
 * - Green accent color for positive feedback
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
}: SuccessStateProps) {
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    // Trigger animation
    const timer = setTimeout(() => setIsAnimating(false), 400)
    return () => clearTimeout(timer)
  }, [])

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
          "mb-6 transition-all duration-400",
          isAnimating ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
        role="img"
        aria-label="Buchung erfolgreich"
      >
        <CheckCircle2
          className="h-24 w-24 text-green-500"
          strokeWidth={1.5}
        />
      </div>

      {/* Success Message */}
      <h2 className="text-3xl font-bold mb-2">
        Buchung erfolgreich!
      </h2>
      <p className="text-muted-foreground mb-8">
        Ihre Massage-Behandlung wurde bestätigt
      </p>

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
