import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import {
  ParametersQuerySchema,
  buildPaginationResponse,
  type ParameterListResponse,
  type ParametersByCategory,
} from "@/lib/api/esmr"

/**
 * GET /api/esmr/parameters
 *
 * List all unique parameters with sample counts.
 *
 * Query params:
 * - limit: number (default: 100, max: 500)
 * - offset: number (default: 0)
 * - category: string (filter by category)
 * - groupByCategory: boolean (return grouped by category instead of flat list)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse and validate query parameters
    const params = ParametersQuerySchema.parse({
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
      category: searchParams.get("category"),
    })

    const groupByCategory = searchParams.get("groupByCategory") === "true"

    // Build where clause
    const where: any = {}

    if (params.category) {
      where.category = params.category
    }

    if (groupByCategory) {
      // Return parameters grouped by category
      const parameters = await prisma.eSMRParameter.findMany({
        where,
        select: {
          id: true,
          parameterName: true,
          category: true,
          canonicalKey: true,
          _count: {
            select: {
              samples: true,
            },
          },
        },
        orderBy: [{ category: "asc" }, { parameterName: "asc" }],
      })

      // Group by category
      const grouped: ParametersByCategory = {}

      parameters.forEach((param) => {
        const category = param.category || "Uncategorized"

        if (!grouped[category]) {
          grouped[category] = []
        }

        grouped[category].push({
          id: param.id,
          parameterName: param.parameterName,
          canonicalKey: param.canonicalKey,
          sampleCount: param._count.samples,
        })
      })

      return NextResponse.json(grouped)
    } else {
      // Return flat list with pagination
      const total = await prisma.eSMRParameter.count({ where })

      const parameters = await prisma.eSMRParameter.findMany({
        where,
        select: {
          id: true,
          parameterName: true,
          category: true,
          canonicalKey: true,
          _count: {
            select: {
              samples: true,
            },
          },
        },
        orderBy: [
          { category: "asc" },
          {
            samples: {
              _count: "desc",
            },
          },
        ],
        take: params.limit,
        skip: params.offset,
      })

      const response: ParameterListResponse = {
        parameters: parameters.map((param) => ({
          id: param.id,
          parameterName: param.parameterName,
          category: param.category,
          canonicalKey: param.canonicalKey,
          sampleCount: param._count.samples,
        })),
        pagination: buildPaginationResponse(total, params.limit, params.offset),
      }

      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Parameters API error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to fetch parameters",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
