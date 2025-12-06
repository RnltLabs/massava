"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useToast } from "@/components/ui/use-toast"
import {
  Bell,
  Clock,
  Zap,
  Mail,
} from "lucide-react"
import { GuestCheckoutForm } from "./GuestCheckoutForm"
import type { Service, Studio } from "@/app/generated/prisma"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import type { GuestFormData } from "./types"

// Simplified TimeSlot type for dynamic slots (no DB record)
interface DynamicTimeSlot {
  startTime: Date
  endTime: Date
}

interface AuthNudgeModalProps {
  isOpen: boolean
  onClose: () => void
  studio: Studio
  selectedService: Service
  timeSlot: DynamicTimeSlot // Simplified type for dynamic slots
  onGuestSubmit: (data: GuestFormData) => Promise<void>
  message?: string
}

/**
 * Authentication Nudge Modal
 *
 * Stealth authentication gate that appears AFTER user commits to booking.
 * Gently nudges users to create an account while offering a low-friction
 * guest checkout option.
 *
 * Design Philosophy:
 * - Show benefits, not barriers
 * - Social login as primary CTA
 * - Guest option small but visible (not hidden)
 * - Mobile-first with Sheet, desktop with Dialog
 *
 * Features:
 * - Social login (Google, Apple) - PRIMARY
 * - Email signup - SECONDARY
 * - Guest checkout form - TERTIARY (stealth)
 * - Booking summary reminder
 * - 3 key benefits highlighted
 *
 * Conversion Strategy:
 * - Progress indicator shows user is almost done
 * - Remind user of their booking
 * - Emphasize account benefits (reminders, history, speed)
 * - Make guest option available but not prominent
 *
 * Accessibility:
 * - Full keyboard navigation
 * - ARIA labels for screen readers
 * - Focus trap within modal
 * - Escape key closes
 */
export function AuthNudgeModal({
  isOpen,
  onClose,
  studio,
  selectedService,
  timeSlot,
  onGuestSubmit,
  message,
}: AuthNudgeModalProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { toast } = useToast()
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setIsLoading(true)
    try {
      await signIn(provider, {
        callbackUrl: window.location.href,
      })
    } catch {
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: "Bitte versuchen Sie es erneut",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleEmailSignup = () => {
    // Open the auth dialog for email registration
    signIn(undefined, {
      callbackUrl: window.location.href,
    })
  }

  const handleGuestContinue = () => {
    setShowGuestForm(true)
  }

  const handleGuestFormSubmit = async (data: GuestFormData) => {
    await onGuestSubmit(data)
  }

  const handleBackToAuth = () => {
    setShowGuestForm(false)
  }

  const content = showGuestForm ? (
    <GuestCheckoutForm
      onSubmit={handleGuestFormSubmit}
      onBack={handleBackToAuth}
      message={message}
    />
  ) : (
    <div className="space-y-4">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
        <div className="w-8 h-0.5 bg-primary" />
        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
        <div className="w-8 h-0.5 bg-muted" />
        <div className="w-2.5 h-2.5 rounded-full bg-muted" />
      </div>

      {/* Headline with urgency */}
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1">
          Fast geschafft!
        </h2>
        <p className="text-sm text-muted-foreground">
          Sichere dir deinen Termin mit einem kostenlosen Konto
        </p>
      </div>

      {/* Booking Summary - Minimal */}
      <div className="bg-muted/50 rounded-lg p-3 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{studio.name}</p>
            <p className="text-muted-foreground">
              {format(new Date(timeSlot.startTime), "dd. MMM, HH:mm", { locale: de })} Uhr
            </p>
          </div>
          <p className="text-lg font-bold text-primary">
            €{selectedService.price.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Benefits - Compact inline */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-xs bg-primary/10 px-2.5 py-1.5 rounded-full">
          <Bell className="w-3.5 h-3.5 text-primary" />
          <span>Erinnerungen</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs bg-primary/10 px-2.5 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>Alle Termine</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs bg-primary/10 px-2.5 py-1.5 rounded-full">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span>Schneller buchen</span>
        </div>
      </div>

      {/* Social Login (PRIMARY) - More prominent */}
      <div className="space-y-2">
        <Button
          size="lg"
          variant="outline"
          className="w-full h-12 text-base border-2 hover:bg-gray-50"
          onClick={() => handleSocialLogin("google")}
          disabled={isLoading}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Mit Google fortfahren
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="w-full h-11"
          onClick={() => handleSocialLogin("apple")}
          disabled={isLoading}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          Mit Apple fortfahren
        </Button>
      </div>

      {/* Divider */}
      <div className="relative py-1">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
          oder
        </span>
      </div>

      {/* Email Signup (SECONDARY) */}
      <Button
        size="lg"
        variant="outline"
        className="w-full h-11"
        onClick={handleEmailSignup}
      >
        <Mail className="w-4 h-4 mr-2" />
        Mit E-Mail registrieren
      </Button>

      {/* Login Option - Inline */}
      <div className="text-center text-xs text-muted-foreground">
        Haben Sie bereits ein Konto?{" "}
        <button
          className="underline hover:text-primary"
          onClick={() => signIn()}
        >
          Anmelden
        </button>
      </div>

      {/* Guest Option - Maximum stealth */}
      <div className="text-center pt-3 mt-2 border-t border-border/30">
        <button
          className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground/80"
          onClick={handleGuestContinue}
        >
          Lieber ohne Konto fortfahren
        </button>
      </div>
    </div>
  )

  // Mobile: Sheet, Desktop: Dialog
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="h-[80vh] rounded-t-3xl p-4 overflow-y-auto"
        >
          {/* Drag Handle */}
          <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />

          {content}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] p-6 overflow-y-auto">
        {content}
      </DialogContent>
    </Dialog>
  )
}
