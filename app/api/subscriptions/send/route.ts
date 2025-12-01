import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { resendClient } from "@/lib/providers"
import { matchSubscription } from "@/lib/spatial"
import axios from "axios"

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { subscriptionId } = body

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true },
    })

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    // Query new violations since last run
    const newEvents = await prisma.violationEvent.findMany({
      where: {
        createdAt: {
          gt: subscription.lastRunAt || new Date(0),
        },
        dismissed: false,
        maxRatio: { gte: subscription.minRatio },
        count: { gte: subscription.repeatOffenderThreshold },
        ...(subscription.impairedOnly && { impairedWater: true }),
      },
      include: { facility: true },
    })

    // Filter by spatial subscription
    const matched = []
    for (const event of newEvents) {
      if (await matchSubscription(subscription, event.facility)) {
        matched.push(event)
      }
    }

    if (matched.length === 0) {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { lastRunAt: new Date() },
      })
      return NextResponse.json({ sent: 0 })
    }

    // Send email
    if ((subscription.delivery === "EMAIL" || subscription.delivery === "BOTH") && resendClient) {
      const html = `
        <h2>${matched.length} new stormwater exceedances</h2>
        <table border="1" cellpadding="10">
          <tr><th>Facility</th><th>Pollutant</th><th>Max Ratio</th></tr>
          ${matched.map((e) => `<tr><td>${e.facility.name}</td><td>${e.pollutantKey}</td><td>${Number(e.maxRatio).toFixed(2)}x</td></tr>`).join("")}
        </table>
      `

      await resendClient.emails.send({
        from: "alerts@stormwaterwatch.org",
        to: subscription.user.email,
        subject: `${matched.length} new stormwater exceedances`,
        html,
      })
    }

    // Send Slack
    if ((subscription.delivery === "SLACK" || subscription.delivery === "BOTH") && process.env.SLACK_WEBHOOK_URL) {
      const blocks = matched.map((e) => ({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${e.facility.name}*\n${e.pollutantKey}: ${Number(e.maxRatio).toFixed(2)}x (${e.count} exceedances)`,
        },
      }))

      await axios.post(process.env.SLACK_WEBHOOK_URL, { blocks })
    }

    // Record alerts
    await prisma.alert.createMany({
      data: matched.map((e) => ({
        subscriptionId: subscription.id,
        facilityId: e.facilityId,
        violationEventId: e.id,
        sentAt: new Date(),
        payload: {},
      })),
    })

    // Update lastRunAt
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { lastRunAt: new Date() },
    })

    return NextResponse.json({ sent: matched.length })
  } catch (error) {
    console.error("Send alert error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 })
  }
}
