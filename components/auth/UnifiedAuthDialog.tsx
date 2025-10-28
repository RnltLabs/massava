'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { AccountTypeSelector } from './AccountTypeSelector';
import { SignUpForm } from './SignUpForm';
import { LoginForm } from './LoginForm';
import { GoogleOAuthButton } from './GoogleOAuthButton';
import { cn } from '@/lib/utils';
import { signUp, signIn, signInWithGoogle } from '@/app/actions/auth';

type AuthMode = 'signup' | 'login';
type AuthStep = 'account-type' | 'email-choice' | 'email-form';
type AccountType = 'customer' | 'studio';

interface UnifiedAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onSuccess?: () => void;
}

interface SignUpFormData {
  email: string;
  password: string;
  passwordConfirm: string;
  firstName: string;
  lastName: string;
  termsAccepted: boolean;
}

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export function UnifiedAuthDialog({
  isOpen,
  onClose,
  initialMode = 'signup',
  onSuccess,
}: UnifiedAuthDialogProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<AuthStep>('account-type');
  const [accountType, setAccountType] = useState<AccountType>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = (): void => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset to initial state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      // Both signup AND login start with account-type selection
      setStep('account-type');
      setAccountType('customer');
      setIsLoading(false);
    }
  }, [isOpen, initialMode]);

  // Step navigation
  const handleAccountTypeSelected = (type: AccountType): void => {
    setAccountType(type);
    setStep('email-choice');
  };

  const handleEmailMethodSelected = (): void => {
    setStep('email-form');
  };

  const goBack = (): void => {
    if (step === 'email-form') {
      setStep('email-choice');
    } else if (step === 'email-choice') {
      setStep('account-type');
    } else {
      onClose();
    }
  };

  // Auth handlers
  const handleSignUp = async (data: SignUpFormData): Promise<void> => {
    console.log('🔵 [CLIENT] handleSignUp called with data:', {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      accountType,
      termsAccepted: data.termsAccepted,
    });

    setIsLoading(true);
    try {
      console.log('🔵 [CLIENT] Calling signUp server action...');
      const result = await signUp({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: data.password,
        phone: undefined,
        terms: true,
        accountType,
      }, 'de');

      console.log('🔵 [CLIENT] signUp result:', result);

      if (result.success) {
        console.log('✅ [CLIENT] Signup successful! Email verification sent to:', result.data?.email);
        // Success! Email verification sent
        onSuccess?.();
        // Don't close - show success message in form
      } else {
        console.error('❌ [CLIENT] Signup error:', result.error, result.errors);
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ [CLIENT] Signup exception:', error);
      throw error; // Let form handle error display
    } finally {
      setIsLoading(false);
      console.log('🔵 [CLIENT] handleSignUp completed');
    }
  };

  const handleLogin = async (data: LoginFormData): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await signIn({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
        accountType,
      });

      if (result.success) {
        // Use window.location.href for hard redirect
        const redirectUrl = result.data?.redirectUrl || '/';
        window.location.href = `/de${redirectUrl}`;
      } else {
        console.error('Login error:', result.error, result.errors);
        throw new Error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Let form handle error display
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await signInWithGoogle('/');
    } catch (error) {
      console.error('Google auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mode toggle
  const toggleMode = (): void => {
    const newMode = mode === 'signup' ? 'login' : 'signup';
    setMode(newMode);
    // Reset to appropriate starting step
    setStep(newMode === 'signup' ? 'account-type' : 'email-choice');
  };

  // Content to render - Modern .io-style
  const renderContent = () => {
    return (
      <div className="relative">
        {/* Back Button - Only show when not on first step */}
        {step !== 'account-type' && (
          <button
            onClick={goBack}
            disabled={isLoading}
            className="absolute left-0 top-0 p-2 -m-2 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50 z-10"
            aria-label="Zurück"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Account Type Selection (Both Signup AND Login) */}
            {step === 'account-type' && (
              <motion.div
                key="account-type"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <AccountTypeSelector
                  selectedType={accountType}
                  onTypeSelect={handleAccountTypeSelected}
                  mode={mode}
                />
              </motion.div>
            )}

            {/* Step 2: Email Method Choice (Google or Email) */}
            {step === 'email-choice' && (
              <motion.div
                key="email-choice"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="text-center space-y-3">
                  <h2 className="text-3xl font-bold text-gray-900">
                    {mode === 'signup' ? 'Konto erstellen' : 'Willkommen zurück'}
                  </h2>
                  <p className="text-base text-gray-600">
                    {mode === 'signup'
                      ? `Als ${accountType === 'customer' ? 'Kunde' : 'Studio-Inhaber'} registrieren`
                      : 'Melden Sie sich an, um fortzufahren'
                    }
                  </p>
                </div>

                {/* Google OAuth Button */}
                <GoogleOAuthButton
                  mode={mode}
                  onAuth={handleGoogleAuth}
                  isLoading={isLoading}
                  disabled={isLoading}
                />

                {/* Email Button */}
                <button
                  onClick={handleEmailMethodSelected}
                  disabled={isLoading}
                  className={cn(
                    'w-full h-12 px-6 rounded-xl border-2 border-gray-300',
                    'bg-white hover:bg-gray-50 hover:border-gray-400',
                    'text-gray-900 font-medium transition-all',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'flex items-center justify-center gap-3'
                  )}
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{mode === 'signup' ? 'Mit E-Mail registrieren' : 'Mit E-Mail anmelden'}</span>
                </button>

                {/* Toggle Mode Link */}
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600">
                    {mode === 'signup' ? (
                      <>
                        Bereits ein Konto?{' '}
                        <button
                          onClick={toggleMode}
                          disabled={isLoading}
                          className="text-sage-700 hover:text-sage-800 font-semibold transition-colors disabled:opacity-50"
                        >
                          Anmelden
                        </button>
                      </>
                    ) : (
                      <>
                        Noch kein Konto?{' '}
                        <button
                          onClick={toggleMode}
                          disabled={isLoading}
                          className="text-sage-700 hover:text-sage-800 font-semibold transition-colors disabled:opacity-50"
                        >
                          Registrieren
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Email Form */}
            {step === 'email-form' && (
              <motion.div
                key="email-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-4"
              >
                {/* Header - Compact */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {mode === 'signup' ? 'Konto erstellen' : 'Anmelden'}
                  </h2>
                </div>

                {/* Form */}
                {mode === 'signup' ? (
                  <SignUpForm
                    accountType={accountType}
                    onSubmit={handleSignUp}
                    isLoading={isLoading}
                    onSwitchToLogin={() => setMode('login')}
                  />
                ) : (
                  <LoginForm
                    accountType={accountType}
                    onSubmit={handleLogin}
                    isLoading={isLoading}
                    onSwitchToSignup={() => setMode('signup')}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  // Mobile: Sheet, Desktop: Dialog
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="h-[95vh] rounded-t-3xl p-0 border-t-2 border-gray-200 bg-white"
          showCloseButton={false}
        >
          {/* Accessibility: Hidden title for screen readers */}
          <SheetTitle className="sr-only">
            {mode === 'signup' ? 'Konto erstellen' : 'Anmelden'}
          </SheetTitle>

          {/* Single Close Button */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              'absolute right-6 top-6 z-20',
              'rounded-full p-2 bg-white hover:bg-gray-100',
              'transition-colors disabled:opacity-50',
              'shadow-sm border border-gray-200'
            )}
            aria-label="Schließen"
          >
            <X className="h-5 w-5 text-gray-700" />
          </button>

          {/* Content */}
          <div className="overflow-y-auto h-full px-6 py-8 pt-16">
            {renderContent()}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[500px] p-0 gap-0 bg-white border-0 shadow-2xl"
        showCloseButton={false}
      >
        {/* Accessibility: Hidden title for screen readers */}
        <DialogTitle className="sr-only">
          {mode === 'signup' ? 'Konto erstellen' : 'Anmelden'}
        </DialogTitle>

        {/* Single Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className={cn(
            'absolute right-6 top-6 z-20',
            'rounded-full p-2 bg-white hover:bg-gray-100',
            'transition-colors disabled:opacity-50',
            'border border-gray-200'
          )}
          aria-label="Schließen"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>

        {/* Content */}
        <div className="p-6 pt-12 max-h-[90vh] overflow-y-auto">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
