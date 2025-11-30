import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { formatDecimal, type FacilityDetailResponse } from "@/lib/api/esmr"

/**
 * GET /api/esmr/facilities/[id]
 *
 * Get detailed information for a single facility including:
 * - Facility metadata
 * - All locations with sample counts
 * - Recent samples aggregated by parameter
 * - Overall statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const facilityPlaceId = parseInt(id, 10)

    if (isNaN(facilityPlaceId)) {
      return NextResponse.json(
        { error: "Invalid facility ID" },
        { status: 400 }
      )
    }

    // Fetch facility with region
    const facility = await prisma.eSMRFacility.findUnique({
      where: { facilityPlaceId },
      include: {
        region: true,
      },
    })

    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 })
    }

    // Fetch locations with sample counts
    const locations = await prisma.eSMRLocation.findMany({
      where: { facilityPlaceId },
      select: {
        locationPlaceId: true,
        locationCode: true,
        locationType: true,
        latitude: true,
        longitude: true,
        locationDesc: true,
        _count: {
          select: {
            samples: true,
          },
        },
      },
      orderBy: {
        locationCode: "asc",
      },
    })

    const locationIds = locations.map((l) => l.locationPlaceId)

    // Get recent samples aggregated by parameter
    const recentSamples = await prisma.$queryRaw<
      {
        parameterId: string
        parameterName: string
        category: string | null
        latestSample: Date
        sampleCount: bigint
        avgResult: any
        minResult: any
        maxResult: any
        units: string | null
      }[]
    >`
      SELECT
        p.id as "parameterId",
        p."parameterName" as "parameterName",
        p.category,
        MAX(s."samplingDate") as "latestSample",
        COUNT(s.id) as "sampleCount",
        AVG(s.result) as "avgResult",
        MIN(s.result) as "minResult",
        MAX(s.result) as "maxResult",
        MODE() WITHIN GROUP (ORDER BY s.units) as units
      FROM "esmr_samples" s
      INNER JOIN "esmr_parameters" p ON s."parameterId" = p.id
      WHERE s."locationPlaceId" IN (${locationIds.join(",")})
      GROUP BY p.id, p."parameterName", p.category
      ORDER BY "latestSample" DESC, "sampleCount" DESC
      LIMIT 50
    `

    // Get overall statistics
    const [totalSamples, dateRange, uniqueParameters] = await Promise.all([
      prisma.eSMRSample.count({
        where: {
          locationPlaceId: {
            in: locationIds,
          },
        },
      }),
      prisma.eSMRSample.aggregate({
        where: {
          locationPlaceId: {
            in: locationIds,
          },
        },
        _min: {
          samplingDate: true,
        },
        _max: {
          samplingDate: true,
        },
      }),
      prisma.eSMRSample.findMany({
        where: {
          locationPlaceId: {
            in: locationIds,
          },
        },
        select: {
          parameterId: true,
        },
        distinct: ["parameterId"],
      }),
    ])

    // Format response
    const response: FacilityDetailResponse = {
      facility: {
        facilityPlaceId: facility.facilityPlaceId,
        facilityName: facility.facilityName,
        regionCode: facility.regionCode,
        regionName: facility.region.name,
        receivingWaterBody: facility.receivingWaterBody,
        createdAt: facility.createdAt.toISOString(),
        lastSeenAt: facility.lastSeenAt.toISOString(),
      },
      locations: locations.map((loc) => ({
        locationPlaceId: loc.locationPlaceId,
        locationCode: loc.locationCode,
        locationType: loc.locationType,
        latitude: formatDecimal(loc.latitude),
        longitude: formatDecimal(loc.longitude),
        locationDesc: loc.locationDesc,
        sampleCount: loc._count.samples,
      })),
      recentSamples: recentSamples.map((sample) => ({
        parameter: sample.parameterName,
        category: sample.category,
        latestSample: sample.latestSample.toISOString().split("T")[0],
        sampleCount: Number(sample.sampleCount),
        avgResult: formatDecimal(sample.avgResult),
        minResult: formatDecimal(sample.minResult),
        maxResult: formatDecimal(sample.maxResult),
        units: sample.units,
      })),
      stats: {
        totalLocations: locations.length,
        totalSamples,
        totalParameters: uniqueParameters.length,
        dateRange: {
          earliest: dateRange._min.samplingDate?.toISOString().split("T")[0] || null,
          latest: dateRange._max.samplingDate?.toISOString().split("T")[0] || null,
        },
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Facility detail API error:", error)

    return NextResponse.json(
      {
        error: "Failed to fetch facility details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
