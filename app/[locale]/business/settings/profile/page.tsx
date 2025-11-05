/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import React from 'react';
import { auth } from '@/auth-unified';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ProfileEditForm } from '../_components/ProfileEditForm';
import { LocationEditForm } from '../_components/LocationEditForm';

interface ProfileSettingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

async function getStudioProfile(userEmail: string) {
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

  return user?.ownedStudios[0]?.studio ?? null;
}

export default async function ProfileSettingsPage({
  params,
}: ProfileSettingsPageProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  const session = await auth();

  if (!session) {
    redirect(
      `/${locale}/auth/login?callbackUrl=/${locale}/business/settings/profile`
    );
  }

  const studio = await getStudioProfile(session.user?.email ?? '');

  if (!studio) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Studio Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your studio information</p>
        </div>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">No studio profile found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Studio Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your studio information and settings</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="hours">Opening Hours</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Studio Information</CardTitle>
              <CardDescription>Update your studio's basic information</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileEditForm studio={studio} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Settings */}
        <TabsContent value="location" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Location & Address</CardTitle>
              <CardDescription>Update your studio's address information</CardDescription>
            </CardHeader>
            <CardContent>
              <LocationEditForm studio={studio} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Opening Hours */}
        <TabsContent value="hours" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Opening Hours</CardTitle>
              <CardDescription>Set your studio's operating hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studio.openingHours ? (
                  <div className="rounded-lg border p-4">
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {JSON.stringify(studio.openingHours, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No opening hours set</p>
                )}

                <div className="flex justify-end">
                  <Button>Edit Opening Hours</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
