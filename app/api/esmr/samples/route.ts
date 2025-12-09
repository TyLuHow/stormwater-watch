import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import {
  SamplesQuerySchema,
  buildDateRangeFilter,
  buildPaginationResponse,
  formatDecimal,
  type SampleListResponse,
} from "@/lib/api/esmr"

/**
 * GET /api/esmr/samples
 *
 * List samples with pagination, filtering, and sorting.
 *
 * Query params:
 * - limit: number (default: 50, max: 500)
 * - offset: number (default: 0)
 * - facilityPlaceId: number (filter by facility)
 * - locationPlaceId: number (filter by location)
 * - parameterId: string (filter by parameter)
 * - startDate: YYYY-MM-DD (filter samples on or after this date)
 * - endDate: YYYY-MM-DD (filter samples on or before this date)
 * - qualifier: ESMRQualifier enum (filter by qualifier)
 * - sortBy: "samplingDate" | "result" (default: "samplingDate")
 * - sortOrder: "asc" | "desc" (default: "desc")
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse and validate query parameters
    const params = SamplesQuerySchema.parse({
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
      facilityPlaceId: searchParams.get("facilityPlaceId"),
      locationPlaceId: searchParams.get("locationPlaceId"),
      parameterId: searchParams.get("parameterId"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      qualifier: searchParams.get("qualifier"),
      locationType: searchParams.get("locationType"),
      sortBy: searchParams.get("sortBy"),
      sortOrder: searchParams.get("sortOrder"),
    })

    // Build where clause
    const where: any = {}

    if (params.locationPlaceId) {
      where.locationPlaceId = params.locationPlaceId
    } else if (params.facilityPlaceId) {
      // If filtering by facility but not location, get all locations for that facility
      where.location = {
        facilityPlaceId: params.facilityPlaceId,
      }
    }

    if (params.parameterId) {
      where.parameterId = params.parameterId
    }

    if (params.qualifier) {
      where.qualifier = params.qualifier
    }

    // Add location type filter
    if (params.locationType) {
      where.location = {
        ...where.location,
        locationType: params.locationType,
      }
    }

    // Add date range filter
    const dateFilter = buildDateRangeFilter(params.startDate, params.endDate)
    if (dateFilter) {
      where.samplingDate = dateFilter
    }

    // Build orderBy clause
    const orderBy: any = {}
    if (params.sortBy === "result") {
      orderBy.result = params.sortOrder
    } else {
      orderBy.samplingDate = params.sortOrder
    }

    // Get total count for pagination
    const total = await prisma.eSMRSample.count({ where })

    // Query samples with related data
    const samples = await prisma.eSMRSample.findMany({
      where,
      select: {
        id: true,
        locationPlaceId: true,
        samplingDate: true,
        samplingTime: true,
        qualifier: true,
        result: true,
        units: true,
        mdl: true,
        ml: true,
        rl: true,
        reviewPriorityIndicator: true,
        location: {
          select: {
            locationCode: true,
            locationType: true,
            locationDesc: true,
            facilityPlaceId: true,
            facility: {
              select: {
                facilityName: true,
              },
            },
          },
        },
        parameter: {
          select: {
            parameterName: true,
            category: true,
          },
        },
        analyticalMethod: {
          select: {
            methodName: true,
          },
        },
      },
      orderBy,
      take: params.limit,
      skip: params.offset,
    })

    // Format response
    const response: SampleListResponse = {
      samples: samples.map((sample) => ({
        id: sample.id,
        locationPlaceId: sample.locationPlaceId,
        locationCode: sample.location.locationCode,
        locationType: sample.location.locationType,
        locationDesc: sample.location.locationDesc,
        facilityPlaceId: sample.location.facilityPlaceId,
        facilityName: sample.location.facility.facilityName,
        parameterName: sample.parameter.parameterName,
        parameterCategory: sample.parameter.category,
        samplingDate: sample.samplingDate.toISOString().split("T")[0],
        samplingTime: sample.samplingTime.toISOString().split("T")[1].substring(0, 8),
        qualifier: sample.qualifier,
        result: formatDecimal(sample.result),
        units: sample.units,
        mdl: formatDecimal(sample.mdl),
        ml: formatDecimal(sample.ml),
        rl: formatDecimal(sample.rl),
        analyticalMethod: sample.analyticalMethod?.methodName || null,
        reviewPriorityIndicator: sample.reviewPriorityIndicator,
      })),
      pagination: buildPaginationResponse(total, params.limit, params.offset),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Samples API error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to fetch samples",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
