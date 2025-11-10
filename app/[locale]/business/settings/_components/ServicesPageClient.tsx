/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React from 'react';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, Edit2Icon, Trash2Icon } from 'lucide-react';
import { ServiceManagementDialog } from '@/app/[locale]/dashboard/_components/service-management/ServiceManagementDialog';
import { ServiceDeleteDialog } from './ServiceDeleteDialog';
import { PageHeader } from '@/components/ui/page-header';

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
    <>
      {/* Fixed container - takes full viewport height minus navigation */}
      <div className="h-full flex flex-col">
        {/* Fixed Header Section - Everything above the divider line */}
        <div className="flex-shrink-0">
          <PageHeader
            title="Services verwalten"
            subtitle="Verwalten Sie Ihre Service-Angebote"
            breadcrumb="Einstellungen"
            backHref={`/${locale}/business/more`}
            backLabel="Einstellungen"
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
          {/* Divider line */}
          <hr className="my-6 border-border" />
        </div>

        {/* Scrollable Section - Only service cards list */}
        <div className="flex-1 overflow-y-auto">
          {services.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-medium text-neutral-900 mb-2">No services yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first service to get started
              </p>
              <Button onClick={handleAddService}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <div
                key={service.id}
                className="group relative flex min-h-[120px] flex-col justify-center overflow-hidden rounded-[1.5rem] border border-border bg-background p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                {/* Header: Name + Price/Duration */}
                <div className="mb-3 flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {service.name}
                  </h3>
                  <div className="shrink-0 text-right">
                    <span className="whitespace-nowrap text-base font-medium text-primary">
                      €{service.price.toFixed(2)} • {service.duration} Min
                    </span>
                  </div>
                </div>

                {/* Description */}
                {service.description && (
                  <p className="mb-3 line-clamp-1 text-sm text-muted-foreground">
                    {service.description}
                  </p>
                )}

                {/* Footer: Category + Actions */}
                <div className="flex items-center justify-between gap-4">
                  {/* Category Badge */}
                  <div className="flex items-center gap-2">
                    {service.category && (
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/20"
                      >
                        {service.category}
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEditService(service)}
                      className="h-8 gap-1.5 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Edit2Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Bearbeiten</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteService(service)}
                      aria-label={`${service.name} löschen`}
                      className="h-8 w-8 rounded-xl bg-muted p-0 transition-colors hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
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
    </>
  );
}
