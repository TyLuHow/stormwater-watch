import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const DEV_MODE = process.env.DEV_MODE === "true" || !process.env.SUPABASE_URL

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!DEV_MODE) {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: params.id },
    })

    if (!subscription) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (!DEV_MODE) {
      const session = await auth()
      if (subscription.userId !== session?.user?.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }
    }

    await prisma.subscription.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete subscription error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!DEV_MODE) {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const body = await req.json()
    const subscription = await prisma.subscription.findUnique({
      where: { id: params.id },
    })

    if (!subscription) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (!DEV_MODE) {
      const session = await auth()
      if (subscription.userId !== session?.user?.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }
    }

    const updated = await prisma.subscription.update({
      where: { id: params.id },
      data: {
        ...(body.active !== undefined && { active: body.active }),
        ...(body.name && { name: body.name }),
        ...(body.schedule && { schedule: body.schedule }),
        ...(body.delivery && { delivery: body.delivery }),
        ...(body.minRatio !== undefined && { minRatio: body.minRatio }),
        ...(body.repeatOffenderThreshold !== undefined && { repeatOffenderThreshold: body.repeatOffenderThreshold }),
        ...(body.impairedOnly !== undefined && { impairedOnly: body.impairedOnly }),
      },
    })

    return NextResponse.json({ success: true, subscription: updated })
  } catch (error) {
    console.error("Update subscription error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 })
  }
}
