/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * More Page (Settings & Additional Options)
 * Placeholder for future features
 */

import { redirect } from 'next/navigation';
import { auth } from '@/auth-unified';
import { db } from '@/lib/db';
import { BottomTabNav } from '../../_components/BottomTabNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, LogOut, HelpCircle, Bell } from 'lucide-react';
import { BookingStatus } from '@/app/generated/prisma';
import { format } from 'date-fns';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MorePage({ params }: Props): Promise<React.JSX.Element> {
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
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Mehr
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            {studio.name}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <Card className="hover:shadow-md transition-shadow cursor-not-allowed opacity-60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Einstellungen</CardTitle>
                  <CardDescription className="text-xs">
                    Studio-Einstellungen verwalten (Demnächst)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-not-allowed opacity-60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Benachrichtigungen</CardTitle>
                  <CardDescription className="text-xs">
                    Benachrichtigungseinstellungen (Demnächst)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-not-allowed opacity-60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Hilfe & Support</CardTitle>
                  <CardDescription className="text-xs">
                    Anleitungen und Support (Demnächst)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-not-allowed opacity-60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <LogOut className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-base">Abmelden</CardTitle>
                  <CardDescription className="text-xs">
                    Von deinem Konto abmelden (Demnächst)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Weitere Funktionen werden bald verfügbar sein.
          </p>
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
