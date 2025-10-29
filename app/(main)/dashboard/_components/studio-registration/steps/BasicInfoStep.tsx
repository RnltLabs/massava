'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useStudioRegistration } from '../hooks/useStudioRegistration';
import { basicInfoSchema } from '../validation/studioSchemas';
import { cn } from '@/lib/utils';

/**
 * Basic Info Step - Step 1
 * Collects studio name and description
 */
export function BasicInfoStep(): React.JSX.Element {
  const { state, updateBasicInfo, goToNextStep, setErrors } = useStudioRegistration();

  const [name, setName] = useState(state.formData.basicInfo.name || '');
  const [description, setDescription] = useState(
    state.formData.basicInfo.description || ''
  );
  const [touched, setTouched] = useState({ name: false, description: false });
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  // Character limits
  const NAME_MAX = 100;
  const DESCRIPTION_MAX = 500;

  // Validate field
  const validateField = (field: 'name' | 'description', value: string): void => {
    try {
      if (field === 'name') {
        basicInfoSchema.shape.name.parse(value);
        setLocalErrors((prev) => ({ ...prev, name: '' }));
      } else {
        basicInfoSchema.shape.description.parse(value);
        setLocalErrors((prev) => ({ ...prev, description: '' }));
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as { errors: Array<{ message: string }> };
        const message = zodError.errors[0]?.message || 'Invalid value';
        setLocalErrors((prev) => ({ ...prev, [field]: message }));
      }
    }
  };

  // Handle blur
  const handleBlur = (field: 'name' | 'description'): void => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, field === 'name' ? name : description);
  };

  // Handle continue
  const handleContinue = (): void => {
    // Mark all as touched
    setTouched({ name: true, description: true });

    // Validate all fields
    try {
      const validated = basicInfoSchema.parse({ name, description });
      updateBasicInfo(validated);
      setErrors({});
      goToNextStep();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as { errors: Array<{ path: string[]; message: string }> };
        const errors: Record<string, string> = {};
        zodError.errors.forEach((err: { path: string[]; message: string }) => {
          if (err.path[0]) {
            errors[err.path[0]] = err.message;
          }
        });
        setLocalErrors(errors);
        setErrors(errors);
      }
    }
  };

  // Update context on unmount
  useEffect(() => {
    return () => {
      updateBasicInfo({ name, description });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, description]);

  const isValid = name.trim().length >= 3 && description.trim().length >= 10;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Studio-Informationen</h2>
        <p className="text-sm text-gray-600">
          Erzähl uns von deinem Wellness-Studio
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Studio Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="after:content-['*'] after:ml-0.5 after:text-red-500">
            Studio-Name
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="organization"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => handleBlur('name')}
            maxLength={NAME_MAX}
            required
            className={cn(
              'transition-colors',
              'focus:border-terracotta-600 focus:ring-2 focus:ring-terracotta-100',
              touched.name && localErrors.name && 'border-red-500 focus:border-red-500 focus:ring-red-100'
            )}
            placeholder="z.B. Serenity Wellness Studio"
            aria-invalid={touched.name && !!localErrors.name}
            aria-describedby={touched.name && localErrors.name ? 'name-error' : 'name-hint'}
          />
          <div className="flex justify-between items-start">
            {touched.name && localErrors.name ? (
              <p id="name-error" className="text-sm text-red-600" role="alert">
                {localErrors.name}
              </p>
            ) : (
              <p id="name-hint" className="text-sm text-gray-500">
                Wird Kunden angezeigt
              </p>
            )}
            <p className={cn(
              'text-sm',
              name.length > NAME_MAX * 0.9 ? 'text-orange-600' : 'text-gray-400'
            )}>
              {name.length}/{NAME_MAX}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="after:content-['*'] after:ml-0.5 after:text-red-500">
            Beschreibung
          </Label>
          <Textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => handleBlur('description')}
            maxLength={DESCRIPTION_MAX}
            rows={4}
            required
            className={cn(
              'transition-colors resize-none',
              'focus:border-terracotta-600 focus:ring-2 focus:ring-terracotta-100',
              touched.description && localErrors.description && 'border-red-500 focus:border-red-500 focus:ring-red-100'
            )}
            placeholder="Beschreibe dein Studio, deine Services und was dich besonders macht..."
            aria-invalid={touched.description && !!localErrors.description}
            aria-describedby={touched.description && localErrors.description ? 'description-error' : 'description-hint'}
          />
          <div className="flex justify-between items-start">
            {touched.description && localErrors.description ? (
              <p id="description-error" className="text-sm text-red-600" role="alert">
                {localErrors.description}
              </p>
            ) : (
              <p id="description-hint" className="text-sm text-gray-500">
                Hebe deine Spezialitäten und besonderen Angebote hervor
              </p>
            )}
            <p className={cn(
              'text-sm',
              description.length > DESCRIPTION_MAX * 0.9 ? 'text-orange-600' : 'text-gray-400'
            )}>
              {description.length}/{DESCRIPTION_MAX}
            </p>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!isValid}
        style={isValid ? { backgroundColor: '#B56550' } : undefined}
        className="w-full h-12 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] hover:opacity-90 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
      >
        Weiter
      </Button>
    </motion.div>
  );
}
