import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"

export const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export const supabaseClient =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null

export async function checkProviders() {
  const status = {
    resend: false,
    supabase: false,
    slack: false,
    mapbox: false,
    redis: false,
  }

  try {
    if (resendClient) {
      await resendClient.emails.send({
        from: "onboarding@resend.dev",
        to: "delivered@resend.dev",
        subject: "Health Check",
        html: "<p>Health check</p>",
      })
      status.resend = true
    }
  } catch (e) {
    console.error("Resend health check failed:", e)
  }

  try {
    if (supabaseClient) {
      await supabaseClient.from("provenance").select("count")
      status.supabase = true
    }
  } catch (e) {
    console.error("Supabase health check failed:", e)
  }

  if (process.env.SLACK_WEBHOOK_URL) {
    status.slack = true
  }

  if (process.env.MAPBOX_TOKEN) {
    status.mapbox = true
  }

  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    status.redis = true
  }

  return status
}
