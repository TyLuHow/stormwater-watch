import { NextRequest, NextResponse } from "next/server"
import { enrichFacilities } from "@/lib/enrichment/spatial"
import { z } from "zod"

const RequestSchema = z.object({
  mode: z.enum(["all", "unenriched", "specific"]).default("unenriched"),
  facilityIds: z.array(z.string()).optional(),
  forceUpdate: z.boolean().default(false),
  datasets: z.array(z.enum(["county", "huc12", "dac", "ms4"])).optional(),
})

/**
 * POST /api/enrichment/spatial
 * Runs spatial enrichment on facilities
 * 
 * Body:
 * {
 *   mode: "all" | "unenriched" | "specific",
 *   facilityIds?: string[],  // Required if mode is "specific"
 *   forceUpdate?: boolean,   // Re-enrich even if already enriched
 *   datasets?: ["county", "huc12", "dac", "ms4"]  // Which datasets to use
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = RequestSchema.parse(body)

    // Validate specific mode
    if (validated.mode === "specific" && (!validated.facilityIds || validated.facilityIds.length === 0)) {
      return NextResponse.json(
        { error: "facilityIds required when mode is 'specific'" },
        { status: 400 }
      )
    }

    const options = {
      facilityIds: validated.mode === "specific" ? validated.facilityIds : undefined,
      forceUpdate: validated.mode === "all" || validated.forceUpdate,
      datasets: validated.datasets,
    }

    const stats = await enrichFacilities(options)

    return NextResponse.json({
      success: stats.errors.length === 0,
      stats: {
        total: stats.total,
        enriched: stats.enriched,
        skipped: stats.skipped,
        errorCount: stats.errors.length,
      },
      errors: stats.errors.slice(0, 10), // Limit error messages in response
      message: stats.errors.length > 0
        ? `Enrichment completed with ${stats.errors.length} errors`
        : "Enrichment completed successfully",
    })
  } catch (error) {
    console.error("Enrichment API error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Enrichment failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/enrichment/spatial
 * Get enrichment status/stats
 */
export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma")
    
    const [total, enriched, unenriched] = await Promise.all([
      prisma.facility.count(),
      prisma.facility.count({ where: { enrichedAt: { not: null } } }),
      prisma.facility.count({ where: { enrichedAt: null } }),
    ])

    const [countiesEnriched, huc12Enriched, ms4Enriched, dacEnriched] = await Promise.all([
      prisma.facility.count({ where: { county: { not: null } } }),
      prisma.facility.count({ where: { watershedHuc12: { not: null } } }),
      prisma.facility.count({ where: { ms4: { not: null } } }),
      prisma.facility.count({ where: { isInDAC: true } }),
    ])

    return NextResponse.json({
      total,
      enriched,
      unenriched,
      percentEnriched: total > 0 ? Math.round((enriched / total) * 100) : 0,
      fields: {
        county: countiesEnriched,
        huc12: huc12Enriched,
        ms4: ms4Enriched,
        dac: dacEnriched,
      },
    })
  } catch (error) {
    console.error("Error getting enrichment status:", error)
    return NextResponse.json(
      { error: "Failed to get enrichment status" },
      { status: 500 }
    )
  }
}




