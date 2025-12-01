#!/usr/bin/env tsx

/**
 * Create Violation Schema Migration
 *
 * Creates new ViolationSample model and updates ViolationEvent model
 * Uses pooled connection to work around direct connection timeouts
 */

import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const statements = [
  {
    name: 'ViolationStatus enum',
    sql: `
      DO $$ BEGIN
        CREATE TYPE "ViolationStatus" AS ENUM (
          'OPEN',
          'UNDER_REVIEW',
          'RESOLVED',
          'DISMISSED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `,
  },
  {
    name: 'ViolationSeverity enum',
    sql: `
      DO $$ BEGIN
        CREATE TYPE "ViolationSeverity" AS ENUM (
          'LOW',
          'MODERATE',
          'HIGH',
          'CRITICAL'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `,
  },
  {
    name: 'ViolationEvent schema updates',
    sql: `
      DO $$ BEGIN
        -- Add pollutantKey column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'ViolationEvent' AND column_name = 'pollutantKey'
        ) THEN
          ALTER TABLE "ViolationEvent" ADD COLUMN "pollutantKey" TEXT;
        END IF;

        -- Add maxSeverity column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'ViolationEvent' AND column_name = 'maxSeverity'
        ) THEN
          ALTER TABLE "ViolationEvent" ADD COLUMN "maxSeverity" "ViolationSeverity" DEFAULT 'MODERATE' NOT NULL;
        END IF;

        -- Add updatedAt column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'ViolationEvent' AND column_name = 'updatedAt'
        ) THEN
          ALTER TABLE "ViolationEvent" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
        END IF;

        -- Migrate data from pollutant to pollutantKey if pollutantKey is empty
        UPDATE "ViolationEvent"
        SET "pollutantKey" = "pollutant"
        WHERE "pollutantKey" IS NULL AND "pollutant" IS NOT NULL;

        -- Make pollutantKey NOT NULL after migration
        ALTER TABLE "ViolationEvent" ALTER COLUMN "pollutantKey" SET NOT NULL;
      END $$;
    `,
  },
  {
    name: 'Drop old ViolationEvent constraints and indexes',
    sql: `
      DO $$ BEGIN
        -- Drop old unique constraint if it exists
        IF EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'ViolationEvent_facilityId_pollutant_reportingYear_key'
        ) THEN
          ALTER TABLE "ViolationEvent" DROP CONSTRAINT "ViolationEvent_facilityId_pollutant_reportingYear_key";
        END IF;

        -- Drop old indexes if they exist
        DROP INDEX IF EXISTS "ViolationEvent_facilityId_pollutant_reportingYear_idx";
        DROP INDEX IF EXISTS "ViolationEvent_pollutant_idx";
      END $$;
    `,
  },
  {
    name: 'Add new ViolationEvent unique constraint',
    sql: `
      DO $$ BEGIN
        -- Add new unique constraint
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'ViolationEvent_facilityId_pollutantKey_reportingYear_key'
        ) THEN
          ALTER TABLE "ViolationEvent" ADD CONSTRAINT "ViolationEvent_facilityId_pollutantKey_reportingYear_key"
            UNIQUE ("facilityId", "pollutantKey", "reportingYear");
        END IF;
      END $$;
    `,
  },
  {
    name: 'Add ViolationEvent index 1',
    sql: `
      CREATE INDEX IF NOT EXISTS "ViolationEvent_facilityId_pollutantKey_reportingYear_idx"
        ON "ViolationEvent"("facilityId", "pollutantKey", "reportingYear");
    `,
  },
  {
    name: 'Add ViolationEvent index 2',
    sql: `
      CREATE INDEX IF NOT EXISTS "ViolationEvent_pollutantKey_idx"
        ON "ViolationEvent"("pollutantKey");
    `,
  },
  {
    name: 'Add foreign key for pollutantKey',
    sql: `
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'ViolationEvent_pollutantKey_fkey'
        ) THEN
          ALTER TABLE "ViolationEvent" ADD CONSTRAINT "ViolationEvent_pollutantKey_fkey"
            FOREIGN KEY ("pollutantKey") REFERENCES "ConfigPollutant"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END $$;
    `,
  },
  {
    name: 'ViolationSample table',
    sql: `
      CREATE TABLE IF NOT EXISTS "ViolationSample" (
        "id" TEXT NOT NULL,
        "violationEventId" TEXT NOT NULL,
        "facilityId" TEXT NOT NULL,
        "esmrSampleId" TEXT NOT NULL,
        "benchmarkId" TEXT NOT NULL,
        "detectedAt" DATE NOT NULL,
        "measuredValue" DECIMAL(18,6) NOT NULL,
        "benchmarkValue" DECIMAL(18,6) NOT NULL,
        "exceedanceRatio" DECIMAL(8,2) NOT NULL,
        "severity" "ViolationSeverity" NOT NULL DEFAULT 'MODERATE',
        "status" "ViolationStatus" NOT NULL DEFAULT 'OPEN',
        "reviewedAt" TIMESTAMP(3),
        "reviewedBy" TEXT,
        "reviewNotes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "ViolationSample_pkey" PRIMARY KEY ("id")
      );
    `,
  },
  {
    name: 'ViolationSample constraints',
    sql: `
      DO $$ BEGIN
        -- Unique constraint on esmrSampleId and benchmarkId
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'ViolationSample_esmrSampleId_benchmarkId_key'
        ) THEN
          ALTER TABLE "ViolationSample" ADD CONSTRAINT "ViolationSample_esmrSampleId_benchmarkId_key"
            UNIQUE ("esmrSampleId", "benchmarkId");
        END IF;

        -- Foreign key to ViolationEvent
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'ViolationSample_violationEventId_fkey'
        ) THEN
          ALTER TABLE "ViolationSample" ADD CONSTRAINT "ViolationSample_violationEventId_fkey"
            FOREIGN KEY ("violationEventId") REFERENCES "ViolationEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;

        -- Foreign key to Facility
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'ViolationSample_facilityId_fkey'
        ) THEN
          ALTER TABLE "ViolationSample" ADD CONSTRAINT "ViolationSample_facilityId_fkey"
            FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;

        -- Foreign key to ESMRSample
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'ViolationSample_esmrSampleId_fkey'
        ) THEN
          ALTER TABLE "ViolationSample" ADD CONSTRAINT "ViolationSample_esmrSampleId_fkey"
            FOREIGN KEY ("esmrSampleId") REFERENCES "esmr_samples"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;

        -- Foreign key to PollutantBenchmark
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'ViolationSample_benchmarkId_fkey'
        ) THEN
          ALTER TABLE "ViolationSample" ADD CONSTRAINT "ViolationSample_benchmarkId_fkey"
            FOREIGN KEY ("benchmarkId") REFERENCES "pollutant_benchmarks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END $$;
    `,
  },
  {
    name: 'ViolationSample indexes 1',
    sql: `
      CREATE INDEX IF NOT EXISTS "ViolationSample_violationEventId_idx"
        ON "ViolationSample"("violationEventId");
    `,
  },
  {
    name: 'ViolationSample indexes 2',
    sql: `
      CREATE INDEX IF NOT EXISTS "ViolationSample_facilityId_idx"
        ON "ViolationSample"("facilityId");
    `,
  },
  {
    name: 'ViolationSample indexes 3',
    sql: `
      CREATE INDEX IF NOT EXISTS "ViolationSample_esmrSampleId_idx"
        ON "ViolationSample"("esmrSampleId");
    `,
  },
  {
    name: 'ViolationSample indexes 4',
    sql: `
      CREATE INDEX IF NOT EXISTS "ViolationSample_benchmarkId_idx"
        ON "ViolationSample"("benchmarkId");
    `,
  },
  {
    name: 'ViolationSample indexes 5',
    sql: `
      CREATE INDEX IF NOT EXISTS "ViolationSample_detectedAt_idx"
        ON "ViolationSample"("detectedAt");
    `,
  },
  {
    name: 'ViolationSample indexes 6',
    sql: `
      CREATE INDEX IF NOT EXISTS "ViolationSample_severity_idx"
        ON "ViolationSample"("severity");
    `,
  },
  {
    name: 'ViolationSample indexes 7',
    sql: `
      CREATE INDEX IF NOT EXISTS "ViolationSample_status_idx"
        ON "ViolationSample"("status");
    `,
  },
  {
    name: 'ViolationSample indexes 8',
    sql: `
      CREATE INDEX IF NOT EXISTS "ViolationSample_facilityId_detectedAt_idx"
        ON "ViolationSample"("facilityId", "detectedAt");
    `,
  },
];

async function main() {
  console.log('🔄 Creating violation schema tables and enums...\n');

  for (const statement of statements) {
    try {
      console.log(`  Creating: ${statement.name}...`);
      await prisma.$executeRawUnsafe(statement.sql);
      console.log(`  ✅ ${statement.name} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating ${statement.name}:`, error.message);
      throw error;
    }
  }

  console.log('\n✅ Violation schema migration complete!\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
