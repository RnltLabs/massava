/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Welcome Dashboard Page
 * First page users see after registration/login
 * Shows action cards: Find a Massage or List My Studio
 * OR shows their studio dashboard if they already have studios
 */

import { redirect } from 'next/navigation';
import { auth } from '@/auth-unified';
import { PrismaClient } from '@/app/generated/prisma';
import Link from 'next/link';
import { Building2, Sparkles, Clock, Plus, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const prisma = new PrismaClient();

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const session = await auth();

  // Redirect if not authenticated
  if (!session?.user?.id) {
    redirect(`/${locale}?openAuth=login`);
  }

  const user = session.user;

  // Check if user owns any studios
  const studios = await prisma.studio.findMany({
    where: {
      ownerId: user.id,
    },
    include: {
      services: true,
      _count: {
        select: {
          bookings: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // If user has studios, show studio owner dashboard
  if (studios.length > 0) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Studio Dashboard
              </h1>
              <p className="text-lg text-muted-foreground">
                Welcome, {user.name || user.email}
              </p>
            </div>

            <Link
              href={`/${locale}/studios/register`}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl transition-all wellness-shadow"
            >
              <Plus className="h-5 w-5" />
              Register Another Studio
            </Link>
          </div>

          {/* Studios */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studios.map((studio) => (
              <div
                key={studio.id}
                className="wellness-shadow rounded-3xl bg-card p-6 hover:scale-105 transition-transform"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{studio.name}</h3>
                    <p className="text-sm text-muted-foreground">{studio.city}</p>
                  </div>
                  <div className="bg-primary/20 p-2 rounded-xl">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Services: </span>
                    <span className="font-medium">{studio.services.length}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Bookings: </span>
                    <span className="font-medium">{studio._count.bookings}</span>
                  </div>
                </div>

                <Link
                  href={`/${locale}/studios/${studio.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-accent/20 hover:bg-accent/30 text-foreground font-medium rounded-xl transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  View Studio
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // New user: Show welcome dashboard with action cards
  // Check if user has any bookings
  const bookings = await prisma.newBooking.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      studio: {
        select: {
          name: true,
          address: true,
        },
      },
    },
  });

  const hasBookings = bookings.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Welcome back, {user.name || 'there'}!
          </h1>
          <p className="text-lg text-muted-foreground">
            What would you like to do today?
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Find a Massage Card */}
          <Link href={`/${locale}/studios`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Find a Massage</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Browse Thai massage studios and book appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Discover top-rated massage studios in your area, compare services, and book your next wellness session.
                </p>
                <div className="flex items-center text-primary font-medium">
                  Browse Studios
                  <svg
                    className="ml-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* List My Studio Card */}
          <Link href={`/${locale}/studios/register`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-3 bg-secondary/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <CardTitle className="text-2xl">List My Studio</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Register your massage studio and start accepting bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Join our platform to reach more customers, manage bookings, and grow your wellness business.
                </p>
                <div className="flex items-center text-primary font-medium">
                  Get Started
                  <svg
                    className="ml-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity Section */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-6">
            Recent Activity
          </h2>

          {hasBookings ? (
            <Card>
              <CardHeader>
                <CardTitle>Your Recent Bookings</CardTitle>
                <CardDescription>
                  Your latest massage appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{booking.studio.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {booking.studio.address}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(booking.preferredDate).toLocaleDateString(locale, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                          {booking.preferredTime && ` at ${booking.preferredTime}`}
                        </p>
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            booking.status === 'CONFIRMED'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start your wellness journey by booking your first massage.
                  </p>
                  <Link
                    href={`/${locale}/studios`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    Browse Studios
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
