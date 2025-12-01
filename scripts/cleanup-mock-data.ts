#!/usr/bin/env tsx
/**
 * Cleanup Mock Data Script
 *
 * Removes all mock facilities and related data from the database.
 * This script is idempotent and safe to run multiple times.
 *
 * Mock data patterns:
 * - Facility IDs like "fac-001", "fac-002", etc.
 * - Permit IDs like "WDID-001", "WDID-002", etc.
 * - Generic facility names from seed files
 *
 * Usage:
 *   npm run db:cleanup-mock
 *   # or
 *   tsx scripts/cleanup-mock-data.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🧹 Starting mock data cleanup...\n")

  try {
    // 1. Find all mock facilities
    console.log("Step 1: Identifying mock facilities...")
    const mockFacilities = await prisma.facility.findMany({
      where: {
        OR: [
          { id: { startsWith: "fac-" } },
          { permitId: { startsWith: "WDID-" } },
          { permitId: { startsWith: "CA000" } }, // Mock permit IDs from test fixtures
          {
            name: {
              in: [
                // From seed.ts
                "Oakland Industrial Park",
                "Fremont Manufacturing",
                "Hayward Processing Plant",
                "Berkeley Chemical Works",
                "Alameda Shipyard",
                "San Jose Tech Park",
                "Sunnyvale Industrial",
                "Palo Alto Research Facility",
                "Richmond Refinery",
                "Concord Manufacturing",
                // From mock-facilities.ts
                "Acme Industrial Park",
                "Bay Area Manufacturing",
                "Central Valley Processing",
              ]
            }
          },
        ],
      },
      select: {
        id: true,
        name: true,
        permitId: true,
        _count: {
          select: {
            samples: true,
            violationEvents: true,
            alerts: true,
          },
        },
      },
    })

    if (mockFacilities.length === 0) {
      console.log("✅ No mock facilities found in database. Already clean!\n")
      return
    }

    console.log(`Found ${mockFacilities.length} mock facilities:\n`)
    mockFacilities.forEach((f) => {
      console.log(`  - ${f.name} (${f.permitId})`)
      console.log(`    ID: ${f.id}`)
      console.log(`    Samples: ${f._count.samples}, Violations: ${f._count.violationEvents}, Alerts: ${f._count.alerts}`)
    })
    console.log()

    // 2. Calculate total records to delete
    const totalSamples = mockFacilities.reduce((sum, f) => sum + f._count.samples, 0)
    const totalViolations = mockFacilities.reduce((sum, f) => sum + f._count.violationEvents, 0)
    const totalAlerts = mockFacilities.reduce((sum, f) => sum + f._count.alerts, 0)

    console.log("Step 2: Records to be deleted:")
    console.log(`  - Facilities: ${mockFacilities.length}`)
    console.log(`  - Samples: ${totalSamples}`)
    console.log(`  - Violation Events: ${totalViolations}`)
    console.log(`  - Alerts: ${totalAlerts}`)
    console.log()

    // 3. Delete in transaction (cascading deletes will handle related records)
    console.log("Step 3: Deleting mock facilities and related data...")

    const facilityIds = mockFacilities.map((f) => f.id)

    const result = await prisma.$transaction(async (tx) => {
      // Delete alerts (to avoid FK constraint issues if they reference violations)
      const deletedAlerts = await tx.alert.deleteMany({
        where: { facilityId: { in: facilityIds } },
      })

      // Delete violation events
      const deletedViolations = await tx.violationEvent.deleteMany({
        where: { facilityId: { in: facilityIds } },
      })

      // Delete samples
      const deletedSamples = await tx.sample.deleteMany({
        where: { facilityId: { in: facilityIds } },
      })

      // Finally, delete facilities
      const deletedFacilities = await tx.facility.deleteMany({
        where: { id: { in: facilityIds } },
      })

      return {
        alerts: deletedAlerts.count,
        violations: deletedViolations.count,
        samples: deletedSamples.count,
        facilities: deletedFacilities.count,
      }
    })

    console.log("\n✅ Cleanup complete!")
    console.log("\nDeleted records:")
    console.log(`  ✓ Facilities: ${result.facilities}`)
    console.log(`  ✓ Samples: ${result.samples}`)
    console.log(`  ✓ Violation Events: ${result.violations}`)
    console.log(`  ✓ Alerts: ${result.alerts}`)
    console.log()

    // 4. Verify cleanup
    console.log("Step 4: Verifying cleanup...")
    const remainingMock = await prisma.facility.count({
      where: {
        OR: [
          { id: { startsWith: "fac-" } },
          { permitId: { startsWith: "WDID-" } },
          { permitId: { startsWith: "CA000" } },
        ],
      },
    })

    if (remainingMock > 0) {
      console.warn(`⚠️  Warning: ${remainingMock} mock facilities still remain`)
    } else {
      console.log("✓ No mock facilities remain in database")
    }

    // 5. Show real data stats
    console.log("\nReal data in database:")
    const [realFacilities, esmrFacilities, esmrSamples] = await Promise.all([
      prisma.facility.count(),
      prisma.eSMRFacility.count(),
      prisma.eSMRSample.count(),
    ])
    console.log(`  - Facility records: ${realFacilities}`)
    console.log(`  - eSMR Facilities: ${esmrFacilities}`)
    console.log(`  - eSMR Samples: ${esmrSamples.toLocaleString()}`)
    console.log()

  } catch (error) {
    console.error("❌ Error during cleanup:", error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error("Fatal error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
