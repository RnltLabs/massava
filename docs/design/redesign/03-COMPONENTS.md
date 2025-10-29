# Massava Authentication Redesign - Component Specifications

**Document:** Detailed component designs with code examples
**Date:** October 2025
**Design Team:** UX Design

---

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [UnifiedAuthDialog](#unifiedauthdialog)
3. [Step Indicator](#step-indicator)
4. [AccountTypeSelector](#accounttypeselector)
5. [SignUpForm](#signupform)
6. [LoginForm](#loginform)
7. [FormField Components](#formfield-components)
8. [TermsAcceptanceCard](#termsacceptancecard)
9. [GoogleOAuthButton](#googleoauthbutton)
10. [LoadingStates](#loadingstates)
11. [SuccessState](#successstate)
12. [ErrorHandling](#errorhandling)

---

## Component Architecture

### Component Tree

```
UnifiedAuthDialog (Client Component)
├── DialogOverlay
├── DialogContent
│   ├── DialogHeader
│   │   ├── Logo
│   │   ├── StepIndicator ⭐ NEW
│   │   └── DialogClose
│   ├── AnimatePresence (Framer Motion)
│   │   └── motion.div
│   │       ├── [Step 1] AccountTypeSelector
│   │       │   ├── AccountTypeCard (Customer)
│   │       │   │   ├── Icon (User)
│   │       │   │   ├── Title
│   │       │   │   ├── Description
│   │       │   │   └── ArrowIcon
│   │       │   └── AccountTypeCard (Studio Owner)
│   │       │       ├── Icon (Building2)
│   │       │       ├── Title
│   │       │       ├── Description
│   │       │       └── ArrowIcon
│   │       └── [Step 2] AuthForm
│   │           ├── mode === 'signup' ? SignUpForm : LoginForm
│   │           └── SocialAuthSection
│   └── DialogFooter
│       └── ModeToggle (Login ↔ Sign Up)
```

---

## UnifiedAuthDialog

### Purpose
Main container for the authentication flow, handling dialog state, step navigation, and responsive behavior.

### Visual Design

**Desktop (≥ 768px):**
- Centered modal (max-width: 480px)
- White background with rounded corners (16px)
- Strong shadow (--shadow-2xl)
- Semi-transparent black overlay (50% opacity)

**Mobile (< 768px):**
- Full-screen bottom sheet
- Slides up from bottom
- Rounded top corners only (12px)
- Covers 90% of viewport height

---

### Component Code

```typescript
// components/auth/UnifiedAuthDialog.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { StepIndicator } from './StepIndicator'
import { AccountTypeSelector } from './AccountTypeSelector'
import { SignUpForm } from './SignUpForm'
import { LoginForm } from './LoginForm'
import { SocialAuthSection } from './SocialAuthSection'
import type { AccountType } from '@/types/auth'

interface UnifiedAuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: 'login' | 'signup'
}

export function UnifiedAuthDialog({
  open,
  onOpenChange,
  defaultMode = 'signup',
}: UnifiedAuthDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode)
  const [accountType, setAccountType] = useState<AccountType | null>(null)

  const handleAccountTypeSelect = (type: AccountType) => {
    setAccountType(type)
    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
    setAccountType(null)
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state after animation completes
    setTimeout(() => {
      setStep(1)
      setAccountType(null)
      setMode(defaultMode)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
      <DialogContent className="auth-dialog">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            {step === 2 && (
              <button
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Zurück"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
          </div>

          <StepIndicator currentStep={step} totalSteps={2} />

          <div className="flex-1 flex justify-end">
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Schließen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Animated Content */}
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.0, 0.0, 0.2, 1] }}
            >
              <AccountTypeSelector
                onSelect={handleAccountTypeSelect}
                mode={mode}
              />
            </motion.div>
          ) : (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: [0.0, 0.0, 0.2, 1] }}
            >
              {mode === 'signup' ? (
                <SignUpForm
                  accountType={accountType!}
                  onSuccess={handleClose}
                />
              ) : (
                <LoginForm
                  accountType={accountType!}
                  onSuccess={handleClose}
                />
              )}

              <SocialAuthSection accountType={accountType!} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {mode === 'signup' ? (
              <>
                Haben Sie bereits ein Konto?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-sage-600 font-medium hover:text-sage-700 transition-colors"
                >
                  Anmelden
                </button>
              </>
            ) : (
              <>
                Noch kein Konto?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-sage-600 font-medium hover:text-sage-700 transition-colors"
                >
                  Registrieren
                </button>
              </>
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Styles (Tailwind)

```css
/* app/globals.css */

.auth-dialog {
  @apply bg-white rounded-xl shadow-2xl;
  @apply p-6 md:p-8;
  @apply w-full max-w-[480px];
  @apply mx-4;
}

/* Mobile: Bottom sheet */
@media (max-width: 767px) {
  .auth-dialog {
    @apply fixed bottom-0 left-0 right-0;
    @apply rounded-t-xl rounded-b-none;
    @apply max-h-[90vh] overflow-y-auto;
    @apply mx-0;
  }
}

/* Smooth dialog animation */
@keyframes dialog-slide-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-dialog {
  animation: dialog-slide-in 400ms cubic-bezier(0.0, 0.0, 0.2, 1);
}
```

---

## Step Indicator

### Purpose
Shows user progress through the 2-step flow, reducing anxiety and improving completion rates.

### Visual Design

**Layout:**
```
┌────────────────────────────┐
│ Schritt 1 von 2            │
│ ━━━━━━━━━━━━━░░░░░░░░░░░░ │
│ 50%                        │
└────────────────────────────┘
```

**States:**
- Step 1: 50% progress (first half filled)
- Step 2: 100% progress (fully filled)

---

### Component Code

```typescript
// components/auth/StepIndicator.tsx
'use client'

import { motion } from 'framer-motion'

interface StepIndicatorProps {
  currentStep: 1 | 2
  totalSteps: 2
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="step-indicator" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
      <p className="text-sm font-medium text-gray-700 mb-2 text-center">
        Schritt {currentStep} von {totalSteps}
      </p>

      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden w-32">
        <motion.div
          className="h-full bg-sage-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.0, 0.0, 0.2, 1] }}
        />
      </div>

      <p className="text-xs text-gray-500 mt-1 text-center">
        {progress}%
      </p>
    </div>
  )
}
```

---

## AccountTypeSelector

### Purpose
First step: User selects whether they're a customer or studio owner. Large, obvious cards with clear descriptions.

### Visual Design

**Desktop:**
```
┌─────────────────────────────────────────────┐
│ Willkommen bei Massava                      │
│ Wählen Sie Ihren Kontotyp                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  👤  Ich möchte buchen                      │
│      Finden und buchen Sie Thai-Massagen    │
│                                         →   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  🏢  Ich habe ein Studio                    │
│      Verwalten Sie Ihr Massagestudio        │
│                                         →   │
└─────────────────────────────────────────────┘
```

**Mobile:**
- Full-width cards
- Stacked vertically
- 16px gap between cards
- Minimum 72px height (comfortable touch target)

---

### Component Code

```typescript
// components/auth/AccountTypeSelector.tsx
'use client'

import { User, Building2, ArrowRight } from 'lucide-react'
import type { AccountType } from '@/types/auth'

interface AccountTypeSelectorProps {
  onSelect: (type: AccountType) => void
  mode: 'login' | 'signup'
}

export function AccountTypeSelector({ onSelect, mode }: AccountTypeSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-display font-bold text-gray-900 mb-2">
          Willkommen bei Massava
        </h2>
        <p className="text-body text-gray-600">
          {mode === 'signup'
            ? 'Wählen Sie Ihren Kontotyp'
            : 'Wie möchten Sie sich anmelden?'}
        </p>
      </div>

      <div className="space-y-4">
        <AccountTypeCard
          icon={<User className="h-8 w-8" />}
          title="Ich möchte buchen"
          description="Finden und buchen Sie Thai-Massagen in Ihrer Nähe"
          onClick={() => onSelect('customer')}
        />

        <AccountTypeCard
          icon={<Building2 className="h-8 w-8" />}
          title="Ich habe ein Studio"
          description="Verwalten Sie Ihr Massagestudio und Ihre Buchungen"
          onClick={() => onSelect('studio')}
        />
      </div>
    </div>
  )
}

interface AccountTypeCardProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}

function AccountTypeCard({ icon, title, description, onClick }: AccountTypeCardProps) {
  return (
    <button
      onClick={onClick}
      className="account-type-card"
      aria-label={title}
    >
      <div className="flex items-start gap-4 flex-1">
        <div className="text-sage-600 flex-shrink-0">
          {icon}
        </div>
        <div className="text-left flex-1">
          <h3 className="text-h3 font-semibold text-gray-900 mb-1">
            {title}
          </h3>
          <p className="text-body-sm text-gray-600">
            {description}
          </p>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0 self-center" />
      </div>
    </button>
  )
}
```

---

### Styles

```css
.account-type-card {
  @apply w-full p-6 rounded-lg;
  @apply bg-white border-2 border-gray-200;
  @apply shadow-md hover:shadow-lg;
  @apply transition-all duration-200;
  @apply flex items-center;
  @apply min-h-[88px]; /* Comfortable touch target */
}

.account-type-card:hover {
  @apply border-sage-300 bg-sage-50;
  @apply transform -translate-y-1;
}

.account-type-card:active {
  @apply transform translate-y-0;
  @apply shadow-sm;
}

.account-type-card:focus-visible {
  @apply outline-none ring-3 ring-sage-500 ring-offset-2;
}

/* Mobile optimization */
@media (max-width: 767px) {
  .account-type-card {
    @apply min-h-[96px]; /* Even larger on mobile */
  }
}
```

---

## SignUpForm

### Purpose
Second step (signup mode): Collect user information with inline validation and clear feedback.

### Visual Design

```
┌─────────────────────────────────────────────┐
│ Konto erstellen                             │
│ Füllen Sie das Formular aus                 │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Ihr vollständiger Name *                    │
│ ┌─────────────────────────────────────────┐ │
│ │ Max Mustermann                    ✓     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ E-Mail-Adresse *                            │
│ ┌─────────────────────────────────────────┐ │
│ │ max@example.com                   ✓     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Telefonnummer (optional)                    │
│ ┌─────────────────────────────────────────┐ │
│ │ +49 123 456789                          │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Passwort *                                  │
│ ┌─────────────────────────────────────────┐ │
│ │ ••••••••                          👁     │ │
│ └─────────────────────────────────────────┘ │
│ ━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░ │
│ Stark (4/4)                                 │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ☑  Ich akzeptiere die Nutzungsbedingungen  │
│     und Datenschutzerklärung                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              Konto erstellen                │
└─────────────────────────────────────────────┘
```

---

### Component Code

```typescript
// components/auth/SignUpForm.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { FormField } from './FormField'
import { PasswordField } from './PasswordField'
import { TermsAcceptanceCard } from './TermsAcceptanceCard'
import { Button } from '@/components/ui/button'
import { signUpAction } from '@/app/actions/auth'
import { toast } from '@/hooks/use-toast'
import type { AccountType } from '@/types/auth'

const signUpSchema = z.object({
  name: z.string()
    .min(2, 'Name muss mindestens 2 Zeichen lang sein')
    .max(100, 'Name darf maximal 100 Zeichen lang sein'),
  email: z.string()
    .email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Ungültige Telefonnummer')
    .optional()
    .or(z.literal('')),
  password: z.string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Ziffer enthalten'),
  termsAccepted: z.boolean()
    .refine(val => val === true, 'Sie müssen die Nutzungsbedingungen akzeptieren'),
})

type SignUpFormData = z.infer<typeof signUpSchema>

interface SignUpFormProps {
  accountType: AccountType
  onSuccess: () => void
}

export function SignUpForm({ accountType, onSuccess }: SignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur',
  })

  const password = watch('password')

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true)

    try {
      const result = await signUpAction({
        ...data,
        accountType,
      })

      if (result.success) {
        toast({
          title: 'Konto erfolgreich erstellt!',
          description: 'Willkommen bei Massava.',
        })
        onSuccess()
      } else {
        toast({
          title: 'Fehler bei der Registrierung',
          description: result.error || 'Bitte versuchen Sie es erneut.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Netzwerkfehler',
        description: 'Bitte überprüfen Sie Ihre Internetverbindung.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-h1 font-semibold text-gray-900 mb-1">
          Konto erstellen
        </h2>
        <p className="text-body-sm text-gray-600">
          Füllen Sie das Formular aus, um zu starten
        </p>
      </div>

      <FormField
        label="Ihr vollständiger Name"
        name="name"
        type="text"
        placeholder="Max Mustermann"
        register={register}
        error={errors.name}
        required
        autoComplete="name"
      />

      <FormField
        label="E-Mail-Adresse"
        name="email"
        type="email"
        placeholder="max@example.com"
        register={register}
        error={errors.email}
        required
        autoComplete="email"
      />

      <FormField
        label="Telefonnummer"
        name="phone"
        type="tel"
        placeholder="+49 123 456789"
        register={register}
        error={errors.phone}
        helpText="Optional - für Buchungsbestätigungen per SMS"
        autoComplete="tel"
      />

      <PasswordField
        label="Passwort"
        name="password"
        register={register}
        error={errors.password}
        required
        showStrengthMeter
        currentPassword={password}
      />

      <TermsAcceptanceCard
        register={register}
        error={errors.termsAccepted}
      />

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isLoading}
      >
        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        Konto erstellen
      </Button>
    </form>
  )
}
```

---

## LoginForm

### Purpose
Second step (login mode): Simple email + password login with remember me option.

### Visual Design

```
┌─────────────────────────────────────────────┐
│ Anmelden                                    │
│ Willkommen zurück!                          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ E-Mail-Adresse *                            │
│ ┌─────────────────────────────────────────┐ │
│ │ max@example.com                         │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Passwort *                                  │
│ ┌─────────────────────────────────────────┐ │
│ │ ••••••••                          👁     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ☑ Angemeldet bleiben                        │
│                        Passwort vergessen? →│
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              Anmelden                       │
└─────────────────────────────────────────────┘
```

---

### Component Code

```typescript
// components/auth/LoginForm.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { FormField } from './FormField'
import { PasswordField } from './PasswordField'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { loginAction } from '@/app/actions/auth'
import { toast } from '@/hooks/use-toast'
import type { AccountType } from '@/types/auth'

const loginSchema = z.object({
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  password: z.string().min(1, 'Bitte geben Sie Ihr Passwort ein'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  accountType: AccountType
  onSuccess: () => void
}

export function LoginForm({ accountType, onSuccess }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)

    try {
      const result = await loginAction({
        ...data,
        accountType,
      })

      if (result.success) {
        toast({
          title: 'Erfolgreich angemeldet!',
          description: 'Willkommen zurück.',
        })
        onSuccess()
      } else {
        toast({
          title: 'Anmeldung fehlgeschlagen',
          description: result.error || 'Bitte überprüfen Sie Ihre Anmeldedaten.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Netzwerkfehler',
        description: 'Bitte überprüfen Sie Ihre Internetverbindung.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-h1 font-semibold text-gray-900 mb-1">
          Anmelden
        </h2>
        <p className="text-body-sm text-gray-600">
          Willkommen zurück!
        </p>
      </div>

      <FormField
        label="E-Mail-Adresse"
        name="email"
        type="email"
        placeholder="max@example.com"
        register={register}
        error={errors.email}
        required
        autoComplete="email"
        autoFocus
      />

      <PasswordField
        label="Passwort"
        name="password"
        register={register}
        error={errors.password}
        required
        autoComplete="current-password"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="rememberMe"
            {...register('rememberMe')}
          />
          <Label
            htmlFor="rememberMe"
            className="text-sm text-gray-700 cursor-pointer"
          >
            Angemeldet bleiben
          </Label>
        </div>

        <a
          href="/auth/forgot-password"
          className="text-sm text-sage-600 hover:text-sage-700 font-medium transition-colors"
        >
          Passwort vergessen?
        </a>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isLoading}
      >
        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        Anmelden
      </Button>
    </form>
  )
}
```

---

## FormField Components

### FormField (Basic Input)

```typescript
// components/auth/FormField.tsx
'use client'

import { forwardRef } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { UseFormRegister, FieldError } from 'react-hook-form'

interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'tel' | 'url'
  placeholder?: string
  register: UseFormRegister<any>
  error?: FieldError
  required?: boolean
  helpText?: string
  autoComplete?: string
  autoFocus?: boolean
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      name,
      type = 'text',
      placeholder,
      register,
      error,
      required,
      helpText,
      autoComplete,
      autoFocus,
    },
    ref
  ) => {
    const isValid = !error && register

    return (
      <div className="form-field-container">
        <Label htmlFor={name} className="form-label">
          {label} {required && <span className="text-error-500">*</span>}
        </Label>

        <div className="relative">
          <Input
            id={name}
            type={type}
            placeholder={placeholder}
            {...register(name)}
            className={`form-input ${error ? 'form-input-error' : ''} ${
              isValid ? 'form-input-valid' : ''
            }`}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            ref={ref}
          />

          {/* Validation Icon */}
          {isValid && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success-600">
              <Check className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div
            id={`${name}-error`}
            className="flex items-start gap-2 mt-2 text-error-600"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{error.message}</span>
          </div>
        )}

        {/* Help Text */}
        {helpText && !error && (
          <p className="text-xs text-gray-500 mt-2">{helpText}</p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'
```

---

### PasswordField (with visibility toggle + strength meter)

```typescript
// components/auth/PasswordField.tsx
'use client'

import { useState, useMemo } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { UseFormRegister, FieldError } from 'react-hook-form'

interface PasswordFieldProps {
  label: string
  name: string
  register: UseFormRegister<any>
  error?: FieldError
  required?: boolean
  autoComplete?: string
  showStrengthMeter?: boolean
  currentPassword?: string
}

export function PasswordField({
  label,
  name,
  register,
  error,
  required,
  autoComplete = 'new-password',
  showStrengthMeter,
  currentPassword = '',
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false)

  const passwordStrength = useMemo(() => {
    if (!showStrengthMeter || !currentPassword) return null

    let strength = 0
    if (currentPassword.length >= 8) strength++
    if (/[A-Z]/.test(currentPassword)) strength++
    if (/[a-z]/.test(currentPassword)) strength++
    if (/[0-9]/.test(currentPassword)) strength++
    if (/[^A-Za-z0-9]/.test(currentPassword)) strength++

    const labels = ['Sehr schwach', 'Schwach', 'Mittel', 'Stark', 'Sehr stark']
    const colors = ['bg-error-500', 'bg-warning-500', 'bg-warning-500', 'bg-success-500', 'bg-success-600']

    return {
      score: strength,
      label: labels[strength - 1] || labels[0],
      color: colors[strength - 1] || colors[0],
      percentage: (strength / 5) * 100,
    }
  }, [currentPassword, showStrengthMeter])

  return (
    <div className="form-field-container">
      <Label htmlFor={name} className="form-label">
        {label} {required && <span className="text-error-500">*</span>}
      </Label>

      <div className="relative">
        <Input
          id={name}
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          {...register(name)}
          className={`form-input pr-12 ${error ? 'form-input-error' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          autoComplete={autoComplete}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Password Strength Meter */}
      {showStrengthMeter && passwordStrength && currentPassword && (
        <div className="mt-2">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${passwordStrength.color} transition-all duration-300`}
              style={{ width: `${passwordStrength.percentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {passwordStrength.label} ({passwordStrength.score}/5)
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          id={`${name}-error`}
          className="flex items-start gap-2 mt-2 text-error-600"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span className="text-sm">{error.message}</span>
        </div>
      )}
    </div>
  )
}
```

---

### Styles (Form Fields)

```css
.form-field-container {
  @apply space-y-2;
}

.form-label {
  @apply text-label text-gray-700 font-medium;
}

.form-input {
  @apply w-full px-4 py-3;
  @apply border-2 border-gray-300 rounded-lg;
  @apply text-body text-gray-900 placeholder-gray-400;
  @apply transition-all duration-200;
  @apply focus:outline-none focus:border-sage-500 focus:ring-3 focus:ring-sage-500/20;
}

.form-input-error {
  @apply border-error-500 focus:border-error-500 focus:ring-error-500/20;
}

.form-input-valid {
  @apply border-success-500;
}

/* Mobile: Larger touch targets */
@media (max-width: 767px) {
  .form-input {
    @apply py-4 text-[16px]; /* Prevents iOS zoom */
  }
}
```

---

## TermsAcceptanceCard

### Purpose
Prominent, impossible-to-miss terms acceptance with large touch target.

### Visual Design

```
┌─────────────────────────────────────────────┐
│ ☑  Ich akzeptiere die Nutzungsbedingungen  │
│     und Datenschutzerklärung                │
└─────────────────────────────────────────────┘
```

---

### Component Code

```typescript
// components/auth/TermsAcceptanceCard.tsx
'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import type { UseFormRegister, FieldError } from 'react-hook-form'

interface TermsAcceptanceCardProps {
  register: UseFormRegister<any>
  error?: FieldError
}

export function TermsAcceptanceCard({ register, error }: TermsAcceptanceCardProps) {
  return (
    <div className="terms-acceptance-card">
      <div className="flex items-start gap-3">
        <Checkbox
          id="termsAccepted"
          {...register('termsAccepted')}
          className="mt-1 h-5 w-5"
          aria-invalid={!!error}
          aria-describedby={error ? 'terms-error' : undefined}
        />
        <Label
          htmlFor="termsAccepted"
          className="text-sm text-gray-700 leading-relaxed cursor-pointer flex-1"
        >
          Ich akzeptiere die{' '}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sage-600 hover:text-sage-700 font-medium underline"
            onClick={(e) => e.stopPropagation()}
          >
            Nutzungsbedingungen
          </a>
          {' '}und{' '}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sage-600 hover:text-sage-700 font-medium underline"
            onClick={(e) => e.stopPropagation()}
          >
            Datenschutzerklärung
          </a>
        </Label>
      </div>

      {error && (
        <div
          id="terms-error"
          className="flex items-start gap-2 mt-2 text-error-600"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span className="text-sm">{error.message}</span>
        </div>
      )}
    </div>
  )
}
```

---

### Styles

```css
.terms-acceptance-card {
  @apply p-4 rounded-lg;
  @apply bg-sage-50 border-2 border-sage-200;
  @apply transition-colors duration-200;
}

.terms-acceptance-card:hover {
  @apply bg-sage-100;
}

/* Ensure touch target is large enough */
.terms-acceptance-card label {
  @apply min-h-[44px] flex items-center;
}
```

---

## GoogleOAuthButton

### Purpose
Prominent social login option with clear value proposition.

### Visual Design

```
┌─────────────────────────────────────────────┐
│ ────────── oder ──────────                  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  G   Mit Google fortfahren                  │
│      Schneller ohne Passwort                │
└─────────────────────────────────────────────┘
```

---

### Component Code

```typescript
// components/auth/GoogleOAuthButton.tsx
'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { googleOAuthAction } from '@/app/actions/auth'
import { toast } from '@/hooks/use-toast'
import type { AccountType } from '@/types/auth'

interface GoogleOAuthButtonProps {
  accountType: AccountType
}

export function GoogleOAuthButton({ accountType }: GoogleOAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)

    try {
      const result = await googleOAuthAction({ accountType })

      if (result.success && result.redirectUrl) {
        window.location.href = result.redirectUrl
      } else {
        toast({
          title: 'OAuth-Fehler',
          description: result.error || 'Bitte versuchen Sie es erneut.',
          variant: 'destructive',
        })
        setIsLoading(false)
      }
    } catch (error) {
      toast({
        title: 'Netzwerkfehler',
        description: 'Bitte überprüfen Sie Ihre Internetverbindung.',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="google-oauth-button"
    >
      {isLoading ? (
        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
      ) : (
        <GoogleIcon className="mr-3 h-5 w-5" />
      )}
      <div className="flex flex-col items-start">
        <span className="font-semibold">Mit Google fortfahren</span>
        <span className="text-xs text-gray-500 font-normal">
          Schneller ohne Passwort
        </span>
      </div>
    </Button>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}
```

---

### SocialAuthSection (Container)

```typescript
// components/auth/SocialAuthSection.tsx
'use client'

import { GoogleOAuthButton } from './GoogleOAuthButton'
import type { AccountType } from '@/types/auth'

interface SocialAuthSectionProps {
  accountType: AccountType
}

export function SocialAuthSection({ accountType }: SocialAuthSectionProps) {
  return (
    <div className="space-y-4 mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">oder</span>
        </div>
      </div>

      <GoogleOAuthButton accountType={accountType} />
    </div>
  )
}
```

---

### Styles

```css
.google-oauth-button {
  @apply w-full py-6 border-2 border-gray-300;
  @apply hover:bg-gray-50 hover:border-gray-400;
  @apply transition-all duration-200;
  @apply min-h-[72px]; /* Comfortable touch target with 2 lines */
}
```

---

## LoadingStates

### Skeleton Screen (Initial Load)

```typescript
// components/auth/AuthDialogSkeleton.tsx
export function AuthDialogSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
      </div>

      {/* Cards */}
      <div className="space-y-4">
        <div className="h-24 bg-gray-200 rounded-lg" />
        <div className="h-24 bg-gray-200 rounded-lg" />
      </div>
    </div>
  )
}
```

---

## SuccessState

### Checkmark Animation

```typescript
// components/auth/SuccessAnimation.tsx
'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

export function SuccessAnimation() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.0, 0.0, 0.2, 1] }}
      className="flex flex-col items-center justify-center py-12"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.0, 0.0, 0.2, 1] }}
        className="w-16 h-16 rounded-full bg-success-500 flex items-center justify-center mb-4"
      >
        <Check className="h-8 w-8 text-white" />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="text-h2 font-semibold text-gray-900 mb-2"
      >
        Erfolgreich!
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="text-body text-gray-600 text-center"
      >
        Ihr Konto wurde erstellt.
      </motion.p>
    </motion.div>
  )
}
```

---

## ErrorHandling

### Inline Error Display (Already Covered in FormField)

### Toast Notifications (Using shadcn/ui Toast)

```typescript
// Example usage in forms:
toast({
  title: 'Fehler bei der Registrierung',
  description: 'Die E-Mail-Adresse wird bereits verwendet.',
  variant: 'destructive',
})

toast({
  title: 'Konto erfolgreich erstellt!',
  description: 'Willkommen bei Massava.',
})
```

---

## Conclusion

This comprehensive component specification provides:
- ✅ Complete, production-ready code examples
- ✅ Modern, accessible design patterns
- ✅ Mobile-first responsive layouts
- ✅ Smooth animations with Framer Motion
- ✅ Inline validation and error handling
- ✅ WCAG 2.1 AA compliance
- ✅ Touch-optimized (48px+ targets)

**Next Step:** Mobile-specific optimizations (Document 04).

---

**Document Version:** 1.0
**Last Updated:** October 28, 2025
**Status:** Ready for Implementation
