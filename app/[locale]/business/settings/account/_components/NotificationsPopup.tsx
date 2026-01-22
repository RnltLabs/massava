/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Dynamic Notification Settings Popup
 * Shows role-specific categories for Studio Owners vs Customers
 *
 * WCAG 2.1 AA Compliant:
 * - Proper heading hierarchy (h2 > h3)
 * - role="group" with aria-labelledby for sections
 * - Labels connected via htmlFor
 * - Loading states with aria-busy and aria-label
 * - Switch components with proper aria-describedby
 * - Focus management handled by Dialog/Sheet components
 *
 * @module app/[locale]/business/settings/account/_components/NotificationsPopup
 */

'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { usePushRegistration } from '@/hooks/usePushRegistration';
import { useNotificationContext } from '@/hooks/useNotificationContext';
import {
  getCategoriesForContext,
  type NotificationCategory,
} from '@/lib/notifications/notification-categories';
import { useTranslations } from 'next-intl';
import { Loader2Icon, X, Bell, Check, Mail, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { announceToScreenReader, focusRingStyles } from '@/lib/utils/accessibility';

interface NotificationsPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PopupStep = 'prePermission' | 'settings';

/**
 * Dynamic settings state - stores enabled state per category ID
 */
interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  categorySettings: Record<string, boolean>;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  pushEnabled: false,
  emailEnabled: true,
  categorySettings: {},
};

export function NotificationsPopup({
  open,
  onOpenChange,
}: NotificationsPopupProps): React.JSX.Element {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isFetchingPreferences, setIsFetchingPreferences] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<PopupStep>('settings');
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const t = useTranslations('business.notifications');

  // Generate unique IDs for ARIA relationships
  const uniqueId = useId();
  const channelsHeadingId = `channels-heading-${uniqueId}`;
  const categoriesHeadingId = `categories-heading-${uniqueId}`;
  const pushToggleId = `push-toggle-${uniqueId}`;
  const pushNotSupportedId = `push-not-supported-${uniqueId}`;
  const pushDeniedId = `push-denied-${uniqueId}`;
  const emailToggleId = `email-toggle-${uniqueId}`;

  // Get notification context (STUDIO_OWNER or CUSTOMER)
  const { context, isStudioOwner, isLoading: isContextLoading } = useNotificationContext();

  // Get categories for current context
  const categories = getCategoriesForContext(context);

  const {
    isSupported: isPushSupported,
    isRegistered: isPushRegistered,
    isRegistering: isPushRegistering,
    registrationPhase,
    permissionStatus,
    error: pushError,
    register: registerPush,
    unregister: unregisterPush,
  } = usePushRegistration();

  // Check if at least one channel is active (for category toggles)
  const hasActiveChannel = settings.pushEnabled || settings.emailEnabled || isPushRegistered;

  // Determine initial step when popup opens
  useEffect(() => {
    logger.debug('[NotificationsPopup] State', {
      open,
      isInitialized,
      isPushSupported,
      permissionStatus,
      isPushRegistered,
      currentStep,
      context,
      isStudioOwner,
    });

    if (open && !isInitialized && !isContextLoading) {
      const shouldShowPrePermission =
        isPushSupported && permissionStatus === 'default' && !isPushRegistered;

      logger.debug('[NotificationsPopup] Decision', {
        shouldShowPrePermission,
        context,
        categoriesCount: categories.length,
        reason: !isPushSupported
          ? 'Push not supported'
          : permissionStatus !== 'default'
            ? `Permission already ${permissionStatus}`
            : isPushRegistered
              ? 'Already registered'
              : 'Should show pre-permission!',
      });

      setCurrentStep(shouldShowPrePermission ? 'prePermission' : 'settings');
      fetchPreferences();
      setIsInitialized(true);
    }

    if (!open) {
      setIsInitialized(false);
    }
  }, [open, isPushSupported, permissionStatus, isPushRegistered, isInitialized, isContextLoading, context, categories.length, isStudioOwner]);

  // Show push error as toast
  useEffect(() => {
    if (pushError) {
      toast({
        title: t('push.title'),
        description: pushError,
        variant: 'destructive',
      });
    }
  }, [pushError, toast, t]);

  /**
   * Fetch preferences from API and map to category settings
   */
  const fetchPreferences = async (): Promise<void> => {
    setIsFetchingPreferences(true);
    try {
      const response = await fetch('/api/notifications/preferences');
      if (response.ok) {
        const data = await response.json();

        // Map API response to category settings
        const categorySettings: Record<string, boolean> = {};
        for (const category of categories) {
          // Use pushField to determine category state from API response
          const fieldName = category.pushField.replace('push', '').toLowerCase();
          categorySettings[category.id] =
            data.push?.[fieldName] ?? data.email?.[fieldName] ?? category.defaultEnabled;
        }

        setSettings({
          pushEnabled: data.push?.enabled ?? false,
          emailEnabled: data.email?.enabled ?? true,
          categorySettings,
        });
      }
    } catch (error) {
      logger.error('[NotificationsPopup] Failed to fetch notification preferences', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      toast({
        title: 'Fehler',
        description: t('errorLoading'),
        variant: 'destructive',
      });
    } finally {
      setIsFetchingPreferences(false);
    }
  };

  /**
   * Build API payload from current settings and categories
   */
  const buildApiPayload = useCallback(
    (newSettings: NotificationSettings) => {
      const payload: Record<string, boolean> = {
        pushEnabled: newSettings.pushEnabled,
        emailEnabled: newSettings.emailEnabled,
      };

      // Add category-specific fields
      for (const category of categories) {
        const enabled = newSettings.categorySettings[category.id] ?? category.defaultEnabled;
        payload[category.pushField] = enabled;
        payload[category.emailField] = enabled;
      }

      return payload;
    },
    [categories]
  );

  /**
   * Save settings immediately on change
   */
  const saveSettings = useCallback(
    async (newSettings: NotificationSettings, field: string): Promise<void> => {
      setSavingField(field);
      try {
        const apiPayload = buildApiPayload(newSettings);

        const response = await fetch('/api/notifications/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiPayload),
        });

        if (!response.ok) {
          throw new Error('Failed to save preferences');
        }

        // Announce success to screen readers
        announceToScreenReader(t('settingsSaved'), 'polite');
      } catch (error) {
        logger.error('[NotificationsPopup] Failed to save notification preferences', {
          error: error instanceof Error ? error : new Error(String(error)),
        });
        toast({
          title: 'Fehler',
          description: t('errorSaving'),
          variant: 'destructive',
        });

        // Announce error to screen readers
        announceToScreenReader(t('errorSaving'), 'assertive');
        fetchPreferences();
      } finally {
        setSavingField(null);
      }
    },
    [buildApiPayload, toast, t]
  );

  // ============================================
  // Pre-Permission Step Handlers
  // ============================================

  const handlePrePermissionConfirm = async (): Promise<void> => {
    const permissionGranted = await registerPush();

    if (!permissionGranted) {
      if (permissionStatus === 'denied') {
        toast({
          title: t('push.permissionDenied'),
          description: t('push.permissionDeniedDescription'),
          variant: 'destructive',
        });
      }
      setCurrentStep('settings');
      return;
    }

    const newSettings = { ...settings, pushEnabled: true };
    setSettings(newSettings);
    await saveSettings(newSettings, 'push');
    setCurrentStep('settings');
  };

  const handlePrePermissionSkip = (): void => {
    setCurrentStep('settings');
  };

  // ============================================
  // Settings Toggle Handlers
  // ============================================

  const handlePushToggle = async (): Promise<void> => {
    const newValue = !settings.pushEnabled;

    if (newValue && !isPushRegistered) {
      if (!isPushSupported) {
        toast({
          title: t('push.notSupported'),
          description: t('push.permissionDeniedDescription'),
          variant: 'destructive',
        });
        return;
      }

      const permissionGranted = await registerPush();
      if (!permissionGranted) {
        if (permissionStatus === 'denied') {
          toast({
            title: t('push.permissionDenied'),
            description: t('push.permissionDeniedDescription'),
            variant: 'destructive',
          });
        }
        return;
      }
    }

    if (!newValue && isPushRegistered) {
      await unregisterPush();
    }

    const newSettings = { ...settings, pushEnabled: newValue };
    setSettings(newSettings);
    await saveSettings(newSettings, 'push');
  };

  const handleEmailToggle = async (): Promise<void> => {
    const newSettings = { ...settings, emailEnabled: !settings.emailEnabled };
    setSettings(newSettings);
    await saveSettings(newSettings, 'email');
  };

  const handleCategoryToggle = async (categoryId: string): Promise<void> => {
    const newCategorySettings = {
      ...settings.categorySettings,
      [categoryId]: !settings.categorySettings[categoryId],
    };
    const newSettings = { ...settings, categorySettings: newCategorySettings };
    setSettings(newSettings);
    await saveSettings(newSettings, categoryId);
  };

  // ============================================
  // Render Functions
  // ============================================

  const renderPrePermissionStep = (): React.JSX.Element => {
    const prePermissionHeadlineId = `pre-permission-headline-${uniqueId}`;
    const prePermissionBodyId = `pre-permission-body-${uniqueId}`;
    const benefits = isStudioOwner
      ? [
          t('prePermission.benefits.bookingRequests'),
          t('prePermission.benefits.cancellations'),
        ]
      : [
          t('prePermission.benefits.reminder'),
          t('prePermission.benefits.changes'),
          t('prePermission.benefits.newStudios'),
        ];

    return (
      <div className="flex flex-col h-full" role="region" aria-labelledby={prePermissionHeadlineId}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{t('title')}</h2>
          <button
            onClick={() => onOpenChange(false)}
            className={cn(
              'p-2 -mr-2 text-gray-500 hover:text-gray-900 transition-colors',
              focusRingStyles
            )}
            aria-label={t('close')}
            type="button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center text-center px-4">
          <div className="rounded-full bg-[#B56550]/10 p-4 mb-6" aria-hidden="true">
            <Bell className="h-10 w-10 text-[#B56550]" />
          </div>

          <h3
            id={prePermissionHeadlineId}
            className="text-2xl font-semibold text-gray-900 mb-3"
          >
            {t('prePermission.headline')}
          </h3>

          <p id={prePermissionBodyId} className="text-gray-600 mb-8">
            {t('prePermission.body')}
          </p>

          <ul
            className="w-full max-w-sm space-y-3 mb-8"
            role="list"
            aria-label={t('prePermission.benefitsLabel')}
          >
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3 text-left">
                <div className="mt-0.5 rounded-full bg-green-100 p-1 flex-shrink-0" aria-hidden="true">
                  <Check className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className={cn(
            'flex flex-col gap-3',
            isMobile ? 'sticky bottom-0 bg-[#F4EDE8] py-4 border-t -mx-6 px-6' : 'pt-4'
          )}
          role="group"
          aria-label={t('prePermission.actionsLabel')}
        >
          <Button
            onClick={handlePrePermissionConfirm}
            disabled={isPushRegistering}
            className={cn(
              'w-full bg-[#B56550] hover:bg-[#A05540] text-white font-medium',
              focusRingStyles
            )}
            size="lg"
            aria-describedby={prePermissionBodyId}
          >
            {isPushRegistering ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            {isPushRegistering ? t('prePermission.ctaLoading') : t('prePermission.cta')}
          </Button>

          <button
            onClick={handlePrePermissionSkip}
            disabled={isPushRegistering}
            className={cn(
              'w-full text-sm text-gray-600 hover:text-gray-900 transition-colors py-2 disabled:opacity-50',
              focusRingStyles
            )}
            type="button"
          >
            {t('prePermission.skip')}
          </button>
        </div>
      </div>
    );
  };

  const renderCategoryToggle = (category: NotificationCategory): React.JSX.Element => {
    const Icon = category.icon;
    const isEnabled =
      settings.categorySettings[category.id] ?? category.defaultEnabled;
    const isSaving = savingField === category.id;
    const isDisabled = !hasActiveChannel;

    // Unique IDs for this category
    const categoryToggleId = `category-toggle-${category.id}-${uniqueId}`;
    const categoryDescriptionId = `category-desc-${category.id}-${uniqueId}`;

    return (
      <div
        key={category.id}
        className={cn(
          'flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0',
          isDisabled && 'opacity-50'
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn('p-2 rounded-lg flex-shrink-0', category.bgColor)} aria-hidden="true">
            <Icon className={cn('h-5 w-5', category.iconColor)} />
          </div>
          <div className="min-w-0">
            <Label
              htmlFor={categoryToggleId}
              className={cn(
                'text-base font-medium cursor-pointer',
                isDisabled ? 'text-gray-500' : 'text-gray-900'
              )}
            >
              {t(`categories.${category.titleKey}`)}
            </Label>
            <p id={categoryDescriptionId} className="text-sm text-gray-500 truncate">
              {t(`categories.${category.descriptionKey}`)}
            </p>
          </div>
        </div>
        <div className="ml-3 flex-shrink-0">
          {isSaving ? (
            <Loader2Icon
              className="h-5 w-5 animate-spin text-[#B56550]"
              aria-label={t('saving')}
              role="status"
            />
          ) : (
            <Switch
              id={categoryToggleId}
              checked={isEnabled}
              onCheckedChange={() => handleCategoryToggle(category.id)}
              disabled={isDisabled}
              aria-describedby={categoryDescriptionId}
            />
          )}
        </div>
      </div>
    );
  };

  const renderSettingsStep = (): React.JSX.Element => {
    const isDisabledDueToPermission = !isPushSupported;
    const isWaitingForPermission = registrationPhase === 'requesting_permission';
    const isPushDenied = permissionStatus === 'denied';

    const sectionTitle = isStudioOwner
      ? t('categories.sectionTitleBusiness')
      : t('categories.title');

    // Determine aria-describedby for push switch
    const pushAriaDescribedBy = !isPushSupported
      ? pushNotSupportedId
      : isPushDenied
        ? pushDeniedId
        : undefined;

    return (
      <>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">{t('title')}</h2>
            {isStudioOwner && (
              <p className="text-sm text-gray-500 mt-0.5">{t('subtitle.business')}</p>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className={cn(
              'p-2 -mr-2 text-gray-500 hover:text-gray-900 transition-colors',
              focusRingStyles
            )}
            aria-label={t('close')}
            type="button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {isFetchingPreferences || isContextLoading ? (
          <div
            className="flex items-center justify-center py-12"
            role="status"
            aria-busy="true"
            aria-label={t('loading')}
          >
            <Loader2Icon className="h-8 w-8 animate-spin text-[#B56550]" aria-hidden="true" />
            <span className="sr-only">{t('loading')}</span>
          </div>
        ) : (
          <div className="space-y-6" aria-busy={savingField !== null}>
            {/* Channels Section */}
            <div
              className="space-y-3"
              role="group"
              aria-labelledby={channelsHeadingId}
            >
              <h3
                id={channelsHeadingId}
                className="text-sm font-medium text-gray-500 uppercase tracking-wide"
              >
                {t('channels.title')}
              </h3>

              {/* Push */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#B56550]/10" aria-hidden="true">
                    <Smartphone className="h-5 w-5 text-[#B56550]" />
                  </div>
                  <div>
                    <Label
                      htmlFor={pushToggleId}
                      className="text-base font-medium text-gray-900 cursor-pointer"
                    >
                      {t('push.title')}
                    </Label>
                    {!isPushSupported && (
                      <p id={pushNotSupportedId} className="text-xs text-gray-500">
                        {t('push.notSupported')}
                      </p>
                    )}
                    {isPushDenied && (
                      <p id={pushDeniedId} className="text-xs text-amber-600">
                        {t('push.permissionDenied')}
                      </p>
                    )}
                  </div>
                </div>
                {isWaitingForPermission || savingField === 'push' ? (
                  <Loader2Icon
                    className="h-5 w-5 animate-spin text-[#B56550]"
                    aria-label={t('saving')}
                    role="status"
                  />
                ) : (
                  <Switch
                    id={pushToggleId}
                    checked={settings.pushEnabled || isPushRegistered}
                    onCheckedChange={handlePushToggle}
                    disabled={isDisabledDueToPermission || isPushDenied}
                    aria-describedby={pushAriaDescribedBy}
                  />
                )}
              </div>

              {/* Email */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#B56550]/10" aria-hidden="true">
                    <Mail className="h-5 w-5 text-[#B56550]" />
                  </div>
                  <Label
                    htmlFor={emailToggleId}
                    className="text-base font-medium text-gray-900 cursor-pointer"
                  >
                    {t('email.title')}
                  </Label>
                </div>
                {savingField === 'email' ? (
                  <Loader2Icon
                    className="h-5 w-5 animate-spin text-[#B56550]"
                    aria-label={t('saving')}
                    role="status"
                  />
                ) : (
                  <Switch
                    id={emailToggleId}
                    checked={settings.emailEnabled}
                    onCheckedChange={handleEmailToggle}
                  />
                )}
              </div>
            </div>

            {/* Dynamic Categories Section */}
            <div
              className="space-y-3"
              role="group"
              aria-labelledby={categoriesHeadingId}
            >
              <h3
                id={categoriesHeadingId}
                className="text-sm font-medium text-gray-500 uppercase tracking-wide"
              >
                {sectionTitle}
              </h3>

              {categories.map((category) => renderCategoryToggle(category))}
            </div>

            {/* Info text */}
            <p className="text-xs text-gray-500 text-center pt-2" role="note">
              {t('autoSaveInfo')}
            </p>
          </div>
        )}
      </>
    );
  };

  const content =
    currentStep === 'prePermission' ? renderPrePermissionStep() : renderSettingsStep();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          style={{ backgroundColor: '#F4EDE8' }}
          className="h-auto max-h-[85vh] rounded-t-3xl p-6 overflow-y-auto"
          showCloseButton={false}
        >
          <VisuallyHidden>
            <SheetTitle>{t('title')}</SheetTitle>
          </VisuallyHidden>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ backgroundColor: '#F4EDE8' }}
        className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>{t('title')}</DialogTitle>
        </VisuallyHidden>
        {content}
      </DialogContent>
    </Dialog>
  );
}
