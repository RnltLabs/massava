"use client"

import { useState } from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { X, ChevronRight, Search, Calendar, Clock, MapPin } from "lucide-react"
import type { Service, Studio, TimeSlot } from "@/app/generated/prisma"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ServiceCard } from "./ServiceCard"

interface StepServiceProps {
  services: Service[]
  selectedServiceId: string | null
  onServiceSelect: (serviceId: string) => void
  onContinue: () => void
  onCancel: () => void
  timeSlot: TimeSlot
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
  const [searchQuery, setSearchQuery] = useState("")
  const startTime = new Date(timeSlot.startTime)

  // Filter services based on search query
  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header with Cancel Button */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          aria-label="Buchung abbrechen"
        >
          <X className="h-5 w-5" />
        </Button>
        <h3 className="text-xl font-semibold">Behandlung wählen</h3>
      </div>

      {/* Context Badge - Shows selected date/time/studio */}
      <div className="bg-accent/10 border-l-4 border-primary p-3 mb-4 rounded-r-lg">
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

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Behandlung suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12"
          aria-label="Behandlungen durchsuchen"
        />
      </div>

      {/* Service List (Scrollable) */}
      <ScrollArea className="flex-1 -mx-6 px-6">
        <RadioGroup
          value={selectedServiceId || undefined}
          onValueChange={onServiceSelect}
          className="space-y-3 pb-4"
        >
          {filteredServices.length > 0 ? (
            filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedServiceId === service.id}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Keine Behandlungen gefunden
              </p>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="mt-2"
                >
                  Suche zurücksetzen
                </Button>
              )}
            </div>
          )}
        </RadioGroup>
      </ScrollArea>

      {/* Actions */}
      <div className="space-y-3 pt-4 border-t mt-4">
        <Button
          size="lg"
          className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
          onClick={onContinue}
          disabled={!selectedServiceId}
        >
          Weiter
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
