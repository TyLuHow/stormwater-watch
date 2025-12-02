#!/usr/bin/env tsx

import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating violation_samples table...\n');

  // Create table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "violation_samples" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "violationEventId" TEXT NOT NULL,
      "facilityId" TEXT NOT NULL,
      "esmrSampleId" TEXT NOT NULL,
      "benchmarkId" TEXT NOT NULL,
      "pollutantKey" TEXT NOT NULL,
      "detectedAt" DATE NOT NULL,
      "measuredValue" DECIMAL(18, 6) NOT NULL,
      "measuredUnit" VARCHAR(50) NOT NULL,
      "benchmarkValue" DECIMAL(18, 6) NOT NULL,
      "benchmarkUnit" VARCHAR(50) NOT NULL,
      "exceedanceRatio" DECIMAL(8, 2) NOT NULL,
      "severity" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'OPEN',
      "reviewedAt" TIMESTAMP,
      "reviewedBy" TEXT,
      "reviewNotes" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),

      CONSTRAINT "violation_samples_esmrSampleId_benchmarkId_key" UNIQUE ("esmrSampleId", "benchmarkId"),
      CONSTRAINT "violation_samples_violationEvent_fkey" FOREIGN KEY ("violationEventId") REFERENCES "ViolationEvent"("id") ON DELETE CASCADE,
      CONSTRAINT "violation_samples_facility_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE,
      CONSTRAINT "violation_samples_esmrSample_fkey" FOREIGN KEY ("esmrSampleId") REFERENCES "esmr_samples"("id") ON DELETE CASCADE,
      CONSTRAINT "violation_samples_benchmark_fkey" FOREIGN KEY ("benchmarkId") REFERENCES "pollutant_benchmarks"("id")
    )
  `);

  console.log('Table created successfully!\n');
  console.log('Creating indexes...\n');

  // Create indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS "violation_samples_violationEventId_idx" ON "violation_samples"("violationEventId")',
    'CREATE INDEX IF NOT EXISTS "violation_samples_facilityId_idx" ON "violation_samples"("facilityId")',
    'CREATE INDEX IF NOT EXISTS "violation_samples_esmrSampleId_idx" ON "violation_samples"("esmrSampleId")',
    'CREATE INDEX IF NOT EXISTS "violation_samples_benchmarkId_idx" ON "violation_samples"("benchmarkId")',
    'CREATE INDEX IF NOT EXISTS "violation_samples_pollutantKey_idx" ON "violation_samples"("pollutantKey")',
    'CREATE INDEX IF NOT EXISTS "violation_samples_detectedAt_idx" ON "violation_samples"("detectedAt")',
    'CREATE INDEX IF NOT EXISTS "violation_samples_status_idx" ON "violation_samples"("status")',
    'CREATE INDEX IF NOT EXISTS "violation_samples_severity_idx" ON "violation_samples"("severity")',
    'CREATE INDEX IF NOT EXISTS "violation_samples_facilityId_pollutantKey_detectedAt_idx" ON "violation_samples"("facilityId", "pollutantKey", "detectedAt")',
    'CREATE INDEX IF NOT EXISTS "violation_samples_status_severity_idx" ON "violation_samples"("status", "severity")',
  ];

  for (const indexSql of indexes) {
    await prisma.$executeRawUnsafe(indexSql);
  }

  console.log('All indexes created successfully!\n');
}

main()
  .then(() => {
    console.log('✅ Done!');
    prisma.$disconnect();
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
