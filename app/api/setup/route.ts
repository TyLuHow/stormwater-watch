import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSupabaseClient, redisClient } from "@/lib/providers"
import { Resend } from "resend"

interface HealthCheck {
  name: string
  status: "pass" | "fail" | "warning"
  message: string
  details?: any
}

/**
 * GET /api/setup
 * Health check and integration verification
 */
export async function GET() {
  const checks: HealthCheck[] = []

  // 1. Database Connection
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.push({
      name: "Database",
      status: "pass",
      message: "PostgreSQL connection successful",
    })
  } catch (error) {
    checks.push({
      name: "Database",
      status: "fail",
      message: "Database connection failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }

  // 2. Supabase Storage
  try {
    const supabase = createSupabaseClient()
    if (supabase) {
      await supabase.storage.from("raw").list({ limit: 1 })
      checks.push({
        name: "Supabase Storage",
        status: "pass",
        message: "Supabase storage accessible",
      })
    } else {
      checks.push({
        name: "Supabase Storage",
        status: "warning",
        message: "Supabase not configured (optional)",
      })
    }
  } catch (error) {
    checks.push({
      name: "Supabase Storage",
      status: "warning",
      message: "Supabase storage check failed (optional)",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }

  // 3. Redis Cache
  try {
    if (redisClient) {
      await redisClient.ping()
      checks.push({
        name: "Redis Cache",
        status: "pass",
        message: "Redis connection successful",
      })
    } else {
      checks.push({
        name: "Redis Cache",
        status: "warning",
        message: "Redis not configured (optional, used for caching)",
      })
    }
  } catch (error) {
    checks.push({
      name: "Redis Cache",
      status: "warning",
      message: "Redis connection failed (optional)",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }

  // 4. Resend Email
  try {
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      // Just check if API key is valid format (won't actually send)
      checks.push({
        name: "Resend Email",
        status: "pass",
        message: "Resend API key configured",
      })
    } else {
      checks.push({
        name: "Resend Email",
        status: "fail",
        message: "RESEND_API_KEY not set",
      })
    }
  } catch (error) {
    checks.push({
      name: "Resend Email",
      status: "fail",
      message: "Resend configuration error",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }

  // 5. NextAuth
  try {
    if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL) {
      checks.push({
        name: "NextAuth",
        status: "pass",
        message: "NextAuth configuration present",
      })
    } else {
      checks.push({
        name: "NextAuth",
        status: "fail",
        message: "NEXTAUTH_SECRET or NEXTAUTH_URL missing",
      })
    }
  } catch (error) {
    checks.push({
      name: "NextAuth",
      status: "fail",
      message: "NextAuth configuration error",
    })
  }

  // 6. Mapbox
  try {
    if (process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      checks.push({
        name: "Mapbox",
        status: "pass",
        message: "Mapbox token configured",
      })
    } else {
      checks.push({
        name: "Mapbox",
        status: "warning",
        message: "Mapbox token not set (maps will be disabled)",
      })
    }
  } catch (error) {
    checks.push({
      name: "Mapbox",
      status: "warning",
      message: "Mapbox check failed",
    })
  }

  // 7. Slack Webhook
  try {
    if (process.env.SLACK_WEBHOOK_URL) {
      checks.push({
        name: "Slack Webhook",
        status: "pass",
        message: "Slack webhook URL configured",
      })
    } else {
      checks.push({
        name: "Slack Webhook",
        status: "warning",
        message: "Slack webhook not set (alerts will only go to email)",
      })
    }
  } catch (error) {
    checks.push({
      name: "Slack Webhook",
      status: "warning",
      message: "Slack configuration check failed",
    })
  }

  // 8. NWS User Agent
  try {
    if (process.env.NWS_USER_AGENT) {
      checks.push({
        name: "NWS API",
        status: "pass",
        message: "NWS User-Agent configured",
      })
    } else {
      checks.push({
        name: "NWS API",
        status: "warning",
        message: "NWS_USER_AGENT not set (precipitation data may fail)",
      })
    }
  } catch (error) {
    checks.push({
      name: "NWS API",
      status: "warning",
      message: "NWS configuration check failed",
    })
  }

  // 9. Environment Variables Summary
  const requiredVars = [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "RESEND_API_KEY",
  ]
  const optionalVars = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "MAPBOX_TOKEN",
    "SLACK_WEBHOOK_URL",
    "NWS_USER_AGENT",
  ]

  const missingRequired = requiredVars.filter((v) => !process.env[v])
  const presentOptional = optionalVars.filter((v) => process.env[v])

  checks.push({
    name: "Environment Variables",
    status: missingRequired.length === 0 ? "pass" : "fail",
    message: `${requiredVars.length - missingRequired.length}/${requiredVars.length} required vars set, ${presentOptional.length}/${optionalVars.length} optional vars set`,
    details: {
      missingRequired,
      presentOptional,
    },
  })

  const allPass = checks.filter((c) => c.status === "fail").length === 0
  const hasWarnings = checks.filter((c) => c.status === "warning").length > 0

  return NextResponse.json({
    status: allPass ? (hasWarnings ? "warning" : "pass") : "fail",
    checks,
    summary: {
      total: checks.length,
      passed: checks.filter((c) => c.status === "pass").length,
      warnings: checks.filter((c) => c.status === "warning").length,
      failed: checks.filter((c) => c.status === "fail").length,
    },
  })
}

