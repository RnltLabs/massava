/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Services Management Page
 * List, edit, and delete services
 */

import { redirect } from 'next/navigation';
import { auth } from '@/auth-unified';
import { db } from '@/lib/db';
import { BottomTabNav } from '../../_components/BottomTabNav';
import { ServiceCard } from '../../_components/ServiceCard';
import { ServiceManagementTrigger } from '../../_components/service-management/ServiceManagementTrigger';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Plus } from 'lucide-react';
import { BookingStatus } from '@/app/generated/prisma';
import { format } from 'date-fns';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ServicesPage({ params }: Props): Promise<React.JSX.Element> {
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
          services: {
            orderBy: {
              createdAt: 'desc',
            },
          },
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
  const services = studio.services;

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

  const servicesCount = services.length;

  return (
    <div className="min-h-screen pb-20 md:pb-8 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Services
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              {studio.name}
            </p>
          </div>

          <ServiceManagementTrigger
            studioId={studio.id}
            buttonIcon={<Plus className="h-5 w-5" />}
          />
        </div>

        {/* Services List */}
        {services.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                studioId={studio.id}
                locale={locale}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Noch keine Services</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Füge deinen ersten Service hinzu, damit Kunden bei dir buchen können.
                </p>
                <ServiceManagementTrigger
                  studioId={studio.id}
                  buttonText="Ersten Service hinzufügen"
                  buttonIcon={<Plus className="h-5 w-5 mr-2" />}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Tab Navigation */}
      <BottomTabNav
        locale={locale}
        activeTab="services"
        pendingCount={pendingCount}
        todayCount={todayCount}
        servicesCount={servicesCount}
      />
    </div>
  );
}
