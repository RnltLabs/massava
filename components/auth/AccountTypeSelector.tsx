/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Account Type Selector Component
 * Two-button choice for customer vs studio owner registration/login
 */

'use client';

import { User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type AccountType = 'customer' | 'studio';

interface AccountTypeOption {
  type: AccountType;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

interface AccountTypeSelectorProps {
  onSelect: (type: AccountType) => void;
  mode: 'signup' | 'login';
  translations: {
    customer: {
      title: string;
      subtitle: string;
    };
    studio: {
      title: string;
      subtitle: string;
    };
    welcome_signup: string;
    welcome_login: string;
    subtitle_signup: string;
    subtitle_login: string;
  };
}

export function AccountTypeSelector({
  onSelect,
  mode,
  translations,
}: AccountTypeSelectorProps) {
  const options: AccountTypeOption[] = [
    {
      type: 'customer',
      icon: <User className="h-8 w-8" />,
      title: translations.customer.title,
      subtitle: translations.customer.subtitle,
    },
    {
      type: 'studio',
      icon: <Building2 className="h-8 w-8" />,
      title: translations.studio.title,
      subtitle: translations.studio.subtitle,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          {mode === 'signup' ? translations.welcome_signup : translations.welcome_login}
        </h2>
        <p className="text-sm text-muted-foreground">
          {mode === 'signup' ? translations.subtitle_signup : translations.subtitle_login}
        </p>
      </div>

      {/* Account Type Buttons */}
      <div className="space-y-3">
        {options.map((option) => (
          <Button
            key={option.type}
            variant="outline"
            size="lg"
            onClick={() => onSelect(option.type)}
            className="w-full h-auto py-6 px-6 justify-start hover:bg-accent hover:border-primary transition-all"
          >
            <div className="flex items-center gap-4 w-full">
              {/* Icon */}
              <div className="flex-shrink-0 text-primary">{option.icon}</div>

              {/* Text */}
              <div className="flex flex-col items-start text-left flex-1">
                <div className="text-lg font-semibold">{option.title}</div>
                <div className="text-sm text-muted-foreground font-normal">
                  {option.subtitle}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
