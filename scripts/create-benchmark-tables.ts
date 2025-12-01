#!/usr/bin/env tsx

import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTables() {
  console.log('Creating benchmark tables...\n');

  const statements = [
    // 1. Create BenchmarkType enum
    {
      name: 'BenchmarkType enum',
      sql: `
        DO $$ BEGIN
          CREATE TYPE "BenchmarkType" AS ENUM (
            'ANNUAL_NAL',
            'INSTANT_NAL',
            'MCL',
            'MCLG',
            'ACTION_LEVEL',
            'CMC',
            'CCC',
            'OTHER'
          );
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `,
    },

    // 2. Create WaterType enum
    {
      name: 'WaterType enum',
      sql: `
        DO $$ BEGIN
          CREATE TYPE "WaterType" AS ENUM (
            'FRESHWATER',
            'SALTWATER',
            'DRINKING',
            'ALL'
          );
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `,
    },

    // 3. Add category column to ConfigPollutant
    {
      name: 'ConfigPollutant.category column',
      sql: `
        ALTER TABLE "ConfigPollutant"
        ADD COLUMN IF NOT EXISTS "category" TEXT;
      `,
    },

    // 4. Create pollutant_benchmarks table
    {
      name: 'pollutant_benchmarks table',
      sql: `
        CREATE TABLE IF NOT EXISTS "pollutant_benchmarks" (
          "id" SERIAL PRIMARY KEY,
          "pollutantKey" TEXT NOT NULL,
          "benchmarkType" "BenchmarkType" NOT NULL,
          "waterType" "WaterType" NOT NULL,
          "value" DECIMAL(15, 6) NOT NULL,
          "valueMax" DECIMAL(15, 6),
          "unit" TEXT NOT NULL,
          "source" TEXT NOT NULL,
          "sourceDocument" TEXT,
          "effectiveDate" TIMESTAMP(3),
          "hardnessDependent" BOOLEAN NOT NULL DEFAULT false,
          "hardnessEquation" TEXT,
          "notes" TEXT
        );
      `,
    },

    // 5. Add foreign key constraint
    {
      name: 'Foreign key constraint',
      sql: `
        DO $$ BEGIN
          ALTER TABLE "pollutant_benchmarks"
          ADD CONSTRAINT "pollutant_benchmarks_pollutantKey_fkey"
          FOREIGN KEY ("pollutantKey")
          REFERENCES "ConfigPollutant"("key")
          ON DELETE RESTRICT
          ON UPDATE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `,
    },

    // 6. Add unique constraint
    {
      name: 'Unique constraint',
      sql: `
        DO $$ BEGIN
          ALTER TABLE "pollutant_benchmarks"
          ADD CONSTRAINT "pollutant_benchmarks_pollutantKey_benchmarkType_waterType_key"
          UNIQUE ("pollutantKey", "benchmarkType", "waterType");
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `,
    },

    // 7-10. Create indexes
    {
      name: 'Index on pollutantKey',
      sql: `CREATE INDEX IF NOT EXISTS "pollutant_benchmarks_pollutantKey_idx" ON "pollutant_benchmarks"("pollutantKey");`,
    },
    {
      name: 'Index on benchmarkType',
      sql: `CREATE INDEX IF NOT EXISTS "pollutant_benchmarks_benchmarkType_idx" ON "pollutant_benchmarks"("benchmarkType");`,
    },
    {
      name: 'Index on waterType',
      sql: `CREATE INDEX IF NOT EXISTS "pollutant_benchmarks_waterType_idx" ON "pollutant_benchmarks"("waterType");`,
    },
    {
      name: 'Index on source',
      sql: `CREATE INDEX IF NOT EXISTS "pollutant_benchmarks_source_idx" ON "pollutant_benchmarks"("source");`,
    },
  ];

  try {
    for (const stmt of statements) {
      process.stdout.write(`  Creating ${stmt.name}... `);
      await prisma.$executeRawUnsafe(stmt.sql);
      console.log('✓');
    }

    console.log('\n✓ All tables and indexes created successfully!');
  } catch (error: any) {
    console.error('\n\nError:', error.message);
    if (error.meta) {
      console.error('Details:', error.meta);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTables();
