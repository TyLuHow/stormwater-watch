import type { NextAuthConfig } from "next-auth"
import Resend from "next-auth/providers/resend"

export const authConfig = {
  providers: [
    Resend({
      from: process.env.NEXTAUTH_FROM_EMAIL || "noreply@stormwaterwatch.org",
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
  },
  callbacks: {
    authorized({ auth, request: { pathname } }) {
      const isLoggedIn = !!auth?.user
      const isSetupPage = pathname === "/setup"

      if (isSetupPage) return true
      if (isLoggedIn) return true
      return false
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = "PARTNER"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
      }
      return session
    },
  },
  trustHost: true,
} satisfies NextAuthConfig
