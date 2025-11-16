import type React from "react"
// import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart3, LogOut, Bell } from "lucide-react"
// import { signOut } from "@/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isDev = process.env.DEV_MODE === "true" || !process.env.SUPABASE_URL
  // const session = await auth()
  const session = isDev ? { user: { email: "dev@example.com" } } : null

  if (!isDev && !session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            <span className="font-bold text-lg">Stormwater Watch</span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/subscriptions">
              <Button variant="ghost">
                <Bell className="w-4 h-4 mr-2" />
                Subscriptions
              </Button>
            </Link>
            <Link href="/ingest">
              <Button variant="ghost">Ingest</Button>
            </Link>
            {!isDev && (
              <form
                action={async () => {
                  "use server"
                  // await signOut()
                }}
              >
                <Button variant="ghost" type="submit">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </form>
            )}
          </nav>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
