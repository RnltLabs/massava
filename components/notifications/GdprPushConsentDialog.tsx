/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * GDPR-Compliant Push Notification Consent Dialog
 * Pre-permission dialog with granular consent options
 *
 * WCAG 2.1 AA Compliant:
 * - Proper heading hierarchy (h2 > h3)
 * - role="group" with aria-labelledby for fieldsets
 * - Labels connected via htmlFor
 * - Loading states with aria-busy and aria-label
 * - Checkbox components with proper aria-describedby
 * - Focus management handled by Dialog/Sheet components
 * - Keyboard accessible interactive elements
 *
 * @module components/notifications/GdprPushConsentDialog
 */

'use client';

import React, { useState, useEffect, useId } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { usePushRegistration } from '@/hooks/usePushRegistration';
import { getCategoriesForContext } from '@/lib/notifications/notification-categories';
import { useTranslations } from 'next-intl';
import {
  Loader2Icon,
  X,
  Bell,
  Check,
  ExternalLink,
  Smartphone,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import { announceToScreenReader, focusRingStyles } from '@/lib/utils/accessibility';

interface GdprPushConsentDialogProps {
  /** Controls dialog visibility */
  isOpen: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback when user consents - receives selected categories */
  onConsent?: (selectedCategories: string[]) => void;
  /** Context that triggered the dialog */
  trigger: 'FIRST_BOOKING' | 'FIRST_REQUEST' | 'ONBOARDING' | 'SETTINGS';
  /** User role - determines which categories to show */
  userRole: 'STUDIO_OWNER' | 'CUSTOMER';
}

/**
 * GDPR-compliant pre-permission dialog for push notifications
 *
 * Features:
 * - Mock notification preview
 * - Clear explanation of data processing
 * - Granular category selection
 * - Required consent checkbox
 * - Link to privacy policy
 * - Mentions Firebase/Google as third-party processor
 *
 * @example
 * ```tsx
 * const [showConsent, setShowConsent] = useState(false);
 *
 * <GdprPushConsentDialog
 *   isOpen={showConsent}
 *   onClose={() => setShowConsent(false)}
 *   onConsent={(categories) => console.log('Consented to:', categories)}
 *   trigger="FIRST_BOOKING"
 *   userRole="CUSTOMER"
 * />
 * ```
 */
export function GdprPushConsentDialog({
  isOpen,
  onClose,
  onConsent,
  trigger,
  userRole,
}: GdprPushConsentDialogProps): React.JSX.Element {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [hasConsented, setHasConsented] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { toast } = useToast();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const t = useTranslations('pushConsent');
  const tNotifications = useTranslations('business.notifications');

  // Generate unique IDs for ARIA relationships
  const uniqueId = useId();
  const benefitsHeadingId = `benefits-heading-${uniqueId}`;
  const categoriesHeadingId = `categories-heading-${uniqueId}`;
  const categoriesDescriptionId = `categories-desc-${uniqueId}`;
  const gdprHeadingId = `gdpr-heading-${uniqueId}`;
  const gdprConsentId = `gdpr-consent-${uniqueId}`;

  const {
    isSupported: isPushSupported,
    isRegistering: isPushRegistering,
    register: registerPush,
  } = usePushRegistration();

  // Get categories based on user role
  const context = userRole === 'STUDIO_OWNER' ? 'STUDIO_OWNER' : 'CUSTOMER';
  const categories = getCategoriesForContext(context);

  // Initialize with all non-essential categories selected by default
  useEffect(() => {
    if (isOpen && !isInitialized) {
      const defaultSelected = categories
        .filter((cat) => !cat.isEssential)
        .map((cat) => cat.id);
      setSelectedCategories(defaultSelected);
      setIsInitialized(true);
    }

    if (!isOpen) {
      setIsInitialized(false);
      setHasConsented(false);
    }
  }, [isOpen, categories, isInitialized]);

  // Toggle category selection
  const handleCategoryToggle = (categoryId: string): void => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Map category IDs to consent categories schema
  const mapCategoriesToConsentSchema = (): {
    bookings: boolean;
    cancellations: boolean;
    reminders: boolean;
    marketing: boolean;
  } => {
    return {
      bookings: selectedCategories.includes('booking_requests') ||
                selectedCategories.includes('booking_confirmations'),
      cancellations: selectedCategories.includes('cancellations') ||
                     selectedCategories.includes('studio_cancellations'),
      reminders: selectedCategories.includes('reminders'),
      marketing: selectedCategories.includes('review_requests') ||
                 selectedCategories.includes('reviews'),
    };
  };

  // Handle consent and push registration
  const handleConsent = async (): Promise<void> => {
    if (!hasConsented) {
      toast({
        title: t('validation.consentRequired'),
        description: t('validation.consentRequiredDescription'),
        variant: 'destructive',
      });
      return;
    }

    if (!isPushSupported) {
      toast({
        title: t('errors.notSupported'),
        description: t('errors.notSupportedDescription'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Save consent to backend with proper schema
      const categories = mapCategoriesToConsentSchema();

      const consentResponse = await fetch('/api/notifications/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'GRANTED',
          categories,
          consentVersion: '1.0',
          method: trigger === 'SETTINGS' ? 'settings_dialog' : `${trigger.toLowerCase()}_flow`,
          deviceInfo: {
            platform: 'WEB',
            userAgent: navigator.userAgent,
            language: navigator.language,
          },
          triggeredBy: 'user',
          notes: `Consent granted via ${trigger} trigger for ${userRole}`,
        }),
      });

      if (!consentResponse.ok) {
        const errorData = await consentResponse.json();
        throw new Error(errorData.error || 'Failed to save consent');
      }

      // Step 2: Request browser permission and register device
      const permissionGranted = await registerPush();

      if (!permissionGranted) {
        throw new Error('Permission denied by user');
      }

      // Success
      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      // Announce success to screen readers
      announceToScreenReader(t('success.title'), 'polite');

      // Callback with selected categories
      onConsent?.(selectedCategories);

      // Close dialog
      onClose();
    } catch (error) {
      logger.error('[GdprPushConsentDialog] Consent failed', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      toast({
        title: t('errors.failed'),
        description: error instanceof Error ? error.message : t('errors.unknownError'),
        variant: 'destructive',
      });

      // Announce error to screen readers
      announceToScreenReader(t('errors.failed'), 'assertive');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle skip/decline
  const handleDecline = (): void => {
    onClose();
  };

  // Render notification preview
  const renderNotificationPreview = (): React.JSX.Element => {
    const previewMessage =
      userRole === 'STUDIO_OWNER'
        ? t('preview.studioOwner')
        : t('preview.customer');

    return (
      <figure
        className="mb-6 p-4 bg-white rounded-xl shadow-lg border border-gray-200"
        aria-label={t('preview.ariaLabel')}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1" aria-hidden="true">
            <div className="w-10 h-10 rounded-lg bg-[#B56550] flex items-center justify-center">
              <Bell className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-gray-900">Massava</p>
              <p className="text-xs text-gray-500">{t('preview.now')}</p>
            </div>
            <p className="text-sm text-gray-700 line-clamp-2">{previewMessage}</p>
          </div>
          <Smartphone className="h-4 w-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
        </div>
      </figure>
    );
  };

  // Render benefits list
  const renderBenefits = (): React.JSX.Element => {
    const benefits =
      userRole === 'STUDIO_OWNER'
        ? [
            t('benefits.studioOwner.realtime'),
            t('benefits.studioOwner.noMiss'),
            t('benefits.studioOwner.control'),
          ]
        : [
            t('benefits.customer.reminders'),
            t('benefits.customer.changes'),
            t('benefits.customer.discover'),
          ];

    return (
      <section className="mb-6" aria-labelledby={benefitsHeadingId}>
        <h3 id={benefitsHeadingId} className="sr-only">
          {t('benefits.heading')}
        </h3>
        <ul className="space-y-3" role="list">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-green-100 p-1 flex-shrink-0" aria-hidden="true">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm text-gray-700">{benefit}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  // Render category checkboxes
  const renderCategories = (): React.JSX.Element => {
    return (
      <fieldset className="space-y-4 mb-6" aria-labelledby={categoriesHeadingId}>
        <legend id={categoriesHeadingId} className="sr-only">
          {t('categories.heading')}
        </legend>

        <div
          id={categoriesDescriptionId}
          className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg"
          role="note"
        >
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-600" aria-hidden="true" />
          <p>{t('categories.description')}</p>
        </div>

        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategories.includes(category.id);
          const categoryCheckboxId = `category-${category.id}-${uniqueId}`;
          const categoryDescriptionId = `category-desc-${category.id}-${uniqueId}`;

          return (
            <div
              key={category.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                isSelected
                  ? 'border-[#B56550] bg-[#B56550]/5'
                  : 'border-gray-200 hover:border-gray-300'
              )}
              onClick={() => handleCategoryToggle(category.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCategoryToggle(category.id);
                }
              }}
              role="presentation"
            >
              <Checkbox
                id={categoryCheckboxId}
                checked={isSelected}
                onCheckedChange={() => handleCategoryToggle(category.id)}
                className="mt-1"
                aria-describedby={categoryDescriptionId}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn('p-1 rounded', category.bgColor)} aria-hidden="true">
                    <Icon className={cn('h-4 w-4', category.iconColor)} />
                  </div>
                  <Label
                    htmlFor={categoryCheckboxId}
                    className="text-sm font-medium text-gray-900 cursor-pointer"
                  >
                    {tNotifications(`categories.${category.titleKey}`)}
                  </Label>
                </div>
                <p id={categoryDescriptionId} className="text-xs text-gray-600">
                  {tNotifications(`categories.${category.descriptionKey}`)}
                </p>
              </div>
            </div>
          );
        })}
      </fieldset>
    );
  };

  // Render GDPR consent section
  const renderGdprConsent = (): React.JSX.Element => {
    return (
      <section className="space-y-4 mb-6" aria-labelledby={gdprHeadingId}>
        <div className="p-4 bg-gray-50 rounded-lg space-y-3 text-xs text-gray-700">
          <h3 id={gdprHeadingId} className="font-medium text-gray-900">
            {t('gdpr.title')}
          </h3>
          <p>{t('gdpr.dataProcessing')}</p>
          <p>{t('gdpr.thirdParty')}</p>
          <p>{t('gdpr.rights')}</p>
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-1 text-[#B56550] hover:underline font-medium',
              focusRingStyles
            )}
          >
            {t('gdpr.privacyLink')}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">({t('gdpr.opensInNewTab')})</span>
          </Link>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200">
          <Checkbox
            id={gdprConsentId}
            checked={hasConsented}
            onCheckedChange={(checked) => setHasConsented(checked === true)}
            className="mt-1"
            aria-required="true"
          />
          <Label
            htmlFor={gdprConsentId}
            className="text-sm text-gray-700 cursor-pointer leading-relaxed"
          >
            {t('gdpr.consentCheckbox')}
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
          </Label>
        </div>
      </section>
    );
  };

  // Main content
  const renderContent = (): React.JSX.Element => {
    const isProcessing = isSubmitting || isPushRegistering;
    const dialogTitleId = `dialog-title-${uniqueId}`;
    const dialogSubtitleId = `dialog-subtitle-${uniqueId}`;

    return (
      <div className="flex flex-col h-full" aria-busy={isProcessing}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 id={dialogTitleId} className="text-xl font-semibold text-gray-900">
              {t('title')}
            </h2>
            <p id={dialogSubtitleId} className="text-sm text-gray-600 mt-1">
              {t('subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className={cn(
              'p-2 -mr-2 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50',
              focusRingStyles
            )}
            aria-label={t('close')}
            type="button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          {renderNotificationPreview()}
          {renderBenefits()}
          {renderCategories()}
          {renderGdprConsent()}
        </div>

        {/* Sticky footer */}
        <div
          className={cn(
            'flex flex-col gap-3 pt-4',
            isMobile && 'sticky bottom-0 bg-[#F4EDE8] border-t -mx-6 px-6 pb-4'
          )}
          role="group"
          aria-label={t('actions.groupLabel')}
        >
          <Button
            onClick={handleConsent}
            disabled={isProcessing || !hasConsented}
            className={cn(
              'w-full bg-[#B56550] hover:bg-[#A05540] text-white font-medium',
              focusRingStyles
            )}
            size="lg"
            aria-describedby={dialogSubtitleId}
          >
            {isProcessing && (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {isProcessing ? t('actions.processing') : t('actions.accept')}
          </Button>

          <button
            onClick={handleDecline}
            disabled={isProcessing}
            className={cn(
              'w-full text-sm text-gray-600 hover:text-gray-900 transition-colors py-2 disabled:opacity-50',
              focusRingStyles
            )}
            type="button"
          >
            {t('actions.decline')}
          </button>
        </div>
      </div>
    );
  };

  // Responsive wrapper
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          style={{ backgroundColor: '#F4EDE8' }}
          className="h-auto max-h-[90vh] rounded-t-3xl p-6"
          showCloseButton={false}
        >
          <VisuallyHidden>
            <SheetTitle>{t('title')}</SheetTitle>
          </VisuallyHidden>
          {renderContent()}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        style={{ backgroundColor: '#F4EDE8' }}
        className="sm:max-w-[540px] max-h-[90vh] p-6"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>{t('title')}</DialogTitle>
        </VisuallyHidden>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
