import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { Redis } from "@upstash/redis"

// Supabase client
export function createSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("Supabase not configured")
    return null
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export const supabaseClient = createSupabaseClient()

// Resend client
export function createResendClient() {
  if (!process.env.RESEND_API_KEY) {
    console.warn("Resend not configured")
    return null
  }

  return new Resend(process.env.RESEND_API_KEY)
}

export const resendClient = createResendClient()

// Redis client
export function createRedisClient() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn("Redis not configured")
    return null
  }

  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

export const redisClient = createRedisClient()

// Health check
export async function checkProviders() {
  const checks = {
    supabase: false,
    redis: false,
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
