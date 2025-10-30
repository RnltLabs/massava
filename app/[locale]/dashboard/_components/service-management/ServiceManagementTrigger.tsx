/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Service Management Trigger
 * Button to open service management dialog
 */

'use client';

import React, { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { type VariantProps } from 'class-variance-authority';
import { ServiceManagementDialog } from './ServiceManagementDialog';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ButtonVariants = VariantProps<typeof buttonVariants>;

interface ServiceManagementTriggerProps {
  studioId: string;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  variant?: ButtonVariants['variant'];
  size?: ButtonVariants['size'];
  className?: string;
  // For edit mode
  editService?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
}

export function ServiceManagementTrigger({
  studioId,
  buttonText = 'Service hinzufügen',
  buttonIcon,
  variant = 'default',
  size = 'default',
  className,
  editService,
}: ServiceManagementTriggerProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = (serviceId: string): void => {
    // Refresh the page to show new/updated service
    router.refresh();
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant={variant}
        size={size}
        className={className}
        style={
          variant === 'default'
            ? {
                backgroundColor: '#B56550',
              }
            : undefined
        }
      >
        {buttonIcon || <Plus className="h-5 w-5 mr-2" />}
        {buttonText}
      </Button>

      <ServiceManagementDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        studioId={studioId}
        onSuccess={handleSuccess}
        editService={editService}
      />
    </>
  );
}
