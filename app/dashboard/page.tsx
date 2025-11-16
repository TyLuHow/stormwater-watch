import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardMap } from "@/components/dashboard/map"
import { ViolationsTable } from "@/components/dashboard/violations-table"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { DEV_MODE, mockFacilities, mockViolations } from "@/lib/dev-mode"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Record<string, string>
}) {
  const county = searchParams.county
  const pollutant = searchParams.pollutant
  const impairedOnly = searchParams.impairedOnly === "true"

  let violations, facilities

  if (DEV_MODE) {
    // Use mock data in dev mode
    violations = mockViolations.map((v) => ({
      ...v,
      facility: mockFacilities.find((f) => f.id === v.facilityId)!,
    }))

    // Apply filters to mock data
    if (county) {
      violations = violations.filter((v) => v.facility.county === county)
    }
    if (pollutant) {
      violations = violations.filter((v) => v.pollutant === pollutant)
    }
    if (impairedOnly) {
      violations = violations.filter((v) => v.severity === "HIGH")
    }

    facilities = mockFacilities
  } else {
    // Fetch from Supabase in production
    violations = await prisma.violationEvent.findMany({
      where: {
        dismissed: false,
        ...(county && { facility: { county } }),
        ...(pollutant && { pollutant }),
        ...(impairedOnly && { impairedWater: true }),
      },
      include: { facility: true },
      orderBy: { maxRatio: "desc" },
      take: 100,
    })

    facilities = await prisma.facility.findMany({
      where: {
        violationEvents: {
          some: {
            dismissed: false,
            ...(county && { facility: { county } }),
            ...(pollutant && { pollutant }),
          },
        },
      },
    })
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Stormwater exceedance monitoring</p>
        {DEV_MODE && <p className="text-sm text-amber-600 mt-1">Using mock data (development mode)</p>}
      </div>

      <StatsCards violations={violations} facilities={facilities} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Facility Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardMap facilities={facilities} violations={violations} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Violations</CardTitle>
            <CardDescription>Active exceedance events</CardDescription>
          </CardHeader>
          <CardContent>
            <ViolationsTable violations={violations} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
