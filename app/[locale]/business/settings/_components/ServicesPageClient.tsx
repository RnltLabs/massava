/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React from 'react';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, Edit2Icon, Trash2Icon, ClockIcon } from 'lucide-react';
import { ServiceManagementDialog } from '@/app/[locale]/dashboard/_components/service-management/ServiceManagementDialog';
import { ServiceDeleteDialog } from './ServiceDeleteDialog';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  category?: string | null;
}

interface ServicesPageClientProps {
  services: Service[];
  studioId: string;
  locale: string;
}

export function ServicesPageClient({ services, studioId, locale }: ServicesPageClientProps): React.JSX.Element {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const handleAddService = (): void => {
    setSelectedService(null);
    setIsDialogOpen(true);
  };

  const handleEditService = (service: Service): void => {
    setSelectedService(service);
    setIsDialogOpen(true);
  };

  const handleDeleteService = (service: Service): void => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="fixed inset-0 top-14 bottom-0 flex flex-col bg-neutral-50 md:static md:h-full md:top-auto">
      {/* Fixed Header Section with backdrop blur - Everything above the divider line */}
      <div className="flex-shrink-0 px-4 pt-4 pb-6 md:px-0 md:pt-0 md:pb-6 backdrop-blur-lg bg-neutral-50/95 sticky top-0 z-10">
        <PageHeader
          title="Services verwalten"
          subtitle="Verwalten Sie Ihre Service-Angebote"
          breadcrumb="Services"
          backHref={`/${locale}/business/settings`}
          backLabel="Einstellungen"
          showBackButton={true}
          actionPlacement="stacked"
          actions={
            <Button
              onClick={handleAddService}
              size="sm"
              className="w-full md:w-auto h-11 md:h-10"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Hinzufügen
            </Button>
          }
        />
      </div>

      {/* Scrollable Section - Only service cards list */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 md:px-0 md:pb-0">
        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-medium text-neutral-900 mb-2">Noch keine Services</p>
            <p className="text-sm text-muted-foreground mb-4">
              Fügen Sie Ihren ersten Service hinzu, um zu beginnen
            </p>
            <Button onClick={handleAddService}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Service hinzufügen
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-card",
                  "transition-all duration-300",
                  "hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20"
                )}
              >
                {/* Price Badge - Top Right */}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full">
                    €{service.price.toFixed(2)}
                  </Badge>
                </div>

                {/* Content */}
                <div className="p-5 pr-24">
                  <h3 className="text-lg font-semibold text-foreground">
                    {service.name}
                  </h3>

                  <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                    <ClockIcon className="h-4 w-4" />
                    <span>{service.duration} Min</span>
                  </div>

                  {service.description && (
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  {service.category && (
                    <Badge variant="outline" className="mt-3 rounded-full">
                      {service.category}
                    </Badge>
                  )}
                </div>

                {/* Actions - Bottom */}
                <div className="flex items-center justify-end gap-1 px-4 pb-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditService(service)}
                    className="text-primary hover:bg-primary/10"
                  >
                    <Edit2Icon className="h-4 w-4 mr-1.5" />
                    Bearbeiten
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteService(service)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Add Service Card */}
            <button
              onClick={handleAddService}
              className={cn(
                "flex flex-col items-center justify-center gap-3",
                "min-h-[220px] rounded-2xl border-2 border-dashed border-border",
                "bg-muted/30 transition-all duration-300",
                "hover:border-primary/50 hover:bg-primary/5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              )}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <PlusIcon className="h-7 w-7 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Service hinzufügen
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Service Management Dialog (Companion Style - Create/Edit) */}
      <ServiceManagementDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        studioId={studioId}
        editService={selectedService ? {
          id: selectedService.id,
          name: selectedService.name,
          duration: selectedService.duration,
          price: selectedService.price,
        } : undefined}
        onSuccess={() => {
          setIsDialogOpen(false);
          // Page will auto-refresh via router.refresh() in the dialog
        }}
      />

      {/* Delete Confirmation Dialog */}
      {selectedService && (
        <ServiceDeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          service={selectedService}
        />
      )}
    </div>
  );
}
