/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@/app/generated/prisma';
import Link from 'next/link';
import { Calendar, Heart, MapPin, Clock } from 'lucide-react';

const prisma = new PrismaClient();

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CustomerDashboardPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('customer_dashboard');
  const session = await auth();

  // Redirect if not authenticated or not a customer
  if (!session?.user?.id) {
    redirect(`/${locale}`);
  }

  // Check if user is a customer (not studio owner)
  const userType = (session.user as any).userType;
  if (userType === 'studioOwner') {
    redirect(`/${locale}/dashboard`);
  }

  // Fetch customer data
  const customer = await prisma.customer.findUnique({
    where: { id: session.user.id },
    include: {
      bookings: {
        include: {
          studio: true,
          service: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      favorites: {
        include: {
          services: true,
        },
      },
    },
  });

  if (!customer) {
    redirect(`/${locale}`);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
      case 'PENDING':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
      case 'CANCELLED':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
      case 'COMPLETED':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {t('title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('welcome', { name: customer.name })}
          </p>
        </div>

        {/* My Bookings Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            {t('my_bookings')}
          </h2>

          {customer.bookings.length === 0 ? (
            <div className="wellness-shadow rounded-3xl bg-card p-12 text-center">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">{t('no_bookings_title')}</h3>
              <p className="text-muted-foreground mb-6">
                {t('no_bookings_description')}
              </p>
              <Link
                href={`/${locale}/studios`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl transition-all wellness-shadow"
              >
                <MapPin className="h-5 w-5" />
                {t('find_studios')}
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {customer.bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="wellness-shadow rounded-3xl bg-card p-6"
                >
                  {/* Status Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{booking.studio.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {booking.studio.city}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                      {t(`booking_status_${booking.status.toLowerCase()}`)}
                    </span>
                  </div>

                  {/* Booking Details */}
                  <div className="space-y-2 mb-4">
                    {booking.service && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">{t('booking_service')}: </span>
                        <span className="font-medium">{booking.service.name}</span>
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-muted-foreground">{t('booking_date')}: </span>
                      <span className="font-medium">{booking.preferredDate}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">{t('booking_time')}: </span>
                      <span className="font-medium">{booking.preferredTime}</span>
                    </div>
                  </div>

                  {/* View Studio Button */}
                  <Link
                    href={`/${locale}/studios/${booking.studio.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-accent/20 hover:bg-accent/30 text-foreground font-medium rounded-xl transition-colors"
                  >
                    {t('view_studio')}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Favorites Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            {t('my_favorites')}
          </h2>

          {customer.favorites.length === 0 ? (
            <div className="wellness-shadow rounded-3xl bg-card p-12 text-center">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">{t('no_favorites_title')}</h3>
              <p className="text-muted-foreground">
                {t('no_favorites_description')}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customer.favorites.map((studio) => (
                <Link
                  key={studio.id}
                  href={`/${locale}/studios/${studio.id}`}
                  className="wellness-shadow rounded-3xl bg-card p-6 hover:scale-105 transition-transform"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{studio.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {studio.city}
                      </p>
                    </div>
                    <Heart className="h-5 w-5 text-primary fill-primary" />
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {studio.services.length} {studio.services.length === 1 ? 'Leistung' : 'Leistungen'}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
