"use client"

import { format } from "date-fns"
import { de } from "date-fns/locale"
import { ArrowLeft, Calendar, Clock, Info, Loader2 } from "lucide-react"
import type { Studio, Service, TimeSlot } from "@/app/generated/prisma"
import { UseFormReturn } from "react-hook-form"
import type { BookingFormData } from "@/lib/validations/booking"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface StepConfirmProps {
  studio: Studio
  timeSlot: TimeSlot
  selectedService: Service
  form: UseFormReturn<BookingFormData>
  isSubmitting: boolean
  onSubmit: (data: BookingFormData) => void
  onBack: () => void
}

/**
 * Step 3: Confirmation & Contact Form
 *
 * Final step showing booking summary and customer contact form.
 * Includes GDPR-compliant health data consent.
 *
 * Features:
 * - Booking summary (studio, date/time, service, price)
 * - Cancellation policy (collapsible)
 * - Contact information form
 * - Optional health message field
 * - GDPR health consent checkbox (required)
 * - Large "Book Now" CTA
 *
 * Validation:
 * - All fields validated via Zod schema
 * - Server-side validation as backup
 * - Clear error messages
 *
 * Accessibility:
 * - Form properly labeled
 * - Error messages announced to screen readers
 * - Keyboard navigation support
 * - Focus management
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
  const [isPolicyExpanded, setIsPolicyExpanded] = useState(false)
  const startTime = new Date(timeSlot.startTime)

  return (
    <div className="flex flex-col h-full">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          disabled={isSubmitting}
          aria-label="Zurück zum vorherigen Schritt"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-xl font-semibold">Buchung bestätigen</h3>
      </div>

      {/* Booking Summary */}
      <Card className="mb-6 wellness-shadow">
        <CardContent className="pt-6 space-y-4">
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
              CHF {selectedService.price.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Cancellation Policy */}
      <Collapsible
        open={isPolicyExpanded}
        onOpenChange={setIsPolicyExpanded}
        className="mb-6"
      >
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
              <Info className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium flex-1">
                Stornierungsbedingungen
              </span>
              <span className={cn(
                "text-xs transition-transform",
                isPolicyExpanded && "rotate-180"
              )}>
                ▼
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Kostenlose Stornierung bis 24 Stunden vor dem Termin möglich.
                Bei kurzfristigeren Absagen wird die volle Behandlungsgebühr
                berechnet.
              </p>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

      {/* Contact Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Customer Name */}
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ihr Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Max Mustermann"
                    {...field}
                    disabled={isSubmitting}
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Customer Email */}
          <FormField
            control={form.control}
            name="customerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-Mail-Adresse *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="max@beispiel.ch"
                    {...field}
                    disabled={isSubmitting}
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Customer Phone */}
          <FormField
            control={form.control}
            name="customerPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefonnummer *</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+41 79 123 45 67"
                    {...field}
                    disabled={isSubmitting}
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Optional Message */}
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nachricht (optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Besondere Wünsche oder gesundheitliche Hinweise..."
                    {...field}
                    disabled={isSubmitting}
                    className="min-h-[100px] resize-none"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Teilen Sie uns besondere Wünsche oder wichtige
                  gesundheitliche Informationen mit
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* GDPR Health Consent */}
          <FormField
            control={form.control}
            name="explicitHealthConsent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4 bg-muted/50">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal">
                    Ich willige ausdrücklich in die Verarbeitung meiner
                    gesundheitsbezogenen Daten ein (DSGVO Art. 9) *
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Diese Einwilligung ist erforderlich, da Ihre Nachricht
                    möglicherweise sensible Gesundheitsdaten enthält
                  </FormDescription>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <div className="pt-4 border-t">
            <Button
              type="submit"
              size="lg"
              className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Wird gebucht...
                </>
              ) : (
                "Jetzt buchen"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
