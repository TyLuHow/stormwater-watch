/**
 * Slack alert webhook blocks
 */

import type { Subscription, Facility, ViolationEvent } from "@prisma/client"

export interface SlackAlertData {
  subscription: Subscription
  violations: Array<ViolationEvent & { facility: Facility }>
  lastRunAt: Date | null
}

/**
 * Send Slack alert via webhook
 */
export async function sendSlackAlert(data: SlackAlertData): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.SLACK_WEBHOOK_URL) {
      console.warn("SLACK_WEBHOOK_URL not configured, skipping Slack alert")
      return { success: false, error: "SLACK_WEBHOOK_URL not configured" }
    }

    const blocks = generateSlackBlocks(data)

    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `Stormwater Watch: ${data.violations.length} new violation${data.violations.length > 1 ? "s" : ""} in ${data.subscription.name}`,
        blocks,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Slack webhook error:", errorText)
      return { success: false, error: `Slack API error: ${response.status}` }
    }

    return { success: true }
  } catch (error) {
    console.error("Slack send error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Generate Slack block kit blocks
 */
function generateSlackBlocks(data: SlackAlertData): any[] {
  const { subscription, violations, lastRunAt } = data
  const dateRange = lastRunAt
    ? `since ${lastRunAt.toLocaleDateString()}`
    : "in your monitoring area"

  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🌊 ${violations.length} New Violation${violations.length > 1 ? "s" : ""} Detected`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Subscription:* ${subscription.name}\n*Detected:* ${dateRange}`,
      },
    },
    {
      type: "divider",
    },
  ]

  // Add one block per facility violation
  for (const violation of violations) {
    const facility = violation.facility
    const badges: string[] = []
    if (violation.impairedWater) badges.push("⚠️ Impaired Water")
    if (violation.count >= 3) badges.push("🔄 Repeat Offender")
    if (facility.isInDAC) badges.push("🌍 DAC")

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${facility.name}* (${facility.permitId})\n*Pollutant:* ${violation.pollutantKey}\n*Max Ratio:* ${Number(violation.maxRatio).toFixed(2)}× NAL\n*Count:* ${violation.count} exceedance${violation.count > 1 ? "s" : ""}\n*County:* ${facility.county || "N/A"}\n${badges.length > 0 ? badges.join(" • ") : ""}`,
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "View Details",
          emoji: true,
        },
        url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/facilities/${facility.id}`,
        action_id: "view_facility",
      },
    })

    // Add divider between violations (except last)
    if (violation !== violations[violations.length - 1]) {
      blocks.push({
        type: "divider",
      })
    }
  }

  // Add footer with actions
  blocks.push(
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `_Data from CIWQS • Last updated: ${new Date().toLocaleString()}_`,
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "View Dashboard",
        },
        url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard`,
        action_id: "view_dashboard",
      },
    }
  )

  return blocks
}

/**
 * Send critical error to Slack (for operational alerts)
 */
export async function sendSlackError(error: Error, context?: string): Promise<void> {
  if (!process.env.SLACK_WEBHOOK_URL) {
    console.error("Slack webhook not configured, cannot send error alert")
    return
  }

  try {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `🚨 Stormwater Watch Error${context ? `: ${context}` : ""}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Error:* ${error.name}\n*Message:* ${error.message}\n${context ? `*Context:* ${context}\n` : ""}\n\`\`\`${error.stack}\`\`\``,
            },
          },
        ],
      }),
    })
  } catch (err) {
    console.error("Failed to send error to Slack:", err)
  }
}




