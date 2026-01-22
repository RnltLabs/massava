"use client"

import { Clock } from "lucide-react"
import type { Service } from "@/app/generated/prisma"
import { cn } from "@/lib/utils"

interface ServiceCardProps {
  service: Service
  isSelected: boolean
  onClick: () => void
}

/**
 * Service Card Component
 *
 * Einzelne auswählbare Service-Card im Booking Flow.
 * Design optimiert für klare visuelle Trennung und Auswahl-Feedback.
 *
 * Features:
 * - Eigenständige Card mit Border und Rundung
 * - Check-Icon bei Auswahl
 * - Hover/Active States für Interaktivität
 * - Preis und Dauer prominent
 *
 * Accessibility:
 * - aria-pressed für Auswahlstatus
 * - Touch target minimum 48px
 * - Keyboard navigation support
 */
export function ServiceCard({ service, isSelected, onClick }: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={cn(
        // Base styles
        "w-full flex items-start gap-3 p-4 transition-all text-left rounded-xl border-2",

        // Default: erkennbar als interaktiv
        !isSelected && [
          "bg-card border-border/50",
          "hover:border-primary/40 hover:bg-accent/30",
          "active:bg-accent/50 active:scale-[0.99]"
        ],

        // Selected: deutlich hervorgehoben
        isSelected && [
          "bg-primary/10 border-primary",
          "shadow-sm"
        ]
      )}
    >
      {/* Left: Title + Description */}
      <div className="flex-1 min-w-0">
        <span className={cn(
          "font-semibold leading-tight block",
          isSelected ? "text-primary" : "text-foreground"
        )}>
          {service.name}
        </span>
        {service.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {service.description}
          </p>
        )}
      </div>

      {/* Right: Price + Duration */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        <span className={cn(
          "font-bold text-base",
          isSelected ? "text-primary" : "text-foreground"
        )}>
          €{service.price.toFixed(0)}
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {service.duration} min
        </span>
      </div>
    </button>
  )
}
