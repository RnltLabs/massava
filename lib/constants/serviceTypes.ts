/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

/**
 * Service Type Constants
 *
 * Defines standardized massage service types for the booking system.
 * These are used for smart matching between user selections and studio service offerings.
 */
export const SERVICE_TYPES = {
  THAI: 'Thai-Massage',
  TRADITIONAL_THAI: 'Traditionelle Thai-Massage',
  OIL: 'Ölmassage',
  SPORT: 'Sportmassage',
  DEEP_TISSUE: 'Deep Tissue',
  HOT_STONE: 'Hot Stone',
  AROMATHERAPY: 'Aromatherapie',
  REFLEXOLOGY: 'Fußreflexzonenmassage',
  SWEDISH: 'Schwedische Massage',
  WELLNESS: 'Wellness-Massage',
  COUPLE: 'Paarmassage',
  PREGNANCY: 'Schwangerschaftsmassage',
  AYURVEDA: 'Ayurveda-Massage',
  SHIATSU: 'Shiatsu',
  LYMPHATIC: 'Lymphdrainage',
} as const;

export type ServiceType = typeof SERVICE_TYPES[keyof typeof SERVICE_TYPES];

/**
 * Service Type Options for UI (Dropdown/Select)
 * Includes icons for better visual representation
 */
export const SERVICE_TYPE_OPTIONS = [
  { value: SERVICE_TYPES.THAI, label: 'Thai-Massage', icon: '🇹🇭' },
  { value: SERVICE_TYPES.TRADITIONAL_THAI, label: 'Traditionelle Thai-Massage', icon: '🙏' },
  { value: SERVICE_TYPES.OIL, label: 'Ölmassage', icon: '💆' },
  { value: SERVICE_TYPES.SPORT, label: 'Sportmassage', icon: '⚡' },
  { value: SERVICE_TYPES.DEEP_TISSUE, label: 'Deep Tissue', icon: '💪' },
  { value: SERVICE_TYPES.HOT_STONE, label: 'Hot Stone', icon: '🔥' },
  { value: SERVICE_TYPES.AROMATHERAPY, label: 'Aromatherapie', icon: '🌸' },
  { value: SERVICE_TYPES.REFLEXOLOGY, label: 'Fußreflexzonenmassage', icon: '🦶' },
  { value: SERVICE_TYPES.SWEDISH, label: 'Schwedische Massage', icon: '🇸🇪' },
  { value: SERVICE_TYPES.WELLNESS, label: 'Wellness-Massage', icon: '✨' },
  { value: SERVICE_TYPES.COUPLE, label: 'Paarmassage', icon: '❤️' },
  { value: SERVICE_TYPES.PREGNANCY, label: 'Schwangerschaftsmassage', icon: '🤰' },
  { value: SERVICE_TYPES.AYURVEDA, label: 'Ayurveda-Massage', icon: '🕉️' },
  { value: SERVICE_TYPES.SHIATSU, label: 'Shiatsu', icon: '🎋' },
  { value: SERVICE_TYPES.LYMPHATIC, label: 'Lymphdrainage', icon: '💧' },
] as const;

/**
 * Service Type Synonyms for Smart Matching
 *
 * Maps service types to common variations and keywords.
 * Used by the matching algorithm to find similar services.
 */
export const SERVICE_TYPE_SYNONYMS: Record<ServiceType, string[]> = {
  [SERVICE_TYPES.THAI]: [
    'thai',
    'thailand',
    'thaimassage',
    'thai massage',
  ],
  [SERVICE_TYPES.TRADITIONAL_THAI]: [
    'traditionell',
    'traditional',
    'klassisch',
    'authentic',
    'original thai',
    'nuad',
  ],
  [SERVICE_TYPES.OIL]: [
    'öl',
    'oil',
    'aromaöl',
    'massageöl',
    'ölmassage',
  ],
  [SERVICE_TYPES.SPORT]: [
    'sport',
    'athletic',
    'fitness',
    'sportler',
  ],
  [SERVICE_TYPES.DEEP_TISSUE]: [
    'deep tissue',
    'tiefengewebe',
    'deep',
    'tiefenmassage',
  ],
  [SERVICE_TYPES.HOT_STONE]: [
    'hot stone',
    'warme steine',
    'heißer stein',
    'steinmassage',
    'lavastein',
  ],
  [SERVICE_TYPES.AROMATHERAPY]: [
    'aroma',
    'aromatherapie',
    'aromatherapy',
    'duft',
    'ätherisch',
  ],
  [SERVICE_TYPES.REFLEXOLOGY]: [
    'fuß',
    'fußreflexzonen',
    'reflexologie',
    'reflexology',
    'fußmassage',
  ],
  [SERVICE_TYPES.SWEDISH]: [
    'schwedisch',
    'swedish',
    'klassisch',
    'klassische massage',
  ],
  [SERVICE_TYPES.WELLNESS]: [
    'wellness',
    'entspannung',
    'relaxation',
    'wohlfühl',
  ],
  [SERVICE_TYPES.COUPLE]: [
    'paar',
    'couple',
    'partner',
    'zu zweit',
  ],
  [SERVICE_TYPES.PREGNANCY]: [
    'schwangerschaft',
    'pregnancy',
    'prenatal',
    'werdende mutter',
  ],
  [SERVICE_TYPES.AYURVEDA]: [
    'ayurveda',
    'ayurvedisch',
    'indisch',
  ],
  [SERVICE_TYPES.SHIATSU]: [
    'shiatsu',
    'akupressur',
    'japanisch',
  ],
  [SERVICE_TYPES.LYMPHATIC]: [
    'lymph',
    'lymphdrainage',
    'lymphatic',
    'entstauung',
  ],
};
