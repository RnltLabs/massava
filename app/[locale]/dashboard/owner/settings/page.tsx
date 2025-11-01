/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Studio Settings Page
 * Manage studio configuration including capacity
 */

import { redirect } from 'next/navigation';
import { auth } from '@/auth-unified';
import { db } from '@/lib/db';
import { BottomTabNav } from '../../_components/BottomTabNav';
import { CapacitySettings } from './_components/CapacitySettings';
import { BookingStatus } from '@/app/generated/prisma';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SettingsPage({ params }: Props): Promise<React.JSX.Element> {
  const { locale } = await params;
  const session = await auth();

  // Redirect if not authenticated
  if (!session?.user?.id) {
    redirect(`/${locale}?openAuth=login`);
  }

  // Get user's studio
  const ownership = await db.studioOwnership.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      studio: {
        select: {
          id: true,
          name: true,
          capacity: true,
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

  // Calculate badge counts for bottom nav
  const pendingCount = await db.newBooking.count({
    where: {
      studioId: studio.id,
      status: BookingStatus.PENDING,
    },
  });

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayCount = await db.newBooking.count({
    where: {
      studioId: studio.id,
      status: BookingStatus.CONFIRMED,
      preferredDate: today,
    },
  });

  const servicesCount = studio.services.length;

  return (
    <div className="min-h-screen pb-20 md:pb-8 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header with Back Button */}
        <div className="mb-6">
          <Link
            href={`/${locale}/dashboard/owner/more`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Zurück</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Einstellungen
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            {studio.name}
          </p>
        </div>

        {/* Capacity Settings */}
        <div className="space-y-6">
          <CapacitySettings
            studioId={studio.id}
            initialCapacity={studio.capacity}
          />
        </div>
      </div>

      {/* Bottom Tab Navigation */}
      <BottomTabNav
        locale={locale}
        activeTab="more"
        pendingCount={pendingCount}
        todayCount={todayCount}
        servicesCount={servicesCount}
      />
    </div>
  );
}
