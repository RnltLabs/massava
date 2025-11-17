/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import type { Studio, Service, TimeSlot } from '@/app/generated/prisma';
import type { ServiceType } from '@/lib/constants/serviceTypes';

/**
 * Time Slot with Service Information (as returned by API)
 * Note: startTime and endTime are ISO strings, not Date objects
 */
export interface TimeSlotWithService {
  id: string;
  startTime: string; // ISO datetime string
  endTime: string; // ISO datetime string
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
  } | null;
}

/**
 * Studio with all related data for search results
 */
export interface SearchResultStudio {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  galleryImages?: unknown | null;
  address: string;
  city: string;
  postalCode: string | null;
  phone: string;
  email: string;
  website?: string | null;
  openingHours?: unknown | null;
  latitude?: number | null;
  longitude?: number | null;
  distance: number;
  services: Service[];
  matchedServices: Service[];
  minPrice: number;
  availableSlots: TimeSlotWithService[];
}

/**
 * Search Parameters for Appointment API
 */
export interface SearchParams {
  location: string;
  lat: number;
  lng: number;
  radius: number;
  datetime?: string;
  serviceType?: ServiceType;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Search Response from API
 */
export interface SearchResponse {
  success: boolean;
  results: SearchResultStudio[];
  meta: {
    total: number;
    radius: number;
    center: {
      lat: number;
      lng: number;
    };
    filters?: {
      serviceType?: ServiceType;
      minPrice?: number;
      maxPrice?: number;
    };
  };
}

/**
 * Booking Creation Request
 */
export interface CreateBookingRequest {
  timeSlotId: string;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
}

/**
 * Booking Details for Confirmation
 */
export interface BookingDetails {
  id: string;
  studio: {
    id: string;
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
  };
  service: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    duration: number;
  };
  timeSlot: {
    id: string;
    startTime: Date;
    endTime: Date;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: Date;
}
