/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Current Time Indicator Component
 * Red line showing current time during business hours
 */

'use client';

import { useState, useEffect } from 'react';
import { getCurrentTimePosition } from '@/lib/calendar-utils';

export function CurrentTimeIndicator(): React.JSX.Element | null {
  const [position, setPosition] = useState(getCurrentTimePosition());

  useEffect(() => {
    // Update position every minute
    const interval = setInterval(() => {
      setPosition(getCurrentTimePosition());
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, []);

  if (!position.visible) {
    return null;
  }

  return (
    <div className="absolute left-0 right-0 pointer-events-none z-10" style={{ top: position.top }}>
      {/* Red line */}
      <div className="h-0.5 bg-red-500 relative">
        {/* Circle indicator */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full shadow-md" />
      </div>
    </div>
  );
}
