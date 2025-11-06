"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVICE_TYPE_SYNONYMS = exports.SERVICE_TYPE_OPTIONS = exports.SERVICE_TYPES = void 0;
/**
 * Service Type Constants
 *
 * Defines standardized massage service types for the booking system.
 * These are used for smart matching between user selections and studio service offerings.
 */
exports.SERVICE_TYPES = {
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
};
/**
 * Service Type Options for UI (Dropdown/Select)
 * Includes icons for better visual representation
 */
exports.SERVICE_TYPE_OPTIONS = [
    { value: exports.SERVICE_TYPES.THAI, label: 'Thai-Massage', icon: '🇹🇭' },
    { value: exports.SERVICE_TYPES.TRADITIONAL_THAI, label: 'Traditionelle Thai-Massage', icon: '🙏' },
    { value: exports.SERVICE_TYPES.OIL, label: 'Ölmassage', icon: '💆' },
    { value: exports.SERVICE_TYPES.SPORT, label: 'Sportmassage', icon: '⚡' },
    { value: exports.SERVICE_TYPES.DEEP_TISSUE, label: 'Deep Tissue', icon: '💪' },
    { value: exports.SERVICE_TYPES.HOT_STONE, label: 'Hot Stone', icon: '🔥' },
    { value: exports.SERVICE_TYPES.AROMATHERAPY, label: 'Aromatherapie', icon: '🌸' },
    { value: exports.SERVICE_TYPES.REFLEXOLOGY, label: 'Fußreflexzonenmassage', icon: '🦶' },
    { value: exports.SERVICE_TYPES.SWEDISH, label: 'Schwedische Massage', icon: '🇸🇪' },
    { value: exports.SERVICE_TYPES.WELLNESS, label: 'Wellness-Massage', icon: '✨' },
    { value: exports.SERVICE_TYPES.COUPLE, label: 'Paarmassage', icon: '❤️' },
    { value: exports.SERVICE_TYPES.PREGNANCY, label: 'Schwangerschaftsmassage', icon: '🤰' },
    { value: exports.SERVICE_TYPES.AYURVEDA, label: 'Ayurveda-Massage', icon: '🕉️' },
    { value: exports.SERVICE_TYPES.SHIATSU, label: 'Shiatsu', icon: '🎋' },
    { value: exports.SERVICE_TYPES.LYMPHATIC, label: 'Lymphdrainage', icon: '💧' },
];
/**
 * Service Type Synonyms for Smart Matching
 *
 * Maps service types to common variations and keywords.
 * Used by the matching algorithm to find similar services.
 */
exports.SERVICE_TYPE_SYNONYMS = {
    [exports.SERVICE_TYPES.THAI]: [
        'thai',
        'thailand',
        'thaimassage',
        'thai massage',
    ],
    [exports.SERVICE_TYPES.TRADITIONAL_THAI]: [
        'traditionell',
        'traditional',
        'klassisch',
        'authentic',
        'original thai',
        'nuad',
    ],
    [exports.SERVICE_TYPES.OIL]: [
        'öl',
        'oil',
        'aromaöl',
        'massageöl',
        'ölmassage',
    ],
    [exports.SERVICE_TYPES.SPORT]: [
        'sport',
        'athletic',
        'fitness',
        'sportler',
    ],
    [exports.SERVICE_TYPES.DEEP_TISSUE]: [
        'deep tissue',
        'tiefengewebe',
        'deep',
        'tiefenmassage',
    ],
    [exports.SERVICE_TYPES.HOT_STONE]: [
        'hot stone',
        'warme steine',
        'heißer stein',
        'steinmassage',
        'lavastein',
    ],
    [exports.SERVICE_TYPES.AROMATHERAPY]: [
        'aroma',
        'aromatherapie',
        'aromatherapy',
        'duft',
        'ätherisch',
    ],
    [exports.SERVICE_TYPES.REFLEXOLOGY]: [
        'fuß',
        'fußreflexzonen',
        'reflexologie',
        'reflexology',
        'fußmassage',
    ],
    [exports.SERVICE_TYPES.SWEDISH]: [
        'schwedisch',
        'swedish',
        'klassisch',
        'klassische massage',
    ],
    [exports.SERVICE_TYPES.WELLNESS]: [
        'wellness',
        'entspannung',
        'relaxation',
        'wohlfühl',
    ],
    [exports.SERVICE_TYPES.COUPLE]: [
        'paar',
        'couple',
        'partner',
        'zu zweit',
    ],
    [exports.SERVICE_TYPES.PREGNANCY]: [
        'schwangerschaft',
        'pregnancy',
        'prenatal',
        'werdende mutter',
    ],
    [exports.SERVICE_TYPES.AYURVEDA]: [
        'ayurveda',
        'ayurvedisch',
        'indisch',
    ],
    [exports.SERVICE_TYPES.SHIATSU]: [
        'shiatsu',
        'akupressur',
        'japanisch',
    ],
    [exports.SERVICE_TYPES.LYMPHATIC]: [
        'lymph',
        'lymphdrainage',
        'lymphatic',
        'entstauung',
    ],
};
