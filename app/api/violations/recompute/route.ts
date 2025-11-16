import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { recomputeViolations } from "@/lib/violations/detector"

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { reportingYear, facilityId, minRatio, repeatOffenderThreshold } = body

    const result = await recomputeViolations(reportingYear, facilityId, {
      minRatio: minRatio || 1.0,
      repeatOffenderThreshold: repeatOffenderThreshold || 2,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Recompute violations error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Recompute failed" }, { status: 500 })
  }
}
