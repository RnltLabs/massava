/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@/app/generated/prisma';
import Link from 'next/link';
import { Building2, Plus, Eye } from 'lucide-react';

const prisma = new PrismaClient();

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const session = await auth();

  // Redirect if not authenticated
  if (!session?.user?.id) {
    redirect(`/${locale}`);
  }

  // Fetch user's studios
  const studios = await prisma.studio.findMany({
    where: {
      ownerId: session.user.id,
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

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Willkommen, {session.user.name || session.user.email}
            </p>
          </div>

          <Link
            href={`/${locale}/studios/register`}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl transition-all wellness-shadow"
          >
            <Plus className="h-5 w-5" />
            Studio registrieren
          </Link>
        </div>

        {/* Studios */}
        {studios.length === 0 ? (
          <div className="wellness-shadow rounded-3xl bg-card p-12 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Noch keine Studios</h2>
            <p className="text-muted-foreground mb-6">
              Registriere dein erstes Studio, um loszulegen.
            </p>
            <Link
              href={`/${locale}/studios/register`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl transition-all wellness-shadow"
            >
              <Plus className="h-5 w-5" />
              Jetzt Studio registrieren
            </Link>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
