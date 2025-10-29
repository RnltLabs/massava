'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '../components/PhoneInput';
import { useStudioRegistration } from '../hooks/useStudioRegistration';
import { contactSchema } from '../validation/studioSchemas';
import { registerStudio } from '@/app/actions/studio/registerStudio';
import { cn } from '@/lib/utils';

/**
 * Contact Step - Step 3
 * Collects contact information and submits registration
 */
export function ContactStep(): React.JSX.Element {
  const {
    state,
    updateContact,
    goToNextStep,
    setErrors,
    setSubmitting,
    setStudioId,
  } = useStudioRegistration();

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

  // Handle complete registration
  const handleCompleteRegistration = async (): Promise<void> => {
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

    // Prepare complete data
    const completeData = {
      name: state.formData.basicInfo.name || '',
      description: state.formData.basicInfo.description || '',
      address: {
        street: state.formData.address.street || '',
        line2: state.formData.address.line2,
        city: state.formData.address.city || '',
        state: state.formData.address.state || '',
        postalCode: state.formData.address.postalCode || '',
        country: state.formData.address.country || '',
      },
      contact: {
        phone,
        email,
        website: website || undefined,
      },
    };

    // Submit to server
    setSubmitting(true);
    try {
      const result = await registerStudio(completeData);

      if (result.success && result.studioId) {
        setStudioId(result.studioId);
        goToNextStep();
      } else {
        setErrors({ submit: result.error || 'Registration failed' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setSubmitting(false);
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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
        <p className="text-sm text-gray-600">How clients can reach you</p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Phone */}
        <PhoneInput
          id="phone"
          name="phone"
          label="Phone Number"
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
            Email Address
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
            placeholder="contact@studio.com"
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
          <Label htmlFor="website">Website (Optional)</Label>
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
            placeholder="https://www.yourstudio.com"
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

      {/* Complete Button */}
      <Button
        onClick={handleCompleteRegistration}
        disabled={!isValid || state.isSubmitting}
        className="w-full h-12 bg-terracotta-500 hover:bg-terracotta-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state.isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Registering...
          </>
        ) : (
          'Complete Registration'
        )}
      </Button>
    </motion.div>
  );
}
