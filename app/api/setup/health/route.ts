import { NextResponse } from "next/server"
import { checkProviders } from "@/lib/providers"

export async function GET() {
  const status = await checkProviders()

  const providers = [
    {
      name: "Resend",
      status: !!process.env.RESEND_API_KEY ? "success" : "error",
      message: process.env.RESEND_API_KEY ? "API key configured" : "Missing RESEND_API_KEY",
      dashboardUrl: "https://resend.com/api-keys",
    },
    {
      name: "Supabase",
      status: status.supabase ? "success" : "error",
      message: status.supabase ? "Connected" : "Check SUPABASE_* env vars",
      dashboardUrl: "https://app.supabase.com",
    },
    {
      name: "Slack",
      status: !!process.env.SLACK_WEBHOOK_URL ? "success" : "unknown",
      message: process.env.SLACK_WEBHOOK_URL ? "Webhook configured" : "Optional",
      dashboardUrl: "https://api.slack.com/apps",
    },
    {
      name: "Mapbox",
      status: !!process.env.MAPBOX_TOKEN ? "success" : "error",
      message: process.env.MAPBOX_TOKEN ? "Token configured" : "Missing MAPBOX_TOKEN",
      dashboardUrl: "https://account.mapbox.com/access-tokens/",
    },
    {
      name: "Redis",
      status: status.redis ? "success" : "error",
      message: status.redis ? "Connected" : "Check UPSTASH_* env vars",
      dashboardUrl: "https://console.upstash.com",
    },
  ]

  return NextResponse.json({ providers })
}
