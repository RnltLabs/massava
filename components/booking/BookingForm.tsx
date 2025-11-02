"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import type { Service } from "@/app/generated/prisma"
import { Loader2, Calendar, User, Mail, Phone, MessageSquare } from "lucide-react"
import {
  bookingFormSchema,
  type BookingFormData,
} from "@/lib/validations/booking"
import { createBooking } from "@/app/actions/createBooking"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BookingFormProps {
  studioId: string
  slotId: string
  services: Service[]
  preselectedTime: Date
}

/**
 * Booking Form Component
 *
 * Client-side form for creating bookings with:
 * - Service selection
 * - Customer contact information
 * - Optional health-related message
 * - GDPR-compliant health data consent
 *
 * Uses React Hook Form + Zod validation for type-safe forms
 * Submits to Server Action (createBooking)
 */
export function BookingForm({
  studioId,
  slotId,
  services,
  preselectedTime,
}: BookingFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      studioId,
      slotId,
      serviceId: services[0]?.id || "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      message: "",
      explicitHealthConsent: false,
    },
  })

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createBooking(data)

      if (result.success && result.bookingId) {
        // Navigate to confirmation page
        router.push(`/booking/confirmation/${result.bookingId}`)
      } else {
        // Show error message
        setError(result.error || "Ein unbekannter Fehler ist aufgetreten")
      }
    } catch (err) {
      console.error("Booking submission error:", err)
      setError(
        "Buchung fehlgeschlagen. Bitte versuchen Sie es erneut oder kontaktieren Sie uns."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="wellness-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Ihre Buchungsdaten
        </CardTitle>
        <CardDescription>
          Bitte füllen Sie alle erforderlichen Felder aus, um Ihre Buchung
          abzuschließen
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Service Selection */}
            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gewünschte Leistung *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting || services.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="wellness-shadow">
                        <SelectValue placeholder="Leistung wählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          <div className="flex items-center justify-between gap-4">
                            <span>{service.name}</span>
                            <span className="text-muted-foreground text-sm">
                              {service.price.toFixed(2)} € • {service.duration}{" "}
                              Min
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Customer Name */}
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Ihr Name *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Max Mustermann"
                      className="wellness-shadow"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="customerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-Mail-Adresse *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="max@example.com"
                      className="wellness-shadow"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Sie erhalten eine Bestätigung an diese E-Mail-Adresse
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefonnummer *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="+49 123 456789"
                      className="wellness-shadow"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Für Rückfragen zu Ihrem Termin
                  </FormDescription>
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
                  <FormLabel className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Nachricht (optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Besondere Wünsche, Allergien oder gesundheitliche Hinweise..."
                      rows={4}
                      className="wellness-shadow resize-none"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Diese Informationen werden vertraulich behandelt und
                    unterliegen der DSGVO (Art. 9 - Gesundheitsdaten).
                    <br />
                    Durch Angabe von gesundheitsbezogenen Informationen
                    stimmen Sie der Verarbeitung zu.
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
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-secondary/10">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      Ich stimme der Verarbeitung meiner gesundheitsbezogenen
                      Daten zu *
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Gemäß DSGVO Art. 9 ist eine ausdrückliche Einwilligung
                      erforderlich. Dies gilt für alle im Nachrichtenfeld
                      angegebenen Gesundheitsdaten sowie für Informationen, die
                      während der Behandlung erhoben werden.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
                className="w-full h-12 text-base"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buchung wird erstellt...
                  </>
                ) : (
                  "Verbindlich buchen"
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Mit dem Absenden bestätigen Sie, dass Sie die Buchung
                verbindlich vornehmen möchten
              </p>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
