import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { matchesSubscription } from "@/lib/subscriptions/matcher"
import { sendEmailAlert } from "@/lib/alerts/email"
import { sendSlackAlert } from "@/lib/alerts/slack"
import { Decimal } from "@prisma/client/runtime/library"

/**
 * GET /api/cron/daily
 * Daily cron job to process subscriptions and send alerts
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
  console.log("🔄 Starting daily cron job...")

  try {
    // Get all active subscriptions with their schedule
    const subscriptions = await prisma.subscription.findMany({
      where: {
        active: true,
        schedule: "DAILY",
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

    console.log(`📋 Found ${subscriptions.length} active daily subscriptions`)

    const results = {
      subscriptionsProcessed: 0,
      alertsSent: 0,
      errors: [] as string[],
    }

    // Process each subscription
    for (const subscription of subscriptions) {
      try {
        console.log(`Processing subscription: ${subscription.name} (${subscription.id})`)

        // Find violations that match this subscription's criteria
        // Get violations since last run (or all if never run)
        const lastRunDate = subscription.lastRunAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Default to 7 days ago

        // Get all violations (we'll filter by spatial criteria in matcher)
        const allViolations = await prisma.violationEvent.findMany({
          where: {
            dismissed: false,
            createdAt: {
              gte: lastRunDate,
            },
            // Apply basic filters
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

        console.log(`  Found ${allViolations.length} candidate violations`)

        // Filter by spatial criteria using matcher
        const matchingViolations = []
        for (const violation of allViolations) {
          const matchResult = matchesSubscription(subscription, violation)
          if (matchResult.matched) {
            matchingViolations.push(violation)
          }
        }

        console.log(`  ${matchingViolations.length} violations match spatial criteria`)

        if (matchingViolations.length === 0) {
          // Update lastRunAt even if no violations
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { lastRunAt: new Date() },
          })
          continue
        }

        // Send alerts based on delivery method
        if (subscription.delivery === "EMAIL" || subscription.delivery === "BOTH") {
          const emailResult = await sendEmailAlert({
            subscription: subscription as any,
            violations: matchingViolations,
            lastRunAt: subscription.lastRunAt,
          })

          if (emailResult.success) {
            console.log(`  ✅ Email alert sent (${matchingViolations.length} violations)`)
            results.alertsSent++
          } else {
            console.error(`  ❌ Email alert failed: ${emailResult.error}`)
            results.errors.push(`Email alert failed for ${subscription.name}: ${emailResult.error}`)
          }
        }

        if (subscription.delivery === "SLACK" || subscription.delivery === "BOTH") {
          const slackResult = await sendSlackAlert({
            subscription,
            violations: matchingViolations,
            lastRunAt: subscription.lastRunAt,
          })

          if (slackResult.success) {
            console.log(`  ✅ Slack alert sent (${matchingViolations.length} violations)`)
            if (subscription.delivery !== "BOTH") {
              results.alertsSent++
            }
          } else {
            console.error(`  ❌ Slack alert failed: ${slackResult.error}`)
            results.errors.push(`Slack alert failed for ${subscription.name}: ${slackResult.error}`)
          }
        }

        // Create alert records in database
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

        // Update subscription lastRunAt
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { lastRunAt: new Date() },
        })

        results.subscriptionsProcessed++
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        console.error(`Error processing subscription ${subscription.name}:`, error)
        results.errors.push(`Subscription ${subscription.name}: ${errorMsg}`)
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`✅ Daily cron completed in ${duration}s`)
    console.log(`   Processed: ${results.subscriptionsProcessed} subscriptions`)
    console.log(`   Alerts sent: ${results.alertsSent}`)
    console.log(`   Errors: ${results.errors.length}`)

    return NextResponse.json({
      success: true,
      duration: `${duration}s`,
      ...results,
    })
  } catch (error) {
    console.error("❌ Daily cron failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
