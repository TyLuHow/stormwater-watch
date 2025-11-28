import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"
import { DEV_MODE } from "@/lib/dev-mode"

export async function POST(req: NextRequest) {
  // Auth is disabled - app is currently public
  // In production, you would uncomment the auth check below:
  // const session = await auth()
  // if (!session?.user) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // }

  if (DEV_MODE) {
    // In dev mode, return mock success
    return NextResponse.json({
      success: true,
      subscription: {
        id: "sub-demo-" + Date.now(),
        name: "Demo Subscription",
        message: "Subscriptions are disabled in demo mode",
      },
    })
  }

  try {
    const body = await req.json()

    const subscription = await prisma.subscription.create({
      data: {
        userId: body.userId || "anonymous",
        name: body.name,
        mode: body.mode,
        params: body.params,
        minRatio: new Decimal(body.minRatio || 1.0),
        repeatOffenderThreshold: body.repeatOffenderThreshold || 2,
        impairedOnly: body.impairedOnly || false,
        schedule: body.schedule,
        delivery: body.delivery,
      },
    })

    return NextResponse.json({ success: true, subscription })
  } catch (error) {
    console.error("Create subscription error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 })
  }
}
