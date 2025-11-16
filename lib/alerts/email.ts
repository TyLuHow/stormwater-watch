/**
 * Email alert templates using Resend
 */

import { Resend } from "resend"
import type { Subscription, Facility, ViolationEvent } from "@prisma/client"

const resend = new Resend(process.env.RESEND_API_KEY)

export interface AlertData {
  subscription: Subscription & { user: { email: string; name: string | null } }
  violations: Array<ViolationEvent & { facility: Facility }>
  lastRunAt: Date | null
}

/**
 * Send email alert for new violations
 */
export async function sendEmailAlert(data: AlertData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { subscription, violations, lastRunAt } = data
    const user = subscription.user

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured, skipping email")
      return { success: false, error: "RESEND_API_KEY not configured" }
    }

    const subject = `[Stormwater Watch] ${violations.length} New Violation${violations.length > 1 ? "s" : ""} in ${subscription.name}`
    const html = generateEmailHTML(subscription, violations, lastRunAt)
    const text = generateEmailText(subscription, violations, lastRunAt)

    const result = await resend.emails.send({
      from: process.env.NEXTAUTH_FROM_EMAIL || "alerts@stormwaterwatch.org",
      to: user.email,
      subject,
      html,
      text,
    })

    if (result.error) {
      console.error("Resend error:", result.error)
      return { success: false, error: result.error.message }
    }

    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error("Email send error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Generate HTML email content
 */
function generateEmailHTML(
  subscription: Subscription,
  violations: Array<ViolationEvent & { facility: Facility }>,
  lastRunAt: Date | null
): string {
  const dateRange = lastRunAt
    ? `since ${lastRunAt.toLocaleDateString()}`
    : "in your monitoring area"

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0d7377; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge-high { background: #fee2e2; color: #991b1b; }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .button { display: inline-block; padding: 12px 24px; background: #0d7377; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .provenance { margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 6px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Stormwater Watch Alert</h1>
      <p>${violations.length} new violation${violations.length > 1 ? "s" : ""} detected ${dateRange}</p>
    </div>
    
    <div class="content">
      <h2>Subscription: ${subscription.name}</h2>
      <p>Violations detected matching your criteria:</p>
      
      <table>
        <thead>
          <tr>
            <th>Facility</th>
            <th>Pollutant</th>
            <th>Max Ratio</th>
            <th>Count</th>
            <th>County</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${violations.map((v) => `
            <tr>
              <td><strong>${v.facility.name}</strong><br><small>${v.facility.permitId}</small></td>
              <td>${v.pollutant}</td>
              <td>${Number(v.maxRatio).toFixed(2)}×</td>
              <td>${v.count}</td>
              <td>${v.facility.county || "N/A"}</td>
              <td>
                ${v.impairedWater ? '<span class="badge badge-high">Impaired Water</span>' : ""}
                ${v.count >= 3 ? '<span class="badge badge-medium">Repeat Offender</span>' : ""}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      
      <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard" class="button">Review Dashboard</a>
      
      <div class="provenance">
        <strong>Data Source:</strong> CIWQS Interactive Violation Report<br>
        <strong>Last Updated:</strong> ${new Date().toLocaleString()}<br>
        <small>This is an automated alert from Stormwater Watch. Data is refreshed nightly from public regulatory sources.</small>
      </div>
    </div>
    
    <div class="footer">
      <p>Stormwater Watch • Monitoring California Stormwater Violations</p>
      <p><a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/settings">Manage Subscriptions</a></p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate plain text email content
 */
function generateEmailText(
  subscription: Subscription,
  violations: Array<ViolationEvent & { facility: Facility }>,
  lastRunAt: Date | null
): string {
  const dateRange = lastRunAt
    ? `since ${lastRunAt.toLocaleDateString()}`
    : "in your monitoring area"

  return `
Stormwater Watch Alert
======================

${violations.length} new violation${violations.length > 1 ? "s" : ""} detected ${dateRange}

Subscription: ${subscription.name}

Violations:
${violations
  .map(
    (v) => `
- ${v.facility.name} (${v.facility.permitId})
  Pollutant: ${v.pollutant}
  Max Ratio: ${Number(v.maxRatio).toFixed(2)}×
  Count: ${v.count}
  County: ${v.facility.county || "N/A"}
  ${v.impairedWater ? "⚠️ Impaired Water" : ""}
  ${v.count >= 3 ? "⚠️ Repeat Offender" : ""}
`
  )
  .join("")}

View Dashboard: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard

Data Source: CIWQS Interactive Violation Report
Last Updated: ${new Date().toLocaleString()}

---
Stormwater Watch • Monitoring California Stormwater Violations
Manage Subscriptions: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/settings
  `.trim()
}




