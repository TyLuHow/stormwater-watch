#!/usr/bin/env tsx

/**
 * Compute Violations from eSMR Samples
 *
 * Aggregates violations by facility, pollutant, and reporting year
 */

import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Computing aggregated violations...\n');

  // Simple test: Find TSS samples above 100 mg/L benchmark
  const tssSamples = await prisma.eSMRSample.findMany({
    where: {
      parameter: {
        parameterName: {
          contains: 'Suspended Solids',
        },
      },
      result: {
        gt: 100,
      },
      units: 'mg/L',
    },
    include: {
      parameter: true,
      location: {
        include: {
          facility: true,
        },
      },
    },
    take: 100,
  });

  console.log(`Found ${tssSamples.length} TSS samples exceeding 100 mg/L\n`);

  for (const sample of tssSamples.slice(0, 10)) {
    console.log(`  ${sample.location?.facility?.facilityName || 'Unknown'}: ${sample.result} ${sample.units} on ${sample.samplingDate.toISOString().split('T')[0]}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
