/**
 * Prisma Seed Script: Pollutant Configuration
 * Populates the ConfigPollutant table with common stormwater pollutants
 *
 * This seed script configures the alias mapping used by the data normalization
 * pipeline (lib/ingest/normalize.ts) to normalize varying pollutant names from
 * different CSV sources to canonical keys and units.
 *
 * Safe to run multiple times - uses upsert pattern
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding ConfigPollutant table...")

  const pollutants = [
    {
      key: "TSS",
      aliases: [
        "Total Suspended Solids",
        "TSS",
        "Suspended Solids",
        "TSS mg/L",
        "Total Suspended Solids (TSS)",
      ],
      canonicalUnit: "mg/L",
      notes:
        "Total suspended solids - primary stormwater pollutant; benchmark typically 100 mg/L",
    },
    {
      key: "O&G",
      aliases: [
        "Oil and Grease",
        "O&G",
        "Oil & Grease",
        "O/G",
        "Oil & Grease (O&G)",
      ],
      canonicalUnit: "mg/L",
      notes: "Oil and grease - common industrial discharge; benchmark typically 15 mg/L",
    },
    {
      key: "PH",
      aliases: ["pH", "PH VALUE", "pH Value", "pH (SU)", "pH Units"],
      canonicalUnit: "pH",
      notes:
        "pH is range-based (6.0-9.0 for most CA water quality standards); no exceedance ratio calculated",
    },
    {
      key: "COPPER",
      aliases: [
        "Copper",
        "CU",
        "Total Copper",
        "Cu",
        "Copper (Cu)",
        "Copper µg/L",
      ],
      canonicalUnit: "µg/L",
      notes:
        "Copper metal - store as µg/L; NAL (numeric action level) typically 14-16 µg/L",
    },
    {
      key: "ZINC",
      aliases: [
        "Zinc",
        "ZN",
        "Total Zinc",
        "Zn",
        "Zinc (Zn)",
        "Zinc µg/L",
      ],
      canonicalUnit: "µg/L",
      notes:
        "Zinc metal - store as µg/L; NAL typically 50-80 µg/L depending on water type",
    },
    {
      key: "LEAD",
      aliases: [
        "Lead",
        "PB",
        "Total Lead",
        "Pb",
        "Lead (Pb)",
        "Lead µg/L",
      ],
      canonicalUnit: "µg/L",
      notes:
        "Lead metal - store as µg/L; very strict NAL typically 2.5 µg/L or lower",
    },
    {
      key: "IRON",
      aliases: [
        "Iron",
        "FE",
        "Total Iron",
        "Fe",
        "Iron (Fe)",
        "Iron µg/L",
      ],
      canonicalUnit: "µg/L",
      notes: "Iron metal - store as µg/L; benchmark varies; typical 1000+ µg/L",
    },
    {
      key: "ALUMINUM",
      aliases: [
        "Aluminum",
        "AL",
        "Total Aluminum",
        "Al",
        "Aluminium",
        "Aluminum µg/L",
      ],
      canonicalUnit: "µg/L",
      notes:
        "Aluminum metal - store as µg/L; benchmark varies; typical 1000+ µg/L",
    },
    {
      key: "NITRATE",
      aliases: [
        "Nitrate",
        "NO3",
        "Nitrate-N",
        "Nitrate as N",
        "Nitrate (NO3)",
      ],
      canonicalUnit: "mg/L",
      notes:
        "Nitrate nutrient - important for eutrophication; benchmark typically 10 mg/L as nitrogen",
    },
    {
      key: "PHOSPHORUS",
      aliases: [
        "Phosphorus",
        "PO4",
        "Total Phosphorus",
        "TP",
        "Phosphate",
        "Phosphorus mg/L",
      ],
      canonicalUnit: "mg/L",
      notes:
        "Phosphorus nutrient - key eutrophication driver; benchmark typically 0.05-0.1 mg/L",
    },
    {
      key: "COD",
      aliases: [
        "Chemical Oxygen Demand",
        "COD",
        "COD mg/L",
        "Chemical O Demand",
      ],
      canonicalUnit: "mg/L",
      notes:
        "Chemical oxygen demand - measures oxidizable organic compounds; benchmark varies 50-100 mg/L",
    },
    {
      key: "BOD",
      aliases: [
        "Biological Oxygen Demand",
        "BOD",
        "BOD mg/L",
        "BOD5",
        "Biochemical O Demand",
      ],
      canonicalUnit: "mg/L",
      notes:
        "Biochemical oxygen demand - measures biodegradable organic content; benchmark typically 5-10 mg/L",
    },
  ]

  let createdCount = 0
  let updatedCount = 0

  for (const pollutant of pollutants) {
    const result = await prisma.configPollutant.upsert({
      where: { key: pollutant.key },
      update: {
        aliases: pollutant.aliases,
        canonicalUnit: pollutant.canonicalUnit,
        notes: pollutant.notes,
      },
      create: pollutant,
    })

    if (result) {
      console.log(`✓ ${pollutant.key}: ${pollutant.canonicalUnit} (${pollutant.aliases.length} aliases)`)
    }
  }

  // Verify all pollutants were created
  const pollutantCount = await prisma.configPollutant.count()
  console.log(`\n✅ ConfigPollutant seeding complete!`)
  console.log(`Total pollutants in database: ${pollutantCount}`)

  // Display summary
  console.log("\nPollutants configured:")
  const allPollutants = await prisma.configPollutant.findMany({
    orderBy: { key: "asc" },
  })
  for (const p of allPollutants) {
    console.log(
      `  - ${p.key.padEnd(15)} (${p.canonicalUnit.padEnd(6)}) ${p.aliases.length} aliases`,
    )
  }
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
