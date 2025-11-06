"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMinPrice = getMinPrice;
exports.getMaxPrice = getMaxPrice;
exports.formatPriceLabel = formatPriceLabel;
exports.getPriceRange = getPriceRange;
exports.formatPriceRange = formatPriceRange;
exports.getAveragePrice = getAveragePrice;
exports.filterServicesByPrice = filterServicesByPrice;
/**
 * Berechnet niedrigsten Preis eines Studios
 *
 * @param services - Array of services with price information
 * @returns Lowest price, or 0 if no services
 *
 * @example
 * getMinPrice([{ price: 50 }, { price: 75 }, { price: 60 }]) // 50
 * getMinPrice([]) // 0
 */
function getMinPrice(services) {
    if (services.length === 0) {
        return 0;
    }
    return Math.min(...services.map((service) => service.price));
}
/**
 * Berechnet höchsten Preis eines Studios
 *
 * @param services - Array of services with price information
 * @returns Highest price, or 0 if no services
 */
function getMaxPrice(services) {
    if (services.length === 0) {
        return 0;
    }
    return Math.max(...services.map((service) => service.price));
}
/**
 * Format: "ab €55" für UI
 *
 * @param minPrice - The minimum price to format
 * @returns Formatted price label for UI display
 *
 * @example
 * formatPriceLabel(55) // "ab €55"
 * formatPriceLabel(0) // "Preis auf Anfrage"
 * formatPriceLabel(99.5) // "ab €99,50"
 */
function formatPriceLabel(minPrice) {
    if (minPrice === 0) {
        return 'Preis auf Anfrage';
    }
    // Format with German locale (€ symbol, comma as decimal separator)
    const formatted = new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(minPrice);
    return `ab ${formatted}`;
}
/**
 * Berechnet Preisspanne (für Studio-Detail-Page später)
 *
 * @param services - Array of services with price information
 * @returns Object with min and max prices
 *
 * @example
 * getPriceRange([{ price: 50 }, { price: 75 }]) // { min: 50, max: 75 }
 * getPriceRange([]) // { min: 0, max: 0 }
 */
function getPriceRange(services) {
    if (services.length === 0) {
        return { min: 0, max: 0 };
    }
    return {
        min: getMinPrice(services),
        max: getMaxPrice(services),
    };
}
/**
 * Formatiert Preisspanne für UI
 *
 * @param priceRange - Object with min and max prices
 * @returns Formatted price range string
 *
 * @example
 * formatPriceRange({ min: 50, max: 100 }) // "€50 - €100"
 * formatPriceRange({ min: 50, max: 50 }) // "€50"
 * formatPriceRange({ min: 0, max: 0 }) // "Preis auf Anfrage"
 */
function formatPriceRange(priceRange) {
    if (priceRange.min === 0 && priceRange.max === 0) {
        return 'Preis auf Anfrage';
    }
    const formatPrice = (price) => {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(price);
    };
    // Same price for all services
    if (priceRange.min === priceRange.max) {
        return formatPrice(priceRange.min);
    }
    return `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`;
}
/**
 * Berechnet Durchschnittspreis
 *
 * @param services - Array of services with price information
 * @returns Average price, or 0 if no services
 */
function getAveragePrice(services) {
    if (services.length === 0) {
        return 0;
    }
    const total = services.reduce((sum, service) => sum + service.price, 0);
    return Math.round((total / services.length) * 100) / 100; // Round to 2 decimals
}
/**
 * Filtert Services nach Preisspanne
 *
 * @param services - Array of services
 * @param minPrice - Optional minimum price filter
 * @param maxPrice - Optional maximum price filter
 * @returns Filtered array of services
 */
function filterServicesByPrice(services, minPrice, maxPrice) {
    return services.filter((service) => {
        const meetsMin = minPrice === undefined || service.price >= minPrice;
        const meetsMax = maxPrice === undefined || service.price <= maxPrice;
        return meetsMin && meetsMax;
    });
}
