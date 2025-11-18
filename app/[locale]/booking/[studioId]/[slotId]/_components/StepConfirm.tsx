"use client"

import { format } from "date-fns"
import { de } from "date-fns/locale"
import { ArrowLeft, ArrowRight, Calendar, Clock, Info, Loader2, ChevronDown } from "lucide-react"
import type { Studio, Service } from "@/app/generated/prisma"
import { UseFormReturn } from "react-hook-form"
import type { BookingFormData } from "@/lib/validations/booking"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

// Simplified TimeSlot type for dynamic slots (no DB record)
interface DynamicTimeSlot {
  startTime: Date
  endTime: Date
}

interface StepConfirmProps {
  studio: Studio
  timeSlot: DynamicTimeSlot // Simplified type for dynamic slots
  selectedService: Service
  form: UseFormReturn<BookingFormData>
  isSubmitting: boolean
  onSubmit: (data: BookingFormData) => void
  onBack: () => void
}

/**
 * Step 2: Frictionless Confirmation
 *
 * Redesigned confirmation step with ZERO contact form fields.
 * User sees booking summary and clicks "Book Now" - that's it.
 * Auth gate appears AFTER user commits (see AuthNudgeModal).
 *
 * Changes from old version:
 * - REMOVED: Name, email, phone inputs
 * - REMOVED: Health consent checkbox (moved to guest form)
 * - KEPT: Booking summary card
 * - KEPT: Optional message (collapsed by default)
 * - KEPT: Privacy/Terms checkbox (legally required)
 * - NEW: Prominent "Book Now" CTA
 *
 * Design Philosophy:
 * - Remove ALL friction before booking
 * - Show only what's necessary for decision
 * - Make "Book Now" irresistible
 * - Gate with auth AFTER commitment
 *
 * Accessibility:
 * - Keyboard navigation support
 * - ARIA labels for screen readers
 * - Focus management
 * - Clear error states
 */
export function StepConfirm({
  studio,
  timeSlot,
  selectedService,
  form,
  isSubmitting,
  onSubmit,
  onBack,
}: StepConfirmProps) {
  const { toast } = useToast()
  const [messageExpanded, setMessageExpanded] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const startTime = new Date(timeSlot.startTime)

  const handleBookNow = () => {
    if (!privacyAccepted) {
      toast({
        title: "Bitte bestätigen",
        description: "Bitte akzeptieren Sie die Datenschutzerklärung und AGB",
        variant: "destructive",
      })
      return
    }

    // This will trigger the auth check in parent component
    onSubmit(form.getValues())
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          disabled={isSubmitting}
          aria-label="Zurück zur Behandlungsauswahl"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-xl font-semibold">Buchung bestätigen</h3>
      </div>

      {/* Booking Summary Card */}
      <Card className="mb-4 wellness-shadow">
        <CardHeader>
          <CardTitle className="text-lg">Zusammenfassung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Studio</p>
            <p className="font-semibold">{studio.name}</p>
            <p className="text-sm text-muted-foreground">{studio.city}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Datum</span>
              </div>
              <p className="font-medium text-sm">
                {format(startTime, "dd. MMM yyyy", { locale: de })}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Uhrzeit</span>
              </div>
              <p className="font-medium text-sm">
                {format(startTime, "HH:mm", { locale: de })} Uhr
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-1">Behandlung</p>
            <p className="font-semibold">{selectedService.name}</p>
            <p className="text-sm text-muted-foreground">
              {selectedService.duration} Minuten
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Gesamt</span>
            <span className="text-2xl font-bold text-primary">
              €{selectedService.price.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Optional Message (Collapsed by Default) */}
      <Card className="mb-4">
        <CardHeader
          className="cursor-pointer"
          onClick={() => setMessageExpanded(!messageExpanded)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">
              Nachricht hinzufügen (optional)
            </CardTitle>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              messageExpanded && "transform rotate-180"
            )} />
          </div>
        </CardHeader>
        {messageExpanded && (
          <CardContent>
            <Textarea
              placeholder="Besondere Wünsche oder Anmerkungen..."
              rows={3}
              value={form.watch("message") || ""}
              onChange={(e) => form.setValue("message", e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-2">
              z.B. Allergien, bevorzugte Öle, Druck-Präferenzen
            </p>
          </CardContent>
        )}
      </Card>

      {/* Cancellation Policy */}
      <Card className="mb-4 bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Stornierungsbedingungen</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Kostenlose Stornierung bis 24 Stunden vor dem Termin möglich.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy/Terms Checkbox - REQUIRED */}
      <div className="flex items-start gap-3 mb-6">
        <Checkbox
          id="privacy"
          checked={privacyAccepted}
          onCheckedChange={(checked) => setPrivacyAccepted(!!checked)}
        />
        <label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
          Ich habe die{" "}
          <a href="/datenschutz" className="underline text-primary" target="_blank" rel="noopener noreferrer">
            Datenschutzerklärung
          </a>{" "}
          gelesen und akzeptiere die{" "}
          <a href="/agb" className="underline text-primary" target="_blank" rel="noopener noreferrer">
            AGB
          </a>.
        </label>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="space-y-3 pt-4 border-t">
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold"
          onClick={handleBookNow}
          disabled={!privacyAccepted || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Wird gebucht...
            </>
          ) : (
            <>
              Jetzt buchen
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Kostenlose Stornierung bis 24h vor Termin
        </p>

        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="w-full"
          disabled={isSubmitting}
        >
          Zurück zur Behandlungsauswahl
        </Button>
      </div>
    </div>
  )
}
