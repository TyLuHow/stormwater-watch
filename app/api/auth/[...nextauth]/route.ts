import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  ...authConfig,
})

export const GET = handler
export const POST = handler
