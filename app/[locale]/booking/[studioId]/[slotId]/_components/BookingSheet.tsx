"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Studio, Service, TimeSlot } from "@/app/generated/prisma"
import {
  bookingFormSchema,
  type BookingFormData,
} from "@/lib/validations/booking"
import { createBooking } from "@/app/actions/createBooking"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useToast } from "@/components/ui/use-toast"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProgressDots } from "./ProgressDots"
import { StepReview } from "./StepReview"
import { StepService } from "./StepService"
import { StepConfirm } from "./StepConfirm"
import { SuccessState } from "./SuccessState"

interface BookingSheetProps {
  studio: Studio
  services: Service[]
  timeSlot: TimeSlot
  studioId: string
  slotId: string
  isOpen: boolean
  onClose: () => void
}

type BookingStep = "review" | "service" | "confirm" | "success"

/**
 * Booking Sheet Component - Mobile-First Optimized
 *
 * Main orchestrator for the booking flow. Handles:
 * - Responsive Sheet (mobile) / Dialog (desktop)
 * - Step navigation (review → service → confirm → success)
 * - Form state management (react-hook-form + Zod)
 * - Booking submission via Server Action
 * - Success/error handling with toast notifications
 *
 * Mobile Optimizations:
 * - Reduced padding: p-4 (was p-6) saves 32px
 * - Reduced margins: mb-4 (was mb-6) saves vertical space
 * - Compact title: text-lg (was text-2xl) saves vertical space
 * - Optimized for iPhone SE (375x667px) without scrolling
 *
 * Architecture:
 * - Mobile (<768px): Sheet component from bottom
 * - Desktop (≥768px): Centered Dialog modal
 * - Same content, different container
 *
 * Step Flow:
 * 1. Review: Show studio info + selected date/time
 * 2. Service: Select service from list
 * 3. Confirm: Contact form + booking summary
 * 4. Success: Confirmation with booking number
 *
 * Accessibility:
 * - Focus trap within modal
 * - Escape key closes dialog
 * - Keyboard navigation support
 * - ARIA labels and roles
 */
export function BookingSheet({
  studio,
  services,
  timeSlot,
  studioId,
  slotId,
  isOpen,
  onClose,
}: BookingSheetProps) {
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useMediaQuery("(max-width: 768px)")

  const [currentStep, setCurrentStep] = useState<BookingStep>("review")
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    services[0]?.id || null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingNumber, setBookingNumber] = useState<string>("")

  // Form setup with react-hook-form + Zod validation
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      studioId,
      slotId,
      serviceId: selectedServiceId || "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      message: "",
      explicitHealthConsent: false,
    },
  })

  // Get current step number for progress indicator
  const getStepNumber = (step: BookingStep): number => {
    const steps = { review: 1, service: 2, confirm: 3, success: 4 }
    return steps[step]
  }

  // Handle step navigation
  const handleContinueFromReview = () => {
    setCurrentStep("service")
  }

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId)
    form.setValue("serviceId", serviceId)
  }

  const handleContinueFromService = () => {
    if (!selectedServiceId) {
      toast({
        title: "Keine Behandlung ausgewählt",
        description: "Bitte wählen Sie eine Behandlung aus",
        variant: "destructive",
      })
      return
    }
    setCurrentStep("confirm")
  }

  const handleBackToReview = () => {
    setCurrentStep("review")
  }

  const handleBackToService = () => {
    setCurrentStep("service")
  }

  // Handle booking submission
  const handleSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true)

    try {
      const result = await createBooking(data)

      if (result.success && result.bookingId) {
        // Generate booking number for display
        const displayNumber = `MB-${result.bookingId.slice(0, 8).toUpperCase()}`
        setBookingNumber(displayNumber)
        setCurrentStep("success")

        toast({
          title: "Buchung erfolgreich",
          description: "Ihre Buchung wurde bestätigt",
        })
      } else {
        toast({
          title: "Buchung fehlgeschlagen",
          description: result.error || "Ein Fehler ist aufgetreten",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Booking submission error:", error)
      toast({
        title: "Fehler",
        description: "Buchung konnte nicht abgeschlossen werden",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle cancel (close dialog)
  const handleCancel = () => {
    if (currentStep === "success") {
      // Don't show confirmation on success screen
      onClose()
      return
    }

    // TODO: Show confirmation dialog if form is partially filled
    onClose()
  }

  // Handle success actions
  const handleViewBooking = () => {
    router.push(`/booking/confirmation/${bookingNumber}`)
  }

  const handleNewSearch = () => {
    router.push("/search/appointments")
  }

  // Get selected service object
  const selectedService = services.find((s) => s.id === selectedServiceId)

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "review":
        return (
          <StepReview
            studio={studio}
            timeSlot={timeSlot}
            onContinue={handleContinueFromReview}
            onCancel={handleCancel}
          />
        )

      case "service":
        return (
          <StepService
            services={services}
            selectedServiceId={selectedServiceId}
            onServiceSelect={handleServiceSelect}
            onContinue={handleContinueFromService}
            onBack={handleBackToReview}
          />
        )

      case "confirm":
        if (!selectedService) {
          // Safety check - shouldn't happen
          setCurrentStep("service")
          return null
        }
        return (
          <StepConfirm
            studio={studio}
            timeSlot={timeSlot}
            selectedService={selectedService}
            form={form}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onBack={handleBackToService}
          />
        )

      case "success":
        return (
          <SuccessState
            bookingNumber={bookingNumber}
            customerEmail={form.getValues("customerEmail")}
            onViewBooking={handleViewBooking}
            onNewSearch={handleNewSearch}
          />
        )

      default:
        return null
    }
  }

  // Shared content wrapper
  const content = (
    <>
      {/* Progress Dots (hide on success) */}
      {currentStep !== "success" && (
        <ProgressDots current={getStepNumber(currentStep)} total={3} />
      )}

      {/* Title (hide on success) */}
      {currentStep !== "success" && (
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold">
            Termin bestätigen
          </DialogTitle>
        </DialogHeader>
      )}

      {/* Step Content */}
      <div className="flex-1 overflow-hidden">
        {renderStepContent()}
      </div>
    </>
  )

  // Render mobile (Sheet) or desktop (Dialog)
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-3xl p-4 flex flex-col"
        >
          {/* Drag Handle - Reduced margin: mb-4 (was mb-6) */}
          <div className="mx-auto w-12 h-1.5 bg-muted rounded-full mb-4 flex-shrink-0" />

          {/* Progress Dots */}
          {currentStep !== "success" && (
            <ProgressDots current={getStepNumber(currentStep)} total={3} />
          )}

          {/* Title - No bottom margin, text-lg (was text-2xl) for space efficiency */}
          {currentStep !== "success" && (
            <SheetHeader className="mb-2">
              <SheetTitle className="text-lg font-bold">
                Termin bestätigen
              </SheetTitle>
            </SheetHeader>
          )}

          {/* Content (Scrollable) - Adjusted margins: -mx-4 px-4 (was -mx-6 px-6) */}
          <div className="flex-1 overflow-y-auto -mx-4 px-4">
            {renderStepContent()}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop: Dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-6 flex flex-col">
        <ScrollArea className="flex-1 pr-6 -mr-6">
          {content}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
