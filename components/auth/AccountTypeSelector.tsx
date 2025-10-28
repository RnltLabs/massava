'use client';

import { motion } from 'framer-motion';
import { User, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type AccountType = 'customer' | 'studio';

interface AccountTypeSelectorProps {
  selectedType: AccountType;
  onTypeSelect: (type: AccountType) => void;
}

export function AccountTypeSelector({
  selectedType,
  onTypeSelect,
}: AccountTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">
          Willkommen bei Massava
        </h2>
        <p className="text-sm text-gray-600">
          Wählen Sie Ihren Kontotyp
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Customer Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <Card
            onClick={() => onTypeSelect('customer')}
            className={cn(
              'relative cursor-pointer p-6 border-2 transition-all duration-200',
              'hover:shadow-lg active:shadow-md',
              'min-h-[180px] flex flex-col items-center justify-center',
              selectedType === 'customer'
                ? 'border-sage-600 bg-sage-50 shadow-md'
                : 'border-gray-200 hover:border-sage-400 bg-white'
            )}
            role="button"
            tabIndex={0}
            aria-pressed={selectedType === 'customer'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTypeSelect('customer');
              }
            }}
          >
            <div className="space-y-4 text-center">
              <div
                className={cn(
                  'mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
                  selectedType === 'customer'
                    ? 'bg-sage-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                )}
              >
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3
                  className={cn(
                    'text-lg font-semibold mb-1',
                    selectedType === 'customer'
                      ? 'text-sage-900'
                      : 'text-gray-900'
                  )}
                >
                  Kunde
                </h3>
                <p className="text-sm text-gray-600">
                  Finden Sie Wellness-Profis
                </p>
              </div>
            </div>

            {/* Selected indicator */}
            {selectedType === 'customer' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-sage-600 flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Studio Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <Card
            onClick={() => onTypeSelect('studio')}
            className={cn(
              'relative cursor-pointer p-6 border-2 transition-all duration-200',
              'hover:shadow-lg active:shadow-md',
              'min-h-[180px] flex flex-col items-center justify-center',
              selectedType === 'studio'
                ? 'border-sage-600 bg-sage-50 shadow-md'
                : 'border-gray-200 hover:border-sage-400 bg-white'
            )}
            role="button"
            tabIndex={0}
            aria-pressed={selectedType === 'studio'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTypeSelect('studio');
              }
            }}
          >
            <div className="space-y-4 text-center">
              <div
                className={cn(
                  'mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
                  selectedType === 'studio'
                    ? 'bg-sage-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                )}
              >
                <Briefcase className="w-8 h-8" />
              </div>
              <div>
                <h3
                  className={cn(
                    'text-lg font-semibold mb-1',
                    selectedType === 'studio'
                      ? 'text-sage-900'
                      : 'text-gray-900'
                  )}
                >
                  Studio-Inhaber
                </h3>
                <p className="text-sm text-gray-600">
                  Verwalten Sie Ihr Studio
                </p>
              </div>
            </div>

            {/* Selected indicator */}
            {selectedType === 'studio' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-sage-600 flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
