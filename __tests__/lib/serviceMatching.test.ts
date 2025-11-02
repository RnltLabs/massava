/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { describe, it, expect } from 'vitest';
import {
  matchesServiceType,
  filterServicesByType,
  getMatchingServiceTypes,
  groupServicesByType,
} from '@/lib/utils/serviceMatching';
import { SERVICE_TYPES } from '@/lib/constants/serviceTypes';

describe('matchesServiceType', () => {
  describe('exact matches', () => {
    it('should match exact service type', () => {
      expect(matchesServiceType('Thai-Massage', SERVICE_TYPES.THAI)).toBe(true);
      expect(matchesServiceType('Sportmassage', SERVICE_TYPES.SPORT)).toBe(true);
      expect(matchesServiceType('Ölmassage', SERVICE_TYPES.OIL)).toBe(true);
    });
  });

  describe('case-insensitive matching', () => {
    it('should match regardless of case', () => {
      expect(matchesServiceType('THAI-MASSAGE', SERVICE_TYPES.THAI)).toBe(true);
      expect(matchesServiceType('thai massage', SERVICE_TYPES.THAI)).toBe(true);
      expect(matchesServiceType('ThAi MaSsAgE', SERVICE_TYPES.THAI)).toBe(true);
    });
  });

  describe('substring matching', () => {
    it('should match when service type is part of the name', () => {
      expect(matchesServiceType('Traditionelle Thai-Massage', SERVICE_TYPES.THAI)).toBe(true);
      expect(matchesServiceType('Thai Wellness Massage', SERVICE_TYPES.THAI)).toBe(true);
      expect(matchesServiceType('Authentische Thai Massage', SERVICE_TYPES.THAI)).toBe(true);
    });
  });

  describe('synonym matching', () => {
    it('should match using synonyms', () => {
      // Thai synonyms
      expect(matchesServiceType('Thailand Massage', SERVICE_TYPES.THAI)).toBe(true);
      expect(matchesServiceType('Nuad Thai', SERVICE_TYPES.TRADITIONAL_THAI)).toBe(true);

      // Sport synonyms
      expect(matchesServiceType('Athletic Massage', SERVICE_TYPES.SPORT)).toBe(true);
      expect(matchesServiceType('Fitness Massage', SERVICE_TYPES.SPORT)).toBe(true);

      // Oil synonyms
      expect(matchesServiceType('Aromaöl Massage', SERVICE_TYPES.OIL)).toBe(true);
      expect(matchesServiceType('Massageöl Treatment', SERVICE_TYPES.OIL)).toBe(true);
    });
  });

  describe('diacritic normalization', () => {
    it('should match with and without umlauts', () => {
      expect(matchesServiceType('Ölmassage', SERVICE_TYPES.OIL)).toBe(true);
      expect(matchesServiceType('Olmassage', SERVICE_TYPES.OIL)).toBe(true);
      expect(matchesServiceType('Fußreflexzonenmassage', SERVICE_TYPES.REFLEXOLOGY)).toBe(true);
      expect(matchesServiceType('Fussreflexzonenmassage', SERVICE_TYPES.REFLEXOLOGY)).toBe(true);
    });
  });

  describe('whitespace tolerance', () => {
    it('should match with different whitespace', () => {
      expect(matchesServiceType('Thai  Massage', SERVICE_TYPES.THAI)).toBe(true);
      expect(matchesServiceType('Thai-Massage', SERVICE_TYPES.THAI)).toBe(true);
      expect(matchesServiceType('ThaiMassage', SERVICE_TYPES.THAI)).toBe(true);
    });
  });

  describe('negative cases', () => {
    it('should not match unrelated service types', () => {
      expect(matchesServiceType('Sportmassage', SERVICE_TYPES.THAI)).toBe(false);
      expect(matchesServiceType('Deep Tissue', SERVICE_TYPES.HOT_STONE)).toBe(false);
      expect(matchesServiceType('Swedish Massage', SERVICE_TYPES.SHIATSU)).toBe(false);
    });
  });

  describe('complex service names', () => {
    it('should match complex multi-word service names', () => {
      expect(matchesServiceType('Traditionelle Thai-Massage mit Aromaöl', SERVICE_TYPES.THAI)).toBe(true);
      expect(matchesServiceType('Hot Stone Aromatherapie', SERVICE_TYPES.HOT_STONE)).toBe(true);
      expect(matchesServiceType('Deep Tissue Sportmassage', SERVICE_TYPES.DEEP_TISSUE)).toBe(true);
    });
  });
});

describe('filterServicesByType', () => {
  const mockServices = [
    { id: '1', name: 'Thai-Massage', price: 50, duration: 60 },
    { id: '2', name: 'Sportmassage', price: 60, duration: 60 },
    { id: '3', name: 'Traditionelle Thai Wellness', price: 70, duration: 90 },
    { id: '4', name: 'Deep Tissue', price: 80, duration: 60 },
  ];

  it('should return all services when no type is specified', () => {
    const result = filterServicesByType(mockServices);
    expect(result).toHaveLength(4);
  });

  it('should filter services by type', () => {
    const result = filterServicesByType(mockServices, SERVICE_TYPES.THAI);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Thai-Massage');
    expect(result[1].name).toBe('Traditionelle Thai Wellness');
  });

  it('should return empty array when no services match', () => {
    const result = filterServicesByType(mockServices, SERVICE_TYPES.HOT_STONE);
    expect(result).toHaveLength(0);
  });
});

describe('getMatchingServiceTypes', () => {
  it('should return multiple matching types for hybrid services', () => {
    const types = getMatchingServiceTypes('Thai Aromatherapie');
    expect(types).toContain(SERVICE_TYPES.THAI);
    expect(types).toContain(SERVICE_TYPES.AROMATHERAPY);
  });

  it('should return single type for specific services', () => {
    const types = getMatchingServiceTypes('Sportmassage');
    expect(types).toContain(SERVICE_TYPES.SPORT);
    expect(types.length).toBe(1);
  });

  it('should return empty array for non-matching services', () => {
    const types = getMatchingServiceTypes('Random Unknown Massage');
    expect(types).toHaveLength(0);
  });
});

describe('groupServicesByType', () => {
  const mockServices = [
    { id: '1', name: 'Thai-Massage', price: 50 },
    { id: '2', name: 'Sportmassage', price: 60 },
    { id: '3', name: 'Traditionelle Thai', price: 70 },
    { id: '4', name: 'Athletic Deep Tissue', price: 80 },
  ];

  it('should group services by their types', () => {
    const grouped = groupServicesByType(mockServices);

    expect(grouped[SERVICE_TYPES.THAI]).toHaveLength(2);
    expect(grouped[SERVICE_TYPES.SPORT]).toHaveLength(2);
    expect(grouped[SERVICE_TYPES.DEEP_TISSUE]).toHaveLength(1);
  });

  it('should handle services matching multiple types', () => {
    const services = [
      { id: '1', name: 'Thai Aromatherapie' },
    ];

    const grouped = groupServicesByType(services);

    expect(grouped[SERVICE_TYPES.THAI]).toHaveLength(1);
    expect(grouped[SERVICE_TYPES.AROMATHERAPY]).toHaveLength(1);
  });

  it('should return empty object for no services', () => {
    const grouped = groupServicesByType([]);
    expect(Object.keys(grouped)).toHaveLength(0);
  });
});
