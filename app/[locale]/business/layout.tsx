/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { BusinessSidebar } from '@/components/business/BusinessSidebar';
import { BusinessNav } from '@/components/business/BusinessNav';
import { MobileBusinessNav } from '@/components/business/MobileBusinessNav';

interface BusinessLayoutProps {
  children: ReactNode;
  params: {
    locale: string;
  };
}

export default async function BusinessLayout({
  children,
  params,
}: BusinessLayoutProps): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  // Protect business portal - redirect to login if not authenticated
  if (!session) {
    redirect(`/${params.locale}/auth/login?callbackUrl=/${params.locale}/business`);
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Desktop Layout */}
      <div className="hidden md:flex">
        {/* Sidebar */}
        <BusinessSidebar locale={params.locale} />

        {/* Main Content */}
        <div className="flex-1 ml-64">
          {/* Top Navigation */}
          <BusinessNav session={session} locale={params.locale} />

          {/* Page Content */}
          <main className="p-6">{children}</main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Top Navigation */}
        <BusinessNav session={session} locale={params.locale} />

        {/* Page Content */}
        <main className="pb-20 pt-16 px-4">{children}</main>

        {/* Bottom Navigation */}
        <MobileBusinessNav locale={params.locale} />
      </div>
    </div>
  );
}
