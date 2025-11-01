/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

/**
 * Manual Test Script for Photon API Integration
 *
 * Run with: npx tsx scripts/test-photon-api.ts
 */

import { searchAddresses, GeocodingError } from '../lib/services/geocoding';

async function testPhotonAPI(): Promise<void> {
  console.log('🧪 Testing Photon API Integration\n');

  // Test 1: Search for Karlsruhe addresses
  console.log('Test 1: Searching for "Karlstraße Karlsruhe"...');
  try {
    const results1 = await searchAddresses('Karlstraße Karlsruhe', { limit: 5 });
    console.log(`✅ Found ${results1.length} results:`);
    results1.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.displayText}`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }

  // Test 2: Search for Munich addresses
  console.log('Test 2: Searching for "Marienplatz München"...');
  try {
    const results2 = await searchAddresses('Marienplatz München', { limit: 5 });
    console.log(`✅ Found ${results2.length} results:`);
    results2.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.displayText}`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
  }

  // Test 3: Search for Berlin addresses
  console.log('Test 3: Searching for "Unter den Linden Berlin"...');
  try {
    const results3 = await searchAddresses('Unter den Linden Berlin', { limit: 5 });
    console.log(`✅ Found ${results3.length} results:`);
    results3.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.displayText}`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }

  // Test 4: Short query (should return empty)
  console.log('Test 4: Testing short query "Ka" (should return empty)...');
  try {
    const results4 = await searchAddresses('Ka');
    console.log(`✅ Returned ${results4.length} results (expected: 0)`);
    console.log('');
  } catch (error) {
    console.error('❌ Test 4 failed:', error);
  }

  // Test 5: Search with specific address format
  console.log('Test 5: Searching for "Hauptstraße 123 Stuttgart"...');
  try {
    const results5 = await searchAddresses('Hauptstraße 123 Stuttgart', { limit: 5 });
    console.log(`✅ Found ${results5.length} results:`);
    results5.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.displayText}`);
      console.log(`     Street: ${result.street}`);
      console.log(`     City: ${result.city}`);
      console.log(`     Postal Code: ${result.postalCode}`);
      console.log(`     Country: ${result.country}`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ Test 5 failed:', error);
  }

  console.log('🎉 Testing complete!');
}

// Run tests
testPhotonAPI().catch((error) => {
  console.error('Fatal error during testing:', error);
  process.exit(1);
});
