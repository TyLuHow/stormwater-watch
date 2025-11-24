#!/usr/bin/env tsx
// Script to validate all environment variables and services are configured
// Run with: npx tsx scripts/validate-setup.ts

import { PrismaClient } from '@prisma/client';
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';

const required = [
  'DATABASE_URL',
  'SUPABASE_URL', 
  'SUPABASE_ANON_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'RESEND_API_KEY',
  'MAPBOX_TOKEN',
  'NEXT_PUBLIC_MAPBOX_TOKEN',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

const optional = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SLACK_WEBHOOK_URL',
  'CRON_SECRET',
  'NWS_USER_AGENT',
  'INTERNVL_ENABLED',
  'INTERNVL_BASE_URL'
];

async function main() {
  console.log('🔍 Validating Stormwater Watch setup...\n');

  // Check required environment variables
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }

  console.log('✅ All required environment variables are set');

  // Check optional environment variables
  const missingOptional = optional.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    console.log('⚠️  Optional environment variables not set:');
    missingOptional.forEach(key => console.log(`   - ${key}`));
  }

  // Test database connection
  console.log('\n📊 Testing database connection...');
  try {
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  // Test Redis connection
  console.log('\n📨 Testing Redis connection...');
  try {
    const redis = Redis.fromEnv();
    await redis.ping();
    console.log('✅ Redis connection successful');
  } catch (error) {
    console.error('❌ Redis connection failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  // Test Supabase connection
  console.log('\n☁️  Testing Supabase connection...');
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    const { error } = await supabase.from('facility').select('count').limit(1);
    if (error) {
      console.log(`⚠️  Supabase connection issue: ${error.message}`);
    } else {
      console.log('✅ Supabase connection successful');
    }
  } catch (error) {
    console.error('❌ Supabase connection failed:', error instanceof Error ? error.message : error);
  }

  // Test Supabase storage
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('\n📁 Testing Supabase storage...');
    try {
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { error } = await supabaseAdmin.storage.listBuckets();
      if (error) {
        console.log(`⚠️  Supabase storage issue: ${error.message}`);
      } else {
        console.log('✅ Supabase storage accessible');
      }
    } catch (error) {
      console.error('❌ Supabase storage failed:', error instanceof Error ? error.message : error);
    }
  }

  console.log('\n🎉 Setup validation complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Run `npm run build` to test the build');
  console.log('   2. Run `npm run type-check` to verify TypeScript');
  console.log('   3. Run `npm run db:push` to sync database schema');
  console.log('   4. Start the development server with `npm run dev`');
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});