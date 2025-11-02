"use client"

import { useState } from "react"
import { ArrowLeft, ChevronRight, Search } from "lucide-react"
import type { Service } from "@/app/generated/prisma"
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
  onBack: () => void
}

/**
 * Step 2: Service Selection
 *
 * Visual service selection with search/filter capability.
 * Shows service cards with expandable descriptions.
 *
 * Features:
 * - Search/filter services by name
 * - Visual service cards with radio selection
 * - Prominent pricing and duration
 * - Expandable descriptions
 * - Continue button enabled only when service selected
 * - Back navigation to previous step
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
  onBack,
}: StepServiceProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Filter services based on search query
  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Zurück zum vorherigen Schritt"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-xl font-semibold">Behandlung wählen</h3>
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
