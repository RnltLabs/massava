/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Block Time Dialog Component
 * Form to create blocked time periods
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { blockTime } from '../actions';
import { generateTimeOptions, parseTimeString } from '@/lib/calendar-utils';

interface BlockTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studioId: string;
  selectedDate: Date;
  prefilledTime?: string; // Pre-filled start time (e.g., "10:00")
}

const REASON_OPTIONS = [
  { value: 'Mittagspause', label: 'Mittagspause' },
  { value: 'Pause', label: 'Pause' },
  { value: 'Privat', label: 'Privat' },
  { value: 'Geschlossen', label: 'Geschlossen' },
];

export function BlockTimeDialog({
  open,
  onOpenChange,
  studioId,
  selectedDate,
  prefilledTime,
}: BlockTimeDialogProps): React.JSX.Element {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState(prefilledTime || '09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [reason, setReason] = useState<string | undefined>(undefined);

  const timeOptions = generateTimeOptions(8, 20);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create Date objects
      const start = new Date(selectedDate);
      const { hour: startHour, minute: startMinute } = parseTimeString(startTime);
      start.setHours(startHour, startMinute, 0, 0);

      const end = new Date(selectedDate);
      const { hour: endHour, minute: endMinute } = parseTimeString(endTime);
      end.setHours(endHour, endMinute, 0, 0);

      // Validate
      if (end <= start) {
        toast({
          title: 'Ungültige Zeitangabe',
          description: 'Die Endzeit muss nach der Startzeit liegen.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Call server action
      const result = await blockTime({
        studioId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        reason: reason || undefined,
        isAllDay: false,
      });

      if (result.success) {
        toast({
          title: 'Zeit blockiert',
          description: `Von ${startTime} bis ${endTime} blockiert.`,
        });
        onOpenChange(false);
        // Reset form
        setStartTime(prefilledTime || '09:00');
        setEndTime('10:00');
        setReason(undefined);
      } else {
        toast({
          title: 'Fehler',
          description: result.error || 'Zeit konnte nicht blockiert werden.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      // TODO: Replace with proper logger when available
      // logger.error('Error blocking time', { error, correlationId });
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Zeit blockieren</DialogTitle>
          <DialogDescription>
            Blockieren Sie einen Zeitraum, in dem keine Buchungen möglich sind.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Date (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="date">Datum</Label>
              <Input
                id="date"
                value={selectedDate.toLocaleDateString('de-DE', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                readOnly
                className="bg-muted"
              />
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="startTime">Startzeit</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger id="startTime">
                  <SelectValue placeholder="Startzeit wählen" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <Label htmlFor="endTime">Endzeit</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger id="endTime">
                  <SelectValue placeholder="Endzeit wählen" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reason (optional) */}
            <div className="space-y-2">
              <Label htmlFor="reason">Grund (optional)</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Grund wählen" />
                </SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Blockiere...' : 'Blockieren'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
