/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SearchIcon, X } from 'lucide-react';
import { useState, useCallback } from 'react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Alle' },
  { value: 'PENDING', label: 'Offen' },
  { value: 'CONFIRMED', label: 'Bestätigt' },
  { value: 'CANCELLED', label: 'Storniert' },
];

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

  const hasActiveFilters = searchParams.get('status') || searchParams.get('search');

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 -mx-4 px-4 py-3 mb-4">
      {/* Search Input */}
      <div className="relative mb-3">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Kunde suchen..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          className="w-full px-4 py-2.5 pl-10 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B56550]/20 focus:border-[#B56550]"
        />
      </div>

      {/* Status Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_OPTIONS.map((option) => {
          const isActive = statusValue === option.value;
          return (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={
                isActive
                  ? 'px-4 py-2 text-sm font-medium rounded-full bg-[#B56550] text-white shadow-sm whitespace-nowrap transition-all'
                  : 'px-4 py-2 text-sm font-medium rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 whitespace-nowrap transition-all'
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Active Filter Badge */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1">
            <X className="h-3 w-3" />
            Filter aktiv
          </span>
          <span className="text-gray-400">•</span>
          <button
            onClick={handleClearFilters}
            className="text-[#B56550] hover:underline font-medium"
          >
            Zurücksetzen
          </button>
        </div>
      )}
    </div>
  );
}
