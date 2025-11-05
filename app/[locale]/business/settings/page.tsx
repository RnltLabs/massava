/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { redirect } from 'next/navigation';

interface SettingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function SettingsPage({ params }: SettingsPageProps): Promise<never> {
  const { locale } = await params;

  // Redirect to profile settings by default
  redirect(`/${locale}/business/settings/profile`);
}
