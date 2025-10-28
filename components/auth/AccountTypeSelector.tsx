'use client';

import { User, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type AccountType = 'customer' | 'studio';

interface AccountTypeSelectorProps {
  selectedType: AccountType;
  onTypeSelect: (type: AccountType) => void;
  mode?: 'signup' | 'login';
}

export function AccountTypeSelector({
  selectedType,
  onTypeSelect,
  mode = 'signup',
}: AccountTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">
          {mode === 'login' ? 'Willkommen zurück' : 'Willkommen bei Massava'}
        </h2>
        <p className="text-sm text-gray-600">
          Wählen Sie Ihren Kontotyp
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        {/* Customer Card */}
        <div className="w-full">
          <Card
            onClick={() => onTypeSelect('customer')}
            className="relative cursor-pointer p-4 sm:p-6 border-2 border-gray-200 bg-white transition-all duration-200 hover:shadow-lg hover:border-sage-400 active:shadow-md min-h-[160px] sm:min-h-[180px] w-full flex flex-col items-center justify-center"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTypeSelect('customer');
              }
            }}
          >
            <div className="space-y-4 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#B56550' }}>
                <User className="w-8 h-8 shrink-0 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1 text-gray-900">
                  Kunde
                </h3>
                <p className="text-sm text-gray-600">
                  Massage buchen
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Studio Card */}
        <div className="w-full">
          <Card
            onClick={() => onTypeSelect('studio')}
            className="relative cursor-pointer p-4 sm:p-6 border-2 border-gray-200 bg-white transition-all duration-200 hover:shadow-lg hover:border-sage-400 active:shadow-md min-h-[160px] sm:min-h-[180px] w-full flex flex-col items-center justify-center"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTypeSelect('studio');
              }
            }}
          >
            <div className="space-y-4 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#B56550' }}>
                <Briefcase className="w-8 h-8 shrink-0 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1 text-gray-900">
                  Studio-Inhaber
                </h3>
                <p className="text-sm text-gray-600">
                  Verwalten Sie Ihr Studio
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
