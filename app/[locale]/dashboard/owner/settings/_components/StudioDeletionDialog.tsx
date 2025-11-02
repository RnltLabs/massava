/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Studio Deletion Dialog
 * Companion-style multi-step dialog for studio deletion
 * Responsive: Sheet on mobile, Dialog on desktop
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { deleteStudio } from '@/app/actions/studio/deleteStudio';

interface StudioDeletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studioId: string;
  studioName: string;
  locale: string;
}

// Step titles for the header (centered title display)
const stepTitles = [
  '', // Step 0: Initial warning (no title, full warning screen)
  'Konsequenzen', // Step 1: Confirmation
  'Passwort eingeben', // Step 2: Password
  '', // Step 3: Final confirmation (no back button)
];

/**
 * Inner content component
 */
function StudioDeletionContent({
  onClose,
  studioId,
  studioName,
  locale,
}: {
  onClose: () => void;
  studioId: string;
  studioName: string;
  locale: string;
}): React.JSX.Element {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(0); // 0: confirm, 1: password, 2: final, 3: deleting
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Step 0 → Step 1
  const handleContinue = (): void => {
    setStep(1);
  };

  // Step 1 → Step 2 (verify password and proceed)
  const handlePasswordSubmit = (): void => {
    setPasswordError('');

    if (!password || password.length === 0) {
      setPasswordError('Bitte geben Sie Ihr Passwort ein');
      return;
    }

    // Move to final confirmation (actual verification happens on deletion)
    setStep(2);
  };

  // Step 2 → Delete
  const handleFinalDelete = async (): Promise<void> => {
    setStep(3); // Deleting state
    setIsDeleting(true);

    try {
      const result = await deleteStudio({
        studioId,
        password,
      });

      if (result.success) {
        toast({
          title: 'Studio gelöscht',
          description: 'Ihr Studio wurde erfolgreich gelöscht',
        });

        // Redirect to dashboard
        router.push(`/${locale}/dashboard`);
        router.refresh();

        // Close dialog
        onClose();
      } else {
        // Handle error
        toast({
          title: 'Fehler beim Löschen',
          description: result.error || 'Bitte versuchen Sie es erneut',
          variant: 'destructive',
        });

        // Go back to password step if password was wrong
        if (result.error?.includes('Passwort')) {
          setPasswordError(result.error);
          setStep(1);
        } else {
          // For other errors, go back to confirm step
          setStep(0);
        }
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('[StudioDeletionDialog] Error:', error);
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten',
        variant: 'destructive',
      });
      setStep(0);
      setIsDeleting(false);
    }
  };

  const handleBack = (): void => {
    if (!isDeleting && step > 0 && step < 3) {
      setStep(step - 1);
    }
  };

  const handleClose = (): void => {
    if (!isDeleting) {
      setStep(0);
      setPassword('');
      setPasswordError('');
      onClose();
    }
  };

  // Render step content
  const renderStepContent = (): React.JSX.Element => {
    switch (step) {
      case 0:
        return (
          <ConfirmStep
            studioName={studioName}
            onContinue={handleContinue}
            onCancel={handleClose}
          />
        );
      case 1:
        return (
          <PasswordStep
            password={password}
            setPassword={setPassword}
            passwordError={passwordError}
            setPasswordError={setPasswordError}
            onSubmit={handlePasswordSubmit}
            onCancel={handleClose}
          />
        );
      case 2:
        return (
          <FinalStep
            studioName={studioName}
            onDelete={handleFinalDelete}
            onCancel={handleClose}
          />
        );
      case 3:
        return <DeletingStep />;
      default:
        return <></>;
    }
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {/* Back Button (show on steps 1-2) */}
        {step > 0 && step < 3 && (
          <button
            onClick={handleBack}
            disabled={isDeleting}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Zurück"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        {/* Spacer */}
        {(step === 0 || step === 3) && <div className="w-9" />}

        {/* Step Title (centered, instead of progress indicator) */}
        {step > 0 && step < 3 && (
          <div className="flex-1 flex justify-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {stepTitles[step]}
            </h2>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isDeleting}
          className="p-2 -mr-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Schließen"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Main Dialog Component (with responsive wrapper)
 */
export function StudioDeletionDialog({
  open,
  onOpenChange,
  studioId,
  studioName,
  locale,
}: StudioDeletionDialogProps): React.JSX.Element {
  const isMobile = useMediaQuery('(max-width: 767px)');

  const handleClose = (): void => {
    onOpenChange(false);
  };

  const content = (
    <StudioDeletionContent
      onClose={handleClose}
      studioId={studioId}
      studioName={studioName}
      locale={locale}
    />
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[95vh] rounded-t-3xl p-0 border-t-2 border-gray-200 bg-white dark:bg-gray-900"
          showCloseButton={false}
        >
          <VisuallyHidden>
            <SheetTitle>Studio löschen</SheetTitle>
          </VisuallyHidden>
          <div className="overflow-y-auto h-full px-6 pt-4 pb-8">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px] p-0 gap-0 bg-white dark:bg-gray-900 border-0 shadow-2xl"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Studio löschen</DialogTitle>
        </VisuallyHidden>
        <div className="px-6 pt-4 pb-6 max-h-[90vh] overflow-y-auto">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ========== STEP 0: CONFIRM DELETION ========== */
interface ConfirmStepProps {
  studioName: string;
  onContinue: () => void;
  onCancel: () => void;
}

function ConfirmStep({ studioName, onContinue, onCancel }: ConfirmStepProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Studio löschen?
        </h2>
        <p className="text-base text-gray-600 dark:text-gray-400">
          Folgendes wird dauerhaft gelöscht:
        </p>
      </div>

      {/* Deletion items */}
      <div className="space-y-3 py-2">
        <div className="flex items-start gap-2">
          <Check className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-700 dark:text-gray-300">Ihr Studio-Profil</p>
        </div>
        <div className="flex items-start gap-2">
          <Check className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-700 dark:text-gray-300">Alle Dienstleistungen und Preise</p>
        </div>
        <div className="flex items-start gap-2">
          <Check className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-700 dark:text-gray-300">Alle Fotos und Bilder</p>
        </div>
        <div className="flex items-start gap-2">
          <Check className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-700 dark:text-gray-300">Alle Buchungen und Terminhistorie</p>
        </div>
        <div className="flex items-start gap-2">
          <Check className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-700 dark:text-gray-300">Kundenbewertungen</p>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-muted/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong className="text-gray-900 dark:text-gray-100">Hinweis:</strong> Ihr Benutzerkonto bleibt aktiv. Sie können
          später ein neues Studio erstellen, wenn Sie möchten.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:flex-1 min-h-[48px]"
        >
          Abbrechen
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onContinue}
          className="w-full sm:flex-1 min-h-[48px]"
        >
          Weiter
        </Button>
      </div>
    </div>
  );
}

/* ========== STEP 1: PASSWORD VERIFICATION ========== */
interface PasswordStepProps {
  password: string;
  setPassword: (password: string) => void;
  passwordError: string;
  setPasswordError: (error: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function PasswordStep({
  password,
  setPassword,
  passwordError,
  setPasswordError,
  onSubmit,
  onCancel,
}: PasswordStepProps): React.JSX.Element {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && password.length > 0) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="space-y-2">
        <p className="text-base text-gray-600 dark:text-gray-400">
          Zum Schutz Ihres Studios geben Sie bitte Ihr Passwort ein:
        </p>
      </div>

      {/* Password input */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-base font-medium">
          Passwort
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError('');
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ihr Passwort eingeben"
          className={`min-h-[48px] text-base ${passwordError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          autoFocus
          autoComplete="current-password"
        />
        {passwordError && (
          <div className="flex items-start gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{passwordError}</p>
          </div>
        )}
      </div>

      {/* Forgot password link */}
      <div>
        <a
          href={`/${window.location.pathname.split('/')[1]}/auth/reset-password`}
          className="text-sm text-primary hover:underline inline-block"
          target="_blank"
          rel="noopener noreferrer"
        >
          Passwort vergessen?
        </a>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:flex-1 min-h-[48px]"
        >
          Abbrechen
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onSubmit}
          disabled={!password || password.length === 0}
          className="w-full sm:flex-1 min-h-[48px]"
        >
          Weiter
        </Button>
      </div>
    </div>
  );
}

/* ========== STEP 2: FINAL CONFIRMATION ========== */
interface FinalStepProps {
  studioName: string;
  onDelete: () => void;
  onCancel: () => void;
}

function FinalStep({ studioName, onDelete, onCancel }: FinalStepProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold text-destructive">
          Sind Sie absolut sicher?
        </h2>
        <p className="text-base text-gray-600 dark:text-gray-400">
          Dies ist der letzte Schritt. Danach wird Ihr Studio{' '}
          <span className="font-semibold text-gray-900 dark:text-gray-100">"{studioName}"</span> endgültig
          gelöscht.
        </p>
      </div>

      {/* Warning box */}
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
        <p className="text-sm font-medium text-destructive flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>Diese Aktion kann nicht rückgängig gemacht werden.</span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:flex-1 min-h-[48px]"
        >
          Abbrechen
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          className="w-full sm:flex-1 min-h-[48px]"
        >
          Ja, endgültig löschen
        </Button>
      </div>
    </div>
  );
}

/* ========== STEP 3: DELETING (LOADING STATE) ========== */
function DeletingStep(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-gray-400 dark:text-gray-500" />
      <div className="text-center space-y-2">
        <p className="text-base font-medium text-gray-900 dark:text-gray-100">
          Ihr Studio wird gelöscht...
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Bitte warten Sie.
        </p>
      </div>
    </div>
  );
}
