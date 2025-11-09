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
import { Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StudioRegistrationTrigger } from '@/app/[locale]/dashboard/_components/StudioRegistrationTrigger';

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

  // If user has no studios, show empty state banner
  if (!user || user.ownedStudios.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold tracking-tight mb-4">
              Willkommen, {user?.name || 'Studio-Besitzer'}!
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Bereit, dein Studio auf Massava zu präsentieren?
            </p>
          </div>

          {/* Prominent Studio Setup CTA Card */}
          <Card className="mb-12 border-2 border-primary/50 shadow-2xl">
            <CardContent className="p-12">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-6 bg-primary/10 rounded-full">
                  <Building2 className="h-16 w-16 text-primary" />
                </div>

                <div className="space-y-4">
                  <h2 className="text-3xl font-bold">
                    Jetzt dein Studio einrichten
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl">
                    Registriere dein Studio in wenigen Schritten und erreiche tausende potenzielle Kunden.
                    Komplett kostenlos, keine versteckten Gebühren.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4">
                  <StudioRegistrationTrigger
                    buttonText="Studio jetzt einrichten"
                    buttonIcon={
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                      </div>
                    }
                    variant="default"
                    size="lg"
                    className="text-lg px-8 py-6"
                  />
                </div>

                {/* Benefits */}
                <div className="grid md:grid-cols-3 gap-6 pt-8 w-full">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">100%</div>
                    <div className="text-sm text-muted-foreground">
                      Der Einnahmen bleiben bei dir
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">0€</div>
                    <div className="text-sm text-muted-foreground">
                      Keine Provisionen oder versteckten Kosten
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">5 Min</div>
                    <div className="text-sm text-muted-foreground">
                      Schnelle und einfache Registrierung
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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
