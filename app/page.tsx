// import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const isDev = process.env.DEV_MODE === "true" || !process.env.SUPABASE_URL

  if (isDev) {
    // In dev mode, skip auth check and go to dashboard
    redirect("/dashboard")
  }

  // const session = await auth()
  // if (!session) {
  //   redirect("/auth/signin")
  // }

  redirect("/dashboard")
}
