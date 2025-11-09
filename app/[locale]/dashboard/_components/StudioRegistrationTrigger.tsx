'use client';

import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudioRegistrationDialog } from './studio-registration/StudioRegistrationDialog';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface StudioRegistrationTriggerProps {
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  externalTrigger?: boolean;
  onExternalTriggerChange?: (open: boolean) => void;
}

/**
 * Trigger button component for Studio Registration dialog
 * Opens a multi-step companion-style registration flow
 * Supports external control via externalTrigger prop for resume functionality
 */
export function StudioRegistrationTrigger({
  buttonText = 'Studio registrieren',
  buttonIcon,
  variant = 'default',
  size = 'default',
  className,
  externalTrigger,
  onExternalTriggerChange,
}: StudioRegistrationTriggerProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { update } = useSession();

  // Handle external trigger (for resume functionality)
  useEffect(() => {
    if (externalTrigger !== undefined) {
      setIsOpen(externalTrigger);
    }
  }, [externalTrigger]);

  const handleSuccess = async (studioId: string): Promise<void> => {
    console.log('Studio registered successfully:', studioId);

    // Update session to set hasStudio flag
    await update({ hasStudio: true });

    // Dispatch custom event to notify Header component
    window.dispatchEvent(new CustomEvent('studio-registered', {
      detail: { studioId }
    }));

    // Refresh the page to show the new studio
    router.refresh();
  };

  const handleClose = (): void => {
    setIsOpen(false);
    onExternalTriggerChange?.(false);
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

      {isOpen && (
        <StudioRegistrationDialog
          key="studio-registration-dialog"
          isOpen={isOpen}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
