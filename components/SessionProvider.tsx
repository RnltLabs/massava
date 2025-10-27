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

// Detect basePath from URL (same logic as lib/navigation.ts)
// In production: URL starts with /massava -> basePath = /massava/api/auth
// In development: URL doesn't start with /massava -> basePath = /api/auth
function getBasePath(): string {
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/massava')) {
      return '/massava/api/auth';
    }
  }
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
