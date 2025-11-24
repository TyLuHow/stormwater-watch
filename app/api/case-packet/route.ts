import { NextRequest, NextResponse } from "next/server"
import { generateCasePacket, getCasePacketFilename } from "@/lib/case-packet/generator"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { withRateLimit } from "@/lib/middleware/rate-limit"

const RequestSchema = z.object({
  violationEventId: z.string(),
  includePrecipitation: z.boolean().default(false),
  includeMap: z.boolean().default(false),
  includeChart: z.boolean().default(false),
})

/**
 * POST /api/case-packet
 * Generate a case packet PDF for a violation event
 * 
 * Body:
 * {
 *   violationEventId: string,
 *   includePrecipitation?: boolean,
 *   includeMap?: boolean,
 *   includeChart?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  return withRateLimit(request, async () => {
  try {
    const body = await request.json()
    const validated = RequestSchema.parse(body)

    // Generate the PDF
    const pdfBuffer = await generateCasePacket(validated.violationEventId, {
      includePrecipitation: validated.includePrecipitation,
      includeMap: validated.includeMap,
      includeChart: validated.includeChart,
    })

    // Get violation details for filename
    const violation = await prisma.violationEvent.findUnique({
      where: { id: validated.violationEventId },
      include: { facility: true },
    })

    if (!violation) {
      return NextResponse.json(
        { error: "Violation not found" },
        { status: 404 }
      )
    }

    const filename = getCasePacketFilename(violation.facility, violation)

    // Return PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Case packet API error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to generate case packet",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
  });
}

/**
 * GET /api/case-packet?violationEventId=xxx
 * Same as POST but via GET for simple link-based downloads
 */
export async function GET(request: NextRequest) {
  return withRateLimit(request, async () => {
  const searchParams = request.nextUrl.searchParams
  const violationEventId = searchParams.get("violationEventId")

  if (!violationEventId) {
    return NextResponse.json(
      { error: "violationEventId required" },
      { status: 400 }
    )
  }

  try {
    const pdfBuffer = await generateCasePacket(violationEventId)

    const violation = await prisma.violationEvent.findUnique({
      where: { id: violationEventId },
      include: { facility: true },
    })

    if (!violation) {
      return NextResponse.json(
        { error: "Violation not found" },
        { status: 404 }
      )
    }

    const filename = getCasePacketFilename(violation.facility, violation)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Case packet GET error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate case packet",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
  });
}




