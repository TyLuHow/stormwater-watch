/**
 * Prisma Seed Script
 * Creates essential configuration data and demo users
 *
 * NOTE: This script no longer creates mock facilities.
 * The application uses real eSMR facility data imported via the import:esmr script.
 *
 * For development/testing with mock data, use seed-test-data.ts instead.
 */

import { PrismaClient } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // NOTE: We do NOT clear existing data by default
  // This preserves real eSMR data that has been imported
  // If you need a fresh database, use: npm run db:reset
  console.log("Seeding configuration data (preserving existing facilities and samples)...")

  // 1. Create Users (1 ADMIN, 2 PARTNER)
  console.log("Creating users...")
  const admin = await prisma.user.create({
    data: {
      email: "admin@stormwaterwatch.org",
      name: "Admin User",
      role: "ADMIN",
    },
  })

  const partner1 = await prisma.user.create({
    data: {
      email: "partner1@example.org",
      name: "Environmental NGO Partner 1",
      role: "PARTNER",
    },
  })

  const partner2 = await prisma.user.create({
    data: {
      email: "partner2@example.org",
      name: "Environmental NGO Partner 2",
      role: "PARTNER",
    },
  })

  console.log(`✓ Created ${3} users`)

  // 2. Seed ConfigPollutant (pollutant aliases)
  console.log("Creating pollutant config...")
  await prisma.configPollutant.createMany({
    data: [
      {
        key: "COPPER",
        aliases: ["Copper", "CU", "Total Copper", "Cu"],
        canonicalUnit: "µg/L",
        notes: "Metals - store as µg/L",
      },
      {
        key: "ZINC",
        aliases: ["Zinc", "ZN", "Total Zinc", "Zn"],
        canonicalUnit: "µg/L",
        notes: "Metals - store as µg/L",
      },
      {
        key: "TSS",
        aliases: ["Total Suspended Solids", "TSS", "Suspended Solids"],
        canonicalUnit: "mg/L",
        notes: "Total suspended solids",
      },
      {
        key: "O&G",
        aliases: ["Oil and Grease", "O&G", "Oil & Grease", "O/G"],
        canonicalUnit: "mg/L",
        notes: "Oil and grease",
      },
      {
        key: "PH",
        aliases: ["pH", "PH VALUE", "pH Value"],
        canonicalUnit: "pH",
        notes: "pH is range-based (6.0-9.0)",
      },
      {
        key: "TURBIDITY",
        aliases: ["Turbidity", "TURB"],
        canonicalUnit: "NTU",
        notes: "Turbidity in NTU",
      },
    ],
    skipDuplicates: true,
  })
  console.log("✓ Created pollutant configs")

  // 3. Skip facility creation - use real eSMR data instead
  console.log("\n⚠️  Skipping mock facility creation")
  console.log("   Real facilities should be imported using: npm run import:esmr")
  console.log("   Or create Facility records from eSMR data using: npm run link:facilities")

  // Check if eSMR data exists
  const esmrFacilityCount = await prisma.eSMRFacility.count()
  const esmrSampleCount = await prisma.eSMRSample.count()
  const facilityCount = await prisma.facility.count()

  console.log(`\n   Current database state:`)
  console.log(`   - eSMR Facilities: ${esmrFacilityCount.toLocaleString()}`)
  console.log(`   - eSMR Samples: ${esmrSampleCount.toLocaleString()}`)
  console.log(`   - Facility records: ${facilityCount}`)

  if (esmrFacilityCount === 0) {
    console.log(`\n   ⚠️  No eSMR data found. Run 'npm run import:esmr' to import real facility data.`)
  }

  // 4. Create example subscriptions (but don't link to specific facilities)
  console.log("Creating subscriptions...")

  // POLYGON subscription (San Francisco Bay area)
  const polygonSub = await prisma.subscription.create({
    data: {
      userId: partner1.id,
      name: "San Francisco Bay Area Monitoring",
      mode: "POLYGON",
      params: {
        polygon: {
          type: "Polygon",
          coordinates: [
            [
              [-122.5, 37.7],
              [-122.3, 37.7],
              [-122.3, 37.9],
              [-122.5, 37.9],
              [-122.5, 37.7],
            ],
          ],
        },
      },
      minRatio: new Decimal("1.5"),
      repeatOffenderThreshold: 2,
      impairedOnly: false,
      schedule: "DAILY",
      delivery: "EMAIL",
      active: true,
    },
  })

  // BUFFER subscription (10km radius around Oakland)
  const bufferSub = await prisma.subscription.create({
    data: {
      userId: partner1.id,
      name: "Oakland Area (10km radius)",
      mode: "BUFFER",
      params: {
        centerLat: 37.8044,
        centerLon: -122.2712,
        radiusKm: 10,
      },
      minRatio: new Decimal("1.0"),
      repeatOffenderThreshold: 2,
      impairedOnly: false,
      schedule: "DAILY",
      delivery: "BOTH",
      active: true,
    },
  })

  // JURISDICTION subscription (Alameda County)
  const jurisdictionSub = await prisma.subscription.create({
    data: {
      userId: partner2.id,
      name: "Alameda County Facilities",
      mode: "JURISDICTION",
      params: {
        counties: ["Alameda"],
      },
      minRatio: new Decimal("2.0"),
      repeatOffenderThreshold: 3,
      impairedOnly: true,
      schedule: "WEEKLY",
      delivery: "SLACK",
      active: true,
    },
  })

  console.log(`✓ Created ${3} subscriptions`)

  console.log("\n✅ Seeding complete!")
  console.log("\nSummary:")
  console.log(`  Users: ${3} (1 ADMIN, 2 PARTNER)`)
  console.log(`  Pollutant Configs: 6`)
  console.log(`  Subscriptions: ${3} (POLYGON, BUFFER, JURISDICTION)`)
  console.log(`  eSMR Facilities: ${esmrFacilityCount.toLocaleString()}`)
  console.log(`  eSMR Samples: ${esmrSampleCount.toLocaleString()}`)
  console.log(`  Facility Records: ${facilityCount}`)
  console.log("\n💡 To import real facility data:")
  console.log("   npm run import:esmr")
  console.log("\n💡 To create Facility records from eSMR data:")
  console.log("   npm run link:facilities")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
