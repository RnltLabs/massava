"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Info, Loader2 } from "lucide-react"
import type { GuestFormData } from "./types"

const guestFormSchema = z.object({
  customerName: z.string().min(2, "Mindestens 2 Zeichen").max(100),
  customerEmail: z.string().email("Ungültige E-Mail-Adresse"),
  customerPhone: z.string().min(10, "Mindestens 10 Zeichen").regex(/^[\d\s+()-]+$/, "Nur Zahlen, Leerzeichen, +, -, (, )"),
  explicitHealthConsent: z.boolean().refine(val => val === true, "Zustimmung erforderlich"),
})

interface GuestCheckoutFormProps {
  onSubmit: (data: GuestFormData) => Promise<void>
  onBack: () => void
  message?: string
}

/**
 * Guest Checkout Form
 *
 * Minimal contact form for users who choose guest checkout.
 * Only shown after user clicks "Ohne Konto fortfahren" in AuthNudgeModal.
 *
 * Features:
 * - Name, email, phone (all required)
 * - GDPR health consent checkbox (required)
 * - Validation with Zod schema
 * - Back button to auth options
 * - Reminder about account benefits
 *
 * Design Philosophy:
 * - Keep it minimal (only essential fields)
 * - Show validation errors clearly
 * - Gentle reminder about benefits of creating account
 * - No dark patterns or tricks
 *
 * Accessibility:
 * - Proper labels for all inputs
 * - Error messages linked to inputs
 * - Keyboard navigation support
 * - Focus management
 */
export function GuestCheckoutForm({ onSubmit, onBack, message }: GuestCheckoutFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<GuestFormData>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      explicitHealthConsent: false,
    },
  })

  const handleSubmit = async (data: GuestFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="pl-0"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Zurück
      </Button>

      {/* Title */}
      <div>
        <h2 className="text-xl font-bold mb-2">
          Als Gast fortfahren
        </h2>
        <p className="text-sm text-muted-foreground">
          Sie erhalten eine einmalige Buchungsbestätigung per E-Mail
        </p>
      </div>

      {/* Form */}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            placeholder="Max Mustermann"
            {...form.register("customerName")}
            className="h-12"
          />
          {form.formState.errors.customerName && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.customerName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="email">E-Mail *</Label>
          <Input
            id="email"
            type="email"
            placeholder="max@example.com"
            {...form.register("customerEmail")}
            className="h-12"
          />
          {form.formState.errors.customerEmail && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.customerEmail.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Telefon *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+41 79 123 45 67"
            {...form.register("customerPhone")}
            className="h-12"
          />
          {form.formState.errors.customerPhone && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.customerPhone.message}
            </p>
          )}
        </div>

        {/* Health Consent */}
        <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/50">
          <Checkbox
            id="health"
            checked={form.watch("explicitHealthConsent")}
            onCheckedChange={(checked) => form.setValue("explicitHealthConsent", !!checked)}
          />
          <label htmlFor="health" className="text-sm leading-relaxed cursor-pointer">
            Ich willige ein, dass meine Gesundheitsdaten zum Zweck der Behandlung verarbeitet werden (Art. 9 DSGVO) *
          </label>
        </div>
        {form.formState.errors.explicitHealthConsent && (
          <p className="text-sm text-destructive">
            {form.formState.errors.explicitHealthConsent.message}
          </p>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full h-12"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Wird gebucht...
            </>
          ) : (
            "Buchung abschließen"
          )}
        </Button>
      </form>

      {/* Reminder */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Tipp: Mit einem Konto erhalten Sie automatische Erinnerungen und können Ihre Buchung jederzeit einsehen
        </AlertDescription>
      </Alert>
    </div>
  )
}
