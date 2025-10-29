/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

// Detect basePath from URL
// Since migration to massava.app: basePath is '/api/auth'
// Legacy support: If URL still contains /massava (old domain), use '/massava/api/auth'
function getBasePath(): string {
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    // Legacy support for old rnltlabs.de/massava URLs
    if (pathname.startsWith('/massava')) {
      return '/massava/api/auth';
    }
  }
  // Default for massava.app
  return '/api/auth';
}

export default function SessionProvider({ children }: Props) {
  const basePath = getBasePath();

  return (
    <NextAuthSessionProvider basePath={basePath}>
      {children}
    </NextAuthSessionProvider>
  );
}
