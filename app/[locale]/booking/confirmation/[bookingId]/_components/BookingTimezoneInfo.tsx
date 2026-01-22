/**
 * Booking Timezone Info Component (Client-Side)
 *
 * Shows appointment time with timezone awareness
 * Used in booking confirmation page
 */

'use client';

import { Calendar } from 'lucide-react';
import { TimezoneDisplay } from '@/components/booking/TimezoneDisplay';

interface BookingTimezoneInfoProps {
  /**
   * Appointment date/time
   */
  appointmentDateTime: Date;

  /**
   * Studio timezone
   */
  studioTimezone: string;
}

/**
 * BookingTimezoneInfo Component
 *
 * Client-side wrapper for TimezoneDisplay
 * (needed because we detect user timezone in browser)
 */
export function BookingTimezoneInfo({
  appointmentDateTime,
  studioTimezone,
}: BookingTimezoneInfoProps) {
  return (
    <div>
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-lg">
        <Calendar className="h-5 w-5 text-primary" />
        Termin
      </h3>
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4">
        <TimezoneDisplay
          dateTime={appointmentDateTime}
          studioTimezone={studioTimezone}
          variant="full"
          dateFormat="EEEE, dd. MMMM yyyy 'um' HH:mm 'Uhr'"
        />
      </div>
    </div>
  );
}
