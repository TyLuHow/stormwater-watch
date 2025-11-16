import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()

    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id!,
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
