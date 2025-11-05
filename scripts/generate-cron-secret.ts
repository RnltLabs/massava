/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Generate CRON_SECRET for Vercel Cron Jobs
 * Run: npm run generate:cron-secret
 */

import { randomBytes } from 'crypto';

function generateCronSecret(): string {
  return randomBytes(32).toString('hex');
}

const secret = generateCronSecret();

console.log('\n===========================================');
console.log('🔐 CRON_SECRET Generated');
console.log('===========================================\n');
console.log('Add this to your .env file:\n');
console.log(`CRON_SECRET=${secret}\n`);
console.log('===========================================');
console.log('\n💡 Next Steps:');
console.log('1. Add this to your local .env file');
console.log('2. Add to Vercel environment variables:');
console.log('   - Go to Vercel Dashboard > Settings > Environment Variables');
console.log('   - Add CRON_SECRET with the value above');
console.log('   - Make sure it\'s available in Production environment');
console.log('\n===========================================\n');
