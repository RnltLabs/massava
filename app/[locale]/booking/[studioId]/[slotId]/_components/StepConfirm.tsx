"use client"

import { format } from "date-fns"
import { de } from "date-fns/locale"
import { ArrowLeft, ArrowRight, Calendar, Clock, Info, Loader2, ChevronDown, MapPin, Sparkles } from "lucide-react"
import type { Studio, Service } from "@/app/generated/prisma"
import { UseFormReturn } from "react-hook-form"
import type { BookingFormData } from "@/lib/validations/booking"
import { Button } from "@/components/ui/button"
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
      <div className="flex items-center gap-3 mt-1 mb-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          disabled={isSubmitting}
          aria-label="Zurück zur Serviceauswahl"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-lg font-semibold">Buchung bestätigen</h3>
      </div>

      {/* Compact Summary - Context Badge Style (matching StepService) */}
      <div className="bg-accent/10 border-l-4 border-primary p-3 mb-3 rounded-lg">
        {/* Studio */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="font-medium">{studio.name}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{studio.city}</span>
        </div>

        {/* Date & Time - inline like StepService */}
        <div className="flex items-center gap-2 text-sm mt-1.5">
          <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
          <span>{format(startTime, "EEE, dd. MMM yyyy", { locale: de })}</span>
          <span className="text-muted-foreground">•</span>
          <Clock className="h-4 w-4 text-primary flex-shrink-0" />
          <span>{format(startTime, "HH:mm", { locale: de })} Uhr</span>
        </div>

        {/* Service */}
        <div className="flex items-center gap-2 text-sm mt-1.5">
          <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="font-medium">{selectedService.name}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{selectedService.duration} min</span>
        </div>
      </div>

      {/* Price Row - Prominent but compact */}
      <div className="flex items-center justify-between p-3 bg-card border-2 border-border/50 rounded-xl mb-3">
        <span className="font-semibold">Gesamt</span>
        <span className="text-xl font-bold text-primary">
          €{selectedService.price.toFixed(2)}
        </span>
      </div>

      {/* Message Expander - Compact */}
      <button
        type="button"
        onClick={() => setMessageExpanded(!messageExpanded)}
        className="w-full flex items-center justify-between p-3 bg-card border border-border/50 rounded-lg text-sm hover:bg-accent/30 transition-colors mb-2"
      >
        <span className="text-muted-foreground">Nachricht hinzufügen (optional)</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            messageExpanded && "rotate-180"
          )}
        />
      </button>

      {messageExpanded && (
        <div className="mb-2">
          <Textarea
            placeholder="Besondere Wünsche, Allergien, Druck-Präferenzen..."
            rows={2}
            value={form.watch("message") || ""}
            onChange={(e) => form.setValue("message", e.target.value)}
            className="text-sm"
          />
        </div>
      )}

      {/* Privacy/Terms in Card - Not floating */}
      <div className="p-3 bg-card border border-border/50 rounded-lg mb-3">
        <div className="flex items-start gap-3">
          <Checkbox
            id="privacy"
            checked={privacyAccepted}
            onCheckedChange={(checked) => setPrivacyAccepted(!!checked)}
            className="mt-0.5"
          />
          <label
            htmlFor="privacy"
            className="text-sm leading-relaxed cursor-pointer"
          >
            Ich akzeptiere die{" "}
            <a
              href="/datenschutz"
              className="underline text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Datenschutzerklärung
            </a>{" "}
            und{" "}
            <a
              href="/agb"
              className="underline text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              AGB
            </a>
            .
          </label>
        </div>
      </div>

      {/* Cancellation Info - Subtle inline */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1 mb-2">
        <Info className="h-3.5 w-3.5 flex-shrink-0" />
        <span>Kostenlose Stornierung bis 24h vor Termin</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions - Compact */}
      <div className="pt-3 border-t">
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
      </div>
    </div>
  )
}
