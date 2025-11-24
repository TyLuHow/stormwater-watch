import { NextResponse } from "next/server"
import { resendClient, supabaseClient } from "@/lib/providers"

export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: providerParam } = await params
  const provider = providerParam.toLowerCase()

  try {
    if (provider === "resend") {
      if (!resendClient) {
        return NextResponse.json({ error: "Resend not configured" }, { status: 400 })
      }
      // Test with Resend's test email
      await resendClient.emails.send({
        from: "onboarding@resend.dev",
        to: "delivered@resend.dev",
        subject: "Test from Stormwater Watch",
        html: "<p>Connection test successful</p>",
      })
      return NextResponse.json({ success: true })
    }

    if (provider === "supabase") {
      if (!supabaseClient) {
        return NextResponse.json({ error: "Supabase not configured" }, { status: 400 })
      }
      await supabaseClient.from("provenance").select("count").limit(1)
      return NextResponse.json({ success: true })
    }

    if (provider === "mapbox") {
      if (!process.env.MAPBOX_TOKEN) {
        return NextResponse.json({ error: "Mapbox token not configured" }, { status: 400 })
      }
      const response = await fetch("https://api.mapbox.com/styles/v1?access_token=" + process.env.MAPBOX_TOKEN)
      if (!response.ok) throw new Error("Mapbox token invalid")
      return NextResponse.json({ success: true })
    }

    if (provider === "slack") {
      if (!process.env.SLACK_WEBHOOK_URL) {
        return NextResponse.json({ error: "Slack webhook not configured" }, { status: 400 })
      }
      const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: "POST",
        body: JSON.stringify({ text: "Stormwater Watch setup test" }),
      })
      if (!response.ok) throw new Error("Slack webhook failed")
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unknown provider" }, { status: 400 })
  } catch (error) {
    console.error(`${provider} test failed:`, error)
    return NextResponse.json({ error: `${provider} test failed` }, { status: 500 })
  }
}
