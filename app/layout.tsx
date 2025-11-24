import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
// import { Analytics } from "@vercel/analytics/next"
// import { SessionProvider } from "next-auth/react"
// import { auth } from "@/auth"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Stormwater Watch | California Water Quality Command Center",
  description: "Real-time tracking of industrial stormwater violations across California. Empowering communities and advocates to protect clean water through data transparency and accountability.",
  keywords: ["water quality", "stormwater", "California", "environmental monitoring", "pollution tracking"],
  authors: [{ name: "Stormwater Watch" }],
  openGraph: {
    title: "Stormwater Watch | Water Quality Command Center",
    description: "Track industrial stormwater violations across California in real-time",
    type: "website",
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
