/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Email Change Dialog Component
 * Updated to use new email change verification flow
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
import { Loader2Icon, MailIcon } from 'lucide-react';

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
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleRequestChange = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast({
        title: 'Ungültige E-Mail',
        description: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/user/change-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newEmail,
          locale: 'de',
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Bestätigungslink gesendet',
          description: 'Bitte prüfen Sie Ihre neue E-Mail-Adresse und klicken Sie auf den Bestätigungslink.',
        });
        setEmailSent(true);
      } else {
        toast({
          title: 'Fehler',
          description: result.error || 'E-Mail-Änderung fehlgeschlagen',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
      console.error('Email change error:', error);
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setNewEmail('');
    setEmailSent(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>E-Mail-Adresse ändern</DialogTitle>
          <DialogDescription>
            {!emailSent
              ? 'Geben Sie Ihre neue E-Mail-Adresse ein. Wir senden Ihnen einen Bestätigungslink.'
              : 'Bestätigungslink wurde gesendet!'}
          </DialogDescription>
        </DialogHeader>

        {!emailSent ? (
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newEmail) {
                    handleRequestChange();
                  }
                }}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Der Bestätigungslink wird an diese neue Adresse gesendet.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
              <MailIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">
                  Bestätigungslink gesendet
                </p>
                <p className="text-sm text-muted-foreground">
                  Wir haben einen Bestätigungslink an <strong>{newEmail}</strong> gesendet.
                  Bitte prüfen Sie Ihr Postfach und klicken Sie auf den Link, um Ihre E-Mail-Änderung zu bestätigen.
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-yellow-800">
                <strong>Wichtig:</strong> Der Link ist 24 Stunden gültig. Prüfen Sie auch Ihren Spam-Ordner.
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
            className="rounded-full"
          >
            {emailSent ? 'Schließen' : 'Abbrechen'}
          </Button>
          {!emailSent && (
            <Button
              onClick={handleRequestChange}
              disabled={isLoading || !newEmail}
              className="bg-[#B56550] hover:bg-[#A05540] text-white rounded-full"
            >
              {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Bestätigungslink senden
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
