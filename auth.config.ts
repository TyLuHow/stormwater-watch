import type { AuthConfig } from "@auth/core"
import EmailProvider from "next-auth/providers/email"
import type { JWT } from "next-auth/jwt"
import type { Session } from "next-auth"

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
    authorized({ auth, request: { pathname } }: { auth: any; request: { pathname: string } }) {
      const isLoggedIn = !!auth?.user
      const isSetupPage = pathname === "/setup"

      if (isSetupPage) return true
      if (isLoggedIn) return true
      return false
    },
    async jwt({ token, user, account }: { token: JWT; user: any; account: any }) {
      if (user) {
        token.role = "PARTNER"
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        (session.user as any).role = token.role as string
      }
      return session
    },
  },
  trustHost: true,
} satisfies AuthConfig
