import { format } from "date-fns"
import { de } from "date-fns/locale"
import { MapPin, Clock, Euro } from "lucide-react"
import type { Studio, Service, TimeSlot } from "@/app/generated/prisma"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { StudioAvatar } from "@/components/ui/studio-avatar"
import { Separator } from "@/components/ui/separator"

interface StudioInfoCardProps {
  studio: Studio & { services: Service[] }
  timeSlot: TimeSlot
}

/**
 * Studio Info Card Component
 *
 * Displays studio information and selected time slot details
 * on the booking page. Sticky on desktop for better UX.
 *
 * Features:
 * - Studio name, location, and avatar
 * - Selected time slot (date + time)
 * - Available services with pricing
 * - Responsive design (mobile-first)
 */
export function StudioInfoCard({ studio, timeSlot }: StudioInfoCardProps) {
  const startTime = new Date(timeSlot.startTime)

  return (
    <Card className="wellness-shadow lg:sticky lg:top-8 h-fit">
      <CardHeader>
        <div className="flex items-center gap-4">
          <StudioAvatar
            logoUrl={studio.logoUrl}
            studioName={studio.name}
            studioId={studio.id}
            size={64}
          />
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate">{studio.name}</CardTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {studio.address}, {studio.city}
              </span>
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Selected TimeSlot */}
        <div className="bg-secondary/20 rounded-lg p-4 border border-secondary">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Ausgewählter Termin
          </h3>
          <p className="text-base font-medium text-muted-foreground">
            {format(startTime, "EEEE, dd. MMMM yyyy", { locale: de })}
          </p>
          <p className="text-3xl font-bold text-primary mt-1">
            {format(startTime, "HH:mm", { locale: de })} Uhr
          </p>
        </div>

        <Separator />

        {/* Available Services */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Euro className="h-4 w-4" />
            Verfügbare Leistungen
          </h3>
          {studio.services.length > 0 ? (
            <div className="space-y-2">
              {studio.services.map((service) => (
                <div
                  key={service.id}
                  className="flex justify-between items-start gap-4 p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{service.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {service.duration} Minuten
                    </p>
                  </div>
                  <p className="font-semibold text-primary whitespace-nowrap">
                    {service.price.toFixed(2)} €
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Keine Leistungen verfügbar
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
