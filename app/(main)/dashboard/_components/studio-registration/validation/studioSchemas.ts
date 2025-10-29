import { z } from 'zod';

/**
 * Validation schema for basic studio information
 */
export const basicInfoSchema = z.object({
  name: z
    .string()
    .min(3, 'Studio name must be at least 3 characters')
    .max(100, 'Studio name must not exceed 100 characters')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters')
    .trim(),
});

/**
 * Validation schema for studio address
 */
export const addressSchema = z.object({
  street: z
    .string()
    .min(5, 'Street address must be at least 5 characters')
    .trim(),
  line2: z.string().optional(),
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .trim(),
  state: z
    .string()
    .min(2, 'State/Province must be at least 2 characters')
    .trim(),
  postalCode: z
    .string()
    .min(3, 'Postal code must be at least 3 characters')
    .trim(),
  country: z
    .string()
    .min(2, 'Country is required')
    .trim(),
});

/**
 * Validation schema for studio contact information
 */
export const contactSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 characters')
    .trim(),
  email: z
    .string()
    .email('Invalid email address')
    .trim(),
  website: z
    .string()
    .url('Invalid URL format')
    .optional()
    .or(z.literal('')),
});

/**
 * Complete registration schema (all steps combined)
 */
export const completeRegistrationSchema = z.object({
  basicInfo: basicInfoSchema,
  address: addressSchema,
  contact: contactSchema,
});

/**
 * Type exports
 */
export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type CompleteRegistrationData = z.infer<typeof completeRegistrationSchema>;
