#!/usr/bin/env tsx
/**
 * Environment Variable Checker
 *
 * Verifies all required environment variables are set and reports their status
 * Run with: npx tsx scripts/check-env.ts
 *
 * Exit codes:
 * - 0: All required environment variables are set
 * - 1: One or more required environment variables are missing
 */

interface EnvConfig {
  required: string[];
  optional: string[];
}

const config: EnvConfig = {
  // 10 required environment variables for core functionality
  required: [
    'DATABASE_URL',           // PostgreSQL/Supabase database connection
    'SUPABASE_URL',          // Supabase project URL
    'SUPABASE_ANON_KEY',     // Supabase anonymous key for client access
    'UPSTASH_REDIS_REST_URL',       // Upstash Redis connection URL
    'UPSTASH_REDIS_REST_TOKEN',     // Upstash Redis authentication token
    'RESEND_API_KEY',        // Resend email service API key
    'MAPBOX_TOKEN',          // Mapbox server-side token
    'NEXT_PUBLIC_MAPBOX_TOKEN',     // Mapbox client-side token (public)
    'NEXTAUTH_SECRET',       // NextAuth.js session secret
    'NEXTAUTH_URL',          // NextAuth.js callback URL
  ],

  // 8 optional environment variables for extended functionality
  optional: [
    'SUPABASE_SERVICE_ROLE_KEY',    // Supabase admin access (for server operations)
    'SLACK_WEBHOOK_URL',            // Slack webhook for alerts and notifications
    'CRON_SECRET',                  // Secret for protecting cron job endpoints
    'NWS_USER_AGENT',              // User-Agent header for NOAA Weather Service API
    'INTERNVL_ENABLED',            // Enable InternVL AI model integration
    'INTERNVL_BASE_URL',           // Base URL for InternVL AI service
    'RESEND_FROM_EMAIL',           // Email address for sending emails
  ],
};

interface VariableStatus {
  key: string;
  status: 'present' | 'missing';
  value?: string;
}

interface CheckResult {
  required: VariableStatus[];
  optional: VariableStatus[];
  summary: {
    requiredMissing: number;
    optionalMissing: number;
    totalPresent: number;
  };
}

function maskValue(value: string, showChars: number = 20): string {
  if (value.length <= showChars) {
    return '*'.repeat(value.length);
  }
  return value.substring(0, showChars) + '*'.repeat(value.length - showChars);
}

function checkEnvironment(): CheckResult {
  const result: CheckResult = {
    required: [],
    optional: [],
    summary: {
      requiredMissing: 0,
      optionalMissing: 0,
      totalPresent: 0,
    },
  };

  // Check required variables
  config.required.forEach((key) => {
    const value = process.env[key];
    if (value) {
      result.required.push({
        key,
        status: 'present',
        value: maskValue(value),
      });
      result.summary.totalPresent++;
    } else {
      result.required.push({
        key,
        status: 'missing',
      });
      result.summary.requiredMissing++;
    }
  });

  // Check optional variables
  config.optional.forEach((key) => {
    const value = process.env[key];
    if (value) {
      result.optional.push({
        key,
        status: 'present',
        value: maskValue(value),
      });
      result.summary.totalPresent++;
    } else {
      result.optional.push({
        key,
        status: 'missing',
      });
      result.summary.optionalMissing++;
    }
  });

  return result;
}

function printResults(result: CheckResult): void {
  console.log('\n========================================');
  console.log('   Environment Variable Checker');
  console.log('========================================\n');

  // Print required variables
  console.log('REQUIRED ENVIRONMENT VARIABLES:');
  console.log('--------------------------------');
  result.required.forEach((item) => {
    const status = item.status === 'present' ? '' : '❌';
    const indicator = item.status === 'present' ? '' : ' (MISSING)';
    const valueStr = item.value ? ` = ${item.value}` : '';
    console.log(`${status} ${item.key}${indicator}${valueStr}`);
  });

  console.log('\nOPTIONAL ENVIRONMENT VARIABLES:');
  console.log('--------------------------------');
  result.optional.forEach((item) => {
    const status = item.status === 'present' ? '' : 'ℹ ';
    const indicator = item.status === 'present' ? '' : ' (not set)';
    const valueStr = item.value ? ` = ${item.value}` : '';
    console.log(`${status}${item.key}${indicator}${valueStr}`);
  });

  // Print summary
  console.log('\n========================================');
  console.log('SUMMARY:');
  console.log('--------');
  console.log(
    `Total variables: ${config.required.length + config.optional.length} ` +
    `(${config.required.length} required, ${config.optional.length} optional)`
  );
  console.log(`Present: ${result.summary.totalPresent}`);
  console.log(`Required missing: ${result.summary.requiredMissing}`);
  console.log(`Optional missing: ${result.summary.optionalMissing}`);

  if (result.summary.requiredMissing === 0) {
    console.log('\n✅ All required environment variables are set!');
  } else {
    console.log(
      `\n❌ ${result.summary.requiredMissing} required ` +
      `variable${result.summary.requiredMissing > 1 ? 's are' : ' is'} missing!`
    );
  }
  console.log('========================================\n');
}

function main(): void {
  const result = checkEnvironment();
  printResults(result);

  // Exit with appropriate code
  if (result.summary.requiredMissing > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main();
