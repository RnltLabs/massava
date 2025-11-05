# Service Type System - Test Suite

## Overview

This directory contains unit tests for the Service Type matching and price aggregation system.

## Test Files

### `serviceMatching.test.ts`

Tests for smart string matching between user-selected service types and studio service names.

**Test Coverage:**
- Exact matches
- Case-insensitive matching
- Substring matching
- Synonym matching
- Diacritic normalization (ä, ö, ü)
- Whitespace tolerance
- Negative cases
- Complex multi-word service names
- Service filtering by type
- Service grouping by type
- Multi-type matching

### `priceAggregation.test.ts`

Tests for price calculations and formatting.

**Test Coverage:**
- Minimum price calculation
- Maximum price calculation
- Price range calculation
- Price label formatting (German locale)
- Price range formatting
- Average price calculation
- Price filtering

## Running Tests

Currently, test infrastructure is pending setup. Tests are written with Vitest syntax.

**To run tests (once Vitest is configured):**

```bash
# Run all tests
npm test

# Run specific test file
npm test -- serviceMatching.test.ts

# Watch mode
npm test -- --watch
```

## Test Dependencies

Required packages:
- `vitest` - Test runner
- `@vitest/ui` - Optional UI for test results

## Example Test Cases

### Service Matching

```typescript
// Should match Thai services
matchesServiceType('Traditionelle Thai-Massage', SERVICE_TYPES.THAI) // true
matchesServiceType('Thai Wellness', SERVICE_TYPES.THAI) // true

// Should match with umlauts
matchesServiceType('Ölmassage', SERVICE_TYPES.OIL) // true
matchesServiceType('Olmassage', SERVICE_TYPES.OIL) // true
```

### Price Aggregation

```typescript
// Get minimum price
getMinPrice([{ price: 50 }, { price: 75 }]) // 50

// Format price label
formatPriceLabel(55) // "ab €55"
formatPriceLabel(99.5) // "ab €99,50"
```

## Notes

- Tests use German locale for price formatting
- All service type constants are imported from `lib/constants/serviceTypes.ts`
- Tests are isolated and don't require database connection
