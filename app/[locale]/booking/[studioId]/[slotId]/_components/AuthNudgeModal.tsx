"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Check,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Zap,
} from "lucide-react"
import { GuestCheckoutForm } from "./GuestCheckoutForm"
import type { Service, Studio } from "@/app/generated/prisma"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import type { GuestFormData } from "./types"
import { signUp, signIn as serverSignIn } from "@/app/actions/auth"

// Modal states for the auth flow
type ModalState =
  | 'auth-nudge'    // Step 1: Fast geschafft (Social + Email options)
  | 'email-signup'  // Step 2a: Email registration form
  | 'email-login'   // Step 2b: Email login form
  | 'guest-form'    // Step 2c: Guest checkout form

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
  timeSlot: DynamicTimeSlot
  onGuestSubmit: (data: GuestFormData) => Promise<void>
  onLoginSuccess?: () => void // Callback when login succeeds
  message?: string
}

// Validation schemas
const signupSchema = z.object({
  firstName: z.string().min(2, "Mindestens 2 Zeichen"),
  lastName: z.string().min(2, "Mindestens 2 Zeichen"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string()
    .min(10, "Mindestens 10 Zeichen")
    .regex(/[A-Z]/, "Mindestens ein Großbuchstabe")
    .regex(/[0-9]/, "Mindestens eine Zahl"),
  passwordConfirm: z.string().min(1, "Passwort-Bestätigung ist erforderlich"),
  phone: z.string().min(10, "Mindestens 10 Zeichen").regex(/^[\d\s+()-]+$/, "Nur Zahlen erlaubt"),
  termsAccepted: z.boolean().refine(val => val === true, "Zustimmung erforderlich"),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwörter stimmen nicht überein",
  path: ["passwordConfirm"],
})

const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(1, "Passwort ist erforderlich"),
})

type SignupFormData = z.infer<typeof signupSchema>
type LoginFormData = z.infer<typeof loginSchema>

// Password strength interface
interface PasswordStrength {
  score: number
  label: string
  color: string
}

// Password strength calculation (aligned with SignUpForm.tsx)
const getPasswordStrength = (password: string): PasswordStrength => {
  if (!password) {
    return { score: 0, label: '', color: '' }
  }

  let score = 0
  // Basic requirement: 10+ characters
  if (password.length >= 10) score++
  // Additional length bonus
  if (password.length >= 14) score++
  // Required: uppercase + lowercase
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  // Required: at least one number
  if (/\d/.test(password)) score++
  // Bonus: special character
  if (/[^a-zA-Z0-9]/.test(password)) score++

  const strengthMap: PasswordStrength[] = [
    { score: 0, label: 'Sehr schwach', color: 'bg-red-500' },
    { score: 1, label: 'Schwach', color: 'bg-orange-500' },
    { score: 2, label: 'Mittel', color: 'bg-yellow-500' },
    { score: 3, label: 'Gut', color: 'bg-lime-500' },
    { score: 4, label: 'Sehr gut', color: 'bg-green-600' },
  ]

  return strengthMap[Math.min(score, 4)]
}

/**
 * Authentication Nudge Modal
 *
 * Stealth authentication gate that appears AFTER user commits to booking.
 * Now includes inline email signup/login forms that stay within the modal.
 *
 * Flow:
 * 1. Auth Nudge (Fast geschafft!) - Social login + Email options
 * 2a. Email Signup - Registration form with booking data
 * 2b. Email Login - Login form for existing users
 * 2c. Guest Form - Minimal guest checkout
 *
 * After successful signup/login, the booking is completed automatically.
 */
export function AuthNudgeModal({
  isOpen,
  onClose,
  studio,
  selectedService,
  timeSlot,
  onGuestSubmit,
  onLoginSuccess,
  message,
}: AuthNudgeModalProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { toast } = useToast()
  const [modalState, setModalState] = useState<ModalState>('auth-nudge')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  // Signup form
  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      passwordConfirm: "",
      phone: "",
      termsAccepted: false,
    },
    mode: "onChange", // Enable real-time validation for password matching
  })

  // Watch password for strength indicator
  const watchedPassword = signupForm.watch("password")
  const watchedPasswordConfirm = signupForm.watch("passwordConfirm")
  const passwordStrength = getPasswordStrength(watchedPassword)

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

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

  const handleSignupSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    try {
      // 1. Create account (email not verified yet)
      const result = await signUp({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: data.password,
        phone: data.phone,
        terms: true,
        accountType: 'customer',
      }, 'de')

      if (!result.success) {
        toast({
          title: "Registrierung fehlgeschlagen",
          description: result.error || "Bitte versuchen Sie es erneut",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // 2. Account created! Now log in the user automatically
      toast({
        title: "Konto erstellt!",
        description: "Sie werden jetzt eingeloggt...",
      })

      // 3. Sign in the user to create a session
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        accountType: "customer",
        redirect: false,
      })

      if (signInResult?.error) {
        // If login fails, still proceed with booking using registeredUserId
        console.warn("Auto-login failed after registration:", signInResult.error)
      }

      // 4. Submit booking - now user is logged in (session created)
      await onGuestSubmit({
        customerName: `${data.firstName} ${data.lastName}`,
        customerEmail: data.email,
        customerPhone: data.phone,
        explicitHealthConsent: true, // Terms accepted in signup
        message: message,
        registeredUserId: result.data?.userId,
        isJustRegistered: true,
      })

    } catch (error) {
      console.error('Signup error:', error)
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const result = await serverSignIn({
        email: data.email,
        password: data.password,
        accountType: 'customer',
      })

      if (!result.success) {
        // Check if email not verified
        if (result.error?.includes('verify')) {
          toast({
            title: "E-Mail nicht verifiziert",
            description: "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Anmeldung fehlgeschlagen",
            description: "E-Mail oder Passwort falsch",
            variant: "destructive",
          })
        }
        setIsLoading(false)
        return
      }

      // Login successful! Reload to get session and complete booking
      toast({
        title: "Anmeldung erfolgreich!",
        description: "Ihre Buchung wird abgeschlossen...",
      })

      // Trigger callback or reload
      if (onLoginSuccess) {
        onLoginSuccess()
      } else {
        // Reload page to get new session
        window.location.reload()
      }

    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleGuestFormSubmit = async (data: GuestFormData) => {
    await onGuestSubmit(data)
  }

  // Progress indicator based on state
  const getProgressStep = (): number => {
    switch (modalState) {
      case 'auth-nudge': return 1
      case 'email-signup':
      case 'email-login':
      case 'guest-form': return 2
      default: return 1
    }
  }

  // Render progress dots (Step 1-2 in modal, 3-4 in booking sheet)
  const renderProgress = () => {
    const currentStep = getProgressStep()
    return (
      <div className="flex items-center justify-center gap-2 mb-2">
        {/* Step 1 */}
        <div className={`w-2.5 h-2.5 rounded-full ${currentStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        {/* Step 2 */}
        <div className={`w-2.5 h-2.5 rounded-full ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        <div className="w-8 h-0.5 bg-muted" />
        {/* Step 3 (will be filled in booking sheet) */}
        <div className="w-2.5 h-2.5 rounded-full bg-muted" />
      </div>
    )
  }

  // Auth Nudge Content (Step 1)
  const renderAuthNudge = () => (
    <div className="space-y-4">
      {renderProgress()}

      {/* Headline */}
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1">Fast geschafft!</h2>
        <p className="text-sm text-muted-foreground">
          Sichere dir deinen Termin mit einem kostenlosen Konto
        </p>
      </div>

      {/* Booking Summary */}
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

      {/* Benefits */}
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

      {/* Social Login */}
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

      {/* Email Signup */}
      <Button
        size="lg"
        variant="outline"
        className="w-full h-11"
        onClick={() => setModalState('email-signup')}
      >
        <Mail className="w-4 h-4 mr-2" />
        Mit E-Mail registrieren
      </Button>

      {/* Login Option */}
      <div className="text-center text-xs text-muted-foreground">
        Haben Sie bereits ein Konto?{" "}
        <button
          className="underline hover:text-primary"
          onClick={() => setModalState('email-login')}
        >
          Anmelden
        </button>
      </div>

      {/* Guest Option */}
      <div className="text-center pt-3 mt-2 border-t border-border/30">
        <button
          className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground/80"
          onClick={() => setModalState('guest-form')}
        >
          Lieber ohne Konto fortfahren
        </button>
      </div>
    </div>
  )

  // Email Signup Form (Step 2a)
  const renderEmailSignup = () => (
    <div className="space-y-4">
      {renderProgress()}

      {/* Back Button + Title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setModalState('auth-nudge')}
          disabled={isLoading}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-bold">Konto erstellen</h2>
      </div>

      <p className="text-sm text-muted-foreground">
        Mit einem Konto können Sie Ihre Buchungen verwalten und erhalten automatische Erinnerungen.
      </p>

      <form onSubmit={signupForm.handleSubmit(handleSignupSubmit)} className="space-y-3">
        {/* Name fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="firstName" className="text-xs">Vorname *</Label>
            <Input
              id="firstName"
              placeholder="Max"
              {...signupForm.register("firstName")}
              className="h-11"
              disabled={isLoading}
            />
            {signupForm.formState.errors.firstName && (
              <p className="text-xs text-destructive mt-1">
                {signupForm.formState.errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="lastName" className="text-xs">Nachname *</Label>
            <Input
              id="lastName"
              placeholder="Mustermann"
              {...signupForm.register("lastName")}
              className="h-11"
              disabled={isLoading}
            />
            {signupForm.formState.errors.lastName && (
              <p className="text-xs text-destructive mt-1">
                {signupForm.formState.errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-xs">E-Mail *</Label>
          <Input
            id="email"
            type="email"
            placeholder="max@example.com"
            {...signupForm.register("email")}
            className="h-11"
            disabled={isLoading}
          />
          {signupForm.formState.errors.email && (
            <p className="text-xs text-destructive mt-1">
              {signupForm.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone" className="text-xs">Telefon *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+49 170 1234567"
            {...signupForm.register("phone")}
            className="h-11"
            disabled={isLoading}
          />
          {signupForm.formState.errors.phone && (
            <p className="text-xs text-destructive mt-1">
              {signupForm.formState.errors.phone.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="relative">
          <Label htmlFor="password" className="text-xs">Passwort *</Label>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Min. 10 Zeichen"
            {...signupForm.register("password")}
            className="h-11 pr-10"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-7 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          {signupForm.formState.errors.password && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-destructive mt-1 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {signupForm.formState.errors.password.message}
            </motion.p>
          )}

          {/* Password strength indicator */}
          {watchedPassword && !signupForm.formState.errors.password && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 space-y-1"
            >
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-all duration-300',
                      level <= passwordStrength.score
                        ? passwordStrength.color
                        : 'bg-gray-200'
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Passwortstärke: <span className="font-medium">{passwordStrength.label}</span>
              </p>
            </motion.div>
          )}
        </div>

        {/* Password Confirmation */}
        <div className="relative">
          <Label htmlFor="passwordConfirm" className="text-xs">Passwort bestätigen *</Label>
          <Input
            id="passwordConfirm"
            type={showPasswordConfirm ? "text" : "password"}
            placeholder="Passwort wiederholen"
            {...signupForm.register("passwordConfirm")}
            className={cn(
              "h-11 pr-10",
              watchedPasswordConfirm && watchedPasswordConfirm === watchedPassword && !signupForm.formState.errors.passwordConfirm
                ? "border-green-500 focus-visible:ring-green-500"
                : ""
            )}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
            className="absolute right-3 top-7 text-muted-foreground hover:text-foreground"
          >
            {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          {signupForm.formState.errors.passwordConfirm && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-destructive mt-1 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {signupForm.formState.errors.passwordConfirm.message}
            </motion.p>
          )}
          {/* Success indicator when passwords match */}
          {watchedPasswordConfirm &&
            watchedPasswordConfirm === watchedPassword &&
            !signupForm.formState.errors.passwordConfirm && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-xs text-green-600 flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Passwörter stimmen überein
              </motion.p>
            )}
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
          <Checkbox
            id="terms"
            checked={signupForm.watch("termsAccepted")}
            onCheckedChange={(checked) => signupForm.setValue("termsAccepted", !!checked)}
            disabled={isLoading}
          />
          <label htmlFor="terms" className="text-xs leading-relaxed cursor-pointer">
            Ich akzeptiere die{" "}
            <a href="/datenschutz" className="underline text-primary" target="_blank">
              Datenschutzerklärung
            </a>{" "}
            und{" "}
            <a href="/agb" className="underline text-primary" target="_blank">
              AGB
            </a>
            , sowie die Verarbeitung meiner Gesundheitsdaten (Art. 9 DSGVO) *
          </label>
        </div>
        {signupForm.formState.errors.termsAccepted && (
          <p className="text-xs text-destructive">
            {signupForm.formState.errors.termsAccepted.message}
          </p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full h-12"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Wird erstellt...
            </>
          ) : (
            "Konto erstellen & buchen"
          )}
        </Button>
      </form>

      {/* Switch to Login */}
      <div className="text-center text-xs text-muted-foreground pt-2">
        Bereits ein Konto?{" "}
        <button
          className="underline hover:text-primary"
          onClick={() => setModalState('email-login')}
          disabled={isLoading}
        >
          Jetzt anmelden
        </button>
      </div>
    </div>
  )

  // Email Login Form (Step 2b)
  const renderEmailLogin = () => (
    <div className="space-y-4">
      {renderProgress()}

      {/* Back Button + Title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setModalState('auth-nudge')}
          disabled={isLoading}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-bold">Anmelden</h2>
      </div>

      <p className="text-sm text-muted-foreground">
        Melden Sie sich an, um Ihre Buchung fortzusetzen.
      </p>

      <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <Label htmlFor="login-email" className="text-xs">E-Mail *</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="max@example.com"
            {...loginForm.register("email")}
            className="h-11"
            disabled={isLoading}
          />
          {loginForm.formState.errors.email && (
            <p className="text-xs text-destructive mt-1">
              {loginForm.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="relative">
          <Label htmlFor="login-password" className="text-xs">Passwort *</Label>
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="Ihr Passwort"
            {...loginForm.register("password")}
            className="h-11 pr-10"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-7 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          {loginForm.formState.errors.password && (
            <p className="text-xs text-destructive mt-1">
              {loginForm.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Forgot Password Link */}
        <div className="text-right">
          <a
            href="/de/auth/reset-password"
            className="text-xs text-muted-foreground hover:text-primary underline"
            target="_blank"
          >
            Passwort vergessen?
          </a>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full h-12"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Anmeldung...
            </>
          ) : (
            "Anmelden & buchen"
          )}
        </Button>
      </form>

      {/* Switch to Signup */}
      <div className="text-center text-xs text-muted-foreground pt-2">
        Noch kein Konto?{" "}
        <button
          className="underline hover:text-primary"
          onClick={() => setModalState('email-signup')}
          disabled={isLoading}
        >
          Jetzt registrieren
        </button>
      </div>
    </div>
  )

  // Render content based on state
  const content = () => {
    switch (modalState) {
      case 'auth-nudge':
        return renderAuthNudge()
      case 'email-signup':
        return renderEmailSignup()
      case 'email-login':
        return renderEmailLogin()
      case 'guest-form':
        return (
          <GuestCheckoutForm
            onSubmit={handleGuestFormSubmit}
            onBack={() => setModalState('auth-nudge')}
            message={message}
          />
        )
      default:
        return renderAuthNudge()
    }
  }

  // Mobile: Sheet, Desktop: Dialog
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-3xl p-4 overflow-y-auto"
        >
          {/* Drag Handle */}
          <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
          {content()}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] p-6 overflow-y-auto">
        {content()}
      </DialogContent>
    </Dialog>
  )
}
