/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useState, type FormEvent, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const [radius, setRadius] = useState<string>('20');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    // Validate location is not empty
    const trimmedLocation = location.trim();
    if (!trimmedLocation) {
      return;
    }

    setIsSubmitting(true);

    // Build search params
    const params = new URLSearchParams();
    params.set('location', trimmedLocation);
    params.set('radius', radius);

    // Navigate to studios page with search params
    router.push(`/studios?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto wellness-shadow rounded-3xl bg-card p-6">
      <div className="flex flex-col gap-4">
        {/* Desktop layout: horizontal row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Location input */}
          <div className="relative flex-1">
            <label htmlFor="location-input" className="sr-only">
              Standort
            </label>
            <MapPin
              className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              id="location-input"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={placeholder}
              autoFocus={autoFocus}
              autoComplete="address-level2"
              className="w-full pl-12 pr-4 py-6 rounded-2xl border-2 border-muted focus:border-primary text-lg h-auto"
              required
              aria-label="Stadt oder Postleitzahl"
            />
          </div>

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
