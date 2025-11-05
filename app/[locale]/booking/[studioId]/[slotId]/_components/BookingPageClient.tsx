"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Studio, Service, TimeSlot } from "@/app/generated/prisma"
import { BookingSheet } from "./BookingSheet"

interface BookingPageClientProps {
  studio: Studio
  services: Service[]
  timeSlot: TimeSlot
  studioId: string
  slotId: string
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
}: BookingPageClientProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  // Auto-open sheet on mount
  useEffect(() => {
    setIsOpen(true)
  }, [])

  // Handle close - navigate back to search
  const handleClose = () => {
    setIsOpen(false)
    // Small delay for closing animation
    setTimeout(() => {
      router.push("/search/appointments")
    }, 300)
  }

  return (
    <BookingSheet
      studio={studio}
      services={services}
      timeSlot={timeSlot}
      studioId={studioId}
      slotId={slotId}
      isOpen={isOpen}
      onClose={handleClose}
    />
  )
}
