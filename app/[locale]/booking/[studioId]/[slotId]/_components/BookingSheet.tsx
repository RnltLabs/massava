/**
 * @fileoverview Booking sheet component for appointment booking flow
 * @module app/[locale]/booking/[studioId]/[slotId]/_components/BookingSheet
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import type { JSX } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "next-auth/react"
import type { Studio, Service, BookingStatus } from "@/app/generated/prisma"
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
import { logger, generateCorrelationId } from "@/lib/logger"

import { StepService } from "./StepService"
import { StepConfirm } from "./StepConfirm"
import { SuccessState } from "./SuccessState"

// Constants
const SCROLL_DELAY_MS = 50;

// Simplified TimeSlot type for dynamic slots (no DB record)
interface DynamicTimeSlot {
  startTime: Date
  endTime: Date
}

interface BookingSheetProps {
  studio: Studio
  services: Service[]
  timeSlot: DynamicTimeSlot // Simplified type for dynamic slots
  studioId: string
  slotId: string
  preferredDateTime: string // ISO DateTime string for dynamic slots
  isOpen: boolean
  onClose: () => void
  locale: string
  searchParams: { [key: string]: string | string[] | undefined }
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
 *
 * @param props - Component properties
 * @returns Booking sheet JSX element
 */
export function BookingSheet({
  studio,
  services,
  timeSlot,
  studioId,
  slotId,
  preferredDateTime,
  isOpen,
  onClose,
  locale,
  searchParams,
}: BookingSheetProps): JSX.Element {
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
  const [isJustRegistered, setIsJustRegistered] = useState(false)
  const [submittedCustomerData, setSubmittedCustomerData] = useState<{
    name: string
    email: string
  } | null>(null)

  // Form setup with react-hook-form + Zod validation
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      studioId,
      preferredDateTime, // Use ISO DateTime instead of slotId for dynamic slots
      serviceId: selectedServiceId || "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      message: "",
      explicitHealthConsent: false,
    },
  })

  // Scroll to top when step changes
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Try to find and scroll the mobile container
      const mobileContainer = document.querySelector('.overflow-y-auto')
      if (mobileContainer) {
        mobileContainer.scrollTo({ top: 0, behavior: 'smooth' })
      }

      // Try to find and scroll the desktop ScrollArea viewport
      const desktopViewport = document.querySelector('[data-slot="scroll-area-viewport"]')
      if (desktopViewport) {
        desktopViewport.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, SCROLL_DELAY_MS)

    return () => clearTimeout(timer)
  }, [currentStep])

  /**
   * Get current step number for progress indicator
   * @param step - Current step
   * @returns Step number (1-3)
   */
  const getStepNumber = (step: BookingStep): number => {
    const steps = { service: 1, confirm: 2, success: 3 }
    return steps[step]
  }

  /**
   * Handle service selection
   * @param serviceId - Selected service ID
   */
  const handleServiceSelect = useCallback((serviceId: string): void => {
    setSelectedServiceId(serviceId)
    form.setValue("serviceId", serviceId)
  }, [form])

  /**
   * Continue from service selection step
   */
  const handleContinueFromService = useCallback((): void => {
    if (!selectedServiceId) {
      toast({
        title: "Keine Behandlung ausgewählt",
        description: "Bitte wählen Sie eine Behandlung aus",
        variant: "destructive",
      })
      return
    }
    setCurrentStep("confirm")
  }, [selectedServiceId, toast])

  /**
   * Navigate back to service selection
   */
  const handleBackToService = useCallback((): void => {
    setCurrentStep("service")
  }, [])

  /**
   * Handle booking submission - WITH AUTH CHECK
   * @param data - Booking form data
   */
  const handleSubmit = useCallback(async (data: BookingFormData): Promise<void> => {
    const correlationId = generateCorrelationId();

    logger.info("Booking submission initiated", {
      correlationId,
      hasSession: !!session?.user,
      studioId: data.studioId
    });

    // If not logged in, show auth modal instead of booking immediately
    if (!session?.user) {
      logger.info("No session detected, showing auth modal", {
        correlationId
      });
      setShowAuthModal(true)
      return
    }

    logger.info("User authenticated, proceeding with booking", {
      correlationId,
      userId: session.user.id || 'unknown'
    });

    // P0.1 FIX: customerId is set server-side from session, not client-side
    // Server action will handle customerId from authenticated session
    // If logged in, proceed with booking directly
    const customerName = session.user.name || ""
    const customerEmail = session.user.email || ""

    // Store customer data for success screen
    setSubmittedCustomerData({
      name: customerName,
      email: customerEmail,
    })

    await createBookingNow({
      ...data,
      customerName,
      customerEmail,
      customerPhone: data.customerPhone || "",
      explicitHealthConsent: true, // Assumed for logged-in users
    })
  }, [session])

  /**
   * Handle guest checkout submission
   * @param guestData - Guest form data
   */
  const handleGuestSubmit = useCallback(async (guestData: GuestFormData): Promise<void> => {
    // Prüfen ob User sich gerade registriert hat
    if (guestData.isJustRegistered) {
      setIsJustRegistered(true)
    }

    // Store customer data for success screen
    setSubmittedCustomerData({
      name: guestData.customerName,
      email: guestData.customerEmail,
    })

    // P0.1 FIX: customerId removed - set server-side in createBooking()
    const bookingData: BookingFormData = {
      ...form.getValues(),
      customerName: guestData.customerName,
      customerEmail: guestData.customerEmail,
      customerPhone: guestData.customerPhone,
      explicitHealthConsent: guestData.explicitHealthConsent,
      // NEU: Falls registriert, ID mitgeben (für Server-Side Verknüpfung)
      registeredUserId: guestData.registeredUserId,
    }

    await createBookingNow(bookingData)
    setShowAuthModal(false)
  }, [form])

  /**
   * Extract actual booking logic
   * @param data - Booking form data
   */
  const createBookingNow = async (data: BookingFormData): Promise<void> => {
    const correlationId = generateCorrelationId();
    setIsSubmitting(true)

    try {
      // Remove slotId from data (we're using preferredDateTime instead)
      // This prevents validation errors when slotId contains invalid CUID format
      const { slotId: _removed, ...bookingData } = data
      const result = await createBooking(bookingData)

      if (result.success && result.bookingId) {
        // Generate booking number for display
        const displayNumber = `MB-${result.bookingId.slice(0, 8).toUpperCase()}`
        setBookingNumber(displayNumber)
        setBookingStatus((result.status as BookingStatus) || null)
        setCurrentStep("success")

        logger.info("Booking created successfully", {
          correlationId,
          bookingId: result.bookingId,
          status: result.status
        });

        toast({
          title: "Buchung erfolgreich",
          description: result.status === "PENDING"
            ? "Ihre Buchungsanfrage wurde gesendet"
            : "Ihre Buchung wurde bestätigt",
        })
      } else {
        logger.error("Booking creation failed", {
          correlationId,
          error: result.error
        });

        toast({
          title: "Buchung fehlgeschlagen",
          description: result.error || "Ein Fehler ist aufgetreten",
          variant: "destructive",
        })
      }
    } catch (error) {
      logger.error("Booking submission error", {
        correlationId,
        error: error instanceof Error ? error.message : String(error)
      });

      toast({
        title: "Fehler",
        description: "Buchung konnte nicht abgeschlossen werden",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle cancel (close dialog)
   */
  const handleCancel = useCallback((): void => {
    if (currentStep === "success") {
      // On success screen, redirect to My Bookings instead of closing
      router.push(`/${locale}/customer/bookings`)
      return
    }

    // TODO: Show confirmation dialog if form is partially filled
    onClose()
  }, [currentStep, onClose, router, locale])

  /**
   * Handle open/close state change from Sheet/Dialog
   * onOpenChange receives a boolean parameter (open/closed)
   */
  const handleOpenChange = useCallback((open: boolean): void => {
    if (!open) {
      // User is closing the dialog
      handleCancel()
    }
  }, [handleCancel])

  // Get selected service object
  const selectedService = services.find((s) => s.id === selectedServiceId)

  /**
   * Render step content with defensive checks
   * @returns Current step content or null
   */
  const renderStepContent = (): JSX.Element | null => {
    try {
      switch (currentStep) {
        case "service":
          return (
            <StepService
              key="service-step" // Force remount on step change to reset scroll
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
            logger.warn("No selected service in confirm step", {
              correlationId: generateCorrelationId(),
              currentStep
            });
            setCurrentStep("service")
            return null
          }
          return (
            <StepConfirm
              key="confirm-step" // Force remount on step change to reset scroll
              studio={studio}
              timeSlot={timeSlot}
              selectedService={selectedService}
              form={form}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onBack={handleBackToService}
            />
          )

        case "success": {
          // Prepare booking details for iCal generation
          // Use stored customer data (from guest form or session) with fallback to "Gast"
          // Ensure customerName is never empty (required for ICS validation)
          const storedName = submittedCustomerData?.name
          const sessionName = session?.user?.name
          const customerName = (storedName && storedName.trim().length > 0)
            ? storedName
            : (sessionName && sessionName.trim().length > 0)
              ? sessionName
              : "Gast"
          const customerEmail = submittedCustomerData?.email || session?.user?.email || ""

          const bookingDetails = {
            startDateTime: timeSlot.startTime,
            endDateTime: timeSlot.endTime,
            serviceName: selectedService?.name || "Behandlung",
            bookingNumber,
            customerName,
            message: form.getValues("message") || "",
          }

          // Prepare studio details for iCal generation
          const studioDetails = {
            name: studio.name,
            address: studio.address,
            city: studio.city,
            postalCode: studio.postalCode || undefined,
            country: "Deutschland", // Default country
            phone: studio.phone || undefined,
            timezone: studio.timezone || "Europe/Berlin", // Use studio's timezone for ICS
          }

          return (
            <SuccessState
              bookingNumber={bookingNumber}
              customerEmail={customerEmail}
              bookingStatus={bookingStatus}
              isGuest={!session} // P0.1 FIX: Check session instead of customerId
              isJustRegistered={isJustRegistered}
              locale={locale}
              bookingDetails={bookingDetails}
              studioDetails={studioDetails}
            />
          )
        }

        default:
          logger.warn("Unknown booking step", {
            correlationId: generateCorrelationId(),
            currentStep
          });
          return null
      }
    } catch (error) {
      logger.error("Error rendering step content", {
        correlationId: generateCorrelationId(),
        currentStep,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  // Shared content wrapper
  const content = (
    <>
      {/* Progress Dots (hide on success) */}
      {currentStep !== "success" && (
        <ProgressDots current={getStepNumber(currentStep)} total={3} />
      )}

      {/* Hidden title for accessibility */}
      <DialogHeader className="sr-only">
        <DialogTitle>Terminbuchung</DialogTitle>
      </DialogHeader>

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
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
          <SheetContent
            side="bottom"
            className="h-[80vh] rounded-t-3xl p-4 flex flex-col"
          >
            {/* Progress Dots - minimal spacing */}
            {currentStep !== "success" && (
              <ProgressDots current={getStepNumber(currentStep)} total={3} />
            )}

            {/* Hidden title for accessibility */}
            <SheetHeader className="sr-only">
              <SheetTitle>Terminbuchung</SheetTitle>
            </SheetHeader>

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
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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