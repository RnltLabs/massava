'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '../components/PhoneInput';
import { useStudioRegistration } from '../hooks/useStudioRegistration';
import { contactSchema } from '../validation/studioSchemas';
import { updateStudio } from '@/app/actions/studio/updateStudio';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

/**
 * Contact Step - Step 3
 * Collects contact information
 */
export function ContactStep(): React.JSX.Element {
  const { state, updateContact, goToNextStep, setErrors, setSubmitting } = useStudioRegistration();
  const { toast } = useToast();

  const [phone, setPhone] = useState(state.formData.contact.phone || '');
  const [email, setEmail] = useState(state.formData.contact.email || '');
  const [website, setWebsite] = useState(state.formData.contact.website || '');

  const [touched, setTouched] = useState({
    phone: false,
    email: false,
    website: false,
  });
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  // Validate field
  const validateField = (field: 'phone' | 'email' | 'website', value: string): void => {
    try {
      if (field === 'phone') {
        contactSchema.shape.phone.parse(value);
      } else if (field === 'email') {
        contactSchema.shape.email.parse(value);
      } else if (field === 'website') {
        contactSchema.shape.website.parse(value || '');
      }
      setLocalErrors((prev) => ({ ...prev, [field]: '' }));
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as { errors: Array<{ message: string }> };
        const message = zodError.errors[0]?.message || 'Invalid value';
        setLocalErrors((prev) => ({ ...prev, [field]: message }));
      }
    }
  };

  // Handle blur
  const handleBlur = (field: 'phone' | 'email' | 'website'): void => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const values = { phone, email, website };
    validateField(field, values[field]);
  };

  // Handle continue to next step - Update studio contact info
  const handleContinue = async (): Promise<void> => {
    // Mark all as touched
    setTouched({ phone: true, email: true, website: true });

    // Validate contact info
    try {
      const validatedContact = contactSchema.parse({
        phone,
        email,
        website: website || undefined,
      });
      updateContact(validatedContact);
      setErrors({});

      // Update studio with contact info if studio exists
      if (state.studioId) {
        setSubmitting(true);

        try {
          const result = await updateStudio(state.studioId, {
            contact: validatedContact,
          });

          if (!result.success) {
            setErrors({ submit: result.error || 'Failed to update contact info' });
            toast({
              title: 'Error',
              description: result.error || 'Failed to update contact info',
              variant: 'destructive',
            });
            setSubmitting(false);
            return;
          }
        } catch (error) {
          console.error('ContactStep: Update error', error);
          setErrors({ submit: 'An unexpected error occurred' });
          toast({
            title: 'Error',
            description: 'An unexpected error occurred',
            variant: 'destructive',
          });
          setSubmitting(false);
          return;
        } finally {
          setSubmitting(false);
        }
      }

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
        return;
      }
    }
  };

  // Update context on unmount
  useEffect(() => {
    return () => {
      updateContact({ phone, email, website });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, email, website]);

  const isValid =
    phone.trim().length >= 10 &&
    email.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Kontaktinformationen</h2>
        <p className="text-sm text-gray-600">Wie Kunden dich erreichen können</p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Phone */}
        <PhoneInput
          id="phone"
          name="phone"
          label="Telefonnummer"
          value={phone}
          onChange={setPhone}
          onBlur={() => handleBlur('phone')}
          error={touched.phone ? localErrors.phone : undefined}
          disabled={state.isSubmitting}
          required
        />

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="after:content-['*'] after:ml-0.5 after:text-red-500">
            E-Mail-Adresse
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur('email')}
            disabled={state.isSubmitting}
            required
            className={cn(
              'focus:border-terracotta-600 focus:ring-2 focus:ring-terracotta-100',
              touched.email && localErrors.email && 'border-red-500 focus:border-red-500 focus:ring-red-100'
            )}
            placeholder="kontakt@studio.de"
            aria-invalid={touched.email && !!localErrors.email}
            aria-describedby={touched.email && localErrors.email ? 'email-error' : undefined}
          />
          {touched.email && localErrors.email && (
            <p id="email-error" className="text-sm text-red-600" role="alert">
              {localErrors.email}
            </p>
          )}
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website">Webseite (Optional)</Label>
          <Input
            id="website"
            name="website"
            type="url"
            autoComplete="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            onBlur={() => handleBlur('website')}
            disabled={state.isSubmitting}
            className={cn(
              'focus:border-terracotta-600 focus:ring-2 focus:ring-terracotta-100',
              touched.website && localErrors.website && 'border-red-500 focus:border-red-500 focus:ring-red-100'
            )}
            placeholder="https://www.deinstudio.de"
            aria-invalid={touched.website && !!localErrors.website}
            aria-describedby={touched.website && localErrors.website ? 'website-error' : undefined}
          />
          {touched.website && localErrors.website && (
            <p id="website-error" className="text-sm text-red-600" role="alert">
              {localErrors.website}
            </p>
          )}
        </div>
      </div>

      {/* Submit Error */}
      {state.errors.submit && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{state.errors.submit}</p>
        </div>
      )}

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!isValid || state.isSubmitting}
        style={isValid && !state.isSubmitting ? { backgroundColor: '#B56550' } : undefined}
        className="w-full h-12 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] hover:opacity-90 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {state.isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Updating...
          </>
        ) : (
          'Weiter'
        )}
      </Button>
    </div>
  );
}
