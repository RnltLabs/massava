/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ClockIcon, UserIcon, CalendarIcon } from 'lucide-react';
import { BookingStatus } from '@/app/generated/prisma';

interface AppointmentCardProps {
  id: string;
  customerName: string;
  serviceName: string;
  time: string;
  date: string;
  status: BookingStatus;
  variant?: 'default' | 'compact' | 'swipeable';
  onConfirm?: (id: string) => void;
  onDecline?: (id: string) => void;
  onClick?: () => void;
}

// Status configuration - moved outside component to prevent recreating on each render
const STATUS_COLORS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'bg-amber-100 text-amber-800',
  [BookingStatus.CONFIRMED]: 'bg-green-100 text-green-800',
  [BookingStatus.CANCELLED]: 'bg-red-100 text-red-800',
};

// Minimum touch target size for mobile (WCAG 2.1 AA)
const MIN_TOUCH_TARGET = 44; // 44x44px

function AppointmentCardComponent({
  id,
  customerName,
  serviceName,
  time,
  date,
  status,
  variant = 'default',
  onConfirm,
  onDecline,
  onClick,
}: AppointmentCardProps): React.JSX.Element {
  const t = useTranslations('business.booking');

  // Memoize computed values
  const isSwipeable = variant === 'swipeable';
  const isCompact = variant === 'compact';

  const statusLabel = useMemo(() => {
    const labels: Record<BookingStatus, string> = {
      [BookingStatus.PENDING]: t('status.pending'),
      [BookingStatus.CONFIRMED]: t('status.confirmed'),
      [BookingStatus.CANCELLED]: t('status.cancelled'),
    };
    return labels[status];
  }, [status, t]);

  // Memoize event handlers to prevent child re-renders
  const handleClick = useCallback((): void => {
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  const handleConfirm = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation();
    if (onConfirm) {
      onConfirm(id);
    }
  }, [id, onConfirm]);

  const handleDecline = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation();
    if (onDecline) {
      onDecline(id);
    }
  }, [id, onDecline]);

  if (isSwipeable) {
    return (
      <article
        className={cn(
          'flex-shrink-0 w-[280px] bg-white border border-gray-200 rounded-xl p-4 shadow-sm',
          'transition-all duration-200 hover:shadow-md',
          onClick && 'cursor-pointer'
        )}
        onClick={handleClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        } : undefined}
        aria-label={`Appointment: ${customerName}, ${serviceName}, ${time} on ${date}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-full bg-[#D4A89F] flex items-center justify-center"
              aria-hidden="true"
            >
              <ClockIcon className="h-5 w-5 text-[#B56550]" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{time}</p>
              <p className="text-xs text-gray-500">{date}</p>
            </div>
          </div>
          <span
            className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              STATUS_COLORS[status]
            )}
            role="status"
            aria-label={`Status: ${statusLabel}`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            <p className="text-sm font-medium text-gray-900">{customerName}</p>
          </div>
          <p className="text-sm text-gray-600 pl-6">{serviceName}</p>
        </div>

        {status === BookingStatus.PENDING && (onConfirm || onDecline) && (
          <div className="flex gap-2 mt-4" role="group" aria-label="Booking actions">
            {onConfirm && (
              <button
                onClick={handleConfirm}
                style={{ backgroundColor: '#B56550' }}
                className="flex-1 min-h-[44px] text-white text-sm font-medium rounded-lg transition-all duration-200 hover:opacity-90 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#B56550] focus:ring-offset-2"
                aria-label={`Confirm appointment for ${customerName}`}
              >
                Bestätigen
              </button>
            )}
            {onDecline && (
              <button
                onClick={handleDecline}
                className="flex-1 min-h-[44px] bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-gray-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                aria-label={`Decline appointment for ${customerName}`}
              >
                Ablehnen
              </button>
            )}
          </div>
        )}
      </article>
    );
  }

  if (isCompact) {
    return (
      <article
        className={cn(
          'bg-white border border-gray-200 rounded-xl p-3 shadow-sm',
          'transition-all duration-200 hover:shadow-md',
          onClick && 'cursor-pointer'
        )}
        onClick={handleClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        } : undefined}
        aria-label={`Appointment: ${customerName}, ${time}, ${serviceName}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D4A89F] flex items-center justify-center" aria-hidden="true">
              <ClockIcon className="h-5 w-5 text-[#B56550]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{customerName}</p>
              <p className="text-xs text-gray-500">{time} • {serviceName}</p>
            </div>
          </div>
          <span
            className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              STATUS_COLORS[status]
            )}
            role="status"
            aria-label={`Status: ${statusLabel}`}
          >
            {statusLabel}
          </span>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        'bg-white border border-gray-200 rounded-xl p-4 shadow-sm',
        'transition-all duration-200 hover:shadow-md',
        onClick && 'cursor-pointer'
      )}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
      aria-label={`Appointment: ${customerName}, ${serviceName}, ${date} at ${time}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#D4A89F] flex items-center justify-center" aria-hidden="true">
            <ClockIcon className="h-6 w-6 text-[#B56550]" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">{customerName}</p>
            <p className="text-sm text-gray-600">{serviceName}</p>
          </div>
        </div>
        <span
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium',
            STATUS_COLORS[status]
          )}
          role="status"
          aria-label={`Status: ${statusLabel}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
          <span>{time}</span>
        </div>
      </div>

      {status === BookingStatus.PENDING && (onConfirm || onDecline) && (
        <div className="flex gap-2 mt-4" role="group" aria-label="Booking actions">
          {onConfirm && (
            <button
              onClick={handleConfirm}
              style={{ backgroundColor: '#B56550' }}
              className="flex-1 min-h-[44px] text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:opacity-90 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#B56550] focus:ring-offset-2"
              aria-label={`Confirm appointment for ${customerName}`}
            >
              Bestätigen
            </button>
          )}
          {onDecline && (
            <button
              onClick={handleDecline}
              className="flex-1 min-h-[44px] bg-gray-100 text-gray-700 text-sm font-medium rounded-xl transition-all duration-200 hover:bg-gray-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              aria-label={`Decline appointment for ${customerName}`}
            >
              Ablehnen
            </button>
          )}
        </div>
      )}
    </article>
  );
}

// Memoized export to prevent unnecessary re-renders
export const AppointmentCard = React.memo(AppointmentCardComponent);
