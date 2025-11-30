import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { type RegionListResponse } from "@/lib/api/esmr"

/**
 * GET /api/esmr/regions
 *
 * List all regions with facility, location, and sample counts.
 *
 * No pagination needed - there are typically a small number of regions.
 */
export async function GET() {
  try {
    // Fetch regions with facility counts
    const regions = await prisma.eSMRRegion.findMany({
      select: {
        code: true,
        name: true,
        _count: {
          select: {
            facilities: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    // Get location counts per region
    const locationCounts = await prisma.$queryRaw<
      {
        regionCode: string
        locationCount: bigint
      }[]
    >`
      SELECT
        f."regionCode" as "regionCode",
        COUNT(DISTINCT l."locationPlaceId") as "locationCount"
      FROM "esmr_facilities" f
      LEFT JOIN "esmr_locations" l ON l."facilityPlaceId" = f."facilityPlaceId"
      GROUP BY f."regionCode"
    `

    // Get sample counts per region
    const sampleCounts = await prisma.$queryRaw<
      {
        regionCode: string
        sampleCount: bigint
      }[]
    >`
      SELECT
        f."regionCode" as "regionCode",
        COUNT(s.id) as "sampleCount"
      FROM "esmr_facilities" f
      LEFT JOIN "esmr_locations" l ON l."facilityPlaceId" = f."facilityPlaceId"
      LEFT JOIN "esmr_samples" s ON s."locationPlaceId" = l."locationPlaceId"
      GROUP BY f."regionCode"
    `

    // Build maps for quick lookup
    const locationCountMap = new Map(
      locationCounts.map((lc) => [lc.regionCode, Number(lc.locationCount)])
    )

    const sampleCountMap = new Map(
      sampleCounts.map((sc) => [sc.regionCode, Number(sc.sampleCount)])
    )

    // Format response
    const response: RegionListResponse = {
      regions: regions.map((region) => ({
        code: region.code,
        name: region.name,
        facilityCount: region._count.facilities,
        locationCount: locationCountMap.get(region.code) || 0,
        sampleCount: sampleCountMap.get(region.code) || 0,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Regions API error:", error)

    return NextResponse.json(
      {
        error: "Failed to fetch regions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
