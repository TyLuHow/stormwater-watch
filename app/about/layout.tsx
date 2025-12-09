import type React from "react"

// About page uses its own layout without the dashboard sidebar
// This page is for users who want background info, not primary workflow

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
