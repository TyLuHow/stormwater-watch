import { NextRequest, NextResponse } from "next/server"
import { getPrecipitationForDate } from "@/lib/providers/precipitation"
import { z } from "zod"

const RequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
})

/**
 * GET /api/precipitation?lat=X&lon=Y&date=YYYY-MM-DD
 * Get precipitation data for a specific location and date
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lat = parseFloat(searchParams.get("lat") || "")
    const lon = parseFloat(searchParams.get("lon") || "")
    const dateStr = searchParams.get("date")

    if (isNaN(lat) || isNaN(lon) || !dateStr) {
      return NextResponse.json(
        { error: "Missing or invalid parameters. Required: lat, lon, date (YYYY-MM-DD)" },
        { status: 400 }
      )
    }

    const validated = RequestSchema.parse({ lat, lon, date: dateStr })
    const date = new Date(validated.date)

    const result = await getPrecipitationForDate(validated.lat, validated.lon, date)

    return NextResponse.json({
      date: result.date,
      precipitationMM: result.precipitationMM,
      precipitationInches: result.precipitationInches,
      source: result.source,
      cached: result.cached,
      lastUpdate: result.lastUpdate,
    })
  } catch (error) {
    console.error("Precipitation API error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to fetch precipitation data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/precipitation
 * Get precipitation data for multiple dates/locations
 * 
 * Body:
 * {
 *   requests: Array<{ lat: number, lon: number, date: string }>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!Array.isArray(body.requests)) {
      return NextResponse.json(
        { error: "Body must contain 'requests' array" },
        { status: 400 }
      )
    }

    if (body.requests.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 requests per batch" },
        { status: 400 }
      )
    }

    const results = await Promise.all(
      body.requests.map(async (req: any) => {
        try {
          const validated = RequestSchema.parse(req)
          const date = new Date(validated.date)
          const result = await getPrecipitationForDate(validated.lat, validated.lon, date)
          
          return {
            request: req,
            success: true,
            data: {
              date: result.date,
              precipitationMM: result.precipitationMM,
              precipitationInches: result.precipitationInches,
              source: result.source,
              cached: result.cached,
            },
          }
        } catch (error) {
          return {
            request: req,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          }
        }
      })
    )

    return NextResponse.json({
      total: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    })
  } catch (error) {
    console.error("Batch precipitation API error:", error)
    return NextResponse.json(
      {
        error: "Failed to process batch request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}




