/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

'use client';

import React from 'react';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, Edit2Icon, Trash2Icon } from 'lucide-react';
import { ServiceManagementDialog } from '@/app/[locale]/dashboard/_components/service-management/ServiceManagementDialog';
import { ServiceDeleteDialog } from './ServiceDeleteDialog';

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
}

export function ServicesPageClient({ services, studioId }: ServicesPageClientProps): React.JSX.Element {
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
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Services</h1>
            <p className="text-muted-foreground mt-1">Manage your studio's service offerings</p>
          </div>
          <Button onClick={handleAddService}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>

        {/* Services List */}
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
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{service.name}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditService(service)}
                        aria-label={`Edit ${service.name}`}
                      >
                        <Edit2Icon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteService(service)}
                        aria-label={`Delete ${service.name}`}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-medium">€{service.price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">{service.duration} minutes</span>
                    </div>
                    {service.category && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Category</span>
                        <span className="font-medium">{service.category}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
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
    </>
  );
}
