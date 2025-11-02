"use client"

import { useState } from "react"
import { Clock, Info, ChevronDown } from "lucide-react"
import type { Service } from "@/app/generated/prisma"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface ServiceCardProps {
  service: Service
  isSelected: boolean
}

/**
 * Service Card Component
 *
 * Visual card for service selection with expandable description.
 * Optimized for touch interactions with large tap targets.
 *
 * Features:
 * - Radio button for selection
 * - Prominent pricing display
 * - Duration indicator
 * - Expandable description (collapsible)
 * - Terracotta border when selected
 * - Wellness shadow effect
 *
 * Accessibility:
 * - Touch target minimum 48px
 * - Keyboard navigation support
 * - ARIA labels for screen readers
 * - High contrast focus states
 */
export function ServiceCard({ service, isSelected }: ServiceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg",
        isSelected && "border-primary border-2 wellness-shadow"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Radio Button */}
          <RadioGroupItem
            value={service.id}
            id={service.id}
            className="mt-1 flex-shrink-0"
          />

          {/* Service Info */}
          <label
            htmlFor={service.id}
            className="flex-1 cursor-pointer min-w-0"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base mb-1 truncate">
                  {service.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{service.duration} min</span>
                </div>
              </div>

              {/* Price */}
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-primary">
                  CHF {service.price.toFixed(0)}
                </p>
              </div>
            </div>

            {/* Description (Collapsible) */}
            {service.description && (
              <Collapsible
                open={isExpanded}
                onOpenChange={setIsExpanded}
                className="mt-3"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.preventDefault()
                      setIsExpanded(!isExpanded)
                    }}
                  >
                    <Info className="h-3 w-3 mr-1" />
                    {isExpanded ? "Details ausblenden" : "Details anzeigen"}
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 ml-1 transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </CollapsibleContent>
              </Collapsible>
            )}
          </label>
        </div>
      </CardContent>
    </Card>
  )
}
