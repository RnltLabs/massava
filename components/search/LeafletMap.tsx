/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Leaflet Map Component
 * Displays an interactive OpenStreetMap with a marker
 */

'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  name: string;
}

// Fix for default marker icon in production
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

export function LeafletMap({ latitude, longitude, name }: LeafletMapProps): React.JSX.Element {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Only initialize if we haven't already and the ref is available
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize the map without zoom control
    const map = L.map(mapRef.current, {
      zoomControl: false, // Disable zoom buttons
      scrollWheelZoom: true, // Keep mouse wheel zoom
      doubleClickZoom: true, // Keep double-click zoom
      touchZoom: true, // Keep touch zoom
    }).setView([latitude, longitude], 15);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add marker
    const marker = L.marker([latitude, longitude]).addTo(map);
    marker.bindPopup(`<b>${name}</b>`).openPopup();

    mapInstanceRef.current = map;

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, name]);

  return (
    <div
      ref={mapRef}
      className="w-full h-48 rounded-lg overflow-hidden border border-border"
      style={{ zIndex: 0 }}
    />
  );
}
