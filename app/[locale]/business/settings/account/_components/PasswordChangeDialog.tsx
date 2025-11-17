/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { changePassword } from '@/app/[locale]/business/actions/account';
import { Loader2Icon, CheckCircle2Icon, XCircleIcon } from 'lucide-react';

interface PasswordChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PasswordChangeDialog({
  open,
  onOpenChange,
}: PasswordChangeDialogProps): React.JSX.Element {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const passwordRequirements = [
    { label: 'Mindestens 8 Zeichen', met: newPassword.length >= 8 },
    { label: 'Mindestens ein Großbuchstabe', met: /[A-Z]/.test(newPassword) },
    { label: 'Mindestens ein Kleinbuchstabe', met: /[a-z]/.test(newPassword) },
    { label: 'Mindestens eine Zahl', met: /[0-9]/.test(newPassword) },
    {
      label: 'Mindestens ein Sonderzeichen',
      met: /[^A-Za-z0-9]/.test(newPassword),
    },
  ];

  const allRequirementsMet = passwordRequirements.every((req) => req.met);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';

  const getPasswordStrength = (): 'weak' | 'medium' | 'strong' => {
    const metCount = passwordRequirements.filter((req) => req.met).length;
    if (metCount <= 2) return 'weak';
    if (metCount <= 4) return 'medium';
    return 'strong';
  };

  const strength = newPassword ? getPasswordStrength() : null;

  const handleSubmit = async () => {
    if (!allRequirementsMet || !passwordsMatch) return;

    setIsLoading(true);

    const result = await changePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (result.success) {
      toast({
        title: 'Passwort geändert',
        description: result.message,
      });
      handleClose();
    } else {
      toast({
        title: 'Fehler',
        description: result.error,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Passwort ändern</DialogTitle>
          <DialogDescription>
            Wählen Sie ein sicheres Passwort für Ihr Konto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="current-password">Aktuelles Passwort</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="new-password">Neues Passwort</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
            />
            {strength && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      strength === 'weak'
                        ? 'w-1/3 bg-red-500'
                        : strength === 'medium'
                        ? 'w-2/3 bg-yellow-500'
                        : 'w-full bg-green-500'
                    }`}
                  />
                </div>
                <span
                  className={`text-xs font-medium ${
                    strength === 'weak'
                      ? 'text-red-600'
                      : strength === 'medium'
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}
                >
                  {strength === 'weak'
                    ? 'Schwach'
                    : strength === 'medium'
                    ? 'Mittel'
                    : 'Stark'}
                </span>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="confirm-password">Passwort bestätigen</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
            {confirmPassword && (
              <p
                className={`text-xs mt-1 ${
                  passwordsMatch ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {passwordsMatch ? 'Passwörter stimmen überein' : 'Passwörter stimmen nicht überein'}
              </p>
            )}
          </div>

          {/* Requirements List */}
          {newPassword && (
            <div className="space-y-1 pt-2 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Anforderungen:
              </p>
              {passwordRequirements.map((req, index) => (
                <div key={index} className="flex items-center gap-2">
                  {req.met ? (
                    <CheckCircle2Icon className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-3.5 w-3.5 text-gray-300" />
                  )}
                  <span
                    className={`text-xs ${
                      req.met ? 'text-green-700' : 'text-gray-500'
                    }`}
                  >
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading || !currentPassword || !allRequirementsMet || !passwordsMatch
            }
            className="bg-[#B56550] hover:bg-[#A05540] text-white"
          >
            {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Passwort ändern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
