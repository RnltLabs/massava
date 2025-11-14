/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { redirect } from 'next/navigation';

interface MorePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function MorePage({ params }: MorePageProps): Promise<never> {
  const { locale } = await params;

  // Redirect to settings (new canonical URL)
  redirect(`/${locale}/business/settings`);
}
