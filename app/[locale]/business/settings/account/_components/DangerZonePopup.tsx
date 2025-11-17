/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { scheduleStudioDeletion } from '@/app/[locale]/business/actions/account';
import { Loader2Icon, AlertTriangleIcon } from 'lucide-react';

interface DangerZonePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studioId: string;
  studioName: string;
}

export function DangerZonePopup({
  open,
  onOpenChange,
  studioId,
  studioName,
}: DangerZonePopupProps): React.JSX.Element {
  const [step, setStep] = useState<'warning' | 'confirm'>('warning');
  const [acknowledgeConsequences, setAcknowledgeConsequences] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setStep('warning');
      setAcknowledgeConsequences(false);
      setConfirmationText('');
      setIsLoading(false);
    }
  }, [open]);

  const handleFirstConfirm = () => {
    if (!acknowledgeConsequences) {
      toast({
        title: 'Bestätigung erforderlich',
        description: 'Sie müssen die Konsequenzen bestätigen',
        variant: 'destructive',
      });
      return;
    }
    setStep('confirm');
  };

  const handleFinalConfirm = async () => {
    if (confirmationText !== studioName) {
      toast({
        title: 'Bestätigung fehlgeschlagen',
        description: 'Der eingegebene Name stimmt nicht überein',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const result = await scheduleStudioDeletion({
      studioId,
      confirmationText,
      acknowledgeConsequences: true,
    });

    if (result.success) {
      toast({
        title: 'Löschung geplant',
        description: result.message,
      });
      onOpenChange(false);
    } else {
      toast({
        title: 'Fehler',
        description: result.error,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  const handleBack = () => {
    setStep('warning');
    setConfirmationText('');
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (step === 'warning') {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangleIcon className="h-5 w-5" />
              <span>Studio wirklich löschen?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 pt-4">
              <p>
                Diese Aktion wird Ihr Studio-Account unwiderruflich löschen. Folgendes
                wird passieren:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li className="text-red-600 font-medium">
                  Alle zukünftigen Buchungen werden automatisch storniert
                </li>
                <li className="text-red-600 font-medium">
                  Alle Kundendaten und Buchungshistorie gehen verloren
                </li>
                <li className="text-red-600 font-medium">
                  Ihr Studio wird nicht mehr in der Suche angezeigt
                </li>
                <li className="text-red-600 font-medium">
                  Diese Aktion kann nicht rückgängig gemacht werden
                </li>
              </ul>

              <div className="flex items-start space-x-2 pt-4 border-t border-gray-200">
                <Checkbox
                  id="acknowledge"
                  checked={acknowledgeConsequences}
                  onCheckedChange={(checked) =>
                    setAcknowledgeConsequences(checked === true)
                  }
                />
                <label
                  htmlFor="acknowledge"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Ich verstehe die Konsequenzen und möchte fortfahren
                </label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFirstConfirm}
              disabled={!acknowledgeConsequences}
              className="bg-red-600 hover:bg-red-700"
            >
              Weiter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">
            Letzte Bestätigung
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-4">
            <p>
              Um die Löschung zu bestätigen, geben Sie bitte den Namen Ihres Studios
              ein:
            </p>

            <div className="space-y-2">
              <Label htmlFor="studio-name-confirm" className="text-gray-900 font-medium">
                Studio-Name: <span className="text-red-600">{studioName}</span>
              </Label>
              <Input
                id="studio-name-confirm"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={studioName}
                disabled={isLoading}
                className="font-medium"
              />
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                30-Tage Kulanzfrist
              </h4>
              <p className="text-sm text-blue-700">
                Ihr Account wird in 30 Tagen gelöscht. Sie erhalten eine
                Bestätigungs-E-Mail mit einem Link zum Abbrechen der Löschung.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isLoading}
          >
            Zurück
          </Button>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            Abbrechen
          </AlertDialogCancel>
          <Button
            onClick={handleFinalConfirm}
            disabled={isLoading || confirmationText !== studioName}
            variant="destructive"
          >
            {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Studio endgültig löschen
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
