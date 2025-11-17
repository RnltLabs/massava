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
import { requestEmailChange, verifyEmailChange } from '@/app/[locale]/business/actions/account';
import { Loader2Icon } from 'lucide-react';

interface EmailChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
}

export function EmailChangeDialog({
  open,
  onOpenChange,
  currentEmail,
}: EmailChangeDialogProps): React.JSX.Element {
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [newEmail, setNewEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRequestChange = async () => {
    setIsLoading(true);

    const result = await requestEmailChange({ newEmail });

    if (result.success) {
      toast({
        title: 'Bestätigungscode gesendet',
        description: result.message,
      });
      setStep('verify');
    } else {
      toast({
        title: 'Fehler',
        description: result.error,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  const handleVerify = async () => {
    setIsLoading(true);

    const result = await verifyEmailChange({
      code: verificationCode,
      newEmail,
    });

    if (result.success) {
      toast({
        title: 'E-Mail geändert',
        description: result.message,
      });
      onOpenChange(false);
      setStep('email');
      setNewEmail('');
      setVerificationCode('');
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
    setStep('email');
    setNewEmail('');
    setVerificationCode('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>E-Mail-Adresse ändern</DialogTitle>
          <DialogDescription>
            {step === 'email'
              ? 'Wir senden einen Bestätigungscode an Ihre aktuelle E-Mail.'
              : 'Geben Sie den 6-stelligen Code ein, den wir an Ihre aktuelle E-Mail gesendet haben.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'email' ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-email">Aktuelle E-Mail</Label>
              <Input
                id="current-email"
                value={currentEmail}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="new-email">Neue E-Mail-Adresse</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="neue@email.de"
                disabled={isLoading}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="verification-code">Bestätigungscode</Label>
              <Input
                id="verification-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500 mt-1">
                Code an {currentEmail} gesendet
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Abbrechen
          </Button>
          {step === 'email' ? (
            <Button
              onClick={handleRequestChange}
              disabled={isLoading || !newEmail}
              className="bg-[#B56550] hover:bg-[#A05540] text-white"
            >
              {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Code senden
            </Button>
          ) : (
            <Button
              onClick={handleVerify}
              disabled={isLoading || verificationCode.length !== 6}
              className="bg-[#B56550] hover:bg-[#A05540] text-white"
            >
              {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Verifizieren
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
