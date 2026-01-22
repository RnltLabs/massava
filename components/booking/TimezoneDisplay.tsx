/**
 * Timezone Display Component
 *
 * Shows booking time in both studio and user timezones
 * with clear warnings when they differ.
 *
 * GDPR-Compliant:
 * - User timezone detected client-side only
 * - Never sent to server
 * - Only used for display purposes
 */

'use client';

import { Clock, AlertTriangle } from 'lucide-react';
import { formatInTimezone } from '@/lib/timezone';
import { getUserTimezone, isTimezoneDifferent } from '@/lib/browser/timezone';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TimezoneDisplayProps {
  /**
   * DateTime to display
   */
  dateTime: Date;

  /**
   * Studio's timezone (IANA format, e.g., "Europe/Berlin")
   */
  studioTimezone: string;

  /**
   * Optional: Override user timezone (for testing)
   * If not provided, will be detected from browser
   */
  userTimezone?: string;

  /**
   * Display variant
   * - "full": Shows both times + warning (default)
   * - "compact": Only shows studio time + timezone indicator
   * - "inline": Inline display for cards
   */
  variant?: 'full' | 'compact' | 'inline';

  /**
   * Date format string (date-fns format)
   * Default: 'PPp' (e.g., "Nov 17, 2025, 2:30 PM")
   */
  dateFormat?: string;
}

/**
 * TimezoneDisplay Component
 *
 * Displays appointment times with timezone awareness
 *
 * @example
 * <TimezoneDisplay
 *   dateTime={new Date('2025-11-17T14:30:00Z')}
 *   studioTimezone="Europe/Berlin"
 * />
 */
export function TimezoneDisplay({
  dateTime,
  studioTimezone,
  userTimezone: providedUserTimezone,
  variant = 'full',
  dateFormat = 'PPp',
}: TimezoneDisplayProps) {
  // Detect user timezone (browser-based, GDPR-compliant)
  const detectedUserTimezone = getUserTimezone();
  const userTimezone = providedUserTimezone || detectedUserTimezone;

  // Check if timezones differ
  const isDifferent = isTimezoneDifferent(studioTimezone);

  // Format times
  const studioTime = formatInTimezone(dateTime, studioTimezone, dateFormat);
  const userTime = isDifferent
    ? formatInTimezone(dateTime, userTimezone, dateFormat)
    : null;

  // Compact variant (for space-constrained layouts)
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{studioTime}</span>
        {isDifferent && (
          <span className="text-xs text-muted-foreground">
            ({studioTimezone})
          </span>
        )}
      </div>
    );
  }

  // Inline variant (for cards/lists)
  if (variant === 'inline') {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{studioTime}</span>
          <span className="text-xs text-muted-foreground">
            ({studioTimezone})
          </span>
        </div>
        {isDifferent && userTime && (
          <div className="text-xs text-muted-foreground ml-6">
            Your time: {userTime}
          </div>
        )}
      </div>
    );
  }

  // Full variant (default)
  return (
    <div className="space-y-3">
      {/* Studio Time */}
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-primary" />
        <span className="font-medium">Studio Time:</span>
        <span className="font-semibold text-primary">
          {studioTime}
        </span>
        <span className="text-xs text-muted-foreground">
          ({studioTimezone})
        </span>
      </div>

      {/* User Time (if different) */}
      {isDifferent && userTime && (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Your Time:</span>
            <span className="font-semibold">
              {userTime}
            </span>
            <span className="text-xs">
              ({userTimezone})
            </span>
          </div>

          {/* Warning if different timezone */}
          <Alert variant="default" className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-900 dark:text-amber-100">
              <strong>Timezone Notice:</strong> This appointment is scheduled in{' '}
              <strong>{studioTimezone}</strong> timezone. Make sure to arrive at
              the studio time shown above.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}
