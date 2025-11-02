/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useState, type FormEvent, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LocationSearchAutocomplete } from '@/components/LocationSearchAutocomplete';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { SERVICE_TYPE_OPTIONS, type ServiceType } from '@/lib/constants/serviceTypes';

interface SearchWidgetProps {
  autoFocus?: boolean;
  placeholder?: string;
  searchButtonText?: string;
}

export function SearchWidget({
  autoFocus = false,
  placeholder = 'Stadt oder PLZ eingeben...',
  searchButtonText = 'Termine finden',
}: SearchWidgetProps): ReactElement {
  const router = useRouter();
  const [location, setLocation] = useState<string>('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [radius, setRadius] = useState<string>('20');
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | undefined>(undefined);
  const [dateTime, setDateTime] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleLocationSelect = (locationData: {
    location: string;
    lat: number;
    lng: number;
  }): void => {
    setLocation(locationData.location);
    setLat(locationData.lat);
    setLng(locationData.lng);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    // Validate required fields
    const trimmedLocation = location.trim();
    if (!trimmedLocation || !lat || !lng) {
      return; // User must select from autocomplete suggestions
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

    // Navigate to search results page
    router.push(`/search/appointments?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto wellness-shadow rounded-2xl bg-card p-4 md:p-5">
      <div className="flex flex-col gap-3">
        {/* First row: Location and Radius */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          {/* Location input with autocomplete */}
          <LocationSearchAutocomplete
            value={location}
            onChange={setLocation}
            onLocationSelect={handleLocationSelect}
            placeholder={placeholder}
            autoFocus={autoFocus}
          />

          {/* Radius dropdown */}
          <div className="w-full md:w-[140px]">
            <label htmlFor="radius-select" className="sr-only">
              Umkreis
            </label>
            <select
              id="radius-select"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border-2 border-muted focus:border-primary outline-none transition-colors text-sm bg-card cursor-pointer"
              aria-label="Suchradius auswählen"
            >
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="20">20 km</option>
              <option value="50">50 km</option>
            </select>
          </div>
        </div>

        {/* Second row: Service Type */}
        <div>
          <Label htmlFor="service-type-select" className="sr-only">
            Massage-Typ
          </Label>
          <Select
            value={selectedServiceType}
            onValueChange={(value) => setSelectedServiceType(value as ServiceType)}
          >
            <SelectTrigger
              id="service-type-select"
              className="w-full h-11 wellness-shadow"
              aria-label="Massage-Typ auswählen"
            >
              <SelectValue placeholder="Massage-Typ wählen (optional)" />
            </SelectTrigger>
            <SelectContent>
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

        {/* Third row: Date and Time */}
        <DateTimePicker
          value={dateTime}
          onChange={setDateTime}
          minDate={new Date()}
          placeholder="Datum und Uhrzeit wählen"
        />

        {/* Search button */}
        <Button
          type="submit"
          disabled={isSubmitting || !location.trim() || !lat || !lng}
          className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 transition-all wellness-shadow hover:shadow-lg text-sm"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          {isSubmitting ? 'Suche läuft...' : searchButtonText}
        </Button>
      </div>
    </form>
  );
}
