/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Customer Password Change Popup
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useMediaQuery } from '@/hooks/use-media-query';
import { customerPasswordSchema } from '@/lib/schemas/customer.schema';
import { cn } from '@/lib/utils';
import { updateCustomerPassword } from '@/app/[locale]/customer/actions/profile';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, X, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PasswordChangePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PasswordChangePopup({
  open,
  onOpenChange,
}: PasswordChangePopupProps): React.JSX.Element {
  const { toast } = useToast();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password requirements validation
  const requirements = {
    minLength: newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasLowerCase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
    passwordsMatch:
      newPassword.length > 0 &&
      confirmPassword.length > 0 &&
      newPassword === confirmPassword,
  };

  const allRequirementsMet =
    requirements.minLength &&
    requirements.hasUpperCase &&
    requirements.hasLowerCase &&
    requirements.hasNumber &&
    requirements.hasSpecial &&
    requirements.passwordsMatch &&
    currentPassword.length >= 8;

  // Handle save
  const handleSave = async (): Promise<void> => {
    try {
      const validated = customerPasswordSchema.parse({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setIsSubmitting(true);

      // Call server action
      const result = await updateCustomerPassword(validated);

      if (result.success) {
        toast({
          title: 'Erfolgreich',
          description: 'Passwort wurde geändert.',
        });
        // Reset form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onOpenChange(false);
        router.refresh();
      } else {
        toast({
          title: 'Fehler',
          description: result.error || 'Passwort konnte nicht geändert werden.',
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      toast({
        title: 'Fehler',
        description: 'Bitte überprüfe alle Anforderungen.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMobile = useMediaQuery('(max-width: 767px)');

  const content = (
    <>
      {/* Custom Header for Mobile */}
      {isMobile && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Passwort ändern</h2>
          <button
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="space-y-4">
        {/* Current Password */}
        <div className="space-y-2">
          <Label htmlFor="currentPassword" className="text-sm font-medium">
            Aktuelles Passwort
          </Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isSubmitting}
              placeholder="••••••••"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={
                showCurrentPassword ? 'Passwort verbergen' : 'Passwort anzeigen'
              }
            >
              {showCurrentPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-sm font-medium">
            Neues Passwort
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSubmitting}
              placeholder="••••••••"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={
                showNewPassword ? 'Passwort verbergen' : 'Passwort anzeigen'
              }
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            Passwort bestätigen
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              placeholder="••••••••"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={
                showConfirmPassword ? 'Passwort verbergen' : 'Passwort anzeigen'
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Password Requirements */}
        {newPassword.length > 0 && (
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Passwort-Anforderungen:
            </p>
            <div className="space-y-1">
              <RequirementItem
                met={requirements.minLength}
                text="Mindestens 8 Zeichen"
              />
              <RequirementItem
                met={requirements.hasUpperCase}
                text="Mindestens ein Großbuchstabe"
              />
              <RequirementItem
                met={requirements.hasLowerCase}
                text="Mindestens ein Kleinbuchstabe"
              />
              <RequirementItem
                met={requirements.hasNumber}
                text="Mindestens eine Zahl"
              />
              <RequirementItem
                met={requirements.hasSpecial}
                text="Mindestens ein Sonderzeichen"
              />
              {confirmPassword.length > 0 && (
                <RequirementItem
                  met={requirements.passwordsMatch}
                  text="Passwörter stimmen überein"
                />
              )}
            </div>
          </div>
        )}
      </div>

      <div
        className={cn(
          'flex gap-2 mt-6',
          isMobile ? 'sticky bottom-0 bg-[#F4EDE8] py-4 border-t -mx-6 px-6' : ''
        )}
      >
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
          className="flex-1"
        >
          Abbrechen
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!allRequirementsMet || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Speichern...
            </>
          ) : (
            'Passwort ändern'
          )}
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          style={{ backgroundColor: '#F4EDE8' }}
          className="h-[90vh] rounded-t-3xl p-6 overflow-y-auto"
          showCloseButton={false}
        >
          <VisuallyHidden>
            <SheetTitle>Passwort ändern</SheetTitle>
          </VisuallyHidden>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ backgroundColor: '#F4EDE8' }}
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Passwort ändern</DialogTitle>
        </VisuallyHidden>
        {content}
      </DialogContent>
    </Dialog>
  );
}

// Helper component for password requirements
function RequirementItem({
  met,
  text,
}: {
  met: boolean;
  text: string;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
      )}
      <span className={cn(met ? 'text-green-700' : 'text-gray-600')}>
        {text}
      </span>
    </div>
  );
}
