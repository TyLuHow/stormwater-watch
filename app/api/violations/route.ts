import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"
import { z } from "zod"

const QuerySchema = z.object({
  pollutants: z.string().optional(),
  counties: z.string().optional(),
  huc12s: z.string().optional(),
  ms4s: z.string().optional(),
  years: z.string().optional(),
  minRatio: z.string().optional(),
  impairedOnly: z.string().optional(),
  hideDismissed: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
})

/**
 * GET /api/violations
 * Get violations with filtering support
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const params = QuerySchema.parse(Object.fromEntries(searchParams.entries()))

    // Build where clause
    const where: any = {}

    // Dismissed filter
    if (params.hideDismissed !== "false") {
      where.dismissed = false
    }

    // Pollutants filter
    if (params.pollutants) {
      const pollutants = params.pollutants.split(",").filter(Boolean)
      where.pollutant = { in: pollutants }
    }

    // Reporting year filter
    if (params.years) {
      const years = params.years.split(",").filter(Boolean)
      where.reportingYear = { in: years }
    }

    // Min ratio filter
    if (params.minRatio) {
      where.maxRatio = {
        gte: new Decimal(params.minRatio),
      }
    }

    // Impaired only filter
    if (params.impairedOnly === "true") {
      where.impairedWater = true
    }

    // Date range filter (on violation creation date)
    if (params.dateFrom || params.dateTo) {
      where.createdAt = {}
      if (params.dateFrom) {
        where.createdAt.gte = new Date(params.dateFrom)
      }
      if (params.dateTo) {
        const dateTo = new Date(params.dateTo)
        dateTo.setHours(23, 59, 59, 999) // End of day
        where.createdAt.lte = dateTo
      }
    }

    // Geographic filters
    if (params.counties || params.huc12s || params.ms4s) {
      where.facility = {}
      if (params.counties) {
        const counties = params.counties.split(",").filter(Boolean)
        where.facility.county = { in: counties }
      }
      if (params.huc12s) {
        const huc12s = params.huc12s.split(",").filter(Boolean)
        where.facility.watershedHuc12 = { in: huc12s }
      }
      if (params.ms4s) {
        const ms4s = params.ms4s.split(",").filter(Boolean)
        where.facility.ms4 = { in: ms4s }
      }
    }

    // Pagination
    const limit = params.limit ? parseInt(params.limit) : 100
    const offset = params.offset ? parseInt(params.offset) : 0

    // Fetch violations
    const [violations, total] = await Promise.all([
      prisma.violationEvent.findMany({
        where,
        include: {
          facility: {
            select: {
              id: true,
              name: true,
              permitId: true,
              county: true,
              watershedHuc12: true,
              ms4: true,
              lat: true,
              lon: true,
              isInDAC: true,
              receivingWater: true,
            },
          },
        },
        orderBy: { maxRatio: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.violationEvent.count({ where }),
    ])

    // Get unique values for filter options
    const [uniquePollutants, uniqueCounties, uniqueHuc12s, uniqueMs4s, uniqueYears] = await Promise.all([
      prisma.violationEvent.findMany({
        select: { pollutant: true },
        distinct: ["pollutant"],
        orderBy: { pollutant: "asc" },
      }),
      prisma.facility.findMany({
        where: { county: { not: null } },
        select: { county: true },
        distinct: ["county"],
        orderBy: { county: "asc" },
      }),
      prisma.facility.findMany({
        where: { watershedHuc12: { not: null } },
        select: { watershedHuc12: true },
        distinct: ["watershedHuc12"],
        orderBy: { watershedHuc12: "asc" },
      }),
      prisma.facility.findMany({
        where: { ms4: { not: null } },
        select: { ms4: true },
        distinct: ["ms4"],
        orderBy: { ms4: "asc" },
      }),
      prisma.violationEvent.findMany({
        select: { reportingYear: true },
        distinct: ["reportingYear"],
        orderBy: { reportingYear: "desc" },
      }),
    ])

    return NextResponse.json({
      violations,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      filters: {
        pollutants: uniquePollutants.map((v) => v.pollutant),
        counties: uniqueCounties.map((f) => f.county).filter(Boolean),
        huc12s: uniqueHuc12s.map((f) => f.watershedHuc12).filter(Boolean),
        ms4s: uniqueMs4s.map((f) => f.ms4).filter(Boolean),
        years: uniqueYears.map((v) => v.reportingYear),
      },
    })
  } catch (error) {
    console.error("Violations API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch violations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}




