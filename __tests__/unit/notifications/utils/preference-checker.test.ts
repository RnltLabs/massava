/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * User Preference Checker Tests
 * Unit tests for notification preference checking
 */

import { describe, it, expect } from '@jest/globals';
import {
  checkUserPreferences,
  shouldSendEmailImmediately,
} from '@/lib/notifications/utils/preference-checker';
import type { NotificationPreference } from '@/app/generated/prisma';

describe('User Preference Checker', () => {
  describe('checkUserPreferences', () => {
    describe('Null Preferences (Defaults)', () => {
      it('sollte Default-Kanäle für BOOKING_CONFIRMED verwenden', () => {
        const channels = checkUserPreferences(null, 'BOOKING_CONFIRMED');

        // Default: ['PUSH', 'EMAIL', 'IN_APP']
        expect(channels).toContain('PUSH');
        expect(channels).toContain('EMAIL');
        expect(channels).toContain('IN_APP');
        expect(channels).toHaveLength(3);
      });

      it('sollte Default-Kanäle für BOOKING_REMINDER_CUSTOMER verwenden', () => {
        const channels = checkUserPreferences(null, 'BOOKING_REMINDER_CUSTOMER');

        // Default: push: true, email: 'off', inApp: true
        expect(channels).toContain('PUSH');
        expect(channels).toContain('IN_APP');
        expect(channels).not.toContain('EMAIL');
      });

      it('sollte Default-Kanäle für ACCOUNT_LOGIN_NEW_DEVICE verwenden', () => {
        const channels = checkUserPreferences(null, 'ACCOUNT_LOGIN_NEW_DEVICE');

        // Default: push: true, email: 'instant', inApp: false
        expect(channels).toContain('PUSH');
        expect(channels).toContain('EMAIL');
        expect(channels).not.toContain('IN_APP');
      });

      it('sollte Default-Kanäle für STUDIO_PROMOTION verwenden', () => {
        const channels = checkUserPreferences(null, 'STUDIO_PROMOTION');

        // Default: push: false, email: 'digest', inApp: false
        expect(channels).toContain('EMAIL');
        expect(channels).not.toContain('PUSH');
        expect(channels).not.toContain('IN_APP');
      });

      it('sollte Default-Kanäle für FEATURE_ANNOUNCEMENT verwenden', () => {
        const channels = checkUserPreferences(null, 'FEATURE_ANNOUNCEMENT');

        // Default: push: false, email: 'off', inApp: true
        expect(channels).toContain('IN_APP');
        expect(channels).not.toContain('PUSH');
        expect(channels).not.toContain('EMAIL');
      });
    });

    describe('Global Toggles', () => {
      it('sollte PUSH deaktivieren wenn pushEnabled false ist', () => {
        const preferences: Partial<NotificationPreference> = {
          pushEnabled: false,
          emailEnabled: true,
          inAppEnabled: true,
          typePreferences: {},
        };

        const channels = checkUserPreferences(
          preferences as NotificationPreference,
          'BOOKING_CONFIRMED'
        );

        expect(channels).not.toContain('PUSH');
        expect(channels).toContain('EMAIL');
        expect(channels).toContain('IN_APP');
      });

      it('sollte EMAIL deaktivieren wenn emailEnabled false ist', () => {
        const preferences: Partial<NotificationPreference> = {
          pushEnabled: true,
          emailEnabled: false,
          inAppEnabled: true,
          typePreferences: {},
        };

        const channels = checkUserPreferences(
          preferences as NotificationPreference,
          'BOOKING_CONFIRMED'
        );

        expect(channels).toContain('PUSH');
        expect(channels).not.toContain('EMAIL');
        expect(channels).toContain('IN_APP');
      });

      it('sollte IN_APP deaktivieren wenn inAppEnabled false ist', () => {
        const preferences: Partial<NotificationPreference> = {
          pushEnabled: true,
          emailEnabled: true,
          inAppEnabled: false,
          typePreferences: {},
        };

        const channels = checkUserPreferences(
          preferences as NotificationPreference,
          'BOOKING_CONFIRMED'
        );

        expect(channels).toContain('PUSH');
        expect(channels).toContain('EMAIL');
        expect(channels).not.toContain('IN_APP');
      });

      it('sollte alle Kanäle deaktivieren wenn alle Global Toggles false sind', () => {
        const preferences: Partial<NotificationPreference> = {
          pushEnabled: false,
          emailEnabled: false,
          inAppEnabled: false,
          typePreferences: {},
        };

        const channels = checkUserPreferences(
          preferences as NotificationPreference,
          'BOOKING_CONFIRMED'
        );

        // Fallback zu IN_APP wenn keine Kanäle aktiviert
        expect(channels).toEqual(['IN_APP']);
      });
    });

    describe('Type-Specific Preferences', () => {
      it('sollte type-specific preferences respektieren', () => {
        const preferences: Partial<NotificationPreference> = {
          pushEnabled: true,
          emailEnabled: true,
          inAppEnabled: true,
          typePreferences: {
            BOOKING_CONFIRMED: {
              push: false,
              email: 'instant',
              inApp: true,
            },
          },
        };

        const channels = checkUserPreferences(
          preferences as NotificationPreference,
          'BOOKING_CONFIRMED'
        );

        expect(channels).not.toContain('PUSH');
        expect(channels).toContain('EMAIL');
        expect(channels).toContain('IN_APP');
      });

      it('sollte email "off" korrekt behandeln', () => {
        const preferences: Partial<NotificationPreference> = {
          pushEnabled: true,
          emailEnabled: true,
          inAppEnabled: true,
          typePreferences: {
            BOOKING_REMINDER_CUSTOMER: {
              push: true,
              email: 'off',
              inApp: true,
            },
          },
        };

        const channels = checkUserPreferences(
          preferences as NotificationPreference,
          'BOOKING_REMINDER_CUSTOMER'
        );

        expect(channels).toContain('PUSH');
        expect(channels).not.toContain('EMAIL');
        expect(channels).toContain('IN_APP');
      });

      it('sollte email "digest" als aktiviert behandeln', () => {
        const preferences: Partial<NotificationPreference> = {
          pushEnabled: true,
          emailEnabled: true,
          inAppEnabled: true,
          typePreferences: {
            STUDIO_PROMOTION: {
              push: false,
              email: 'digest',
              inApp: false,
            },
          },
        };

        const channels = checkUserPreferences(
          preferences as NotificationPreference,
          'STUDIO_PROMOTION'
        );

        expect(channels).not.toContain('PUSH');
        expect(channels).toContain('EMAIL');
        expect(channels).not.toContain('IN_APP');
      });

      it('sollte alle type-specific Kanäle aktivieren', () => {
        const preferences: Partial<NotificationPreference> = {
          pushEnabled: true,
          emailEnabled: true,
          inAppEnabled: true,
          typePreferences: {
            BOOKING_REQUEST_RECEIVED: {
              push: true,
              email: 'instant',
              inApp: true,
            },
          },
        };

        const channels = checkUserPreferences(
          preferences as NotificationPreference,
          'BOOKING_REQUEST_RECEIVED'
        );

        expect(channels).toContain('PUSH');
        expect(channels).toContain('EMAIL');
        expect(channels).toContain('IN_APP');
        expect(channels).toHaveLength(3);
      });
    });

    describe('Global Toggle Override', () => {
      it('sollte Global Toggle über Type Preference stellen (PUSH)', () => {
        const preferences: Partial<NotificationPreference> = {
          pushEnabled: false, // Global disabled
          emailEnabled: true,
          inAppEnabled: true,
          typePreferences: {
            BOOKING_CONFIRMED: {
              push: true, // Type enabled
              email: 'instant',
              inApp: true,
            },
          },
        };

        const channels = checkUserPreferences(
          preferences as NotificationPreference,
          'BOOKING_CONFIRMED'
        );

        // Global toggle sollte gewinnen
        expect(channels).not.toContain('PUSH');
        expect(channels).toContain('EMAIL');
        expect(channels).toContain('IN_APP');
      });

      it('sollte Global Toggle über Type Preference stellen (EMAIL)', () => {
        const preferences: Partial<NotificationPreference> = {
          pushEnabled: true,
          emailEnabled: false, // Global disabled
          inAppEnabled: true,
          typePreferences: {
            BOOKING_CONFIRMED: {
              push: true,
              email: 'instant', // Type enabled
              inApp: true,
            },
          },
        };

        const channels = checkUserPreferences(
          preferences as NotificationPreference,
          'BOOKING_CONFIRMED'
        );

        expect(channels).toContain('PUSH');
        expect(channels).not.toContain('EMAIL'); // Global disabled
        expect(channels).toContain('IN_APP');
      });

      it('sollte Global Toggle über Type Preference stellen (IN_APP)', () => {
        const preferences: Partial<NotificationPreference> = {
          pushEnabled: true,
          emailEnabled: true,
          inAppEnabled: false, // Global disabled
          typePreferences: {
            BOOKING_CONFIRMED: {
              push: true,
              email: 'instant',
              inApp: true, // Type enabled
            },
          },
        };

        const channels = checkUserPreferences(
          preferences as NotificationPreference,
          'BOOKING_CONFIRMED'
        );

        expect(channels).toContain('PUSH');
        expect(channels).toContain('EMAIL');
        expect(channels).not.toContain('IN_APP'); // Global disabled
      });
    });

    describe('Fallback zu IN_APP', () => {
      it('sollte IN_APP als Fallback verwenden wenn keine Kanäle aktiviert', () => {
        const preferences: Partial<NotificationPreference> = {
          pushEnabled: false,
          emailEnabled: false,
          inAppEnabled: false,
          typePreferences: {
            BOOKING_CONFIRMED: {
              push: false,
              email: 'off',
              inApp: false,
            },
          },
        };

        const channels = checkUserPreferences(
          preferences as NotificationPreference,
          'BOOKING_CONFIRMED'
        );

        expect(channels).toEqual(['IN_APP']);
      });

      it('sollte IN_APP als Fallback verwenden bei fehlenden Type Preferences', () => {
        const preferences: Partial<NotificationPreference> = {
          pushEnabled: false,
          emailEnabled: false,
          inAppEnabled: false,
          typePreferences: {},
        };

        const channels = checkUserPreferences(
          preferences as NotificationPreference,
          'BOOKING_CONFIRMED'
        );

        expect(channels).toEqual(['IN_APP']);
      });
    });

    describe('Edge Cases', () => {
      it('sollte mit undefined Global Toggles umgehen (als true behandeln)', () => {
        const preferences: Partial<NotificationPreference> = {
          // Alle undefined
          typePreferences: {
            BOOKING_CONFIRMED: {
              push: true,
              email: 'instant',
              inApp: true,
            },
          },
        };

        const channels = checkUserPreferences(
          preferences as NotificationPreference,
          'BOOKING_CONFIRMED'
        );

        // undefined sollte als enabled behandelt werden
        expect(channels).toContain('PUSH');
        expect(channels).toContain('EMAIL');
        expect(channels).toContain('IN_APP');
      });

      it('sollte mit leerem typePreferences Object umgehen', () => {
        const preferences: Partial<NotificationPreference> = {
          pushEnabled: true,
          emailEnabled: true,
          inAppEnabled: true,
          typePreferences: {},
        };

        const channels = checkUserPreferences(
          preferences as NotificationPreference,
          'BOOKING_CONFIRMED'
        );

        // Sollte auf Defaults zurückfallen
        expect(channels).toContain('PUSH');
        expect(channels).toContain('EMAIL');
        expect(channels).toContain('IN_APP');
      });

      it('sollte mit nicht existierendem Type umgehen', () => {
        const preferences: Partial<NotificationPreference> = {
          pushEnabled: true,
          emailEnabled: true,
          inAppEnabled: true,
          typePreferences: {},
        };

        // @ts-expect-error Testing invalid type
        const channels = checkUserPreferences(preferences as NotificationPreference, 'INVALID_TYPE');

        // Sollte Fallback verwenden
        expect(channels).toEqual(['IN_APP']);
      });
    });

    describe('Alle Notification Types', () => {
      const allTypes = [
        'BOOKING_REQUEST_RECEIVED',
        'BOOKING_CANCELLED_BY_CUSTOMER',
        'BOOKING_REMINDER_STUDIO',
        'PAYMENT_RECEIVED',
        'REVIEW_POSTED',
        'LOW_AVAILABILITY_ALERT',
        'BOOKING_CONFIRMED',
        'BOOKING_REJECTED',
        'BOOKING_REMINDER_CUSTOMER',
        'BOOKING_CANCELLED_BY_STUDIO',
        'REVIEW_REQUEST',
        'STUDIO_PROMOTION',
        'ACCOUNT_LOGIN_NEW_DEVICE',
        'ACCOUNT_PASSWORD_CHANGED',
        'ACCOUNT_EMAIL_CHANGED',
        'ACCOUNT_TWO_FACTOR_ENABLED',
        'ACCOUNT_DELETION_SCHEDULED',
        'ACCOUNT_DELETION_CANCELLED',
        'SYSTEM_MAINTENANCE',
        'FEATURE_ANNOUNCEMENT',
        'TERMS_UPDATE',
        'WELCOME',
        'ONBOARDING_REMINDER',
        'SUBSCRIPTION_EXPIRING',
        'SUBSCRIPTION_EXPIRED',
      ];

      it('sollte für alle Types mindestens einen Kanal zurückgeben', () => {
        allTypes.forEach((type) => {
          const channels = checkUserPreferences(null, type as any);
          expect(channels.length).toBeGreaterThan(0);
        });
      });

      it('sollte für alle Types valide Kanäle zurückgeben', () => {
        const validChannels = ['PUSH', 'EMAIL', 'IN_APP'];

        allTypes.forEach((type) => {
          const channels = checkUserPreferences(null, type as any);
          channels.forEach((channel) => {
            expect(validChannels).toContain(channel);
          });
        });
      });
    });
  });

  describe('shouldSendEmailImmediately', () => {
    describe('Email disabled', () => {
      it('sollte false zurückgeben wenn emailEnabled false ist', () => {
        const preferences: Partial<NotificationPreference> = {
          emailEnabled: false,
          typePreferences: {
            BOOKING_CONFIRMED: {
              push: true,
              email: 'instant',
              inApp: true,
            },
          },
        };

        const result = shouldSendEmailImmediately(
          preferences as NotificationPreference,
          'BOOKING_CONFIRMED'
        );

        expect(result).toBe(false);
      });

      it('sollte false zurückgeben bei null preferences', () => {
        const result = shouldSendEmailImmediately(null, 'BOOKING_CONFIRMED');
        expect(result).toBe(false);
      });

      it('sollte false zurückgeben wenn emailEnabled undefined ist', () => {
        const preferences: Partial<NotificationPreference> = {
          typePreferences: {
            BOOKING_CONFIRMED: {
              push: true,
              email: 'instant',
              inApp: true,
            },
          },
        };

        const result = shouldSendEmailImmediately(
          preferences as NotificationPreference,
          'BOOKING_CONFIRMED'
        );

        expect(result).toBe(false);
      });
    });

    describe('Email instant', () => {
      it('sollte true zurückgeben für email "instant"', () => {
        const preferences: Partial<NotificationPreference> = {
          emailEnabled: true,
          typePreferences: {
            BOOKING_CONFIRMED: {
              push: true,
              email: 'instant',
              inApp: true,
            },
          },
        };

        const result = shouldSendEmailImmediately(
          preferences as NotificationPreference,
          'BOOKING_CONFIRMED'
        );

        expect(result).toBe(true);
      });

      it('sollte true zurückgeben für Default instant Email Type', () => {
        const preferences: Partial<NotificationPreference> = {
          emailEnabled: true,
          typePreferences: {},
        };

        // BOOKING_CONFIRMED hat default email: 'instant'
        const result = shouldSendEmailImmediately(
          preferences as NotificationPreference,
          'BOOKING_CONFIRMED'
        );

        expect(result).toBe(true);
      });
    });

    describe('Email digest', () => {
      it('sollte false zurückgeben für email "digest"', () => {
        const preferences: Partial<NotificationPreference> = {
          emailEnabled: true,
          typePreferences: {
            STUDIO_PROMOTION: {
              push: false,
              email: 'digest',
              inApp: false,
            },
          },
        };

        const result = shouldSendEmailImmediately(
          preferences as NotificationPreference,
          'STUDIO_PROMOTION'
        );

        expect(result).toBe(false);
      });

      it('sollte false zurückgeben für Default digest Email Type', () => {
        const preferences: Partial<NotificationPreference> = {
          emailEnabled: true,
          typePreferences: {},
        };

        // STUDIO_PROMOTION hat default email: 'digest'
        const result = shouldSendEmailImmediately(
          preferences as NotificationPreference,
          'STUDIO_PROMOTION'
        );

        expect(result).toBe(false);
      });
    });

    describe('Email off', () => {
      it('sollte false zurückgeben für email "off"', () => {
        const preferences: Partial<NotificationPreference> = {
          emailEnabled: true,
          typePreferences: {
            BOOKING_REMINDER_CUSTOMER: {
              push: true,
              email: 'off',
              inApp: true,
            },
          },
        };

        const result = shouldSendEmailImmediately(
          preferences as NotificationPreference,
          'BOOKING_REMINDER_CUSTOMER'
        );

        expect(result).toBe(false);
      });

      it('sollte false zurückgeben für Default off Email Type', () => {
        const preferences: Partial<NotificationPreference> = {
          emailEnabled: true,
          typePreferences: {},
        };

        // FEATURE_ANNOUNCEMENT hat default email: 'off'
        const result = shouldSendEmailImmediately(
          preferences as NotificationPreference,
          'FEATURE_ANNOUNCEMENT'
        );

        expect(result).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('sollte false zurückgeben bei fehlendem Type in Preferences', () => {
        const preferences: Partial<NotificationPreference> = {
          emailEnabled: true,
          typePreferences: {},
        };

        // @ts-expect-error Testing invalid type
        const result = shouldSendEmailImmediately(preferences as NotificationPreference, 'INVALID_TYPE');

        expect(result).toBe(false);
      });

      it('sollte Default verwenden wenn Type Preference fehlt', () => {
        const preferences: Partial<NotificationPreference> = {
          emailEnabled: true,
          typePreferences: {},
        };

        // BOOKING_CONFIRMED Default ist 'instant'
        const result = shouldSendEmailImmediately(
          preferences as NotificationPreference,
          'BOOKING_CONFIRMED'
        );

        expect(result).toBe(true);
      });
    });

    describe('Alle Notification Types mit instant Email', () => {
      const instantEmailTypes = [
        'BOOKING_REQUEST_RECEIVED',
        'BOOKING_CANCELLED_BY_CUSTOMER',
        'PAYMENT_RECEIVED',
        'BOOKING_CONFIRMED',
        'BOOKING_REJECTED',
        'BOOKING_CANCELLED_BY_STUDIO',
        'REVIEW_REQUEST',
        'ACCOUNT_LOGIN_NEW_DEVICE',
        'ACCOUNT_PASSWORD_CHANGED',
        'ACCOUNT_EMAIL_CHANGED',
        'ACCOUNT_TWO_FACTOR_ENABLED',
        'ACCOUNT_DELETION_SCHEDULED',
        'ACCOUNT_DELETION_CANCELLED',
        'SYSTEM_MAINTENANCE',
        'TERMS_UPDATE',
        'WELCOME',
        'ONBOARDING_REMINDER',
        'SUBSCRIPTION_EXPIRING',
        'SUBSCRIPTION_EXPIRED',
      ];

      it('sollte true für alle instant Email Types zurückgeben', () => {
        const preferences: Partial<NotificationPreference> = {
          emailEnabled: true,
          typePreferences: {},
        };

        instantEmailTypes.forEach((type) => {
          const result = shouldSendEmailImmediately(
            preferences as NotificationPreference,
            type as any
          );
          expect(result).toBe(true);
        });
      });
    });

    describe('Alle Notification Types mit digest Email', () => {
      const digestEmailTypes = ['STUDIO_PROMOTION'];

      it('sollte false für alle digest Email Types zurückgeben', () => {
        const preferences: Partial<NotificationPreference> = {
          emailEnabled: true,
          typePreferences: {},
        };

        digestEmailTypes.forEach((type) => {
          const result = shouldSendEmailImmediately(
            preferences as NotificationPreference,
            type as any
          );
          expect(result).toBe(false);
        });
      });
    });

    describe('Alle Notification Types mit off Email', () => {
      const offEmailTypes = [
        'BOOKING_REMINDER_STUDIO',
        'REVIEW_POSTED',
        'BOOKING_REMINDER_CUSTOMER',
        'FEATURE_ANNOUNCEMENT',
      ];

      it('sollte false für alle off Email Types zurückgeben', () => {
        const preferences: Partial<NotificationPreference> = {
          emailEnabled: true,
          typePreferences: {},
        };

        offEmailTypes.forEach((type) => {
          const result = shouldSendEmailImmediately(
            preferences as NotificationPreference,
            type as any
          );
          expect(result).toBe(false);
        });
      });
    });
  });
});
