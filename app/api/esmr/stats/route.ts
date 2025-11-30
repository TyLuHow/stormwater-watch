import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { type StatsResponse } from "@/lib/api/esmr"

/**
 * GET /api/esmr/stats
 *
 * Get comprehensive dashboard statistics for the eSMR dataset:
 * - Total counts (facilities, locations, samples, parameters, regions)
 * - Recent activity (samples in last 30 days, last 7 days)
 * - Top parameters by sample count
 * - Overall date range
 * - Breakdown by qualifier
 * - Breakdown by location type
 */
export async function GET() {
  try {
    // Calculate date thresholds
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Run all queries in parallel for performance
    const [
      totalFacilities,
      totalLocations,
      totalSamples,
      totalParameters,
      totalRegions,
      samplesLast30Days,
      samplesLast7Days,
      dateRange,
      topParameters,
      byQualifier,
      byLocationType,
    ] = await Promise.all([
      // Total counts
      prisma.eSMRFacility.count(),
      prisma.eSMRLocation.count(),
      prisma.eSMRSample.count(),
      prisma.eSMRParameter.count(),
      prisma.eSMRRegion.count(),

      // Recent activity
      prisma.eSMRSample.count({
        where: {
          samplingDate: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      prisma.eSMRSample.count({
        where: {
          samplingDate: {
            gte: sevenDaysAgo,
          },
        },
      }),

      // Date range
      prisma.eSMRSample.aggregate({
        _min: {
          samplingDate: true,
        },
        _max: {
          samplingDate: true,
        },
      }),

      // Top parameters
      prisma.eSMRParameter.findMany({
        select: {
          parameterName: true,
          category: true,
          _count: {
            select: {
              samples: true,
            },
          },
        },
        orderBy: {
          samples: {
            _count: "desc",
          },
        },
        take: 20,
      }),

      // Breakdown by qualifier
      prisma.eSMRSample.groupBy({
        by: ["qualifier"],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
      }),

      // Breakdown by location type
      prisma.eSMRLocation.findMany({
        select: {
          locationType: true,
          _count: {
            select: {
              samples: true,
            },
          },
        },
      }),
    ])

    // Aggregate location type counts
    const locationTypeMap = new Map<string, number>()
    byLocationType.forEach((loc) => {
      const current = locationTypeMap.get(loc.locationType) || 0
      locationTypeMap.set(loc.locationType, current + loc._count.samples)
    })

    // Format response
    const response: StatsResponse = {
      totals: {
        facilities: totalFacilities,
        locations: totalLocations,
        samples: totalSamples,
        parameters: totalParameters,
        regions: totalRegions,
      },
      recentActivity: {
        samplesLast30Days,
        samplesLast7Days,
      },
      topParameters: topParameters.map((param) => ({
        parameterName: param.parameterName,
        category: param.category,
        sampleCount: param._count.samples,
      })),
      dateRange: {
        earliest: dateRange._min.samplingDate?.toISOString().split("T")[0] || null,
        latest: dateRange._max.samplingDate?.toISOString().split("T")[0] || null,
      },
      byQualifier: byQualifier.map((q) => ({
        qualifier: q.qualifier,
        count: q._count.id,
      })),
      byLocationType: Array.from(locationTypeMap.entries()).map(
        ([locationType, count]) => ({
          locationType: locationType as any,
          count,
        })
      ),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Stats API error:", error)

    return NextResponse.json(
      {
        error: "Failed to fetch statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
