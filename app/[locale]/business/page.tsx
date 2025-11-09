/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { TodayDashboard } from '@/components/business/TodayDashboard';
import { BookingStatus } from '@/app/generated/prisma';
import { OnboardingScreen } from './_components/OnboardingScreen';

interface BusinessDashboardPageProps {
  params: Promise<{
    locale: string;
  }>;
}

const AVERAGE_SERVICE_PRICE = 80; // EUR - TODO: Calculate from actual service prices

function getDefaultDashboardData(userName?: string | null) {
  return {
    stats: {
      todayAppointments: 0,
      openRequests: 0,
      todayRevenue: 0,
      cancelledToday: 0,
    },
    nextAppointment: null,
    todayAppointments: [],
    openRequests: [],
    userName: userName ?? 'Studio Owner',
  };
}

async function getDashboardData(userEmail: string) {
  try {
    // Validate email format
    if (!userEmail || userEmail.trim() === '') {
      logger.warn('Invalid email format provided to getDashboardData', { userEmail });
      return getDefaultDashboardData();
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Optimized: Execute all queries in parallel using transaction
    const [user, allTodayBookings, pendingBookings] = await prisma.$transaction([
      // Query 1: Get user's studio
      prisma.user.findUnique({
        where: { email: userEmail },
        include: {
          ownedStudios: {
            include: {
              studio: true,
            },
          },
        },
      }),
      // Query 2: Get today's bookings (execute while waiting for user)
      prisma.newBooking.findMany({
        where: {
          studio: {
            ownerships: {
              some: {
                user: {
                  email: userEmail,
                },
              },
            },
          },
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          service: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      // Query 3: Get pending bookings (execute in parallel)
      prisma.newBooking.findMany({
        where: {
          studio: {
            ownerships: {
              some: {
                user: {
                  email: userEmail,
                },
              },
            },
          },
          status: BookingStatus.PENDING,
        },
        include: {
          service: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: 10,
      }),
    ]);

    if (!user || user.ownedStudios.length === 0) {
      return getDefaultDashboardData(user?.name);
    }

  // Calculate stats
  const todayConfirmed = allTodayBookings.filter(
    (b) => b.status === BookingStatus.CONFIRMED
  );
  const todayCancelled = allTodayBookings.filter(
    (b) => b.status === BookingStatus.CANCELLED
  ).length;

  // Calculate revenue using constant
  const todayRevenue = todayConfirmed.length * AVERAGE_SERVICE_PRICE;

  // Map bookings to appointment format
  const mapBookingToAppointment = (booking: typeof allTodayBookings[0]) => ({
    id: booking.id,
    customerName: booking.customerName,
    serviceName: booking.service?.name ?? 'Kein Service',
    time: booking.preferredTime,
    date: booking.preferredDate,
    status: booking.status,
  });

  // Get next appointment (first confirmed booking)
  const nextAppointment = todayConfirmed[0]
    ? mapBookingToAppointment(todayConfirmed[0])
    : null;

  return {
    stats: {
      todayAppointments: todayConfirmed.length,
      openRequests: pendingBookings.length,
      todayRevenue,
      cancelledToday: todayCancelled,
    },
    nextAppointment,
    todayAppointments: todayConfirmed.map(mapBookingToAppointment),
    openRequests: pendingBookings.map(mapBookingToAppointment),
    userName: user.name ?? 'Studio Owner',
  };
  } catch (error) {
    logger.error('Error fetching dashboard data', {
      error: error instanceof Error ? error.message : String(error),
      userEmail
    });
    return getDefaultDashboardData();
  }
}

export default async function BusinessDashboardPage({
  params,
}: BusinessDashboardPageProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  const session = await auth();

  if (!session) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/business`);
  }

  // Check if user owns any studios
  const userEmail = session.user?.email ?? '';
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      ownedStudios: {
        include: {
          studio: true,
        },
      },
    },
  });

  // If user has no studios, show onboarding screen
  if (!user || user.ownedStudios.length === 0) {
    return <OnboardingScreen userName={user?.name} locale={locale} />;
  }

  const dashboardData = await getDashboardData(userEmail);

  return (
    <TodayDashboard
      data={{
        stats: dashboardData.stats,
        nextAppointment: dashboardData.nextAppointment,
        todayAppointments: dashboardData.todayAppointments,
        openRequests: dashboardData.openRequests,
      }}
      userName={dashboardData.userName}
    />
  );
}
