/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Blocked Time Block Component
 * Visual representation of blocked time on the calendar
 */

'use client';

import { calculateBlockPosition } from '@/lib/calendar-utils';
import type { BlockedTime } from '@/app/generated/prisma';

interface BlockedTimeBlockProps {
  blocked: BlockedTime;
  onClick: () => void;
}

export function BlockedTimeBlock({ blocked, onClick }: BlockedTimeBlockProps): React.JSX.Element {
  // Calculate position
  const { top, height } = calculateBlockPosition(blocked.startTime, blocked.endTime);

  return (
    <div
      className="absolute left-0 right-0 mx-1 mb-1 rounded-lg border border-gray-300 bg-gray-100 p-2 cursor-pointer hover:bg-gray-200 transition-colors overflow-hidden"
      style={{
        top,
        height,
        backgroundImage:
          'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)',
      }}
      onClick={onClick}
    >
      {/* Icon */}
      <div className="flex items-center gap-1 mb-1">
        <span className="text-sm">🚫</span>
        <span className="text-xs font-medium text-gray-700">Blockiert</span>
      </div>

      {/* Reason (if provided) */}
      {blocked.reason && (
        <p className="text-[11px] text-gray-600 truncate leading-tight">{blocked.reason}</p>
      )}

      {/* Time */}
      <p className="text-[10px] text-gray-500 leading-tight">
        {blocked.startTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} -{' '}
        {blocked.endTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
}
