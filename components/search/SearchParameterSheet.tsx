/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useState, useEffect, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { LocationSearchAutocomplete } from '@/components/LocationSearchAutocomplete';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { SERVICE_TYPE_OPTIONS, type ServiceType } from '@/lib/constants/serviceTypes';
import { cn } from '@/lib/utils';

interface SearchParameterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: {
    location: string;
    lat: number | null;
    lng: number | null;
    radius: string;
    datetime: Date | undefined;
    serviceType: string | undefined;
  };
}

const RADIUS_OPTIONS = ['5', '10', '20', '50'] as const;

export function SearchParameterSheet({
  open,
  onOpenChange,
  initialValues,
}: SearchParameterSheetProps): ReactElement {
  const router = useRouter();

  // Local form state
  const [location, setLocation] = useState<string>(initialValues.location);
  const [lat, setLat] = useState<number | null>(initialValues.lat);
  const [lng, setLng] = useState<number | null>(initialValues.lng);
  const [radius, setRadius] = useState<string>(initialValues.radius);
  const [dateTime, setDateTime] = useState<Date | undefined>(initialValues.datetime);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | undefined>(
    initialValues.serviceType as ServiceType | undefined
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync local state with initialValues when sheet opens
  useEffect(() => {
    if (open) {
      setLocation(initialValues.location);
      setLat(initialValues.lat);
      setLng(initialValues.lng);
      setRadius(initialValues.radius);
      setDateTime(initialValues.datetime);
      setSelectedServiceType(initialValues.serviceType as ServiceType | undefined);
    }
  }, [open, initialValues]);

  // Handle location selection from autocomplete
  const handleLocationSelect = (locationData: {
    location: string;
    lat: number;
    lng: number;
  }): void => {
    setLocation(locationData.location);
    setLat(locationData.lat);
    setLng(locationData.lng);
  };

  // Handle radius pill button click
  const handleRadiusClick = (radiusValue: string): void => {
    setRadius(radiusValue);
  };

  // Handle search submission
  const handleSearch = (): void => {
    // Validate required fields
    const trimmedLocation = location.trim();
    if (!trimmedLocation || !lat || !lng) {
      return; // User must select a valid location
    }

    setIsSubmitting(true);

    // Build search params
    const params = new URLSearchParams();
    params.set('location', trimmedLocation);
    params.set('lat', String(lat));
    params.set('lng', String(lng));
    params.set('radius', radius);

    if (dateTime) {
      params.set('datetime', dateTime.toISOString());
    }

    if (selectedServiceType) {
      params.set('serviceType', selectedServiceType);
    }

    // Navigate to search results
    router.push(`/search/appointments?${params.toString()}`);

    // Close the sheet
    onOpenChange(false);
    setIsSubmitting(false);
  };

  // Check if search button should be disabled
  const isSearchDisabled = !location.trim() || !lat || !lng || isSubmitting;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85dvh] max-h-[85dvh] rounded-t-3xl flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-xl font-bold text-center">
            Suche anpassen
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Location Input */}
          <div className="space-y-2">
            <Label htmlFor="location-search" className="text-sm font-semibold text-gray-900">
              Standort
            </Label>
            <LocationSearchAutocomplete
              value={location}
              onChange={setLocation}
              onLocationSelect={handleLocationSelect}
              placeholder="Stadt oder PLZ eingeben..."
              autoFocus={false}
            />
          </div>

          {/* Radius Pills */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900">
              Umkreis
            </Label>
            <div className="flex gap-2">
              {RADIUS_OPTIONS.map((radiusOption) => (
                <button
                  key={radiusOption}
                  type="button"
                  onClick={() => handleRadiusClick(radiusOption)}
                  className={cn(
                    'flex-1 h-11 rounded-xl font-medium transition-all',
                    radius === radiusOption
                      ? 'bg-[#B56550] text-white'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                  aria-label={`${radiusOption} Kilometer Umkreis`}
                  aria-pressed={radius === radiusOption}
                >
                  {radiusOption} km
                </button>
              ))}
            </div>
          </div>

          {/* Service Type Select */}
          <div className="space-y-2">
            <Label htmlFor="service-type-select" className="text-sm font-semibold text-gray-900">
              Massage-Typ
            </Label>
            <Select
              value={selectedServiceType || '__all__'}
              onValueChange={(value) => setSelectedServiceType(value === '__all__' ? undefined : value as ServiceType)}
            >
              <SelectTrigger
                id="service-type-select"
                className="w-full h-11"
                aria-label="Massage-Typ auswählen"
              >
                <SelectValue placeholder="Alle Massage-Typen" />
              </SelectTrigger>
              <SelectContent>
                {/* Default "All types" option */}
                <SelectItem value="__all__">
                  <span className="flex items-center gap-2">
                    <span>🌟</span>
                    <span>Alle Massage-Typen</span>
                  </span>
                </SelectItem>

                {/* Service type options */}
                {SERVICE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time Picker */}
          <div className="space-y-2">
            <Label htmlFor="datetime-picker" className="text-sm font-semibold text-gray-900">
              Datum & Uhrzeit (optional)
            </Label>
            <DateTimePicker
              value={dateTime}
              onChange={setDateTime}
              minDate={new Date()}
              placeholder="Datum und Uhrzeit wählen"
              showAnyDate={false}
            />
          </div>
        </div>

        {/* Search Button (fixed at bottom) */}
        <div className="px-6 pb-6 pt-4 border-t bg-background">
          <Button
            onClick={handleSearch}
            disabled={isSearchDisabled}
            className="w-full bg-[#B56550] hover:bg-[#A05540] text-white font-semibold rounded-xl h-12 text-base"
          >
            {isSubmitting ? 'Suche läuft...' : 'Suchen'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
