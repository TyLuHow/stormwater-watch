/**
 * Prisma Seed Script
 * Creates test data: users, facilities, samples, subscriptions
 */

import { PrismaClient, Decimal } from "@prisma/client"
import { getReportingYear } from "../lib/utils/dates"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("Clearing existing data...")
  await prisma.alert.deleteMany()
  await prisma.violationEvent.deleteMany()
  await prisma.sample.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.facility.deleteMany()
  await prisma.user.deleteMany()
  await prisma.configPollutant.deleteMany()
  await prisma.provenance.deleteMany()

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

  // 3. Create 10 Facilities across 3 CA counties
  console.log("Creating facilities...")
  const counties = ["Alameda", "Santa Clara", "Contra Costa"]
  const facilitiesData = [
    // Alameda County (5 facilities)
    { name: "Oakland Industrial Park", permitId: "WDID-001", county: "Alameda", lat: 37.8044, lon: -122.2712, naics: "324110" },
    { name: "Fremont Manufacturing", permitId: "WDID-002", county: "Alameda", lat: 37.5483, lon: -121.9886, naics: "336211" },
    { name: "Hayward Processing Plant", permitId: "WDID-003", county: "Alameda", lat: 37.6688, lon: -122.0808, naics: "311111" },
    { name: "Berkeley Chemical Works", permitId: "WDID-004", county: "Alameda", lat: 37.8715, lon: -122.2730, naics: "325211" },
    { name: "Alameda Shipyard", permitId: "WDID-005", county: "Alameda", lat: 37.7652, lon: -122.2416, naics: "336611" },
    
    // Santa Clara County (3 facilities)
    { name: "San Jose Tech Park", permitId: "WDID-006", county: "Santa Clara", lat: 37.3382, lon: -121.8863, naics: "334413" },
    { name: "Sunnyvale Industrial", permitId: "WDID-007", county: "Santa Clara", lat: 37.3688, lon: -122.0363, naics: "334220" },
    { name: "Palo Alto Research Facility", permitId: "WDID-008", county: "Santa Clara", lat: 37.4419, lon: -122.1430, naics: "541712" },
    
    // Contra Costa County (2 facilities)
    { name: "Richmond Refinery", permitId: "WDID-009", county: "Contra Costa", lat: 37.9358, lon: -122.3477, naics: "324110" },
    { name: "Concord Manufacturing", permitId: "WDID-010", county: "Contra Costa", lat: 37.9780, lon: -122.0311, naics: "336399" },
  ]

  const facilities = []
  for (const facData of facilitiesData) {
    const facility = await prisma.facility.create({
      data: {
        name: facData.name,
        permitId: facData.permitId,
        county: facData.county,
        naics: facData.naics,
        lat: new Decimal(facData.lat.toString()),
        lon: new Decimal(facData.lon.toString()),
        receivingWater: facData.county === "Alameda" ? "San Francisco Bay" : "San Francisco Bay",
        watershedHuc12: facData.county === "Alameda" ? "180500020401" : "180500020301",
        ms4Jurisdiction: facData.county === "Alameda" ? "Oakland" : facData.county === "Santa Clara" ? "San Jose" : "Richmond",
        isInDAC: Math.random() > 0.6, // 40% chance of being in disadvantaged community
      },
    })
    facilities.push(facility)
  }
  console.log(`✓ Created ${facilities.length} facilities`)

  // 4. Create 60 samples over 90 days
  console.log("Creating samples...")
  const pollutants = ["COPPER", "TSS", "O&G", "PH"]
  const benchmarks: Record<string, { value: number; unit: string }> = {
    COPPER: { value: 14, unit: "µg/L" }, // NAL for copper
    TSS: { value: 100, unit: "mg/L" },
    "O&G": { value: 15, unit: "mg/L" },
    PH: { value: 7.5, unit: "pH" }, // Midpoint for range check
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 90) // 90 days ago
  const samples: any[] = []

  for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
    const sampleDate = new Date(startDate)
    sampleDate.setDate(sampleDate.getDate() + dayOffset)
    const reportingYear = getReportingYear(sampleDate)

    // Create 1-2 samples per day across different facilities
    const samplesPerDay = Math.random() > 0.5 ? 2 : 1

    for (let i = 0; i < samplesPerDay; i++) {
      const facility = facilities[Math.floor(Math.random() * facilities.length)]
      const pollutant = pollutants[Math.floor(Math.random() * pollutants.length)]
      const benchmark = benchmarks[pollutant]

      // Generate realistic values
      let value: number
      let exceedanceRatio: Decimal | null = null

      if (pollutant === "PH") {
        // pH: sometimes outside 6.0-9.0 range
        if (Math.random() > 0.7) {
          // 30% chance of exceedance
          value = Math.random() > 0.5 ? 5.5 : 9.5 // Below or above range
        } else {
          value = 6.5 + Math.random() * 2.5 // Normal range
        }
        // pH doesn't have exceedance ratio
      } else if (pollutant === "COPPER") {
        // Copper: sometimes exceeds NAL
        value = Math.random() > 0.6 ? 20 + Math.random() * 10 : 5 + Math.random() * 10
        exceedanceRatio = new Decimal((value / benchmark.value).toFixed(2))
      } else if (pollutant === "TSS") {
        // TSS: sometimes exceeds
        value = Math.random() > 0.7 ? 150 + Math.random() * 50 : 50 + Math.random() * 50
        exceedanceRatio = new Decimal((value / benchmark.value).toFixed(2))
      } else {
        // O&G
        value = Math.random() > 0.75 ? 20 + Math.random() * 10 : 5 + Math.random() * 10
        exceedanceRatio = new Decimal((value / benchmark.value).toFixed(2))
      }

      samples.push({
        facilityId: facility.id,
        sampleDate,
        pollutant,
        value: new Decimal(value.toFixed(4)),
        unit: benchmark.unit,
        benchmark: new Decimal(benchmark.value.toString()),
        benchmarkUnit: benchmark.unit,
        exceedanceRatio,
        reportingYear,
        source: "CIWQS Test Data",
        sourceDocUrl: "https://ciwqs.waterboards.ca.gov/test",
      })
    }
  }

  // Insert samples in batches
  const BATCH_SIZE = 50
  for (let i = 0; i < samples.length; i += BATCH_SIZE) {
    await prisma.sample.createMany({
      data: samples.slice(i, i + BATCH_SIZE),
      skipDuplicates: true,
    })
  }
  console.log(`✓ Created ${samples.length} samples`)

  // 5. Create 3 Subscriptions (POLYGON, BUFFER, JURISDICTION)
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
  console.log(`  Facilities: ${facilities.length} across ${counties.length} counties`)
  console.log(`  Samples: ${samples.length} over 90 days`)
  console.log(`  Subscriptions: ${3} (POLYGON, BUFFER, JURISDICTION)`)
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
