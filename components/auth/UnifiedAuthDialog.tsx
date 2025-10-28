'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AccountTypeSelector } from './AccountTypeSelector';
import { SignUpForm } from './SignUpForm';
import { LoginForm } from './LoginForm';
import { GoogleOAuthButton } from './GoogleOAuthButton';
import { AccountTypeToggle } from './AccountTypeToggle';
import { cn } from '@/lib/utils';
import { signUp, signIn, signInWithGoogle } from '@/app/actions/auth';

type AuthMode = 'signup' | 'login';
type AuthStep = 'type-selection' | 'form';
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
  const [step, setStep] = useState<AuthStep>('type-selection');
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
      setStep('type-selection');
      setAccountType('customer');
      setIsLoading(false);
    }
  }, [isOpen, initialMode]);

  // Step navigation
  const goToNextStep = (): void => {
    if (step === 'type-selection') {
      setStep('form');
    }
  };

  const goToPreviousStep = (): void => {
    if (step === 'form') {
      setStep('type-selection');
    }
  };

  // Auth handlers
  const handleSignUp = async (data: SignUpFormData): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await signUp({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: data.password,
        phone: undefined,
        terms: true,
        accountType,
      }, 'de');

      if (result.success) {
        // Success! Email verification sent
        onSuccess?.();
        // Don't close - show success message in form
      } else {
        // Show error in form
        console.error('Signup error:', result.error, result.errors);
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error; // Let form handle error display
    } finally {
      setIsLoading(false);
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
    setMode(mode === 'signup' ? 'login' : 'signup');
  };

  // Progress indicator
  const currentStepNumber = step === 'type-selection' ? 1 : 2;
  const totalSteps = mode === 'signup' ? 2 : 1;

  // Content to render
  const renderContent = () => {
    return (
      <div className="space-y-6">
        {/* Progress and Mode Indicators */}
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className={cn(
              'text-xs font-medium px-3 py-1',
              mode === 'signup' ? 'bg-sage-100 text-sage-800' : 'bg-blue-100 text-blue-800'
            )}
          >
            {mode === 'signup' ? 'REGISTRIERUNG' : 'ANMELDUNG'}
          </Badge>

          {mode === 'signup' && (
            <Badge variant="outline" className="text-xs font-medium px-3 py-1">
              Schritt {currentStepNumber} von {totalSteps}
            </Badge>
          )}
        </div>

        {/* Step Content with Animations */}
        <AnimatePresence mode="wait">
          {step === 'type-selection' && mode === 'signup' && (
            <motion.div
              key="type-selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <AccountTypeSelector
                selectedType={accountType}
                onTypeSelect={(type) => {
                  setAccountType(type);
                  goToNextStep();
                }}
              />
            </motion.div>
          )}

          {(step === 'form' || mode === 'login') && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Title */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {mode === 'signup' ? 'Konto erstellen' : 'Willkommen zurück'}
                </h2>
                {mode === 'login' && (
                  <p className="text-sm text-gray-600">
                    Melden Sie sich an, um fortzufahren
                  </p>
                )}
              </div>

              {/* Account Type Toggle for Login or Back Button for Signup */}
              {mode === 'login' ? (
                <div className="flex justify-center">
                  <AccountTypeToggle
                    value={accountType}
                    onChange={setAccountType}
                    translations={{
                      customer: 'Kunde',
                      studio: 'Studio-Inhaber',
                    }}
                  />
                </div>
              ) : (
                <button
                  onClick={goToPreviousStep}
                  disabled={isLoading}
                  className="text-sm text-sage-700 hover:text-sage-800 font-medium transition-colors disabled:opacity-50"
                >
                  ← Kontotyp ändern ({accountType === 'customer' ? 'Kunde' : 'Studio-Inhaber'})
                </button>
              )}

              {/* Google OAuth */}
              <GoogleOAuthButton
                mode={mode}
                onAuth={handleGoogleAuth}
                isLoading={isLoading}
                disabled={isLoading}
              />

              {/* Divider */}
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-gray-500">
                  oder
                </span>
              </div>

              {/* Form */}
              {mode === 'signup' ? (
                <SignUpForm
                  accountType={accountType}
                  onSubmit={handleSignUp}
                  isLoading={isLoading}
                />
              ) : (
                <LoginForm
                  accountType={accountType}
                  onSubmit={handleLogin}
                  isLoading={isLoading}
                />
              )}

              {/* Toggle Mode */}
              <div className="text-center text-sm text-gray-600">
                {mode === 'signup' ? (
                  <>
                    Bereits ein Konto?{' '}
                    <button
                      onClick={toggleMode}
                      disabled={isLoading}
                      className="text-sage-700 hover:text-sage-800 font-medium transition-colors disabled:opacity-50"
                    >
                      Jetzt anmelden
                    </button>
                  </>
                ) : (
                  <>
                    Noch kein Konto?{' '}
                    <button
                      onClick={toggleMode}
                      disabled={isLoading}
                      className="text-sage-700 hover:text-sage-800 font-medium transition-colors disabled:opacity-50"
                    >
                      Jetzt registrieren
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Mobile: Sheet, Desktop: Dialog
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="h-[95vh] rounded-t-3xl p-0 border-t-2 border-gray-200"
        >
          <SheetHeader className="p-6 pb-0">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute right-6 top-6 rounded-full p-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
              aria-label="Schließen"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </SheetHeader>
          <div className="overflow-y-auto h-[calc(100%-80px)] px-6 py-4">
            {renderContent()}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 border-2">
        <DialogHeader className="p-6 pb-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute right-6 top-6 rounded-full p-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label="Schließen"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DialogHeader>
        <div className="p-6 pt-4 max-h-[85vh] overflow-y-auto">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
