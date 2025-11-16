import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./lib/prisma"

const DEV_MODE = process.env.DEV_MODE === "true" || !process.env.SUPABASE_URL

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Only use PrismaAdapter in production
  ...(DEV_MODE ? {} : { adapter: PrismaAdapter(prisma) }),
  ...authConfig,
})
