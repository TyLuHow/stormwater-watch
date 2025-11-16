import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { Redis } from "@upstash/redis"
import { DEV_MODE } from "./dev-mode"

// Supabase client
export function createSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    if (DEV_MODE) {
      console.log("[DEV] Supabase mock mode enabled")
      return null
    }
    console.warn("Supabase not configured")
    return null
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export const supabaseClient = createSupabaseClient()

// Resend client
export function createResendClient() {
  if (!process.env.RESEND_API_KEY) {
    if (DEV_MODE) {
      console.log("[DEV] Resend mock mode enabled")
      return null
    }
    console.warn("Resend not configured")
    return null
  }

  return new Resend(process.env.RESEND_API_KEY)
}

export const resendClient = createResendClient()

// Redis client
export function createRedisClient() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    if (DEV_MODE) {
      console.log("[DEV] Redis mock mode enabled")
      return null
    }
    console.warn("Redis not configured")
    return null
  }

  return new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  })
}

export const redisClient = createRedisClient()

// Health check
export async function checkProviders() {
  const checks = {
    supabase: DEV_MODE ? false : false,
    redis: DEV_MODE ? false : false,
  }

  // Check Supabase
  if (supabaseClient) {
    try {
      await supabaseClient.from("facility").select("id").limit(1)
      checks.supabase = true
    } catch (e) {
      console.error("Supabase health check failed:", e)
    }
  }

  // Check Redis
  if (redisClient) {
    try {
      await redisClient.ping()
      checks.redis = true
    } catch (e) {
      console.error("Redis health check failed:", e)
    }
  }

  return checks
}
