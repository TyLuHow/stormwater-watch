import { redirect } from "next/navigation"

// VIOLATIONS-FIRST HOMEPAGE
// Per domain expert feedback: "I want a way to quickly access hard data related to stormwater violations"
// Water professionals need direct access to violation data, not marketing content
// This redirects to the violations dashboard as the primary entry point

export default function HomePage() {
  // Redirect homepage to violations dashboard
  // Marketing/about content moved to /about
  redirect("/dashboard")
}
