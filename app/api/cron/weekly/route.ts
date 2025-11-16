import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { matchesSubscription } from "@/lib/subscriptions/matcher"
import { sendEmailAlert } from "@/lib/alerts/email"
import { sendSlackAlert } from "@/lib/alerts/slack"
import { Decimal } from "@prisma/client/runtime/library"

/**
 * GET /api/cron/weekly
 * Weekly cron job to process WEEKLY subscriptions and send alerts
 * Protected with CRON_SECRET
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("Authorization")
  const expectedSecret = `Bearer ${process.env.CRON_SECRET || "dev-secret"}`
  
  if (authHeader !== expectedSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()
  console.log("🔄 Starting weekly cron job...")

  try {
    // Get all active WEEKLY subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: {
        active: true,
        schedule: "WEEKLY",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    console.log(`📋 Found ${subscriptions.length} active weekly subscriptions`)

    const results = {
      subscriptionsProcessed: 0,
      alertsSent: 0,
      errors: [] as string[],
    }

    // Process each subscription (same logic as daily)
    for (const subscription of subscriptions) {
      try {
        console.log(`Processing subscription: ${subscription.name} (${subscription.id})`)

        const lastRunDate = subscription.lastRunAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default to 30 days ago

        const allViolations = await prisma.violationEvent.findMany({
          where: {
            dismissed: false,
            createdAt: {
              gte: lastRunDate,
            },
            maxRatio: {
              gte: subscription.minRatio as Decimal,
            },
            count: {
              gte: subscription.repeatOffenderThreshold,
            },
            ...(subscription.impairedOnly && { impairedWater: true }),
          },
          include: {
            facility: true,
          },
        })

        // Filter by spatial criteria
        const matchingViolations = []
        for (const violation of allViolations) {
          const matchResult = matchesSubscription(subscription, violation)
          if (matchResult.matched) {
            matchingViolations.push(violation)
          }
        }

        if (matchingViolations.length === 0) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { lastRunAt: new Date() },
          })
          continue
        }

        // Send alerts
        if (subscription.delivery === "EMAIL" || subscription.delivery === "BOTH") {
          const emailResult = await sendEmailAlert({
            subscription: subscription as any,
            violations: matchingViolations,
            lastRunAt: subscription.lastRunAt,
          })

          if (emailResult.success) {
            results.alertsSent++
          } else {
            results.errors.push(`Email alert failed for ${subscription.name}: ${emailResult.error}`)
          }
        }

        if (subscription.delivery === "SLACK" || subscription.delivery === "BOTH") {
          const slackResult = await sendSlackAlert({
            subscription,
            violations: matchingViolations,
            lastRunAt: subscription.lastRunAt,
          })

          if (slackResult.success && subscription.delivery !== "BOTH") {
            results.alertsSent++
          } else if (!slackResult.success) {
            results.errors.push(`Slack alert failed for ${subscription.name}: ${slackResult.error}`)
          }
        }

        // Create alert records
        for (const violation of matchingViolations) {
          await prisma.alert.create({
            data: {
              subscriptionId: subscription.id,
              facilityId: violation.facilityId,
              violationEventId: violation.id,
              payload: {
                subscriptionName: subscription.name,
                violationCount: matchingViolations.length,
                sentAt: new Date().toISOString(),
              },
            },
          })
        }

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { lastRunAt: new Date() },
        })

        results.subscriptionsProcessed++
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        results.errors.push(`Subscription ${subscription.name}: ${errorMsg}`)
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`✅ Weekly cron completed in ${duration}s`)

    return NextResponse.json({
      success: true,
      duration: `${duration}s`,
      ...results,
    })
  } catch (error) {
    console.error("❌ Weekly cron failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

