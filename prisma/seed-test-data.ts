/**
 * Prisma Seed Script: Test Data
 * Creates test facilities and violation events for development and UI testing
 *
 * Creates:
 * - 1 test facility (San Francisco Bay Area)
 * - 3 sample violations (TSS x2, Copper x1) with exceedances
 *
 * Safe to run multiple times - uses upsert pattern
 */

import { PrismaClient, Decimal } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding test data (facility and violations)...")

  // 1. Create or update test facility in San Francisco Bay Area
  console.log("\nCreating test facility...")
  const testFacility = await prisma.facility.upsert({
    where: { permitId: "TEST-SF-BAY-001" },
    update: {
      name: "SF Bay Test Facility",
      naics: "325211",
      lat: new Decimal("37.7749"),
      lon: new Decimal("-122.4194"),
      county: "San Francisco",
      watershedHuc12: "180500020402",
      receivingWater: "San Francisco Bay",
      ms4: "San Francisco",
      isInDAC: true,
      lastSeenAt: new Date(),
    },
    create: {
      name: "SF Bay Test Facility",
      permitId: "TEST-SF-BAY-001",
      naics: "325211",
      lat: new Decimal("37.7749"),
      lon: new Decimal("-122.4194"),
      county: "San Francisco",
      watershedHuc12: "180500020402",
      receivingWater: "San Francisco Bay",
      ms4: "San Francisco",
      isInDAC: true,
    },
  })

  console.log(
    `✓ Facility: ${testFacility.name} (${testFacility.permitId}) at (${testFacility.lat}, ${testFacility.lon})`,
  )

  // 2. Create test samples
  console.log("\nCreating test samples...")
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const samples = [
    {
      facilityId: testFacility.id,
      sampleDate: thirtyDaysAgo,
      pollutant: "TSS",
      value: new Decimal("150.5"),
      unit: "mg/L",
      benchmark: new Decimal("100"),
      benchmarkUnit: "mg/L",
      exceedanceRatio: new Decimal("1.51"),
      reportingYear: new Date().getFullYear().toString(),
      source: "SMARTS Test Upload",
      sourceDocUrl: "https://example.com/test-data.csv",
    },
    {
      facilityId: testFacility.id,
      sampleDate: new Date(thirtyDaysAgo.getTime() + 5 * 24 * 60 * 60 * 1000),
      pollutant: "TSS",
      value: new Decimal("175.25"),
      unit: "mg/L",
      benchmark: new Decimal("100"),
      benchmarkUnit: "mg/L",
      exceedanceRatio: new Decimal("1.75"),
      reportingYear: new Date().getFullYear().toString(),
      source: "SMARTS Test Upload",
      sourceDocUrl: "https://example.com/test-data.csv",
    },
    {
      facilityId: testFacility.id,
      sampleDate: new Date(thirtyDaysAgo.getTime() + 10 * 24 * 60 * 60 * 1000),
      pollutant: "COPPER",
      value: new Decimal("25.5"),
      unit: "µg/L",
      benchmark: new Decimal("14"),
      benchmarkUnit: "µg/L",
      exceedanceRatio: new Decimal("1.82"),
      reportingYear: new Date().getFullYear().toString(),
      source: "SMARTS Test Upload",
      sourceDocUrl: "https://example.com/test-data.csv",
    },
  ]

  for (const sample of samples) {
    const createdSample = await prisma.sample.create({
      data: sample,
    })
    console.log(
      `✓ Sample: ${createdSample.pollutant} = ${createdSample.value} ${createdSample.unit} (ratio: ${createdSample.exceedanceRatio})`,
    )
  }

  // 3. Create violation events from samples
  console.log("\nCreating test violation events...")

  // TSS violation (2 exceedances)
  const tssViolation = await prisma.violationEvent.upsert({
    where: {
      facilityId_pollutant_reportingYear: {
        facilityId: testFacility.id,
        pollutant: "TSS",
        reportingYear: new Date().getFullYear().toString(),
      },
    },
    update: {
      count: 2,
      maxRatio: new Decimal("1.75"),
      lastDate: new Date(thirtyDaysAgo.getTime() + 5 * 24 * 60 * 60 * 1000),
      impairedWater: true,
    },
    create: {
      facilityId: testFacility.id,
      pollutant: "TSS",
      firstDate: thirtyDaysAgo,
      lastDate: new Date(thirtyDaysAgo.getTime() + 5 * 24 * 60 * 60 * 1000),
      count: 2,
      maxRatio: new Decimal("1.75"),
      reportingYear: new Date().getFullYear().toString(),
      impairedWater: true,
      dismissed: false,
      notes: "Test violation: TSS exceedance in Bay Area facility",
    },
  })

  console.log(
    `✓ Violation: ${tssViolation.pollutant} (${tssViolation.count} exceedances, max ratio: ${tssViolation.maxRatio})`,
  )

  // Copper violation (1 exceedance)
  const copperViolation = await prisma.violationEvent.upsert({
    where: {
      facilityId_pollutant_reportingYear: {
        facilityId: testFacility.id,
        pollutant: "COPPER",
        reportingYear: new Date().getFullYear().toString(),
      },
    },
    update: {
      count: 1,
      maxRatio: new Decimal("1.82"),
      lastDate: new Date(thirtyDaysAgo.getTime() + 10 * 24 * 60 * 60 * 1000),
    },
    create: {
      facilityId: testFacility.id,
      pollutant: "COPPER",
      firstDate: new Date(thirtyDaysAgo.getTime() + 10 * 24 * 60 * 60 * 1000),
      lastDate: new Date(thirtyDaysAgo.getTime() + 10 * 24 * 60 * 60 * 1000),
      count: 1,
      maxRatio: new Decimal("1.82"),
      reportingYear: new Date().getFullYear().toString(),
      impairedWater: false,
      dismissed: false,
      notes: "Test violation: Copper exceedance in Bay Area facility",
    },
  })

  console.log(
    `✓ Violation: ${copperViolation.pollutant} (${copperViolation.count} exceedance, max ratio: ${copperViolation.maxRatio})`,
  )

  console.log("\n✅ Test data seeding complete!")
  console.log("\nTest facility summary:")
  console.log(`  Facility: ${testFacility.name}`)
  console.log(`  Permit ID: ${testFacility.permitId}`)
  console.log(`  Location: (${testFacility.lat}, ${testFacility.lon})`)
  console.log(`  County: ${testFacility.county}`)
  console.log(`  Samples: 3`)
  console.log(`  Violations: 2`)
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
