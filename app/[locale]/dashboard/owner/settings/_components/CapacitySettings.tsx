/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Capacity Settings Component
 * Allows studio owners to update their treatment room capacity
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { updateStudioCapacity } from '@/app/actions/studio/capacityActions';
import { Minus, Plus, Info, Check } from 'lucide-react';

interface CapacitySettingsProps {
  studioId: string;
  initialCapacity: number;
}

export function CapacitySettings({ studioId, initialCapacity }: CapacitySettingsProps): React.JSX.Element {
  const [capacity, setCapacity] = useState(initialCapacity);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const handleIncrement = (): void => {
    if (capacity < 10) {
      setCapacity(capacity + 1);
      setShowSuccess(false);
    }
  };

  const handleDecrement = (): void => {
    if (capacity > 1) {
      setCapacity(capacity - 1);
      setShowSuccess(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);

    try {
      const result = await updateStudioCapacity({
        studioId,
        capacity,
      });

      if (result.success) {
        setShowSuccess(true);
        toast({
          title: 'Gespeichert!',
          description: 'Kapazität wurde erfolgreich aktualisiert.',
        });

        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      } else {
        toast({
          title: 'Fehler',
          description: result.error || 'Speichern fehlgeschlagen',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = capacity !== initialCapacity;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <span className="text-2xl">🛏️</span>
          </div>
          <div>
            <CardTitle>Behandlungsräume</CardTitle>
            <CardDescription>
              Wie viele Behandlungen können gleichzeitig stattfinden?
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Capacity Selector */}
        <div className="space-y-4">
          <Label className="text-base font-medium">
            Anzahl der Liegen/Räume
          </Label>

          <div className="flex items-center justify-center gap-6 py-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              disabled={capacity <= 1 || isSaving}
              className="h-14 w-14 rounded-full border-2 hover:border-[#B56550] hover:bg-[#B56550]/5 transition-all disabled:opacity-50"
            >
              <Minus className="h-5 w-5" />
            </Button>

            <div className="flex items-center justify-center h-20 w-20 text-4xl font-bold border-4 border-[#B56550] rounded-2xl bg-[#B56550]/5 transition-all">
              {capacity}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              disabled={capacity >= 10 || isSaving}
              className="h-14 w-14 rounded-full border-2 hover:border-[#B56550] hover:bg-[#B56550]/5 transition-all disabled:opacity-50"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Wähle zwischen 1 und 10 Räumen
          </p>
        </div>

        {/* Info Alert */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-gray-700">
            <strong>Beispiel:</strong> Mit {capacity} {capacity === 1 ? 'Raum' : 'Räumen'} kannst
            du bis zu {capacity} {capacity === 1 ? 'Behandlung' : 'Behandlungen'} zur gleichen Zeit
            durchführen.
            {capacity > 1 && ' Du wirst gewarnt, wenn ein Zeitslot voll ist.'}
          </AlertDescription>
        </Alert>

        {/* Success Message */}
        {showSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 font-medium">
              Kapazität erfolgreich aktualisiert!
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            style={{ backgroundColor: hasChanges && !isSaving ? '#B56550' : undefined }}
            className="flex-1 text-white hover:opacity-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Wird gespeichert...' : hasChanges ? 'Änderungen speichern' : 'Gespeichert'}
          </Button>

          {hasChanges && (
            <Button
              variant="outline"
              onClick={() => {
                setCapacity(initialCapacity);
                setShowSuccess(false);
              }}
              disabled={isSaving}
              className="hover:bg-gray-100"
            >
              Abbrechen
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
