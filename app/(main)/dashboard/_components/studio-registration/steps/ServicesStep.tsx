'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, X, Loader2, Sparkles } from 'lucide-react';
import { useStudioRegistration } from '../hooks/useStudioRegistration';
import { registerStudio } from '@/app/actions/studio/registerStudio';
import { createService } from '@/app/actions/studio/serviceActions';
import { serviceSchema, type ServiceFormData } from '../validation/servicesSchema';
import { cn } from '@/lib/utils';

const DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240];

/**
 * Services Step - Step 6
 * Collects studio services, submits studio registration, and creates services
 */
export function ServicesStep(): React.JSX.Element {
  const { state, updateServices, goToNextStep, setSubmitting, setStudioId, setErrors } =
    useStudioRegistration();

  // Service form state (start with 1 empty service)
  const [services, setServices] = useState<ServiceFormData[]>(
    state.formData.services || [
      {
        name: '',
        duration: 60,
        price: 50,
      },
    ]
  );

  // Field errors
  const [fieldErrors, setFieldErrors] = useState<Record<number, Record<string, string>>>({});

  // Add new service
  const handleAddService = (): void => {
    if (services.length < 3) {
      setServices([
        ...services,
        {
          name: '',
          duration: 60,
          price: 50,
        },
      ]);
    }
  };

  // Remove service
  const handleRemoveService = (index: number): void => {
    const newServices = services.filter((_, i) => i !== index);
    setServices(newServices);

    // Clear field errors for this service
    const newFieldErrors = { ...fieldErrors };
    delete newFieldErrors[index];
    setFieldErrors(newFieldErrors);
  };

  // Update service field
  const handleUpdateService = (
    index: number,
    field: keyof ServiceFormData,
    value: string | number
  ): void => {
    const newServices = [...services];
    newServices[index] = {
      ...newServices[index],
      [field]: value,
    };
    setServices(newServices);

    // Clear field error for this field
    if (fieldErrors[index]?.[field]) {
      const newFieldErrors = { ...fieldErrors };
      delete newFieldErrors[index][field];
      setFieldErrors(newFieldErrors);
    }
  };

  // Validate all services
  const validateServices = (): boolean => {
    const errors: Record<number, Record<string, string>> = {};
    let isValid = true;

    services.forEach((service, index) => {
      const result = serviceSchema.safeParse(service);
      if (!result.success) {
        errors[index] = {};
        result.error.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          errors[index][field] = issue.message;
        });
        isValid = false;
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  // Skip services
  const handleSkip = async (): Promise<void> => {
    await handleSubmitStudio(true);
  };

  // Continue with services
  const handleContinue = async (): Promise<void> => {
    // Validate all services
    if (!validateServices()) {
      setErrors({ submit: 'Bitte alle Fehler beheben' });
      return;
    }

    await handleSubmitStudio(false);
  };

  // Submit studio registration and create services
  const handleSubmitStudio = async (skipServices: boolean): Promise<void> => {
    // Prepare complete data for registration
    const completeData = {
      name: state.formData.basicInfo.name || '',
      description: state.formData.basicInfo.description || '',
      address: {
        street: state.formData.address.street || '',
        line2: state.formData.address.line2,
        city: state.formData.address.city || '',
        postalCode: state.formData.address.postalCode || '',
        country: state.formData.address.country || '',
      },
      contact: {
        phone: state.formData.contact.phone || '',
        email: state.formData.contact.email || '',
        website: state.formData.contact.website || undefined,
      },
      openingHours: state.formData.openingHours as
        | {
            mode: 'same' | 'different';
            sameHours?: { open: string; close: string };
            differentHours?: Record<string, { open: string; close: string } | null>;
          }
        | undefined,
      capacity: state.formData.capacity || 1,
    };

    // Submit to server
    setSubmitting(true);
    setErrors({});

    try {
      const result = await registerStudio(completeData);

      if (!result.success || !result.studioId) {
        setErrors({ submit: result.error || 'Registration failed' });
        setSubmitting(false);
        return;
      }

      // Save studio ID
      setStudioId(result.studioId);

      // If skipping services, go to success step
      if (skipServices) {
        updateServices([]);
        goToNextStep();
        setSubmitting(false);
        return;
      }

      // Create services
      let createdCount = 0;
      const validServices = services.filter(
        (service) => service.name.trim().length > 0
      );

      for (const service of validServices) {
        const serviceResult = await createService(result.studioId, {
          name: service.name,
          duration: service.duration,
          price: service.price,
        });

        if (serviceResult.success) {
          createdCount++;
        }
      }

      // Save services to context (even if some failed)
      updateServices(validServices);

      // Navigate to success step
      goToNextStep();
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Ein unerwarteter Fehler ist aufgetreten' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-2.5 sm:space-y-3"
    >
      {/* Header */}
      <div className="space-y-0.5 text-center">
        <div className="text-3xl">
          <span>💆</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          Services hinzufügen
        </h2>
        <p className="text-gray-600 text-sm">
          Bis zu 3 Services (optional)
        </p>
      </div>

      {/* Services List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.2 }}
              className="relative p-3 border-2 border-gray-200 rounded-xl bg-white"
            >
              {/* Remove Button */}
              {services.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveService(index)}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Service entfernen"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              )}

              <div className="space-y-2">
                {/* Service Name */}
                <div className="space-y-1">
                  <Label
                    htmlFor={`service-name-${index}`}
                    className="text-sm font-medium text-gray-700"
                  >
                    Service-Name *
                  </Label>
                  <Input
                    id={`service-name-${index}`}
                    value={service.name}
                    onChange={(e) =>
                      handleUpdateService(index, 'name', e.target.value)
                    }
                    placeholder="z.B. Thai-Massage"
                    className={cn(
                      'h-10 rounded-lg border-2',
                      fieldErrors[index]?.name
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-[#B56550]'
                    )}
                  />
                  {fieldErrors[index]?.name && (
                    <p className="text-xs text-red-600 mt-0.5" role="alert" aria-live="polite">
                      {fieldErrors[index].name}
                    </p>
                  )}
                </div>

                {/* Duration & Price */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Duration */}
                  <div className="space-y-1">
                    <Label
                      htmlFor={`service-duration-${index}`}
                      className="text-sm font-medium text-gray-700"
                    >
                      Dauer *
                    </Label>
                    <select
                      id={`service-duration-${index}`}
                      value={service.duration}
                      onChange={(e) =>
                        handleUpdateService(
                          index,
                          'duration',
                          parseInt(e.target.value)
                        )
                      }
                      className={cn(
                        'w-full h-10 px-3 rounded-lg border-2 bg-white',
                        'focus:outline-none focus:ring-0',
                        fieldErrors[index]?.duration
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200 focus:border-[#B56550]'
                      )}
                    >
                      {DURATION_OPTIONS.map((minutes) => (
                        <option key={minutes} value={minutes}>
                          {minutes} Min
                        </option>
                      ))}
                    </select>
                    {fieldErrors[index]?.duration && (
                      <p className="text-xs text-red-600 mt-0.5" role="alert" aria-live="polite">
                        {fieldErrors[index].duration}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="space-y-1">
                    <Label
                      htmlFor={`service-price-${index}`}
                      className="text-sm font-medium text-gray-700"
                    >
                      Preis *
                    </Label>
                    <div className="relative">
                      <Input
                        id={`service-price-${index}`}
                        type="number"
                        min="5"
                        max="500"
                        step="0.01"
                        value={service.price}
                        onChange={(e) =>
                          handleUpdateService(
                            index,
                            'price',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className={cn(
                          'h-10 rounded-lg border-2 pr-10',
                          fieldErrors[index]?.price
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-[#B56550]'
                        )}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                        €
                      </span>
                    </div>
                    {fieldErrors[index]?.price && (
                      <p className="text-xs text-red-600 mt-0.5" role="alert" aria-live="polite">
                        {fieldErrors[index].price}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Service Button */}
        {services.length < 3 && (
          <motion.button
            type="button"
            onClick={handleAddService}
            className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#B56550] hover:bg-[#B56550]/5 transition-all group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-2 text-gray-600 group-hover:text-[#B56550]">
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Weiteren Service hinzufügen</span>
            </div>
          </motion.button>
        )}
      </div>

      {/* Info Banner */}
      <Alert className="border-blue-200 bg-blue-50 py-2">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-gray-700">
          <p className="text-xs">
            Du kannst Services später jederzeit hinzufügen oder bearbeiten
          </p>
        </AlertDescription>
      </Alert>

      {/* Submit Error */}
      {state.errors.submit && (
        <Alert className="border-red-200 bg-red-50 py-2">
          <AlertDescription className="text-red-700 text-xs">{state.errors.submit}</AlertDescription>
        </Alert>
      )}

      {/* Continue Button */}
      <div className="pt-1 space-y-1.5">
        <Button
          onClick={handleContinue}
          disabled={state.isSubmitting || services.every((s) => s.name.trim() === '')}
          style={
            !state.isSubmitting && services.some((s) => s.name.trim() !== '')
              ? { backgroundColor: '#B56550' }
              : undefined
          }
          className="w-full text-white py-5 text-base font-semibold rounded-2xl shadow-lg hover:opacity-90 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {state.isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Studio wird erstellt...
            </>
          ) : (
            'Studio erstellen'
          )}
        </Button>

        {/* Skip Button */}
        <div className="text-center py-1">
          <button
            onClick={handleSkip}
            disabled={state.isSubmitting}
            className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Später hinzufügen
          </button>
        </div>
      </div>
    </motion.div>
  );
}
