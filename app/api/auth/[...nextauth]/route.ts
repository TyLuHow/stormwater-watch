import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

const isDev = process.env.DEV_MODE === "true" || !process.env.SUPABASE_URL

// Create handler for production
const authHandler = isDev
  ? null
  : NextAuth({
      adapter: PrismaAdapter(prisma),
      ...authConfig,
    })

// Export GET and POST - in dev mode return simple response, in prod use NextAuth
export const GET = isDev
  ? async () => NextResponse.json({ message: "Auth disabled in dev mode" })
  : authHandler

export const POST = isDev
  ? async () => NextResponse.json({ message: "Auth disabled in dev mode" })
  : authHandler
