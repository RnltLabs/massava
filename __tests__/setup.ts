/**
 * Jest Test Setup
 *
 * Global test configuration and utilities
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/massava_test';

// Extend Jest matchers if needed
expect.extend({
  // Custom matchers can be added here
});

// Global test timeout
jest.setTimeout(30000);
