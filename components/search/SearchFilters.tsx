/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { SERVICE_TYPE_OPTIONS } from '@/lib/constants/serviceTypes';
import { SearchParameterSheet } from './SearchParameterSheet';

interface SearchFiltersProps {
  /**
   * Optional callback when filters are applied
   */
  onFiltersApplied?: () => void;
}

/**
 * SearchFilters Component
 *
 * Unified filter hub with integrated sticky header.
 * Combines search location display, service type pills, and price filter.
 *
 * Features:
 * - Sticky header with location info (clickable to edit search parameters)
 * - Horizontal scrollable service type pills (instant apply)
 * - Price range filter in bottom sheet
 * - Active filter badges with remove option
 * - URL parameter sync
 * - Same layout for mobile and desktop
 */
export function SearchFilters({ onFiltersApplied }: SearchFiltersProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for price filter (only used in sheet)
  const [priceRange, setPriceRange] = useState<[number, number]>([
    parseInt(searchParams.get('minPrice') || '0'),
    parseInt(searchParams.get('maxPrice') || '200'),
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);

  // Get current values from URL
  const currentServiceType = searchParams.get('serviceType') || '';
  const currentMinPrice = parseInt(searchParams.get('minPrice') || '0');
  const currentMaxPrice = parseInt(searchParams.get('maxPrice') || '200');
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

  // Sync price state with URL params when they change
  useEffect(() => {
    setPriceRange([
      parseInt(searchParams.get('minPrice') || '0'),
      parseInt(searchParams.get('maxPrice') || '200'),
    ]);
  }, [searchParams]);

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
   * Apply price filter from sheet
   */
  const applyPriceFilter = (): void => {
    const params = new URLSearchParams(searchParams.toString());

    if (priceRange[0] > 0) {
      params.set('minPrice', priceRange[0].toString());
    } else {
      params.delete('minPrice');
    }

    if (priceRange[1] < 200) {
      params.set('maxPrice', priceRange[1].toString());
    } else {
      params.delete('maxPrice');
    }

    router.push(`?${params.toString()}`);
    setIsOpen(false);
    onFiltersApplied?.();
  };

  /**
   * Remove service type filter
   */
  const removeServiceTypeFilter = (): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('serviceType');
    router.push(`?${params.toString()}`);
    onFiltersApplied?.();
  };

  /**
   * Remove price filter
   */
  const removePriceFilter = (): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('minPrice');
    params.delete('maxPrice');
    setPriceRange([0, 200]);
    router.push(`?${params.toString()}`);
    onFiltersApplied?.();
  };

  /**
   * Reset price in sheet without applying
   */
  const resetPriceInSheet = (): void => {
    setPriceRange([0, 200]);
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters =
    currentServiceType !== '' || currentMinPrice > 0 || currentMaxPrice < 200;

  /**
   * Check if price filter is active
   */
  const hasPriceFilter = currentMinPrice > 0 || currentMaxPrice < 200;

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

        {/* Service Type Pills - Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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

        {/* Price Filter Row - Compact */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Preis:</span>
            <span className="text-sm font-medium text-gray-900">
              {hasPriceFilter
                ? `${currentMinPrice} - ${currentMaxPrice}`
                : '0 - 200'}
            </span>
          </div>

          {/* Filter Button for extended filters */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <SlidersHorizontal className="h-4 w-4" />
                Filter
                {hasPriceFilter && (
                  <span className="w-2 h-2 bg-primary rounded-full" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-xl font-bold">
                  Preis-Filter
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6">
                {/* Price Range Slider */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold">Preis-Spanne</Label>
                  <div className="px-2 pt-4">
                    <Slider
                      min={0}
                      max={200}
                      step={5}
                      value={priceRange}
                      onValueChange={(value) =>
                        setPriceRange(value as [number, number])
                      }
                      className="wellness-slider"
                    />
                  </div>
                  <p className="text-lg text-center font-medium text-gray-900">
                    {priceRange[0]} - {priceRange[1]}
                  </p>
                </div>

                {/* Apply Button */}
                <div className="pt-4">
                  <Button onClick={applyPriceFilter} className="w-full">
                    Filter anwenden
                  </Button>
                </div>

                {/* Reset Button */}
                {(priceRange[0] > 0 || priceRange[1] < 200) && (
                  <Button
                    variant="ghost"
                    onClick={resetPriceInSheet}
                    className="w-full text-muted-foreground"
                  >
                    Preis zurücksetzen
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Active Filter Badges - Below header */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {currentServiceType && (
            <Badge
              variant="secondary"
              className="gap-1.5 pr-1 bg-gray-100 hover:bg-gray-200"
            >
              <span className="flex items-center gap-1">
                {SERVICE_TYPE_OPTIONS.find((o) => o.value === currentServiceType)
                  ?.icon}
                {SERVICE_TYPE_OPTIONS.find((o) => o.value === currentServiceType)
                  ?.label}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0.5 hover:bg-transparent"
                onClick={removeServiceTypeFilter}
                aria-label="Filter entfernen"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {hasPriceFilter && (
            <Badge
              variant="secondary"
              className="gap-1.5 pr-1 bg-gray-100 hover:bg-gray-200"
            >
              <span>
                {currentMinPrice} - {currentMaxPrice}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0.5 hover:bg-transparent"
                onClick={removePriceFilter}
                aria-label="Preis-Filter entfernen"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Search Parameter Sheet */}
      <SearchParameterSheet
        open={isSearchSheetOpen}
        onOpenChange={setIsSearchSheetOpen}
        initialValues={initialSearchValues}
      />
    </>
  );
}