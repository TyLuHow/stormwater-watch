#!/usr/bin/env tsx

import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying violations in database...\n');

  // Count ViolationEvent records
  const eventCount = await prisma.$queryRawUnsafe<any>(`
    SELECT COUNT(*) as count FROM "ViolationEvent"
  `);
  console.log(`ViolationEvent records: ${eventCount[0].count}`);

  // Count ViolationSample records
  const sampleCount = await prisma.$queryRawUnsafe<any>(`
    SELECT COUNT(*) as count FROM "violation_samples"
  `);
  console.log(`ViolationSample records: ${sampleCount[0].count}\n`);

  // Get violation events with details
  const events = await prisma.$queryRawUnsafe<any>(`
    SELECT
      ve.id,
      ve."facilityId",
      f.name as "facilityName",
      ve."pollutantKey",
      ve."firstDate",
      ve."lastDate",
      ve.count,
      ve."maxRatio",
      ve."maxSeverity",
      ve."reportingYear"
    FROM "ViolationEvent" ve
    JOIN "Facility" f ON f.id = ve."facilityId"
    ORDER BY ve."maxRatio" DESC
  `);

  console.log('ViolationEvent records:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  for (const event of events) {
    console.log(`Facility: ${event.facilityName}`);
    console.log(`Pollutant: ${event.pollutantKey}`);
    console.log(`Date Range: ${event.firstDate.toISOString().split('T')[0]} to ${event.lastDate.toISOString().split('T')[0]}`);
    console.log(`Count: ${event.count} violations`);
    console.log(`Max Ratio: ${event.maxRatio}x (${event.maxSeverity})`);
    console.log(`Year: ${event.reportingYear}`);
    console.log('───────────────────────────────────────────────────────────────\n');
  }

  // Get sample details for first event
  if (events.length > 0) {
    const samples = await prisma.$queryRawUnsafe<any>(`
      SELECT
        vs."detectedAt",
        vs."measuredValue",
        vs."measuredUnit",
        vs."benchmarkValue",
        vs."benchmarkUnit",
        vs."exceedanceRatio",
        vs.severity
      FROM "violation_samples" vs
      WHERE vs."violationEventId" = $1
      ORDER BY vs."exceedanceRatio" DESC
      LIMIT 5
    `, events[0].id);

    console.log(`Sample violations for ${events[0].facilityName} (showing top 5):`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (const sample of samples) {
      console.log(`Date: ${sample.detectedAt.toISOString().split('T')[0]}`);
      console.log(`Measured: ${sample.measuredValue} ${sample.measuredUnit}`);
      console.log(`Benchmark: ${sample.benchmarkValue} ${sample.benchmarkUnit}`);
      console.log(`Exceedance: ${sample.exceedanceRatio}x (${sample.severity})`);
      console.log('───────────────────────────────────────────────────────────────\n');
    }
  }
}

main()
  .then(() => {
    console.log('✅ Verification complete!');
    prisma.$disconnect();
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
