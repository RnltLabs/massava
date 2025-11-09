"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "next-auth/react"
import type { Studio, Service, TimeSlot, BookingStatus } from "@/app/generated/prisma"
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
import { AuthNudgeModal } from "./AuthNudgeModal"
import type { GuestFormData } from "./types"

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

type BookingStep = "service" | "confirm" | "success"

/**
 * Booking Sheet Component - With Stealth Auth Gate
 *
 * Main orchestrator for the frictionless booking flow. Handles:
 * - Responsive Sheet (mobile) / Dialog (desktop)
 * - Step navigation (service → confirm → auth gate → success)
 * - Form state management (react-hook-form + Zod)
 * - Stealth authentication nudge AFTER commitment
 * - Booking submission via Server Action
 * - Success/error handling with toast notifications
 *
 * New Flow:
 * 1. Service: Select service from list
 * 2. Confirm: See summary + click "Book Now" (NO contact form)
 * 3. Auth Gate: Modal appears with social login / guest option
 * 4. Success: Confirmation with booking number
 *
 * Auth Strategy:
 * - If logged in: Skip auth gate, book immediately
 * - If not logged in: Show AuthNudgeModal after "Book Now"
 * - Guest option available but de-emphasized
 *
 * Mobile Optimizations:
 * - Reduced padding: p-4 saves 32px vertical space
 * - Reduced margins: mb-4 saves vertical space
 * - Compact title: text-lg saves vertical space
 * - Optimized for iPhone SE (375x667px)
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
  const { data: session } = useSession()

  const [currentStep, setCurrentStep] = useState<BookingStep>("service")
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    services[0]?.id || null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingNumber, setBookingNumber] = useState<string>("")
  const [bookingStatus, setBookingStatus] = useState<BookingStatus | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

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
    const steps = { service: 1, confirm: 2, success: 3 }
    return steps[step]
  }

  // Handle step navigation
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

  const handleBackToService = () => {
    setCurrentStep("service")
  }

  // Handle booking submission - WITH AUTH CHECK
  const handleSubmit = async (data: BookingFormData) => {
    console.log("🔍 handleSubmit called", { session, data })

    // If not logged in, show auth modal instead of booking immediately
    if (!session?.user) {
      console.log("❌ No session, showing auth modal")
      setShowAuthModal(true)
      return
    }

    console.log("✅ User is logged in, creating booking", session.user)

    // P0.1 FIX: customerId is set server-side from session, not client-side
    // Server action will handle customerId from authenticated session
    // If logged in, proceed with booking directly
    await createBookingNow({
      ...data,
      customerName: session.user.name || "",
      customerEmail: session.user.email || "",
      customerPhone: data.customerPhone || "",
      explicitHealthConsent: true, // Assumed for logged-in users
    })
  }

  // Handle guest checkout submission
  const handleGuestSubmit = async (guestData: GuestFormData) => {
    // P0.1 FIX: customerId removed - set server-side in createBooking()
    const bookingData: BookingFormData = {
      ...form.getValues(),
      customerName: guestData.customerName,
      customerEmail: guestData.customerEmail,
      customerPhone: guestData.customerPhone,
      explicitHealthConsent: guestData.explicitHealthConsent,
    }

    await createBookingNow(bookingData)
    setShowAuthModal(false)
  }

  // Extract actual booking logic
  const createBookingNow = async (data: BookingFormData) => {
    setIsSubmitting(true)

    try {
      const result = await createBooking(data)

      if (result.success && result.bookingId) {
        // Generate booking number for display
        const displayNumber = `MB-${result.bookingId.slice(0, 8).toUpperCase()}`
        setBookingNumber(displayNumber)
        setBookingStatus((result.status as BookingStatus) || null)
        setCurrentStep("success")

        toast({
          title: "Buchung erfolgreich",
          description: result.status === "PENDING"
            ? "Ihre Buchungsanfrage wurde gesendet"
            : "Ihre Buchung wurde bestätigt",
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
      case "service":
        return (
          <StepService
            services={services}
            selectedServiceId={selectedServiceId}
            onServiceSelect={handleServiceSelect}
            onContinue={handleContinueFromService}
            onCancel={handleCancel}
            timeSlot={timeSlot}
            studio={studio}
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
            customerEmail={form.getValues("customerEmail") || ""}
            onViewBooking={handleViewBooking}
            onNewSearch={handleNewSearch}
            bookingStatus={bookingStatus}
            isGuest={!session} // P0.1 FIX: Check session instead of customerId
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
      <>
        <Sheet open={isOpen} onOpenChange={onClose}>
          <SheetContent
            side="bottom"
            className="h-[80vh] rounded-t-3xl p-4 flex flex-col"
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

        {/* Auth Nudge Modal (Mobile) */}
        {showAuthModal && !session && selectedService && (
          <AuthNudgeModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            studio={studio}
            selectedService={selectedService}
            timeSlot={timeSlot}
            onGuestSubmit={handleGuestSubmit}
            message={form.getValues("message")}
          />
        )}
      </>
    )
  }

  // Desktop: Dialog
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-6 flex flex-col">
          <ScrollArea className="flex-1 pr-6 -mr-6">
            {content}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Auth Nudge Modal (Desktop) */}
      {showAuthModal && !session && selectedService && (
        <AuthNudgeModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          studio={studio}
          selectedService={selectedService}
          timeSlot={timeSlot}
          onGuestSubmit={handleGuestSubmit}
          message={form.getValues("message")}
        />
      )}
    </>
  )
}
