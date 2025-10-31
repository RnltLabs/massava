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
import type { VirtualBlockedTime } from '@/lib/opening-hours-utils';

interface BlockedTimeBlockProps {
  blocked: BlockedTime | VirtualBlockedTime;
  onClick: () => void;
}

export function BlockedTimeBlock({ blocked, onClick }: BlockedTimeBlockProps): React.JSX.Element {
  // Calculate position
  const { top, height } = calculateBlockPosition(blocked.startTime, blocked.endTime);

  // Check if this is a virtual (closed hours) block
  const isVirtual = 'isVirtual' in blocked && blocked.isVirtual;

  return (
    <div
      className={`absolute left-0 right-0 mx-1 mb-1 rounded-lg p-2 transition-colors overflow-hidden ${
        isVirtual
          ? 'border-2 border-dashed border-gray-400 bg-gray-100/50 cursor-default'
          : 'border border-gray-300 bg-gray-100 cursor-pointer hover:bg-gray-200'
      }`}
      style={{
        top,
        height,
        backgroundImage: isVirtual
          ? 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.03) 8px, rgba(0,0,0,0.03) 16px)'
          : 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)',
      }}
      onClick={isVirtual ? undefined : onClick}
      title={isVirtual ? 'Außerhalb der Öffnungszeiten' : undefined}
    >
      {/* Icon and Label */}
      <div className="flex items-center gap-1 mb-1">
        {isVirtual ? (
          <>
            <span className="text-sm">🕒</span>
            <span className="text-xs font-medium text-gray-600">Geschlossen</span>
          </>
        ) : (
          <>
            <span className="text-sm">🚫</span>
            <span className="text-xs font-medium text-gray-700">Blockiert</span>
          </>
        )}
      </div>

      {/* Reason (if provided) - only for non-virtual blocks */}
      {!isVirtual && blocked.reason && (
        <p className="text-[11px] text-gray-600 truncate leading-tight">{blocked.reason}</p>
      )}

      {/* Time */}
      <p className={`text-[10px] leading-tight ${isVirtual ? 'text-gray-500' : 'text-gray-500'}`}>
        {blocked.startTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} -{' '}
        {blocked.endTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
}
