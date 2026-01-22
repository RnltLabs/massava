import { cn } from "@/lib/utils"

interface ProgressDotsProps {
  current: number
  total: number
}

/**
 * Progress Dots Component
 *
 * Visual progress indicator showing current step in multi-step flow.
 * Active steps are highlighted with terracotta color and expanded width.
 *
 * Accessibility:
 * - role="progressbar" for screen readers
 * - aria-valuenow, aria-valuemin, aria-valuemax for step count
 * - aria-label with human-readable description
 */
export function ProgressDots({ current, total }: ProgressDotsProps) {
  return (
    <div
      className="flex items-center justify-center gap-2 mb-2"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Schritt ${current} von ${total}`}
    >
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            index < current
              ? "bg-primary w-8" // Active/completed dots (terracotta)
              : "bg-muted w-2" // Inactive dots
          )}
        />
      ))}
    </div>
  )
}
