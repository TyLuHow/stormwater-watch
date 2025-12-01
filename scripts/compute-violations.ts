#!/usr/bin/env tsx

/**
 * Compute Violations from eSMR Samples
 *
 * Compares eSMR sample results against benchmark thresholds to identify violations.
 * Creates ViolationEvent records for exceedances.
 */

import { config } from 'dotenv';
config();

import { PrismaClient, BenchmarkType } from '@prisma/client';

const prisma = new PrismaClient();

interface ViolationResult {
  sampleId: string;
  pollutantKey: string;
  benchmarkId: string;
  benchmarkValue: number;
  sampleValue: number;
  exceedanceRatio: number;
  benchmarkType: BenchmarkType;
}

// Unit conversion factors to mg/L
const UNIT_CONVERSIONS: Record<string, number> = {
  'mg/L': 1,
  'mg/l': 1,
  'MG/L': 1,
  'µg/L': 0.001,
  'ug/L': 0.001,
  'UG/L': 0.001,
  'ng/L': 0.000001,
  'ppm': 1,
  'ppb': 0.001,
  'ppt': 0.000001,
  '%': 10000, // 1% = 10,000 mg/L
};

function convertToMgL(value: number, unit: string): number | null {
  const normalizedUnit = unit.trim();
  const factor = UNIT_CONVERSIONS[normalizedUnit];

  if (factor === undefined) {
    // Unit not recognized - return null
    return null;
  }

  return value * factor;
}

function normalizeParameterName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

async function computeViolations() {
  console.log('🔍 Computing violations from eSMR samples...\n');

  // Get all benchmarks
  const benchmarks = await prisma.pollutantBenchmark.findMany({
    include: {
      pollutant: true,
    },
  });

  console.log(`Found ${benchmarks.length} benchmarks to check\n`);

  // Get all eSMR samples
  const samples = await prisma.eSMRSample.findMany({
    where: {
      result: {
        not: null,
      },
    },
    include: {
      parameter: true,
      location: {
        include: {
          facility: true,
        },
      },
    },
  });

  console.log(`Processing ${samples.length} eSMR samples...\n`);

  const violations: ViolationResult[] = [];
  let samplesProcessed = 0;
  let samplesWithBenchmark = 0;

  for (const sample of samples) {
    samplesProcessed++;

    if (samplesProcessed % 10000 === 0) {
      console.log(`  Processed ${samplesProcessed.toLocaleString()} samples...`);
    }

    // Parse sample value
    const sampleValue = parseFloat(sample.result!);
    if (isNaN(sampleValue) || sampleValue < 0) {
      continue;
    }

    // Try to match parameter to pollutant
    const normalizedParam = normalizeParameterName(sample.parameter.parameterName);

    let matchedBenchmark = null;

    for (const benchmark of benchmarks) {
      // Check if parameter name matches pollutant key or aliases
      const pollutantMatches = [
        benchmark.pollutantKey.toLowerCase(),
        ...benchmark.pollutant.aliases.map(a => normalizeParameterName(a)),
      ];

      if (pollutantMatches.includes(normalizedParam)) {
        matchedBenchmark = benchmark;
        break;
      }
    }

    if (!matchedBenchmark) {
      // No benchmark found for this parameter
      continue;
    }

    samplesWithBenchmark++;

    // Convert sample value to same unit as benchmark
    const sampleUnit = sample.units || 'mg/L';
    const benchmarkUnit = matchedBenchmark.unit;

    // Convert both to mg/L for comparison
    const sampleInMgL = convertToMgL(sampleValue, sampleUnit);
    const benchmarkInMgL = convertToMgL(parseFloat(matchedBenchmark.value.toString()), benchmarkUnit);

    if (sampleInMgL === null || benchmarkInMgL === null) {
      // Can't convert units
      continue;
    }

    // Check for exceedance
    let isViolation = false;

    if (matchedBenchmark.valueMax) {
      // Range-based (pH)
      const benchmarkMin = parseFloat(matchedBenchmark.value.toString());
      const benchmarkMax = parseFloat(matchedBenchmark.valueMax.toString());
      isViolation = sampleValue < benchmarkMin || sampleValue > benchmarkMax;
    } else {
      // Threshold-based
      isViolation = sampleInMgL > benchmarkInMgL;
    }

    if (isViolation) {
      const exceedanceRatio = matchedBenchmark.valueMax
        ? Math.max(
            Math.abs(sampleValue - parseFloat(matchedBenchmark.value.toString())),
            Math.abs(sampleValue - parseFloat(matchedBenchmark.valueMax.toString()))
          ) / (parseFloat(matchedBenchmark.valueMax.toString()) - parseFloat(matchedBenchmark.value.toString()))
        : sampleInMgL / benchmarkInMgL;

      violations.push({
        sampleId: sample.sampleId,
        pollutantKey: matchedBenchmark.pollutantKey,
        benchmarkId: matchedBenchmark.id,
        benchmarkValue: benchmarkInMgL,
        sampleValue: sampleInMgL,
        exceedanceRatio,
        benchmarkType: matchedBenchmark.benchmarkType,
      });
    }
  }

  console.log(`\n✅ Sample processing complete!`);
  console.log(`   Total samples: ${samplesProcessed.toLocaleString()}`);
  console.log(`   Samples with benchmarks: ${samplesWithBenchmark.toLocaleString()}`);
  console.log(`   Violations detected: ${violations.length.toLocaleString()}\n`);

  if (violations.length === 0) {
    console.log('No violations to create.\n');
    return;
  }

  // Create ViolationEvent records
  console.log('📝 Creating violation event records...\n');

  let created = 0;
  const batchSize = 100;

  for (let i = 0; i < violations.length; i += batchSize) {
    const batch = violations.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (violation) => {
        try {
          const sample = await prisma.eSMRSample.findUnique({
            where: { sampleId: violation.sampleId },
            include: {
              location: {
                include: {
                  facility: true,
                },
              },
            },
          });

          if (!sample?.location?.facility) {
            return;
          }

          await prisma.violationEvent.create({
            data: {
              facilityPlaceId: sample.location.facility.facilityPlaceId,
              sampleId: violation.sampleId,
              pollutantKey: violation.pollutantKey,
              detectedAt: sample.sampleDate,
              exceedanceRatio: violation.exceedanceRatio,
              benchmarkValue: violation.benchmarkValue,
              measuredValue: violation.sampleValue,
              status: 'OPEN',
              severity: violation.exceedanceRatio > 2 ? 'CRITICAL' : 'MODERATE',
            },
          });

          created++;
        } catch (error: any) {
          // Skip duplicates
          if (!error.message?.includes('Unique constraint')) {
            console.error(`Error creating violation:`, error.message);
          }
        }
      })
    );

    console.log(`  Created ${Math.min(i + batchSize, violations.length).toLocaleString()} / ${violations.length.toLocaleString()} violations`);
  }

  console.log(`\n✅ Violation computation complete!`);
  console.log(`   Total violations created: ${created.toLocaleString()}\n`);
}

async function main() {
  try {
    await computeViolations();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
