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

/**
 * Runtime Configuration: Node.js
 *
 * The business portal requires Node.js runtime for:
 * 1. Prisma Client (binary engine, not WASM)
 * 2. GDPR encryption middleware (crypto APIs for health data)
 * 3. NextAuth session management
 * 4. Direct database queries in Server Components
 *
 * This declaration applies to all child routes automatically.
 * Do not override with 'edge' in child routes unless migrating to API abstraction.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#runtime
 */
export const runtime = 'nodejs';

interface BusinessLayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default async function BusinessLayout({
  children,
  params,
}: BusinessLayoutProps): Promise<JSX.Element> {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  // Protect business portal - redirect to login if not authenticated
  if (!session) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/business`);
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Desktop Layout */}
      <div className="hidden md:flex">
        {/* Sidebar */}
        <BusinessSidebar locale={locale} />

        {/* Main Content */}
        <div className="flex-1 ml-64">
          {/* Top Navigation */}
          <BusinessNav session={session} locale={locale} />

          {/* Page Content */}
          <main className="p-6">{children}</main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Top Navigation */}
        <BusinessNav session={session} locale={locale} />

        {/* Page Content */}
        <main className="pb-20 pt-16 px-4">{children}</main>

        {/* Bottom Navigation */}
        <MobileBusinessNav locale={locale} />
      </div>
    </div>
  );
}
