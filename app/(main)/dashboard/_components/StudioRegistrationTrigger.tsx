'use client';

import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudioRegistrationDialog } from './studio-registration/StudioRegistrationDialog';
import { useRouter } from 'next/navigation';

interface StudioRegistrationTriggerProps {
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

/**
 * Trigger button component for Studio Registration dialog
 * Opens a multi-step companion-style registration flow
 */
export function StudioRegistrationTrigger({
  buttonText = 'Studio registrieren',
  buttonIcon,
  variant = 'default',
  size = 'default',
  className,
}: StudioRegistrationTriggerProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = (studioId: string): void => {
    console.log('Studio registered successfully:', studioId);

    // Dispatch custom event to notify Header component
    window.dispatchEvent(new CustomEvent('studio-registered', {
      detail: { studioId }
    }));

    // Refresh the page to show the new studio
    router.refresh();
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant={variant}
        size={size}
        className={className}
      >
        {buttonIcon || <Building2 className="h-5 w-5 mr-2" />}
        {buttonText}
      </Button>

      <StudioRegistrationDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
