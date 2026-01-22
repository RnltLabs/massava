"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Studio, Service } from "@/app/generated/prisma"
import { BookingSheet } from "./BookingSheet"

// Simplified TimeSlot type for dynamic slots (no DB record)
interface DynamicTimeSlot {
  startTime: Date
  endTime: Date
}

interface BookingPageClientProps {
  studio: Studio
  services: Service[]
  timeSlot: DynamicTimeSlot // Simplified type for dynamic slots
  studioId: string
  slotId: string
  preferredDateTime: string // ISO DateTime string for dynamic slots
  locale: string
  searchParams: { [key: string]: string | string[] | undefined }
}

/**
 * Booking Page Client Component
 *
 * Client-side wrapper that automatically opens the booking sheet.
 * Handles navigation back to search when sheet is closed.
 *
 * This component bridges the Server Component (page.tsx) with the
 * client-side BookingSheet component, ensuring the sheet opens
 * immediately on page load.
 */
export function BookingPageClient({
  studio,
  services,
  timeSlot,
  studioId,
  slotId,
  preferredDateTime,
  locale,
  searchParams,
}: BookingPageClientProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  // Auto-open sheet on mount
  useEffect(() => {
    setIsOpen(true)
  }, [])

  // Handle close - navigate back to search with preserved parameters
  const handleClose = () => {
    setIsOpen(false)
    // Small delay for closing animation
    setTimeout(() => {
      // Build query string from search params to preserve search context
      const params = new URLSearchParams()
      if (searchParams.location && typeof searchParams.location === 'string') {
        params.set('location', searchParams.location)
      }
      if (searchParams.lat && typeof searchParams.lat === 'string') {
        params.set('lat', searchParams.lat)
      }
      if (searchParams.lng && typeof searchParams.lng === 'string') {
        params.set('lng', searchParams.lng)
      }
      if (searchParams.radius && typeof searchParams.radius === 'string') {
        params.set('radius', searchParams.radius)
      }
      if (searchParams.datetime && typeof searchParams.datetime === 'string') {
        params.set('datetime', searchParams.datetime)
      }
      if (searchParams.serviceType && typeof searchParams.serviceType === 'string') {
        params.set('serviceType', searchParams.serviceType)
      }
      if (searchParams.minPrice && typeof searchParams.minPrice === 'string') {
        params.set('minPrice', searchParams.minPrice)
      }
      if (searchParams.maxPrice && typeof searchParams.maxPrice === 'string') {
        params.set('maxPrice', searchParams.maxPrice)
      }

      const queryString = params.toString()
      const searchUrl = `/${locale}/search/appointments${queryString ? `?${queryString}` : ''}`
      router.push(searchUrl)
    }, 300)
  }

  return (
    <BookingSheet
      studio={studio}
      services={services}
      timeSlot={timeSlot}
      studioId={studioId}
      slotId={slotId}
      preferredDateTime={preferredDateTime}
      isOpen={isOpen}
      onClose={handleClose}
      locale={locale}
      searchParams={searchParams}
    />
  )
}
