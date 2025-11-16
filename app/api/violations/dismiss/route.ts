import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { dismissViolation, undismissViolation } from "@/lib/violations/detector"

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { violationEventId, notes, action } = body

    if (action === "dismiss") {
      await dismissViolation(violationEventId, notes)
      return NextResponse.json({ success: true })
    } else if (action === "undismiss") {
      await undismissViolation(violationEventId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Dismiss violation error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 })
  }
}
