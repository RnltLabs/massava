/**
 * Time Slot Button Component
 *
 * Displays available time slots with timezone awareness
 *
 * Features:
 * - Shows studio time prominently
 * - Shows user's local time if different (optional)
 * - Hover tooltip with full datetime info
 * - Accessibility compliant
 */

'use client';

import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatInTimezone } from '@/lib/timezone';
import { getUserTimezone, isTimezoneDifferent } from '@/lib/browser/timezone';
import { cn } from '@/lib/utils';

interface TimeSlotButtonProps {
  /**
   * Slot start time (ISO 8601 string or Date)
   */
  startTime: string | Date;

  /**
   * Studio timezone (IANA format)
   */
  studioTimezone: string;

  /**
   * Click handler
   */
  onClick: () => void;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Show user time below studio time (default: true if timezones differ)
   */
  showUserTime?: boolean;

  /**
   * Size variant
   */
  size?: 'sm' | 'default' | 'lg';

  /**
   * Custom class name
   */
  className?: string;
}

/**
 * TimeSlotButton Component
 *
 * @example
 * <TimeSlotButton
 *   startTime="2025-11-17T14:30:00+01:00"
 *   studioTimezone="Europe/Berlin"
 *   onClick={() => handleBookSlot(slotId)}
 * />
 */
export function TimeSlotButton({
  startTime,
  studioTimezone,
  onClick,
  disabled = false,
  showUserTime = true,
  size = 'default',
  className,
}: TimeSlotButtonProps) {
  // Parse date
  const date = typeof startTime === 'string' ? new Date(startTime) : startTime;

  // Detect user timezone
  const userTimezone = getUserTimezone();
  const isDifferent = isTimezoneDifferent(studioTimezone);

  // Format times
  const studioTime = formatInTimezone(date, studioTimezone, 'HH:mm');
  const userTime = isDifferent
    ? formatInTimezone(date, userTimezone, 'HH:mm')
    : null;

  // Full datetime for tooltip
  const fullStudioTime = formatInTimezone(date, studioTimezone, 'PPp');
  const fullUserTime = isDifferent
    ? formatInTimezone(date, userTimezone, 'PPp')
    : null;

  const buttonContent = (
    <div className="text-center w-full">
      {/* Studio Time (Primary) */}
      <div className="font-semibold text-base">
        {studioTime}
      </div>

      {/* User Time (Secondary) - if different and showUserTime enabled */}
      {isDifferent && showUserTime && userTime && (
        <div className="text-xs text-muted-foreground mt-0.5">
          ({userTime} your time)
        </div>
      )}
    </div>
  );

  // If timezones are the same, no need for tooltip
  if (!isDifferent) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'justify-center hover:bg-primary hover:text-primary-foreground transition-colors w-full',
          size === 'sm' && 'h-10',
          size === 'default' && 'h-12',
          size === 'lg' && 'h-14',
          className
        )}
        aria-label={`Book appointment at ${studioTime}`}
      >
        {buttonContent}
      </Button>
    );
  }

  // With timezone difference, add tooltip
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size={size}
            onClick={onClick}
            disabled={disabled}
            className={cn(
              'justify-center hover:bg-primary hover:text-primary-foreground transition-colors w-full',
              size === 'sm' && 'h-10',
              size === 'default' && 'h-12',
              size === 'lg' && 'h-14',
              className
            )}
            aria-label={`Book appointment at ${studioTime} studio time (${userTime} your time)`}
          >
            {buttonContent}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <strong>Studio Time:</strong>
              <span>{fullStudioTime}</span>
            </div>
            {fullUserTime && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <strong>Your Time:</strong>
                <span>{fullUserTime}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
