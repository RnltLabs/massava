/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

interface LogoProps {
  isMobile: boolean;
  isStudioOwner: boolean;
  hasStudio: boolean;
}

export function Logo({ isMobile, isStudioOwner, hasStudio }: LogoProps): React.JSX.Element {
  const locale = useLocale();

  // Hide logo on desktop when sidebar is present (studio owner with registered studio)
  const shouldHide = !isMobile && isStudioOwner && hasStudio;

  return (
    <Link
      href={`/${locale}/`}
      className={cn('flex items-center', shouldHide && 'md:hidden')}
    >
      <span className="text-xl md:text-2xl font-bold text-[#B56550]">Massava</span>
    </Link>
  );
}
