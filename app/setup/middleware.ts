// import { auth } from "@/auth"
import { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const isDev = process.env.DEV_MODE === "true" || !process.env.SUPABASE_URL
  // const session = await auth()

  // Allow setup page for everyone
  if (request.nextUrl.pathname === "/setup") {
    return null
  }

  // In dev mode, allow all pages
  if (isDev) {
    return null
  }

  // Require auth for all other pages
  // if (!session) {
  //   return Response.redirect(new URL("/auth/signin", request.url))
  // }
  return null
}

export const config = {
  matcher: ["/((?!_next|api/auth|auth/).*)"],
}
