/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchIcon, FilterIcon } from 'lucide-react';
import { useState, useCallback } from 'react';

export function BookingFilters(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(searchParams.get('search') ?? '');
  const statusValue = searchParams.get('status') ?? 'all';

  const updateFilters = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === 'all' || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const handleSearch = (): void => {
    updateFilters('search', searchValue);
  };

  const handleStatusChange = (value: string): void => {
    updateFilters('status', value);
  };

  const handleClearFilters = (): void => {
    setSearchValue('');
    router.push(pathname ?? '');
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Nach Kundenname oder E-Mail suchen..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            className="pl-10 w-full sm:w-64"
          />
        </div>
        <Button onClick={handleSearch} variant="outline">
          Suchen
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 items-center">
        <FilterIcon className="h-4 w-4 text-muted-foreground" />
        <Select value={statusValue} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Nach Status filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Buchungen</SelectItem>
            <SelectItem value="PENDING">Ausstehend</SelectItem>
            <SelectItem value="CONFIRMED">Bestätigt</SelectItem>
            <SelectItem value="CANCELLED">Storniert</SelectItem>
          </SelectContent>
        </Select>

        {(searchParams.get('status') || searchParams.get('search')) && (
          <Button onClick={handleClearFilters} variant="ghost" size="sm">
            Filter löschen
          </Button>
        )}
      </div>
    </div>
  );
}
