/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { redirect } from 'next/navigation';

interface SettingsPageProps {
  params: {
    locale: string;
  };
}

export default function SettingsPage({ params }: SettingsPageProps): never {
  // Redirect to profile settings by default
  redirect(`/${params.locale}/business/settings/profile`);
}
