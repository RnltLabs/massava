/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Studio Map Component
 * Displays a map with the studio location using OpenStreetMap
 */

'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { MapPinIcon, ExternalLinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dynamically import LeafletMap to avoid SSR issues
const LeafletMap = dynamic(() => import('./LeafletMap').then((mod) => mod.LeafletMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 rounded-lg overflow-hidden border border-border bg-gray-100 flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Karte wird geladen...</p>
    </div>
  ),
});

interface StudioMapProps {
  name: string;
  address: string;
  city: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
}

export function StudioMap({
  name,
  address,
  city,
  postalCode,
  latitude,
  longitude,
}: StudioMapProps): React.JSX.Element {
  /**
   * Opens Google Maps with the studio address
   */
  const handleOpenInMaps = (): void => {
    // If we have coordinates, use them for more precise location
    if (latitude && longitude) {
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
    } else {
      // Otherwise, use the address
      const addressQuery = encodeURIComponent(`${address}, ${postalCode || ''} ${city}`.trim());
      window.open(`https://www.google.com/maps/search/?api=1&query=${addressQuery}`, '_blank');
    }
  };

  // If we don't have coordinates, show address only without map
  if (!latitude || !longitude) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Adresse</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <MapPinIcon className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{address}</p>
              <p className="text-sm text-muted-foreground">
                {postalCode ? `${postalCode} ` : ''}
                {city}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={handleOpenInMaps}
          >
            <MapPinIcon className="h-4 w-4 mr-2" />
            In Karten öffnen
            <ExternalLinkIcon className="h-3 w-3 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Standort</h3>

      {/* Address */}
      <div className="flex items-start gap-3">
        <MapPinIcon className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium">{address}</p>
          <p className="text-sm text-muted-foreground">
            {postalCode ? `${postalCode} ` : ''}
            {city}
          </p>
        </div>
      </div>

      {/* Interactive OpenStreetMap */}
      <LeafletMap latitude={latitude} longitude={longitude} name={name} />

      {/* Open in Maps Button */}
      <Button variant="outline" size="sm" className="w-full" onClick={handleOpenInMaps}>
        <MapPinIcon className="h-4 w-4 mr-2" />
        In Google Maps öffnen
        <ExternalLinkIcon className="h-3 w-3 ml-2" />
      </Button>
    </div>
  );
}
