/**
 * Jest Test Setup
 *
 * Global test configuration and utilities
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
config({ path: resolve(__dirname, '..', '.env') });

// Set test environment variables
process.env.NODE_ENV = 'test';

// Use development database for tests (in production, use separate test DB)
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Please create a .env file with DATABASE_URL.');
}

// Extend Jest matchers if needed
expect.extend({
  // Custom matchers can be added here
});

// Global test timeout
jest.setTimeout(30000);
