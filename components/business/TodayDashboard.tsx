/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarIcon, ClockIcon, EuroIcon, XCircleIcon } from 'lucide-react';
import { AppointmentCard } from './AppointmentCard';
import { BookingStatus } from '@/app/generated/prisma';

interface DashboardData {
  stats: {
    todayAppointments: number;
    openRequests: number;
    todayRevenue: number;
    cancelledToday: number;
  };
  nextAppointment: {
    id: string;
    customerName: string;
    serviceName: string;
    time: string;
    date: string;
    status: BookingStatus;
  } | null;
  todayAppointments: Array<{
    id: string;
    customerName: string;
    serviceName: string;
    time: string;
    date: string;
    status: BookingStatus;
  }>;
  openRequests: Array<{
    id: string;
    customerName: string;
    serviceName: string;
    time: string;
    date: string;
    status: BookingStatus;
  }>;
}

interface TodayDashboardProps {
  data: DashboardData;
  userName: string;
  onConfirmBooking?: (id: string) => void;
  onDeclineBooking?: (id: string) => void;
}

interface StatCard {
  key: string;
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  iconColor: string;
}

// Memoized stat card component
const StatCardComponent = React.memo(({ stat }: { stat: StatCard }) => {
  const Icon = stat.icon;
  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
      role="region"
      aria-label={`${stat.label}: ${stat.value}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 ${stat.bgColor} rounded-full flex items-center justify-center`} aria-hidden="true">
          <Icon className={`h-5 w-5 ${stat.iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
      <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
    </div>
  );
});
StatCardComponent.displayName = 'StatCard';

function TodayDashboardComponent({
  data,
  userName,
  onConfirmBooking,
  onDeclineBooking,
}: TodayDashboardProps): React.JSX.Element {
  const t = useTranslations('business.dashboard');

  // Get time of day for greeting - memoized
  const timeOfDay = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greetingMorning');
    if (hour < 18) return t('greetingAfternoon');
    return t('greetingEvening');
  }, [t]);

  const greeting = useMemo(
    () => t('greeting', { timeOfDay, name: userName }),
    [t, timeOfDay, userName]
  );

  // Memoize stat cards configuration
  const statCards = useMemo<StatCard[]>(
    () => [
      {
        key: 'appointments',
        label: t('appointments'),
        value: data.stats.todayAppointments,
        icon: CalendarIcon,
        bgColor: 'bg-[#D4A89F]',
        iconColor: 'text-[#B56550]',
      },
      {
        key: 'open',
        label: t('open'),
        value: data.stats.openRequests,
        icon: ClockIcon,
        bgColor: 'bg-amber-100',
        iconColor: 'text-amber-600',
      },
      {
        key: 'revenue',
        label: t('revenue'),
        value: `€${data.stats.todayRevenue}`,
        icon: EuroIcon,
        bgColor: 'bg-green-100',
        iconColor: 'text-green-600',
      },
      {
        key: 'cancelled',
        label: t('cancelled'),
        value: data.stats.cancelledToday,
        icon: XCircleIcon,
        bgColor: 'bg-red-100',
        iconColor: 'text-red-600',
      },
    ],
    [data.stats, t]
  );

  // Memoize computed values
  const hasAppointments = data.nextAppointment || data.todayAppointments.length > 0;
  const hasOpenRequests = data.openRequests.length > 0;

  return (
    <main className="space-y-6">
      {/* Greeting */}
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{greeting}</h1>
        <p className="text-sm text-gray-600 mt-1">{t('todayOverview')}</p>
      </header>

      {/* Stats Grid - Optimized with memoized components */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4" aria-label="Today's statistics">
        {statCards.map((stat) => (
          <StatCardComponent key={stat.key} stat={stat} />
        ))}
      </section>

      {/* Next Appointment - Large Display */}
      {data.nextAppointment && (
        <section
          className="bg-gradient-to-br from-[#B56550] to-[#D4A89F] rounded-2xl p-6 text-white shadow-lg"
          aria-label="Next appointment"
        >
          <p className="text-sm font-medium opacity-90 mb-2">{t('nextAppointment')}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold mb-1" aria-label={`Time: ${data.nextAppointment.time}`}>
                {data.nextAppointment.time}
              </p>
              <p className="text-lg font-semibold">{data.nextAppointment.customerName}</p>
              <p className="text-sm opacity-90 mt-1">{data.nextAppointment.serviceName}</p>
            </div>
            <div
              className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
              aria-hidden="true"
            >
              <CalendarIcon className="h-8 w-8" />
            </div>
          </div>
        </section>
      )}

      {/* Today's Appointments - Horizontal Scroll */}
      {data.todayAppointments.length > 0 && (
        <section aria-label="Today's appointments">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('todayAppointments')}</h2>
          <div
            className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide"
            role="list"
            aria-label="Appointment cards"
            style={{
              WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
              scrollSnapType: 'x mandatory', // Snap scrolling for better mobile UX
            }}
          >
            {data.todayAppointments.map((appointment) => (
              <div key={appointment.id} style={{ scrollSnapAlign: 'start' }}>
                <AppointmentCard
                  id={appointment.id}
                  customerName={appointment.customerName}
                  serviceName={appointment.serviceName}
                  time={appointment.time}
                  date={appointment.date}
                  status={appointment.status}
                  variant="swipeable"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {!hasAppointments && (
        <div
          className="bg-white border border-gray-200 rounded-xl p-8 text-center"
          role="status"
          aria-live="polite"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
            <CalendarIcon className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600">{t('noAppointments')}</p>
        </div>
      )}

      {/* Open Requests */}
      {hasOpenRequests ? (
        <section aria-label="Open booking requests">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('openRequests')}</h2>
          <div className="space-y-3" role="list">
            {data.openRequests.map((request) => (
              <AppointmentCard
                key={request.id}
                id={request.id}
                customerName={request.customerName}
                serviceName={request.serviceName}
                time={request.time}
                date={request.date}
                status={request.status}
                variant="default"
                onConfirm={onConfirmBooking}
                onDecline={onDeclineBooking}
              />
            ))}
          </div>
        </section>
      ) : (
        <div
          className="bg-white border border-gray-200 rounded-xl p-6 text-center"
          role="status"
          aria-live="polite"
        >
          <p className="text-gray-600">{t('noRequests')}</p>
        </div>
      )}
    </main>
  );
}

// Memoized export for performance
export const TodayDashboard = React.memo(TodayDashboardComponent);
