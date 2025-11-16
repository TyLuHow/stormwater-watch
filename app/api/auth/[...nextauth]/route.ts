import { handlers } from "@/auth"
import { NextResponse } from "next/server"

const isDev = process.env.DEV_MODE === "true" || !process.env.SUPABASE_URL

export const GET = isDev 
  ? async () => NextResponse.json({ message: "Auth disabled in dev mode" })
  : handlers.GET

export const POST = isDev
  ? async () => NextResponse.json({ message: "Auth disabled in dev mode" })
  : handlers.POST
