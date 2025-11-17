/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LanguageSwitcherProps {
  locale: string;
  compact?: boolean;
}

export function LanguageSwitcher({
  locale,
  compact = false,
}: LanguageSwitcherProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string): void => {
    // Replace locale in pathname
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  if (compact) {
    // Mobile: Icon-only button
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            aria-label="Change language"
          >
            <Globe className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() => handleLocaleChange('de')}
            className="flex items-center justify-between"
          >
            Deutsch
            {locale === 'de' && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleLocaleChange('en')}
            className="flex items-center justify-between"
          >
            English
            {locale === 'en' && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Desktop: Text + Icon button
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="default" className="h-10 px-3 gap-2">
          <Globe className="h-4 w-4" />
          <span className="text-sm">{locale === 'de' ? 'Deutsch' : 'English'}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => handleLocaleChange('de')}
          className="flex items-center justify-between"
        >
          Deutsch
          {locale === 'de' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLocaleChange('en')}
          className="flex items-center justify-between"
        >
          English
          {locale === 'en' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
