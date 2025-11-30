import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import {
  FacilitiesQuerySchema,
  buildTextSearchFilter,
  buildPaginationResponse,
  type FacilityListResponse,
} from "@/lib/api/esmr"

/**
 * GET /api/esmr/facilities
 *
 * List facilities with pagination and filtering.
 *
 * Query params:
 * - limit: number (default: 50, max: 500)
 * - offset: number (default: 0)
 * - regionCode: string (filter by region)
 * - facilityName: string (search by name, case-insensitive)
 * - receivingWaterBody: string (search by receiving water body, case-insensitive)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse and validate query parameters
    const params = FacilitiesQuerySchema.parse({
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
      regionCode: searchParams.get("regionCode"),
      facilityName: searchParams.get("facilityName"),
      receivingWaterBody: searchParams.get("receivingWaterBody"),
    })

    // Build where clause
    const where: any = {}

    if (params.regionCode) {
      where.regionCode = params.regionCode
    }

    if (params.facilityName) {
      where.facilityName = buildTextSearchFilter("facilityName", params.facilityName)
    }

    if (params.receivingWaterBody) {
      where.receivingWaterBody = buildTextSearchFilter(
        "receivingWaterBody",
        params.receivingWaterBody
      )
    }

    // Get total count for pagination
    const total = await prisma.eSMRFacility.count({ where })

    // Query facilities with aggregations
    const facilities = await prisma.eSMRFacility.findMany({
      where,
      select: {
        facilityPlaceId: true,
        facilityName: true,
        regionCode: true,
        receivingWaterBody: true,
        region: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            locations: true,
          },
        },
      },
      orderBy: {
        facilityName: "asc",
      },
      take: params.limit,
      skip: params.offset,
    })

    // Get sample counts for each facility (batch query to avoid N+1)
    const facilityIds = facilities.map((f) => f.facilityPlaceId)

    const sampleCounts = await prisma.eSMRSample.groupBy({
      by: ["locationPlaceId"],
      where: {
        location: {
          facilityPlaceId: {
            in: facilityIds,
          },
        },
      },
      _count: {
        id: true,
      },
    })

    // Build a map of locationPlaceId -> sample count
    const sampleCountMap = new Map<number, number>()
    sampleCounts.forEach((sc) => {
      sampleCountMap.set(sc.locationPlaceId, sc._count.id)
    })

    // Get location to facility mapping
    const locations = await prisma.eSMRLocation.findMany({
      where: {
        facilityPlaceId: {
          in: facilityIds,
        },
      },
      select: {
        locationPlaceId: true,
        facilityPlaceId: true,
      },
    })

    // Build facility -> total sample count map
    const facilitySampleCounts = new Map<number, number>()
    locations.forEach((loc) => {
      const sampleCount = sampleCountMap.get(loc.locationPlaceId) || 0
      const currentTotal = facilitySampleCounts.get(loc.facilityPlaceId) || 0
      facilitySampleCounts.set(loc.facilityPlaceId, currentTotal + sampleCount)
    })

    // Format response
    const response: FacilityListResponse = {
      facilities: facilities.map((facility) => ({
        facilityPlaceId: facility.facilityPlaceId,
        facilityName: facility.facilityName,
        regionCode: facility.regionCode,
        regionName: facility.region.name,
        receivingWaterBody: facility.receivingWaterBody,
        locationCount: facility._count.locations,
        sampleCount: facilitySampleCounts.get(facility.facilityPlaceId) || 0,
      })),
      pagination: buildPaginationResponse(total, params.limit, params.offset),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Facilities API error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to fetch facilities",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
