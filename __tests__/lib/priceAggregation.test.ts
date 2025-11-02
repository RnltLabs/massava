/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { describe, it, expect } from 'vitest';
import {
  getMinPrice,
  getMaxPrice,
  getPriceRange,
  formatPriceLabel,
  formatPriceRange,
  getAveragePrice,
  filterServicesByPrice,
} from '@/lib/utils/priceAggregation';

describe('getMinPrice', () => {
  it('should return the minimum price from services', () => {
    const services = [
      { id: '1', price: 75 },
      { id: '2', price: 50 },
      { id: '3', price: 100 },
    ];

    expect(getMinPrice(services)).toBe(50);
  });

  it('should return 0 for empty array', () => {
    expect(getMinPrice([])).toBe(0);
  });

  it('should handle single service', () => {
    const services = [{ id: '1', price: 55 }];
    expect(getMinPrice(services)).toBe(55);
  });

  it('should handle decimal prices', () => {
    const services = [
      { id: '1', price: 49.99 },
      { id: '2', price: 50.50 },
    ];

    expect(getMinPrice(services)).toBe(49.99);
  });
});

describe('getMaxPrice', () => {
  it('should return the maximum price from services', () => {
    const services = [
      { id: '1', price: 75 },
      { id: '2', price: 50 },
      { id: '3', price: 100 },
    ];

    expect(getMaxPrice(services)).toBe(100);
  });

  it('should return 0 for empty array', () => {
    expect(getMaxPrice([])).toBe(0);
  });

  it('should handle single service', () => {
    const services = [{ id: '1', price: 55 }];
    expect(getMaxPrice(services)).toBe(55);
  });
});

describe('getPriceRange', () => {
  it('should return min and max prices', () => {
    const services = [
      { id: '1', price: 50 },
      { id: '2', price: 75 },
      { id: '3', price: 100 },
    ];

    const range = getPriceRange(services);
    expect(range.min).toBe(50);
    expect(range.max).toBe(100);
  });

  it('should return same min and max for single service', () => {
    const services = [{ id: '1', price: 55 }];
    const range = getPriceRange(services);

    expect(range.min).toBe(55);
    expect(range.max).toBe(55);
  });

  it('should return 0/0 for empty array', () => {
    const range = getPriceRange([]);
    expect(range.min).toBe(0);
    expect(range.max).toBe(0);
  });
});

describe('formatPriceLabel', () => {
  it('should format price with "ab" prefix', () => {
    expect(formatPriceLabel(55)).toBe('ab €55');
    expect(formatPriceLabel(100)).toBe('ab €100');
  });

  it('should handle decimal prices with German formatting', () => {
    expect(formatPriceLabel(99.5)).toBe('ab €99,50');
    expect(formatPriceLabel(49.99)).toBe('ab €49,99');
  });

  it('should return "Preis auf Anfrage" for zero price', () => {
    expect(formatPriceLabel(0)).toBe('Preis auf Anfrage');
  });

  it('should format whole numbers without decimals', () => {
    expect(formatPriceLabel(50)).toBe('ab €50');
  });
});

describe('formatPriceRange', () => {
  it('should format price range', () => {
    expect(formatPriceRange({ min: 50, max: 100 })).toBe('€50 - €100');
  });

  it('should show single price when min equals max', () => {
    expect(formatPriceRange({ min: 75, max: 75 })).toBe('€75');
  });

  it('should return "Preis auf Anfrage" for 0/0', () => {
    expect(formatPriceRange({ min: 0, max: 0 })).toBe('Preis auf Anfrage');
  });

  it('should handle decimal prices with German formatting', () => {
    expect(formatPriceRange({ min: 49.99, max: 99.99 })).toBe('€49,99 - €99,99');
  });
});

describe('getAveragePrice', () => {
  it('should calculate average price', () => {
    const services = [
      { id: '1', price: 50 },
      { id: '2', price: 60 },
      { id: '3', price: 70 },
    ];

    expect(getAveragePrice(services)).toBe(60);
  });

  it('should return 0 for empty array', () => {
    expect(getAveragePrice([])).toBe(0);
  });

  it('should round to 2 decimal places', () => {
    const services = [
      { id: '1', price: 50 },
      { id: '2', price: 55 },
      { id: '3', price: 60 },
    ];

    expect(getAveragePrice(services)).toBe(55);
  });

  it('should handle decimal averages', () => {
    const services = [
      { id: '1', price: 50 },
      { id: '2', price: 51 },
    ];

    expect(getAveragePrice(services)).toBe(50.5);
  });
});

describe('filterServicesByPrice', () => {
  const mockServices = [
    { id: '1', name: 'Service A', price: 30 },
    { id: '2', name: 'Service B', price: 50 },
    { id: '3', name: 'Service C', price: 70 },
    { id: '4', name: 'Service D', price: 100 },
  ];

  it('should filter by minimum price', () => {
    const result = filterServicesByPrice(mockServices, 60);
    expect(result).toHaveLength(2);
    expect(result[0].price).toBe(70);
    expect(result[1].price).toBe(100);
  });

  it('should filter by maximum price', () => {
    const result = filterServicesByPrice(mockServices, undefined, 60);
    expect(result).toHaveLength(2);
    expect(result[0].price).toBe(30);
    expect(result[1].price).toBe(50);
  });

  it('should filter by price range', () => {
    const result = filterServicesByPrice(mockServices, 40, 80);
    expect(result).toHaveLength(2);
    expect(result[0].price).toBe(50);
    expect(result[1].price).toBe(70);
  });

  it('should return all services when no filter is specified', () => {
    const result = filterServicesByPrice(mockServices);
    expect(result).toHaveLength(4);
  });

  it('should include boundary values', () => {
    const result = filterServicesByPrice(mockServices, 50, 70);
    expect(result).toHaveLength(2);
    expect(result[0].price).toBe(50);
    expect(result[1].price).toBe(70);
  });

  it('should return empty array when no services match', () => {
    const result = filterServicesByPrice(mockServices, 150, 200);
    expect(result).toHaveLength(0);
  });
});
