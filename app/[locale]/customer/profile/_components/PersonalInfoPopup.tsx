/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Customer Personal Info Popup (Read-Only)
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useMediaQuery } from '@/hooks/use-media-query';
import { X, InfoIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PersonalInfoPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string | null;
  email: string;
}

export function PersonalInfoPopup({
  open,
  onOpenChange,
  name,
  email,
}: PersonalInfoPopupProps): React.JSX.Element {
  const isMobile = useMediaQuery('(max-width: 767px)');

  const content = (
    <>
      {/* Custom Header for Mobile */}
      {isMobile && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Persönliche Informationen</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="space-y-4">
        {/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            Name und E-Mail-Adresse können derzeit nicht geändert werden.
            Kontaktiere uns bei Änderungswünschen.
          </AlertDescription>
        </Alert>

        {/* Name Field (Read-Only) */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Name
          </Label>
          <Input
            id="name"
            type="text"
            value={name || 'Nicht gesetzt'}
            disabled
            readOnly
            className="bg-gray-50 cursor-not-allowed"
          />
        </div>

        {/* Email Field (Read-Only) */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            E-Mail-Adresse
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            disabled
            readOnly
            className="bg-gray-50 cursor-not-allowed"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="flex-1"
        >
          Schließen
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
          className="h-[80vh] rounded-t-3xl p-6 overflow-y-auto"
          showCloseButton={false}
        >
          <VisuallyHidden>
            <SheetTitle>Persönliche Informationen</SheetTitle>
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
          <DialogTitle>Persönliche Informationen</DialogTitle>
        </VisuallyHidden>
        {content}
      </DialogContent>
    </Dialog>
  );
}
