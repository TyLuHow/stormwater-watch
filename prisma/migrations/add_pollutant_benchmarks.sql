-- Migration: Add PollutantBenchmark table and enums
-- Created: 2024-11-30
-- Purpose: Extend water quality benchmark system

-- Create enums
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

CREATE TYPE "WaterType" AS ENUM (
  'FRESHWATER',
  'SALTWATER',
  'DRINKING',
  'ALL'
);

-- Add category column to ConfigPollutant
ALTER TABLE "ConfigPollutant"
ADD COLUMN IF NOT EXISTS "category" TEXT;

-- Create PollutantBenchmark table
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
  "notes" TEXT,

  -- Foreign key
  CONSTRAINT "pollutant_benchmarks_pollutantKey_fkey"
    FOREIGN KEY ("pollutantKey")
    REFERENCES "ConfigPollutant"("key")
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  -- Unique constraint
  CONSTRAINT "pollutant_benchmarks_pollutantKey_benchmarkType_waterType_key"
    UNIQUE ("pollutantKey", "benchmarkType", "waterType")
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "pollutant_benchmarks_pollutantKey_idx"
  ON "pollutant_benchmarks"("pollutantKey");

CREATE INDEX IF NOT EXISTS "pollutant_benchmarks_benchmarkType_idx"
  ON "pollutant_benchmarks"("benchmarkType");

CREATE INDEX IF NOT EXISTS "pollutant_benchmarks_waterType_idx"
  ON "pollutant_benchmarks"("waterType");

CREATE INDEX IF NOT EXISTS "pollutant_benchmarks_source_idx"
  ON "pollutant_benchmarks"("source");

-- Comments for documentation
COMMENT ON TABLE "pollutant_benchmarks" IS
  'Water quality benchmark thresholds from regulatory sources (IGP, EPA MCL, EPA Aquatic Life)';

COMMENT ON COLUMN "pollutant_benchmarks"."benchmarkType" IS
  'Type: ANNUAL_NAL, INSTANT_NAL, MCL, MCLG, ACTION_LEVEL, CMC (acute), CCC (chronic)';

COMMENT ON COLUMN "pollutant_benchmarks"."waterType" IS
  'Applicable water type: FRESHWATER, SALTWATER, DRINKING, or ALL';

COMMENT ON COLUMN "pollutant_benchmarks"."hardnessDependent" IS
  'Whether benchmark varies with water hardness (Cu, Zn, Pb, Cd, Ni, Ag)';

COMMENT ON COLUMN "pollutant_benchmarks"."hardnessEquation" IS
  'Hardness adjustment formula (e.g., exp(mA * ln(hardness) + bA))';
