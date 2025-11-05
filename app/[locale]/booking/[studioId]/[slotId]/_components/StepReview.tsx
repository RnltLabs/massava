import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Calendar, Clock, ChevronRight, X } from "lucide-react"
import type { Studio, TimeSlot } from "@/app/generated/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { StudioAvatar } from "@/components/ui/studio-avatar"

interface StepReviewProps {
  studio: Studio
  timeSlot: TimeSlot
  onContinue: () => void
  onCancel: () => void
}

/**
 * Step 1: Review Details
 *
 * Shows compact studio info and prominent date/time display.
 * User reviews their selection before proceeding to service selection.
 *
 * Design:
 * - Compact studio card (1 line with avatar)
 * - Large, prominent date/time card with terracotta accent
 * - Clear "Continue" CTA (56px height, touch-optimized)
 * - Cancel button (ghost style)
 *
 * Accessibility:
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
      {/* Content */}
      <div className="flex-1 space-y-6 py-6">
        {/* Compact Studio Info */}
        <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-xl">
          <StudioAvatar
            logoUrl={studio.logoUrl}
            studioName={studio.name}
            studioId={studio.id}
            size={40}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{studio.name}</p>
            <p className="text-sm text-muted-foreground truncate">
              {studio.city}
            </p>
          </div>
        </div>

        {/* Prominent Date/Time Card */}
        <Card className="bg-primary/5 border-primary/20 wellness-shadow">
          <CardContent className="pt-6 space-y-4">
            {/* Date */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Datum</p>
                <p className="text-lg font-semibold mt-0.5">
                  {format(startTime, "EEEE, dd. MMMM yyyy", { locale: de })}
                </p>
              </div>
            </div>

            <Separator className="bg-primary/20" />

            {/* Time */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Uhrzeit</p>
                <p className="text-lg font-semibold mt-0.5">
                  {format(startTime, "HH:mm", { locale: de })} Uhr
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-4 border-t">
        <Button
          size="lg"
          className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
          onClick={onContinue}
        >
          Behandlung wählen
          <ChevronRight className="ml-2 h-5 w-5" />
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
