/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { SERVICE_TYPE_OPTIONS } from '@/lib/constants/serviceTypes';

interface SearchFiltersProps {
  /**
   * Optional callback when filters are applied
   */
  onFiltersApplied?: () => void;
}

/**
 * SearchFilters Component
 *
 * Mobile-first filter UI with bottom sheet for mobile and sidebar for desktop.
 * Allows users to filter search results by service type and price range.
 *
 * Features:
 * - Mobile: Bottom sheet (80vh height)
 * - Desktop: Sidebar card (> 1024px)
 * - Service type select with icons
 * - Price range slider (€0-€200)
 * - Active filter badges
 * - URL parameter sync
 */
export function SearchFilters({ onFiltersApplied }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // State for filters
  const [serviceType, setServiceType] = useState(searchParams.get('serviceType') || '');
  const [priceRange, setPriceRange] = useState<[number, number]>([
    parseInt(searchParams.get('minPrice') || '0'),
    parseInt(searchParams.get('maxPrice') || '200'),
  ]);
  const [isOpen, setIsOpen] = useState(false);

  // Sync state with URL params when they change
  useEffect(() => {
    setServiceType(searchParams.get('serviceType') || '');
    setPriceRange([
      parseInt(searchParams.get('minPrice') || '0'),
      parseInt(searchParams.get('maxPrice') || '200'),
    ]);
  }, [searchParams]);

  /**
   * Apply filters by updating URL params
   */
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    // Service type
    if (serviceType) {
      params.set('serviceType', serviceType);
    } else {
      params.delete('serviceType');
    }

    // Price range
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
   * Remove a specific filter
   */
  const removeFilter = (filterType: 'serviceType' | 'priceRange') => {
    const params = new URLSearchParams(searchParams.toString());

    if (filterType === 'serviceType') {
      params.delete('serviceType');
      setServiceType('');
    } else if (filterType === 'priceRange') {
      params.delete('minPrice');
      params.delete('maxPrice');
      setPriceRange([0, 200]);
    }

    router.push(`?${params.toString()}`);
  };

  /**
   * Clear all filters
   */
  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('serviceType');
    params.delete('minPrice');
    params.delete('maxPrice');

    setServiceType('');
    setPriceRange([0, 200]);

    router.push(`?${params.toString()}`);
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters =
    serviceType !== '' || priceRange[0] > 0 || priceRange[1] < 200;

  /**
   * Filter content (shared between mobile and desktop)
   */
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Service Type Select */}
      <div className="space-y-3">
        <Label htmlFor="service-type" className="text-sm font-semibold">
          Massage-Typ
        </Label>
        <Select value={serviceType || undefined} onValueChange={setServiceType}>
          <SelectTrigger id="service-type">
            <SelectValue placeholder="Alle Typen" />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2">
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range Slider */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Preis-Spanne</Label>
        <div className="px-2 pt-4">
          <Slider
            min={0}
            max={200}
            step={5}
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            className="wellness-slider"
          />
        </div>
        <p className="text-sm text-muted-foreground text-center font-medium">
          €{priceRange[0]} - €{priceRange[1]}
        </p>
      </div>

      {/* Apply Button */}
      <div className="pt-2">
        <Button onClick={applyFilters} className="w-full">
          Filter anwenden
        </Button>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={clearAllFilters}
          className="w-full text-muted-foreground"
        >
          Alle Filter zurücksetzen
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {serviceType && (
            <Badge variant="secondary" className="gap-1.5 pr-1">
              <span className="flex items-center gap-1">
                {SERVICE_TYPE_OPTIONS.find((o) => o.value === serviceType)?.icon}
                {SERVICE_TYPE_OPTIONS.find((o) => o.value === serviceType)?.label}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0.5 hover:bg-transparent"
                onClick={() => removeFilter('serviceType')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {(priceRange[0] > 0 || priceRange[1] < 200) && (
            <Badge variant="secondary" className="gap-1.5 pr-1">
              <span>
                €{priceRange[0]} - €{priceRange[1]}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0.5 hover:bg-transparent"
                onClick={() => removeFilter('priceRange')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Desktop: Sidebar */}
      {isDesktop ? (
        <Card className="wellness-shadow rounded-3xl p-6 sticky top-8">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">Filter</h3>
          </div>
          <FilterContent />
        </Card>
      ) : (
        /* Mobile: Bottom Sheet */
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 relative"
            >
              <Filter className="h-4 w-4" />
              Filter
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
              )}
            </Button>
          </SheetTrigger>

          <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-xl font-bold">Filter</SheetTitle>
            </SheetHeader>
            <FilterContent />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
