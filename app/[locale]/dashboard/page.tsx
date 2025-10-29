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
import { UserRole } from '@/app/generated/prisma';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Building2, Sparkles, Clock, Plus, Eye, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StudioRegistrationTrigger } from '@/app/(main)/dashboard/_components/StudioRegistrationTrigger';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).primaryRole as UserRole;
  const isStudioOwner = userRole === UserRole.STUDIO_OWNER;

  // Check if user owns any studios (via StudioOwnership junction table)
  const ownerships = await db.studioOwnership.findMany({
    where: {
      userId: user.id,
    },
    include: {
      studio: {
        include: {
          services: true,
          _count: {
            select: {
              bookings: true,
            },
          },
        },
      },
    },
    orderBy: {
      invitedAt: 'desc',
    },
  });

  // Extract studios from ownerships
  const studios = ownerships.map(ownership => ownership.studio);

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
                Willkommen, {user.name || user.email}
              </p>
            </div>

            <StudioRegistrationTrigger
              buttonText="Weiteres Studio registrieren"
              buttonIcon={<Plus className="h-5 w-5 mr-2" />}
              variant="default"
            />
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
                    <span className="text-muted-foreground">Buchungen: </span>
                    <span className="font-medium">{studio._count.bookings}</span>
                  </div>
                </div>

                <Link
                  href={`/${locale}/studios/${studio.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-accent/20 hover:bg-accent/30 text-foreground font-medium rounded-xl transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  Studio ansehen
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
  const bookings = await db.newBooking.findMany({
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

  // Studio Owner without studios: Show prominent Studio Setup CTA
  if (isStudioOwner && studios.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section for Studio Owners */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold tracking-tight mb-4">
              Willkommen, {user.name || 'Studio-Besitzer'}!
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

          {/* Secondary: Browse Studios Option */}
          <Card>
            <CardHeader>
              <CardTitle>Oder entdecke andere Studios</CardTitle>
              <CardDescription>
                Schau dir an, wie andere Studios sich auf Massava präsentieren
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link href={`/${locale}/studios`} className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Studios durchsuchen
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Regular customers or users without specific role: Show welcome dashboard
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Willkommen zurück, {user.name || 'dort'}!
          </h1>
          <p className="text-lg text-muted-foreground">
            Was möchtest du heute tun?
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
                  <CardTitle className="text-2xl">Massage finden</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Thai-Massage-Studios durchsuchen und Termine buchen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Entdecke top-bewertete Massage-Studios in deiner Nähe, vergleiche Services und buche deine nächste Wellness-Session.
                </p>
                <div className="flex items-center text-primary font-medium">
                  Studios durchsuchen
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
                  <CardTitle className="text-2xl">Mein Studio listen</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Registriere dein Massage-Studio und akzeptiere Buchungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Tritt unserer Plattform bei, um mehr Kunden zu erreichen, Buchungen zu verwalten und dein Wellness-Business zu vergrößern.
                </p>
                <div className="flex items-center text-primary font-medium">
                  Jetzt starten
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
            Letzte Aktivitäten
          </h2>

          {hasBookings ? (
            <Card>
              <CardHeader>
                <CardTitle>Deine letzten Buchungen</CardTitle>
                <CardDescription>
                  Deine letzten Massage-Termine
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
                  <h3 className="text-lg font-semibold mb-2">Noch keine Buchungen</h3>
                  <p className="text-muted-foreground mb-6">
                    Starte deine Wellness-Reise, indem du deine erste Massage buchst.
                  </p>
                  <Link
                    href={`/${locale}/studios`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    Studios durchsuchen
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
