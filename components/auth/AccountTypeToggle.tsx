/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Account Type Toggle Component
 * Small toggle at top of form to switch between customer/studio if user misclicked
 */

'use client';

import { User, Building2 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { AccountType } from './AccountTypeSelector';

interface AccountTypeToggleProps {
  value: AccountType;
  onChange: (value: AccountType) => void;
  translations: {
    customer: string;
    studio: string;
  };
}

export function AccountTypeToggle({
  value,
  onChange,
  translations,
}: AccountTypeToggleProps) {
  return (
    <div className="flex items-center gap-2 pb-4 mb-4 border-b">
      <span className="text-sm text-muted-foreground">Account type:</span>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(val) => {
          if (val) onChange(val as AccountType);
        }}
        className="gap-1"
      >
        <ToggleGroupItem
          value="customer"
          aria-label="Customer account"
          className="text-sm gap-1.5"
        >
          <User className="h-4 w-4" />
          {translations.customer}
        </ToggleGroupItem>
        <ToggleGroupItem
          value="studio"
          aria-label="Studio owner account"
          className="text-sm gap-1.5"
        >
          <Building2 className="h-4 w-4" />
          {translations.studio}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
