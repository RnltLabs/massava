/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon, SparklesIcon } from 'lucide-react';
import { ServiceManagementDialog } from '@/app/[locale]/dashboard/_components/service-management/ServiceManagementDialog';
import { ServiceDeleteDialog } from './ServiceDeleteDialog';
import { PageHeader } from '@/components/ui/page-header';
import { SettingsSection, ServiceListItem } from '@/components/business/settings';

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

  const formatDuration = (duration: number): string => {
    if (duration < 60) return `${duration} Min`;
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    if (mins === 0) return `${hours} Std`;
    return `${hours} Std ${mins} Min`;
  };

  const formatPrice = (price: number): string => {
    return `€${price.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 top-14 bottom-0 flex flex-col bg-neutral-50 md:static md:h-full md:top-auto">
      {/* Fixed Header Section with backdrop blur */}
      <div className="flex-shrink-0 px-4 pt-4 pb-6 md:px-0 md:pt-0 md:pb-6 backdrop-blur-lg bg-neutral-50/95 sticky top-0 z-10">
        <PageHeader
          title="Services verwalten"
          subtitle="Verwalte deine Service-Angebote"
          breadcrumb="Services"
          backHref={`/${locale}/business/settings`}
          backLabel="Einstellungen"
          showBackButton={true}
        />
      </div>

      {/* Scrollable Content - iOS-style List */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 md:px-0 md:pb-8">
        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center max-w-2xl mx-auto">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 mb-4">
              <SparklesIcon className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-lg font-medium text-neutral-900 mb-2">Noch keine Services</p>
            <p className="text-sm text-muted-foreground mb-6">
              Füge deinen ersten Service hinzu, um zu beginnen
            </p>
            <Button onClick={handleAddService} size="lg">
              <PlusIcon className="mr-2 h-5 w-5" />
              Service hinzufügen
            </Button>
          </div>
        ) : (
          <div className="space-y-6 max-w-2xl mx-auto">
            {/* Services Section */}
            <SettingsSection title="Deine Services">
              {services.map((service) => (
                <ServiceListItem
                  key={service.id}
                  icon={SparklesIcon}
                  iconBg="bg-orange-100"
                  iconColor="text-orange-600"
                  label={service.name}
                  description={formatDuration(service.duration)}
                  preview={formatPrice(service.price)}
                  onClick={() => handleEditService(service)}
                  onDelete={() => handleDeleteService(service)}
                />
              ))}
            </SettingsSection>

            {/* Add Service Button */}
            <div className="px-4">
              <Button
                onClick={handleAddService}
                size="lg"
                className="w-full h-12"
              >
                <PlusIcon className="mr-2 h-5 w-5" />
                Service hinzufügen
              </Button>
            </div>
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
