import type { NextAuthConfig } from "next-auth"
import EmailProvider from "next-auth/providers/email"

export const authConfig = {
  providers: [
    EmailProvider({
      from: process.env.NEXTAUTH_FROM_EMAIL || "noreply@stormwaterwatch.org",
      server: {
        host: "smtp.resend.com",
        port: 465,
        auth: {
          user: "resend",
          pass: process.env.RESEND_API_KEY,
        },
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
  },
  callbacks: {
    authorized({ auth, request: { pathname } }: any) {
      const isLoggedIn = !!auth?.user
      const isSetupPage = pathname === "/setup"

      if (isSetupPage) return true
      if (isLoggedIn) return true
      return false
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.role = "PARTNER"
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).role = token.role as string
      }
      return session
    },
  },
  trustHost: true,
} satisfies NextAuthConfig
