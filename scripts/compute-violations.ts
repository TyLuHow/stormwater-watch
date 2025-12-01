#!/usr/bin/env tsx

/**
 * Compute Violations from eSMR Samples
 *
 * Compares eSMR sample results against benchmark thresholds to identify violations.
 * Creates both ViolationSample (individual) and ViolationEvent (aggregated) records.
 */

import { config } from 'dotenv';
config();

import { PrismaClient, BenchmarkType, ViolationSeverity } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

interface ViolationResult {
  sampleId: string;
  facilityPlaceId: number;
  pollutantKey: string;
  benchmarkId: string;
  benchmarkValue: number;
  benchmarkUnit: string;
  sampleValue: number;
  sampleUnit: string;
  exceedanceRatio: number;
  benchmarkType: BenchmarkType;
  detectedAt: Date;
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

  // Count total samples
  const totalCount = await prisma.eSMRSample.count({
    where: {
      result: {
        not: null,
      },
    },
  });

  console.log(`Processing ${totalCount.toLocaleString()} eSMR samples in batches...\n`);

  const violations: ViolationResult[] = [];
  let samplesProcessed = 0;
  let samplesWithBenchmark = 0;

  // Process in batches to avoid timeout
  const batchSize = 10000;
  let skip = 0;

  while (skip < totalCount) {
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
      take: batchSize,
      skip: skip,
    });

    console.log(`Processing batch ${Math.floor(skip / batchSize) + 1}/${Math.ceil(totalCount / batchSize)} (${skip.toLocaleString()} - ${Math.min(skip + batchSize, totalCount).toLocaleString()})...`);

    for (const sample of samples) {
      samplesProcessed++;

    // Parse sample value
    const sampleValue = typeof sample.result === 'string'
      ? parseFloat(sample.result)
      : parseFloat(sample.result!.toString());
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
        sampleId: sample.id,
        facilityPlaceId: sample.location.facility.facilityPlaceId,
        pollutantKey: matchedBenchmark.pollutantKey,
        benchmarkId: matchedBenchmark.id,
        benchmarkValue: benchmarkInMgL,
        benchmarkUnit: 'mg/L',
        sampleValue: sampleInMgL,
        sampleUnit: 'mg/L',
        exceedanceRatio,
        benchmarkType: matchedBenchmark.benchmarkType,
        detectedAt: sample.samplingDate,
      });
    }
  }

    skip += batchSize;
  }

  console.log(`\n✅ Sample processing complete!`);
  console.log(`   Total samples: ${samplesProcessed.toLocaleString()}`);
  console.log(`   Samples with benchmarks: ${samplesWithBenchmark.toLocaleString()}`);
  console.log(`   Violations detected: ${violations.length.toLocaleString()}\n`);

  if (violations.length === 0) {
    console.log('No violations to create.\n');
    return;
  }

  // Step 1: Get or create Facility records for each eSMR facility
  console.log('🏢 Ensuring Facility records exist for eSMR facilities...\n');

  const facilityMap = new Map<number, string>(); // facilityPlaceId -> Facility.id
  const uniqueFacilityPlaceIds = [...new Set(violations.map(v => v.facilityPlaceId))];

  for (const facilityPlaceId of uniqueFacilityPlaceIds) {
    // Check if Facility already exists
    let facility = await prisma.facility.findFirst({
      where: { esmrFacilityId: facilityPlaceId },
    });

    if (!facility) {
      // Create Facility from eSMR data
      const esmrFacility = await prisma.eSMRFacility.findUnique({
        where: { facilityPlaceId },
        include: { region: true },
      });

      if (esmrFacility) {
        facility = await prisma.facility.create({
          data: {
            name: esmrFacility.facilityName,
            permitId: `ESMR-${facilityPlaceId}`,
            lat: new Decimal(0), // Default - will be enriched later
            lon: new Decimal(0),
            esmrFacilityId: facilityPlaceId,
            receivingWater: esmrFacility.receivingWaterBody,
          },
        });
        console.log(`  Created Facility: ${facility.name}`);
      }
    }

    if (facility) {
      facilityMap.set(facilityPlaceId, facility.id);
    }
  }

  console.log(`  Mapped ${facilityMap.size} facilities\n`);

  // Step 2: Group violations by facility + pollutant + year
  console.log('📊 Aggregating violations by facility/pollutant/year...\n');

  interface ViolationGroup {
    facilityId: string;
    pollutantKey: string;
    reportingYear: string;
    violations: ViolationResult[];
  }

  const groups = new Map<string, ViolationGroup>();

  for (const violation of violations) {
    const facilityId = facilityMap.get(violation.facilityPlaceId);
    if (!facilityId) continue;

    const year = violation.detectedAt.getFullYear().toString();
    const key = `${facilityId}-${violation.pollutantKey}-${year}`;

    if (!groups.has(key)) {
      groups.set(key, {
        facilityId,
        pollutantKey: violation.pollutantKey,
        reportingYear: year,
        violations: [],
      });
    }

    groups.get(key)!.violations.push(violation);
  }

  console.log(`  Created ${groups.size} violation groups\n`);

  // Step 3: Create ViolationEvent and ViolationSample records
  console.log('📝 Creating violation records...\n');

  let eventsCreated = 0;
  let samplesCreated = 0;
  let errors = 0;

  for (const [key, group] of groups.entries()) {
    try {
      // Sort by date
      group.violations.sort((a, b) => a.detectedAt.getTime() - b.detectedAt.getTime());

      const firstDate = group.violations[0].detectedAt;
      const lastDate = group.violations[group.violations.length - 1].detectedAt;
      const maxRatio = Math.max(...group.violations.map(v => v.exceedanceRatio));
      const maxSeverity = calculateSeverity(maxRatio);

      // Upsert ViolationEvent
      const violationEvent = await prisma.violationEvent.upsert({
        where: {
          facilityId_pollutantKey_reportingYear: {
            facilityId: group.facilityId,
            pollutantKey: group.pollutantKey,
            reportingYear: group.reportingYear,
          },
        },
        create: {
          facilityId: group.facilityId,
          pollutantKey: group.pollutantKey,
          firstDate,
          lastDate,
          count: group.violations.length,
          maxRatio: new Decimal(maxRatio.toFixed(2)),
          maxSeverity,
          reportingYear: group.reportingYear,
        },
        update: {
          lastDate,
          count: group.violations.length,
          maxRatio: new Decimal(maxRatio.toFixed(2)),
          maxSeverity,
        },
      });

      eventsCreated++;

      // Create ViolationSample records for each violation
      for (const violation of group.violations) {
        try {
          await prisma.violationSample.create({
            data: {
              violationEventId: violationEvent.id,
              facilityId: group.facilityId,
              esmrSampleId: violation.sampleId,
              benchmarkId: violation.benchmarkId,
              pollutantKey: violation.pollutantKey,
              detectedAt: violation.detectedAt,
              measuredValue: new Decimal(violation.sampleValue.toFixed(6)),
              measuredUnit: violation.sampleUnit,
              benchmarkValue: new Decimal(violation.benchmarkValue.toFixed(6)),
              benchmarkUnit: violation.benchmarkUnit,
              exceedanceRatio: new Decimal(violation.exceedanceRatio.toFixed(2)),
              severity: calculateSeverity(violation.exceedanceRatio),
              status: 'OPEN',
            },
          });

          samplesCreated++;
        } catch (error: any) {
          // Skip duplicates
          if (!error.message?.includes('Unique constraint')) {
            errors++;
            if (errors <= 5) {
              console.error(`  Error creating violation sample:`, error.message);
            }
          }
        }
      }

      if (eventsCreated % 50 === 0) {
        console.log(`  Progress: ${eventsCreated} events, ${samplesCreated} samples`);
      }
    } catch (error: any) {
      errors++;
      if (errors <= 5) {
        console.error(`  Error creating violation event for ${key}:`, error.message);
      }
    }
  }

  console.log(`\n✅ Violation computation complete!`);
  console.log(`   Violation events created/updated: ${eventsCreated.toLocaleString()}`);
  console.log(`   Violation samples created: ${samplesCreated.toLocaleString()}`);
  console.log(`   Errors: ${errors.toLocaleString()}\n`);
}

/**
 * Calculate violation severity based on exceedance ratio
 */
function calculateSeverity(exceedanceRatio: number): ViolationSeverity {
  if (exceedanceRatio >= 10) return 'CRITICAL';
  if (exceedanceRatio >= 5) return 'HIGH';
  if (exceedanceRatio >= 2) return 'MODERATE';
  return 'LOW';
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
