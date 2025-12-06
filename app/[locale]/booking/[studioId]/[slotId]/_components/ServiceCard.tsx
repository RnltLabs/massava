"use client"

import { Clock } from "lucide-react"
import type { Service } from "@/app/generated/prisma"
import { cn } from "@/lib/utils"
import { RadioGroupItem } from "@/components/ui/radio-group"

interface ServiceCardProps {
  service: Service
  isSelected: boolean
  showBorder?: boolean
}

/**
 * Compact Service List Item
 *
 * Kompaktes Listen-Item für Service-Auswahl im Booking Flow.
 * Design basiert auf SettingsListItem für konsistentes, platzsparendes Layout.
 *
 * Features:
 * - Radio button für Auswahl (links)
 * - Service Name prominent
 * - Duration + Price kompakt in einer Zeile
 * - Optionale Description (truncated)
 * - Border-bottom Separatoren statt separate Cards
 *
 * Accessibility:
 * - Touch target minimum 48px
 * - Keyboard navigation support
 * - ARIA labels for screen readers
 */
export function ServiceCard({ service, isSelected, showBorder = true }: ServiceCardProps) {
  return (
    <label
      htmlFor={service.id}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
        isSelected
          ? "bg-primary/5"
          : "hover:bg-accent/50 active:bg-accent",
        showBorder && "border-b border-border last:border-b-0"
      )}
    >
      {/* Radio Button */}
      <RadioGroupItem
        value={service.id}
        id={service.id}
        className="shrink-0"
      />

      {/* Service Icon mit farbigem Background */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10"
        aria-hidden="true"
      >
        <Clock className="h-4 w-4 text-primary" />
      </div>

      {/* Service Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-foreground truncate">
          {service.name}
        </p>
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <span>{service.duration} min</span>
          {service.description && (
            <>
              <span>•</span>
              <span className="truncate">{service.description}</span>
            </>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="shrink-0 text-right">
        <p className="text-[15px] font-semibold text-primary">
          €{service.price.toFixed(0)}
        </p>
      </div>
    </label>
  )
}
