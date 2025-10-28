/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useState, type FormEvent, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';

interface SearchWidgetProps {
  autoFocus?: boolean;
  placeholder?: string;
  searchButtonText?: string;
}

interface LocationData {
  lat: number;
  lng: number;
}

export function SearchWidget({
  autoFocus = false,
  placeholder = 'Stadt oder PLZ eingeben...',
  searchButtonText = 'Termine finden',
}: SearchWidgetProps): ReactElement {
  const router = useRouter();
  const [location, setLocation] = useState<string>('');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [radius, setRadius] = useState<string>('20');
  const [dateTime, setDateTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Get minimum datetime (now)
  const getMinDateTime = (): string => {
    const now = new Date();
    // Format: YYYY-MM-DDTHH:mm
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleLocationChange = (value: string, location?: { lat: number; lng: number }): void => {
    setLocation(value);
    if (location) {
      setLocationData({ lat: location.lat, lng: location.lng });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    // Validate required fields
    const trimmedLocation = location.trim();
    if (!trimmedLocation) {
      return;
    }

    setIsSubmitting(true);

    // Build search params
    const params = new URLSearchParams();
    params.set('location', trimmedLocation);
    params.set('radius', radius);

    if (locationData) {
      params.set('lat', String(locationData.lat));
      params.set('lng', String(locationData.lng));
    }

    if (dateTime) {
      params.set('datetime', dateTime);
    }

    // Navigate to search results page
    router.push(`/search/appointments?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto wellness-shadow rounded-3xl bg-card p-6">
      <div className="flex flex-col gap-4">
        {/* First row: Location and Radius */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Location input with autocomplete */}
          <LocationAutocomplete
            value={location}
            onChange={handleLocationChange}
            placeholder={placeholder}
            autoFocus={autoFocus}
          />

          {/* Radius dropdown */}
          <div className="sm:w-auto">
            <label htmlFor="radius-select" className="sr-only">
              Umkreis
            </label>
            <select
              id="radius-select"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-full sm:w-auto px-4 py-6 rounded-2xl border-2 border-muted focus:border-primary outline-none transition-colors text-lg bg-card cursor-pointer min-h-[56px]"
              aria-label="Suchradius auswählen"
            >
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="20">20 km</option>
              <option value="50">50 km</option>
            </select>
          </div>
        </div>

        {/* Second row: Date and Time */}
        <div className="relative flex-1">
          <label htmlFor="datetime-input" className="sr-only">
            Datum und Uhrzeit
          </label>
          <Calendar
            className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10"
            aria-hidden="true"
          />
          <Input
            id="datetime-input"
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            min={getMinDateTime()}
            className="w-full pl-12 pr-4 py-6 rounded-2xl border-2 border-muted focus:border-primary text-lg h-auto"
            aria-label="Datum und Uhrzeit auswählen"
          />
        </div>

        {/* Search button */}
        <Button
          type="submit"
          disabled={isSubmitting || !location.trim()}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all wellness-shadow hover:shadow-lg h-auto text-lg"
        >
          <Search className="h-5 w-5" aria-hidden="true" />
          {isSubmitting ? 'Suche läuft...' : searchButtonText}
        </Button>
      </div>
    </form>
  );
}
