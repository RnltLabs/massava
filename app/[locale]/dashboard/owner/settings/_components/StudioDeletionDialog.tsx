/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Studio Deletion Dialog
 * Multi-step confirmation dialog for studio deletion
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { deleteStudio } from '@/app/actions/studio/deleteStudio';

interface StudioDeletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studioId: string;
  studioName: string;
  locale: string;
}

type Step = 'confirm' | 'password' | 'final' | 'deleting';

export function StudioDeletionDialog({
  open,
  onOpenChange,
  studioId,
  studioName,
  locale,
}: StudioDeletionDialogProps): React.JSX.Element {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 640px)');
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('confirm');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Reset state on close
  const handleClose = (): void => {
    setStep('confirm');
    setPassword('');
    setPasswordError('');
    onOpenChange(false);
  };

  // Step 1 → Step 2
  const handleContinue = (): void => {
    setStep('password');
  };

  // Step 2 → Step 3 (verify password and proceed)
  const handlePasswordSubmit = (): void => {
    setPasswordError('');

    if (!password || password.length === 0) {
      setPasswordError('Bitte geben Sie Ihr Passwort ein');
      return;
    }

    // Move to final confirmation (actual verification happens on deletion)
    setStep('final');
  };

  // Step 3 → Delete
  const handleFinalDelete = async (): Promise<void> => {
    setStep('deleting');

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
        handleClose();
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
          setStep('password');
        } else {
          // For other errors, go back to confirm step
          setStep('confirm');
        }
      }
    } catch (error) {
      console.error('[StudioDeletionDialog] Error:', error);
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten',
        variant: 'destructive',
      });
      setStep('confirm');
    }
  };

  // Render step content
  const renderStepContent = (): React.JSX.Element => {
    switch (step) {
      case 'confirm':
        return (
          <ConfirmStep
            studioName={studioName}
            onContinue={handleContinue}
            onCancel={handleClose}
            isMobile={isMobile}
          />
        );
      case 'password':
        return (
          <PasswordStep
            password={password}
            setPassword={setPassword}
            passwordError={passwordError}
            setPasswordError={setPasswordError}
            onSubmit={handlePasswordSubmit}
            onCancel={handleClose}
            isMobile={isMobile}
          />
        );
      case 'final':
        return (
          <FinalStep
            studioName={studioName}
            onDelete={handleFinalDelete}
            onCancel={handleClose}
            isMobile={isMobile}
          />
        );
      case 'deleting':
        return <DeletingStep />;
    }
  };

  // Mobile: Sheet (bottom drawer)
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="px-4 pb-8">
          {renderStepContent()}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Dialog (centered modal)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">{renderStepContent()}</DialogContent>
    </Dialog>
  );
}

/* ========== STEP 1: CONFIRM DELETION ========== */
interface ConfirmStepProps {
  studioName: string;
  onContinue: () => void;
  onCancel: () => void;
  isMobile: boolean;
}

function ConfirmStep({ studioName, onContinue, onCancel, isMobile }: ConfirmStepProps): React.JSX.Element {
  const Header = isMobile ? SheetHeader : DialogHeader;
  const Title = isMobile ? SheetTitle : DialogTitle;
  const Description = isMobile ? SheetDescription : DialogDescription;
  const Footer = isMobile ? SheetFooter : DialogFooter;

  return (
    <>
      <Header>
        <Title className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Studio löschen?
        </Title>
        <Description className="text-base pt-4">
          Folgendes wird dauerhaft gelöscht:
        </Description>
      </Header>

      <div className="space-y-3 py-4">
        <div className="flex items-start gap-2">
          <Check className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm">Ihr Studio-Profil</p>
        </div>
        <div className="flex items-start gap-2">
          <Check className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm">Alle Dienstleistungen und Preise</p>
        </div>
        <div className="flex items-start gap-2">
          <Check className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm">Alle Fotos und Bilder</p>
        </div>
        <div className="flex items-start gap-2">
          <Check className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm">Alle Buchungen und Terminhistorie</p>
        </div>
        <div className="flex items-start gap-2">
          <Check className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm">Kundenbewertungen</p>
        </div>
      </div>

      <div className="border-t pt-4 bg-muted/50 rounded-lg p-3">
        <p className="text-sm text-muted-foreground">
          <strong>Hinweis:</strong> Ihr Benutzerkonto bleibt aktiv. Sie können
          später ein neues Studio erstellen, wenn Sie möchten.
        </p>
      </div>

      <Footer className="gap-2 sm:gap-0 flex-col sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto min-h-[48px]"
        >
          Abbrechen
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onContinue}
          className="w-full sm:w-auto min-h-[48px]"
        >
          Weiter
        </Button>
      </Footer>
    </>
  );
}

/* ========== STEP 2: PASSWORD VERIFICATION ========== */
interface PasswordStepProps {
  password: string;
  setPassword: (password: string) => void;
  passwordError: string;
  setPasswordError: (error: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isMobile: boolean;
}

function PasswordStep({
  password,
  setPassword,
  passwordError,
  setPasswordError,
  onSubmit,
  onCancel,
  isMobile,
}: PasswordStepProps): React.JSX.Element {
  const Header = isMobile ? SheetHeader : DialogHeader;
  const Title = isMobile ? SheetTitle : DialogTitle;
  const Description = isMobile ? SheetDescription : DialogDescription;
  const Footer = isMobile ? SheetFooter : DialogFooter;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && password.length > 0) {
      onSubmit();
    }
  };

  return (
    <>
      <Header>
        <Title>Passwort zur Bestätigung eingeben</Title>
        <Description className="text-base">
          Zum Schutz Ihres Studios geben Sie bitte Ihr Passwort ein:
        </Description>
      </Header>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-base">
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
            className={`min-h-[48px] text-base ${passwordError ? 'border-destructive' : ''}`}
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

        <a
          href={`/${window.location.pathname.split('/')[1]}/auth/reset-password`}
          className="text-sm text-primary hover:underline inline-block"
          target="_blank"
          rel="noopener noreferrer"
        >
          Passwort vergessen?
        </a>
      </div>

      <Footer className="gap-2 sm:gap-0 flex-col sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto min-h-[48px]"
        >
          Abbrechen
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onSubmit}
          disabled={!password || password.length === 0}
          className="w-full sm:w-auto min-h-[48px]"
        >
          Studio löschen
        </Button>
      </Footer>
    </>
  );
}

/* ========== STEP 3: FINAL CONFIRMATION ========== */
interface FinalStepProps {
  studioName: string;
  onDelete: () => void;
  onCancel: () => void;
  isMobile: boolean;
}

function FinalStep({ studioName, onDelete, onCancel, isMobile }: FinalStepProps): React.JSX.Element {
  const Header = isMobile ? SheetHeader : DialogHeader;
  const Title = isMobile ? SheetTitle : DialogTitle;
  const Description = isMobile ? SheetDescription : DialogDescription;
  const Footer = isMobile ? SheetFooter : DialogFooter;

  return (
    <>
      <Header>
        <Title className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Sind Sie absolut sicher?
        </Title>
        <Description className="text-base pt-4">
          Dies ist der letzte Schritt. Danach wird Ihr Studio{' '}
          <span className="font-semibold text-foreground">"{studioName}"</span> endgültig
          gelöscht.
        </Description>
      </Header>

      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 my-4">
        <p className="text-sm font-medium text-destructive flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>Diese Aktion kann nicht rückgängig gemacht werden.</span>
        </p>
      </div>

      <Footer className="gap-2 sm:gap-0 flex-col sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto min-h-[48px]"
        >
          Abbrechen
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          className="w-full sm:w-auto min-h-[48px]"
        >
          Ja, endgültig löschen
        </Button>
      </Footer>
    </>
  );
}

/* ========== STEP 4: DELETING (LOADING STATE) ========== */
function DeletingStep(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      <div className="text-center space-y-2">
        <p className="text-base font-medium">Ihr Studio wird gelöscht...</p>
        <p className="text-sm text-muted-foreground">Bitte warten Sie.</p>
      </div>
    </div>
  );
}
