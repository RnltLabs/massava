/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Thai Studio Owner Dashboard
 * Mobile-first dashboard with bottom tab navigation
 * Shows pending bookings, today's schedule, and quick stats
 */

import { redirect } from 'next/navigation';
import { auth } from '@/auth-unified';
import { db } from '@/lib/db';
import { BookingStatus } from '@/app/generated/prisma';
import { BottomTabNav } from '../_components/BottomTabNav';
import { BookingCard } from '../_components/BookingCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Package, AlertCircle } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { de } from 'date-fns/locale';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function OwnerDashboardPage({ params }: Props): Promise<React.JSX.Element> {
  const { locale } = await params;
  const session = await auth();

  // Redirect if not authenticated
  if (!session?.user?.id) {
    redirect(`/${locale}?openAuth=login`);
  }

  // Get user's studio (single studio model)
  const ownership = await db.studioOwnership.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      studio: {
        include: {
          services: true,
        },
      },
    },
    orderBy: {
      invitedAt: 'desc',
    },
  });

  // If no studio, redirect to main dashboard
  if (!ownership) {
    redirect(`/${locale}/dashboard`);
  }

  const studio = ownership.studio;

  // Get pending bookings (need confirmation)
  const pendingBookings = await db.newBooking.findMany({
    where: {
      studioId: studio.id,
      status: BookingStatus.PENDING,
    },
    include: {
      service: true,
      customer: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Get today's confirmed bookings
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaysBookings = await db.newBooking.findMany({
    where: {
      studioId: studio.id,
      status: BookingStatus.CONFIRMED,
      preferredDate: today,
    },
    include: {
      service: true,
      customer: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: {
      preferredTime: 'asc',
    },
  });

  // Get total bookings count (all time)
  const totalBookings = await db.newBooking.count({
    where: {
      studioId: studio.id,
    },
  });

  // Calculate badge counts for bottom nav
  const pendingCount = pendingBookings.length;
  const todayCount = todaysBookings.length;
  const servicesCount = studio.services.length;

  return (
    <div className="min-h-screen pb-20 md:pb-8 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {studio.name}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Dashboard
          </p>
        </div>

        {/* Tab Content: Dashboard View */}
        <div className="space-y-6">
          {/* Pending Bookings Section */}
          {pendingCount > 0 ? (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-semibold text-foreground">
                  Neue Anfragen ({pendingCount})
                </h2>
              </div>
              <div className="space-y-3">
                {pendingBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    locale={locale}
                    studioId={studio.id}
                  />
                ))}
              </div>
            </section>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2">Keine neuen Anfragen</h3>
                  <p className="text-muted-foreground text-sm">
                    Neue Buchungsanfragen werden hier angezeigt.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Today's Schedule Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                Heute ({todayCount} {todayCount === 1 ? 'Termin' : 'Termine'})
              </h2>
            </div>
            {todayCount > 0 ? (
              <div className="space-y-3">
                {todaysBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    locale={locale}
                    studioId={studio.id}
                    compact
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-semibold mb-2">Keine Termine heute</h3>
                    <p className="text-muted-foreground text-sm">
                      Dein Kalender ist heute frei.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Quick Stats */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Übersicht
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="text-sm">Gesamt Buchungen</CardDescription>
                  <CardTitle className="text-3xl font-bold">{totalBookings}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    Alle Zeit
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="text-sm">Services</CardDescription>
                  <CardTitle className="text-3xl font-bold">{servicesCount}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Package className="h-3 w-3 mr-1" />
                    Aktiv
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Tab Navigation */}
      <BottomTabNav
        locale={locale}
        activeTab="dashboard"
        pendingCount={pendingCount}
        todayCount={todayCount}
        servicesCount={servicesCount}
      />
    </div>
  );
}
