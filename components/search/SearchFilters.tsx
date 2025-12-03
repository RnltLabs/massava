/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, ChevronDown, ArrowUpDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SERVICE_TYPE_OPTIONS } from '@/lib/constants/serviceTypes';
import { SearchParameterSheet } from './SearchParameterSheet';
import { useState } from 'react';

interface SearchFiltersProps {
  /**
   * Optional callback when filters are applied
   */
  onFiltersApplied?: () => void;
}

/**
 * Sort options for search results
 */
const SORT_OPTIONS = [
  { value: 'distance', label: 'Entfernung' },
  { value: 'price', label: 'Preis' },
  { value: 'rating', label: 'Bewertung' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

/**
 * SearchFilters Component
 *
 * Unified filter hub with integrated sticky header.
 * Combines search location display, service type pills, and sort option.
 *
 * Features:
 * - Sticky header with location info (clickable to edit search parameters)
 * - Horizontal scrollable service type pills with sort dropdown (instant apply)
 * - URL parameter sync
 * - Same layout for mobile and desktop
 */
export function SearchFilters({ onFiltersApplied }: SearchFiltersProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);

  // Get current values from URL
  const currentServiceType = searchParams.get('serviceType') || '';
  const currentSort = (searchParams.get('sort') as SortValue) || 'distance';
  const location = searchParams.get('location') || 'In deiner Nähe';
  const radius = searchParams.get('radius') || '10';

  // Initial values for search parameter sheet
  const initialSearchValues = useMemo(() => ({
    location: searchParams.get('location') || '',
    lat: parseFloat(searchParams.get('lat') || '') || null,
    lng: parseFloat(searchParams.get('lng') || '') || null,
    radius: searchParams.get('radius') || '10',
    datetime: searchParams.get('datetime')
      ? new Date(searchParams.get('datetime')!)
      : undefined,
    serviceType: searchParams.get('serviceType') || undefined,
  }), [searchParams]);

  // Combine "Alle" option with service type options
  const allServiceTypes = [{ value: '', label: 'Alle', icon: '' }, ...SERVICE_TYPE_OPTIONS];

  /**
   * Handle service type change - applies immediately without sheet
   */
  const handleServiceTypeChange = (value: string): void => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('serviceType', value);
    } else {
      params.delete('serviceType');
    }
    router.push(`?${params.toString()}`);
    onFiltersApplied?.();
  };

  /**
   * Handle sort change - applies immediately
   */
  const handleSortChange = (value: SortValue): void => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'distance') {
      // Distance is default, remove from URL
      params.delete('sort');
    } else {
      params.set('sort', value);
    }
    router.push(`?${params.toString()}`);
    onFiltersApplied?.();
  };

  /**
   * Get current sort label
   */
  const currentSortLabel = SORT_OPTIONS.find(o => o.value === currentSort)?.label || 'Entfernung';

  return (
    <>
      {/* Sticky Header - Always visible */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 -mx-4 px-4 py-3 mb-4">
        {/* Location Row - Clickable to open search sheet */}
        <button
          type="button"
          onClick={() => setIsSearchSheetOpen(true)}
          className="flex items-center justify-between w-full mb-3 py-2 -my-2 rounded-lg hover:bg-black/5 active:bg-black/10 transition-colors group"
          aria-label="Suchparameter anpassen"
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-gray-900">{location}</span>
            <span className="text-sm text-gray-600">
              &bull; {radius}km
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </button>

        {/* Service Type Pills + Sort - Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {/* Sort Dropdown as first pill */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1.5"
                aria-label="Sortierung ändern"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {currentSortLabel}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[140px]">
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={currentSort === option.value ? 'bg-primary/10 text-primary' : ''}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Divider */}
          <div className="w-px bg-gray-200 my-1 flex-shrink-0" />

          {/* Service Type Pills */}
          {allServiceTypes.map((option) => {
            const isActive = currentServiceType === option.value;

            return (
              <button
                key={option.value}
                onClick={() => handleServiceTypeChange(option.value)}
                className={
                  isActive
                    ? 'px-4 py-2 text-sm font-medium rounded-full bg-[#B56550] text-white shadow-sm whitespace-nowrap transition-all flex-shrink-0'
                    : 'px-4 py-2 text-sm font-medium rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 whitespace-nowrap transition-all flex-shrink-0'
                }
                type="button"
                aria-pressed={isActive}
                aria-label={`Filter: ${option.label}`}
              >
                {option.icon && <span className="mr-1.5">{option.icon}</span>}
                {option.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Search Parameter Sheet */}
      <SearchParameterSheet
        open={isSearchSheetOpen}
        onOpenChange={setIsSearchSheetOpen}
        initialValues={initialSearchValues}
      />
    </>
  );
}
