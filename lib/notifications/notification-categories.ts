/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Notification Category Configurations
 * Defines categories for Studio Owner and Customer roles
 */

import {
  Bell,
  AlertTriangle,
  Star,
  Clock,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react';
import type { NotificationType } from '@/app/generated/prisma';

/**
 * Notification category configuration
 */
export interface NotificationCategory {
  /** Unique identifier for this category */
  id: string;
  /** Translation key for the title */
  titleKey: string;
  /** Translation key for the description */
  descriptionKey: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Tailwind color class for the icon */
  iconColor: string;
  /** Tailwind background color class */
  bgColor: string;
  /** NotificationTypes that belong to this category */
  types: NotificationType[];
  /** Cannot be disabled by user */
  isEssential: boolean;
  /** Default enabled state for new users */
  defaultEnabled: boolean;
  /** API field name for push preference */
  pushField: string;
  /** API field name for email preference */
  emailField: string;
}

/**
 * Studio Owner notification categories
 * Business-focused categories for managing studio operations
 */
export const STUDIO_OWNER_CATEGORIES: NotificationCategory[] = [
  {
    id: 'booking_requests',
    titleKey: 'studioOwner.bookingRequests.title',
    descriptionKey: 'studioOwner.bookingRequests.description',
    icon: Bell,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50',
    types: ['BOOKING_REQUEST_RECEIVED'],
    isEssential: false,
    defaultEnabled: true,
    pushField: 'pushBookings',
    emailField: 'emailBookings',
  },
  {
    id: 'cancellations',
    titleKey: 'studioOwner.cancellations.title',
    descriptionKey: 'studioOwner.cancellations.description',
    icon: AlertTriangle,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
    types: ['BOOKING_CANCELLED_BY_CUSTOMER'],
    isEssential: false,
    defaultEnabled: true,
    pushField: 'pushCancellations',
    emailField: 'emailCancellations',
  },
  {
    id: 'reviews',
    titleKey: 'studioOwner.reviews.title',
    descriptionKey: 'studioOwner.reviews.description',
    icon: Star,
    iconColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    types: ['REVIEW_POSTED'],
    isEssential: false,
    defaultEnabled: true,
    pushField: 'pushReviews',
    emailField: 'emailReviews',
  },
  {
    id: 'reminders',
    titleKey: 'studioOwner.reminders.title',
    descriptionKey: 'studioOwner.reminders.description',
    icon: Clock,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    types: ['BOOKING_REMINDER_STUDIO'],
    isEssential: false,
    defaultEnabled: true,
    pushField: 'pushReminders',
    emailField: 'emailReminders',
  },
];

/**
 * Customer notification categories
 * User-focused categories for booking management
 */
export const CUSTOMER_CATEGORIES: NotificationCategory[] = [
  {
    id: 'booking_confirmations',
    titleKey: 'customer.confirmations.title',
    descriptionKey: 'customer.confirmations.description',
    icon: CheckCircle,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    types: ['BOOKING_CONFIRMED', 'BOOKING_REJECTED'],
    isEssential: false,
    defaultEnabled: true,
    pushField: 'pushBookings',
    emailField: 'emailBookings',
  },
  {
    id: 'reminders',
    titleKey: 'customer.reminders.title',
    descriptionKey: 'customer.reminders.description',
    icon: Clock,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    types: ['BOOKING_REMINDER_CUSTOMER'],
    isEssential: false,
    defaultEnabled: true,
    pushField: 'pushReminders',
    emailField: 'emailReminders',
  },
  {
    id: 'studio_cancellations',
    titleKey: 'customer.studioCancellations.title',
    descriptionKey: 'customer.studioCancellations.description',
    icon: AlertTriangle,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50',
    types: ['BOOKING_CANCELLED_BY_STUDIO'],
    isEssential: false,
    defaultEnabled: true,
    pushField: 'pushCancellations',
    emailField: 'emailCancellations',
  },
  {
    id: 'review_requests',
    titleKey: 'customer.reviewRequests.title',
    descriptionKey: 'customer.reviewRequests.description',
    icon: Star,
    iconColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    types: ['REVIEW_REQUEST'],
    isEssential: false,
    defaultEnabled: true,
    pushField: 'pushReviews',
    emailField: 'emailReviews',
  },
];

/**
 * Get categories for a specific context
 */
export function getCategoriesForContext(
  context: 'STUDIO_OWNER' | 'CUSTOMER'
): NotificationCategory[] {
  return context === 'STUDIO_OWNER' ? STUDIO_OWNER_CATEGORIES : CUSTOMER_CATEGORIES;
}

/**
 * Get a specific category by ID
 */
export function getCategoryById(
  categoryId: string,
  context: 'STUDIO_OWNER' | 'CUSTOMER'
): NotificationCategory | undefined {
  const categories = getCategoriesForContext(context);
  return categories.find((c) => c.id === categoryId);
}
