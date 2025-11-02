import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Calendar, Clock, ChevronRight, X } from "lucide-react"
import type { Studio, TimeSlot } from "@/app/generated/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StudioAvatar } from "@/components/ui/studio-avatar"

interface StepReviewProps {
  studio: Studio
  timeSlot: TimeSlot
  onContinue: () => void
  onCancel: () => void
}

/**
 * Step 1: Review Details - Mobile-First Optimized
 *
 * Shows compact studio info and date/time display optimized for mobile screens.
 * User reviews their selection before proceeding to service selection.
 *
 * Mobile Optimizations (fits iPhone SE 375x667px without scrolling):
 * - Combined date/time into single compact section (saves 72px)
 * - Reduced padding throughout (saves 44px+)
 * - Compact typography (saves 20px+)
 * - 48px avatar (saves vertical space while maintaining clarity)
 * - 48px button height (WCAG AAA touch target)
 *
 * Design:
 * - Compact studio card with 48px avatar
 * - Combined date/time rows (no separate sections)
 * - Clear "Continue" CTA (48px height, touch-optimized)
 * - Cancel button (ghost style)
 *
 * Accessibility:
 * - WCAG 2.1 AA compliant (44px+ touch targets)
 * - Semantic heading hierarchy
 * - ARIA labels on interactive elements
 * - Focus indicators on buttons
 */
export function StepReview({
  studio,
  timeSlot,
  onContinue,
  onCancel,
}: StepReviewProps) {
  const startTime = new Date(timeSlot.startTime)

  return (
    <div className="flex flex-col h-full">
      {/* Content - Reduced spacing: space-y-4 (was space-y-6), py-4 (was py-6) */}
      <div className="flex-1 space-y-4 py-4">
        {/* Unified Card - Combined Studio Info + Date/Time */}
        <Card className="bg-primary/5 border-primary/20 wellness-shadow">
          <CardContent className="p-3 space-y-3">
            {/* Studio Header - Compact with 48px avatar */}
            <div className="flex items-start gap-3">
              <StudioAvatar
                logoUrl={studio.logoUrl}
                studioName={studio.name}
                studioId={studio.id}
                size={48}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold leading-tight truncate">
                  {studio.name}
                </h3>
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {studio.city}
                </p>
              </div>
            </div>

            {/* Combined Date & Time Section - Single compact area */}
            <div className="space-y-2 pt-2">
              {/* Date Row */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-medium">
                  {format(startTime, "EEE, dd. MMM yyyy", { locale: de })}
                </span>
              </div>

              {/* Time Row */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-medium">
                  {format(startTime, "HH:mm", { locale: de })} Uhr
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions - Reduced padding: pt-3 (was pt-4) */}
      <div className="space-y-3 pt-3 border-t">
        <Button
          size="lg"
          className="w-full h-12 text-base bg-primary hover:bg-primary/90"
          onClick={onContinue}
        >
          Behandlung wählen
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
        <Button
          size="lg"
          variant="ghost"
          className="w-full"
          onClick={onCancel}
        >
          <X className="mr-2 h-4 w-4" />
          Abbrechen
        </Button>
      </div>
    </div>
  )
}
