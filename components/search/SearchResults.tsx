/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import { useEffect, useState } from 'react';
import { MapPin, Clock, Phone, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
  } | null;
}

interface StudioResult {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  postalCode: string | null;
  phone: string;
  email: string;
  distance: number;
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    duration: number;
  }>;
  availableSlots: TimeSlot[];
}

interface SearchResultsResponse {
  success: boolean;
  results: StudioResult[];
  meta: {
    total: number;
    radius: number;
    center: { lat: number; lng: number };
  };
}

interface SearchResultsProps {
  searchParams: {
    location?: string;
    lat?: string;
    lng?: string;
    radius?: string;
    datetime?: string;
  };
}

export function SearchResults({ searchParams }: SearchResultsProps) {
  const [results, setResults] = useState<StudioResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build query string
        const params = new URLSearchParams();
        if (searchParams.location) params.set('location', searchParams.location);
        if (searchParams.lat) params.set('lat', searchParams.lat);
        if (searchParams.lng) params.set('lng', searchParams.lng);
        if (searchParams.radius) params.set('radius', searchParams.radius);
        if (searchParams.datetime) params.set('datetime', searchParams.datetime);

        const response = await fetch(`/api/search/appointments?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch search results');
        }

        const data: SearchResultsResponse = await response.json();
        setResults(data.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="wellness-shadow rounded-3xl bg-card p-6 animate-pulse"
          >
            <div className="h-6 bg-muted rounded w-1/3 mb-4" />
            <div className="h-4 bg-muted rounded w-2/3 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="wellness-shadow rounded-3xl bg-card p-8 text-center">
        <p className="text-destructive font-medium mb-2">Fehler beim Laden der Ergebnisse</p>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="wellness-shadow rounded-3xl bg-card p-8 text-center">
        <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Keine Studios gefunden</h3>
        <p className="text-muted-foreground">
          Leider konnten wir keine verfügbaren Termine in Ihrer Nähe finden.
          Versuchen Sie es mit einem größeren Suchradius oder einem anderen Datum.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {results.map((studio) => (
        <div
          key={studio.id}
          className="wellness-shadow rounded-3xl bg-card p-6 hover:shadow-lg transition-shadow"
        >
          {/* Studio Info */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{studio.name}</h2>
              {studio.description && (
                <p className="text-muted-foreground mb-3">{studio.description}</p>
              )}

              {/* Address */}
              <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  {studio.address}
                  <br />
                  {studio.postalCode} {studio.city}
                </div>
              </div>

              {/* Contact */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {studio.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {studio.email}
                </div>
              </div>
            </div>

            {/* Distance Badge */}
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap ml-4">
              {studio.distance} km
            </div>
          </div>

          {/* Services */}
          {studio.services.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Angebotene Services:</h3>
              <div className="flex flex-wrap gap-2">
                {studio.services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-muted px-3 py-1 rounded-full text-sm"
                  >
                    {service.name} - {service.price}€ ({service.duration} Min.)
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Time Slots */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Verfügbare Termine ({studio.availableSlots.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {studio.availableSlots.slice(0, 8).map((slot) => {
                const startDate = new Date(slot.startTime);
                const dateStr = startDate.toLocaleDateString('de-DE', {
                  weekday: 'short',
                  day: '2-digit',
                  month: '2-digit',
                });
                const timeStr = startDate.toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <Button
                    key={slot.id}
                    variant="outline"
                    className="flex flex-col items-start gap-1 h-auto py-3 px-4 hover:bg-primary/10 hover:border-primary transition-colors"
                  >
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {dateStr}
                    </div>
                    <div className="font-semibold">{timeStr}</div>
                    {slot.service && (
                      <div className="text-xs text-muted-foreground truncate w-full">
                        {slot.service.name}
                      </div>
                    )}
                  </Button>
                );
              })}
            </div>
            {studio.availableSlots.length > 8 && (
              <p className="text-sm text-muted-foreground mt-3">
                + {studio.availableSlots.length - 8} weitere Termine verfügbar
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
