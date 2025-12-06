"use client"

import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Calendar, Clock, MapPin } from "lucide-react"
import type { Service, Studio } from "@/app/generated/prisma"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ServiceCard } from "./ServiceCard"

// Simplified TimeSlot type for dynamic slots (no DB record)
interface DynamicTimeSlot {
  startTime: Date
  endTime: Date
}

interface StepServiceProps {
  services: Service[]
  selectedServiceId: string | null
  onServiceSelect: (serviceId: string) => void
  onContinue: () => void
  onCancel: () => void
  timeSlot: DynamicTimeSlot // Simplified type for dynamic slots
  studio: Studio
}

/**
 * Step 1: Service Selection
 *
 * Visual service selection with search/filter capability.
 * Shows service cards with expandable descriptions.
 * Displays appointment context (date, time, studio) at the top.
 *
 * Features:
 * - Context badge showing selected date/time/studio
 * - Search/filter services by name
 * - Visual service cards with radio selection
 * - Prominent pricing and duration
 * - Expandable descriptions
 * - Continue button enabled only when service selected
 * - Cancel button to close booking flow
 *
 * Accessibility:
 * - Search input properly labeled
 * - Radio group for single selection
 * - Keyboard navigation support
 * - Focus management on step change
 */
export function StepService({
  services,
  selectedServiceId,
  onServiceSelect,
  onContinue,
  onCancel,
  timeSlot,
  studio,
}: StepServiceProps) {
  const startTime = new Date(timeSlot.startTime)

  // Handle service selection - select and immediately continue
  const handleServiceClick = (serviceId: string) => {
    onServiceSelect(serviceId)
    // Small delay to show selection before continuing
    setTimeout(() => onContinue(), 150)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Section Title */}
      <h3 className="text-lg font-semibold mt-1 mb-3">Service wählen</h3>

      {/* Context Badge - Shows selected date/time/studio */}
      <div className="bg-accent/10 border-l-4 border-primary p-3 mb-4 rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
          <span>{format(startTime, "EEE, dd. MMM yyyy", { locale: de })}</span>
          <span className="text-muted-foreground">•</span>
          <Clock className="h-4 w-4 text-primary flex-shrink-0" />
          <span>{format(startTime, "HH:mm", { locale: de })} Uhr</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{studio.name}</span>
        </div>
      </div>

      {/* Service List (Scrollable) */}
      <ScrollArea className="flex-1">
        {services.length > 0 ? (
          <div className="space-y-2 pb-4">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedServiceId === service.id}
                onClick={() => handleServiceClick(service.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Keine Services verfügbar
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
