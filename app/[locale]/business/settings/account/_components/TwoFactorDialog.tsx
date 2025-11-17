/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useState, useEffect } from 'react';
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
import { enable2FA, verify2FA, disable2FA } from '@/app/[locale]/business/actions/account';
import { Loader2Icon, SmartphoneIcon, QrCodeIcon, KeyIcon } from 'lucide-react';
import Image from 'next/image';

interface TwoFactorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEnabled: boolean;
}

export function TwoFactorDialog({
  open,
  onOpenChange,
  isEnabled,
}: TwoFactorDialogProps): React.JSX.Element {
  const [step, setStep] = useState<'intro' | 'qr' | 'verify' | 'disable'>(
    isEnabled ? 'disable' : 'intro'
  );
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setStep(isEnabled ? 'disable' : 'intro');
      setVerificationCode('');
    }
  }, [open, isEnabled]);

  const handleEnable = async () => {
    setIsLoading(true);

    const result = await enable2FA();

    if (result.success && result.data) {
      const data = result.data as { qrCode: string; secret: string };
      setQrCodeUrl(data.qrCode);
      setSecret(data.secret);
      setStep('qr');
    } else {
      toast({
        title: 'Fehler',
        description: (result as { error: string }).error,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  const handleVerify = async () => {
    if (!secret) return;

    setIsLoading(true);

    const result = await verify2FA({
      code: verificationCode,
      secret,
    });

    if (result.success) {
      toast({
        title: '2FA aktiviert',
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

  const handleDisable = async () => {
    setIsLoading(true);

    const result = await disable2FA({
      code: verificationCode,
    });

    if (result.success) {
      toast({
        title: '2FA deaktiviert',
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
    setStep(isEnabled ? 'disable' : 'intro');
    setQrCodeUrl(null);
    setSecret(null);
    setVerificationCode('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEnabled ? '2FA deaktivieren' : '2FA aktivieren'}
          </DialogTitle>
          <DialogDescription>
            {step === 'intro' &&
              'Schützen Sie Ihr Konto mit Zwei-Faktor-Authentifizierung'}
            {step === 'qr' && 'Scannen Sie den QR-Code mit Ihrer Authenticator-App'}
            {step === 'verify' && 'Geben Sie den 6-stelligen Code aus Ihrer App ein'}
            {step === 'disable' &&
              'Geben Sie den Code aus Ihrer Authenticator-App ein'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Introduction */}
        {step === 'intro' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <SmartphoneIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Authenticator-App erforderlich
                </h4>
                <p className="text-sm text-blue-700">
                  Sie benötigen eine Authenticator-App wie Google Authenticator,
                  Microsoft Authenticator oder Authy.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">So funktioniert es:</h4>
              <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-600">
                <li>Laden Sie eine Authenticator-App herunter</li>
                <li>Scannen Sie den QR-Code mit der App</li>
                <li>Geben Sie den 6-stelligen Code ein</li>
                <li>Fertig! Ihr Account ist jetzt geschützt</li>
              </ol>
            </div>
          </div>
        )}

        {/* Step 2: QR Code */}
        {step === 'qr' && qrCodeUrl && secret && (
          <div className="space-y-4">
            <div className="flex justify-center py-4">
              <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                <Image
                  src={qrCodeUrl}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="w-48 h-48"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <KeyIcon className="h-4 w-4" />
                <span>Manuelle Eingabe:</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <code className="text-xs font-mono text-gray-800 break-all">
                  {secret}
                </code>
              </div>
              <p className="text-xs text-gray-500">
                Falls Sie den QR-Code nicht scannen können, geben Sie diesen Code
                manuell in Ihrer App ein.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Verify or Disable */}
        {(step === 'verify' || step === 'disable') && (
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
                className="text-center text-lg tracking-widest font-mono"
              />
              <p className="text-sm text-gray-500 mt-1">
                Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein
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

          {step === 'intro' && (
            <Button
              onClick={handleEnable}
              disabled={isLoading}
              className="bg-[#B56550] hover:bg-[#A05540] text-white"
            >
              {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Weiter
            </Button>
          )}

          {step === 'qr' && (
            <Button
              onClick={() => setStep('verify')}
              className="bg-[#B56550] hover:bg-[#A05540] text-white"
            >
              <QrCodeIcon className="mr-2 h-4 w-4" />
              Code gescannt
            </Button>
          )}

          {step === 'verify' && (
            <Button
              onClick={handleVerify}
              disabled={isLoading || verificationCode.length !== 6}
              className="bg-[#B56550] hover:bg-[#A05540] text-white"
            >
              {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Verifizieren
            </Button>
          )}

          {step === 'disable' && (
            <Button
              onClick={handleDisable}
              disabled={isLoading || verificationCode.length !== 6}
              variant="destructive"
            >
              {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Deaktivieren
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
