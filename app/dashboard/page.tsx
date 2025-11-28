import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardMap } from "@/components/dashboard/map"
import { ViolationsTable } from "@/components/dashboard/violations-table"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { DashboardFilters } from "@/components/dashboard/filters"
import { DEV_MODE, mockFacilities, mockViolations } from "@/lib/dev-mode"

// Force dynamic rendering to prevent database access during build
export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Record<string, string>
}) {
  // Enhanced filter support
  const counties = searchParams.counties?.split(",") || []
  const pollutants = searchParams.pollutants?.split(",") || []
  const huc12s = searchParams.huc12s?.split(",") || []
  const ms4s = searchParams.ms4s?.split(",") || []
  const years = searchParams.years?.split(",") || []
  const minRatio = parseFloat(searchParams.minRatio || "1.0")
  const impairedOnly = searchParams.impairedOnly === "true"
  const hideDismissed = searchParams.hideDismissed !== "false"
  const dateFrom = searchParams.dateFrom ? new Date(searchParams.dateFrom) : undefined
  const dateTo = searchParams.dateTo ? new Date(searchParams.dateTo) : undefined
  
  // Legacy support
  const county = searchParams.county
  const pollutant = searchParams.pollutant

  let violations: any[], facilities: any[]
  let usingMockData = DEV_MODE

  // Helper to get mock data with filters applied
  const getMockData = () => {
    let mockVios = mockViolations.map((v) => ({
      ...v,
      facility: mockFacilities.find((f) => f.id === v.facilityId)!,
    }))

    // Apply filters to mock data
    if (county) {
      mockVios = mockVios.filter((v) => v.facility.county === county)
    }
    if (pollutant) {
      mockVios = mockVios.filter((v) => v.pollutant === pollutant)
    }
    if (counties.length > 0) {
      mockVios = mockVios.filter((v) => counties.includes(v.facility.county))
    }
    if (pollutants.length > 0) {
      mockVios = mockVios.filter((v) => pollutants.includes(v.pollutant))
    }
    if (years.length > 0) {
      mockVios = mockVios.filter((v) => years.includes(v.reportingYear.toString()))
    }
    if (minRatio > 1.0) {
      mockVios = mockVios.filter((v) => Number(v.maxRatio) >= minRatio)
    }
    if (impairedOnly) {
      mockVios = mockVios.filter((v) => v.severity === "HIGH")
    }
    if (hideDismissed) {
      mockVios = mockVios.filter((v) => !v.dismissed)
    }
    if (dateFrom) {
      mockVios = mockVios.filter((v) => new Date(v.firstDate) >= dateFrom)
    }
    if (dateTo) {
      mockVios = mockVios.filter((v) => new Date(v.lastDate) <= dateTo)
    }

    return { violations: mockVios, facilities: mockFacilities }
  }

  if (DEV_MODE) {
    const mockData = getMockData()
    violations = mockData.violations
    facilities = mockData.facilities
  } else {
    // Try to fetch from database, fall back to mock data on error
    try {
      // Build where clause for enhanced filters
      const whereClause: any = {
        dismissed: hideDismissed ? false : undefined,
        ...(county && { facility: { county } }),
        ...(pollutant && { pollutant }),
        ...(counties.length > 0 && { facility: { county: { in: counties } } }),
        ...(pollutants.length > 0 && { pollutant: { in: pollutants } }),
        ...(huc12s.length > 0 && { facility: { watershedHuc12: { in: huc12s } } }),
        ...(ms4s.length > 0 && { facility: { ms4: { in: ms4s } } }),
        ...(years.length > 0 && { reportingYear: { in: years.map(y => parseInt(y)) } }),
        ...(minRatio > 1.0 && { maxRatio: { gte: minRatio } }),
        ...(impairedOnly && { impairedWater: true }),
        ...(dateFrom && { firstDate: { gte: dateFrom } }),
        ...(dateTo && { lastDate: { lte: dateTo } }),
      }

      // Remove undefined values
      Object.keys(whereClause).forEach(key => {
        if (whereClause[key] === undefined) {
          delete whereClause[key]
        }
      })

      // Fetch from Supabase in production
      violations = await prisma.violationEvent.findMany({
        where: whereClause,
        include: { facility: true },
        orderBy: { maxRatio: "desc" },
        take: 100,
      })

      facilities = await prisma.facility.findMany({
        where: {
          violationEvents: {
            some: whereClause,
          },
        },
      })
    } catch (error) {
      // Database unavailable - fall back to mock data
      console.error("Database error, using mock data:", error)
      usingMockData = true
      const mockData = getMockData()
      violations = mockData.violations
      facilities = mockData.facilities
    }
  }

  // Get available filter options (use mock data if DB unavailable)
  let availableCounties: string[]
  let availablePollutants: string[]
  let availableHuc12s: string[]
  let availableMs4s: string[]
  let availableYears: string[]

  if (usingMockData) {
    availableCounties = [...new Set(mockFacilities.map(f => f.county).filter(Boolean) as string[])]
    availablePollutants = [...new Set(mockViolations.map(v => v.pollutant))]
    availableHuc12s = [...new Set(mockFacilities.map(f => f.watershedHuc12).filter(Boolean) as string[])]
    availableMs4s = [...new Set(mockFacilities.map(f => f.ms4).filter(Boolean) as string[])]
    availableYears = [...new Set(mockViolations.map(v => v.reportingYear.toString()))]
  } else {
    try {
      const [countiesRes, pollutantsRes, huc12sRes, ms4sRes, yearsRes] = await Promise.all([
        prisma.facility.findMany({ select: { county: true }, distinct: ['county'] }),
        prisma.violationEvent.findMany({ select: { pollutant: true }, distinct: ['pollutant'] }),
        prisma.facility.findMany({ select: { watershedHuc12: true }, distinct: ['watershedHuc12'] }),
        prisma.facility.findMany({ select: { ms4: true }, distinct: ['ms4'] }),
        prisma.violationEvent.findMany({ select: { reportingYear: true }, distinct: ['reportingYear'] }),
      ])
      availableCounties = countiesRes.map(x => x.county).filter(Boolean) as string[]
      availablePollutants = pollutantsRes.map(x => x.pollutant).filter(Boolean) as string[]
      availableHuc12s = huc12sRes.map(x => x.watershedHuc12).filter(Boolean) as string[]
      availableMs4s = ms4sRes.map(x => x.ms4).filter(Boolean) as string[]
      availableYears = yearsRes.map(x => x.reportingYear.toString())
    } catch {
      // Fall back to mock filter options
      availableCounties = [...new Set(mockFacilities.map(f => f.county).filter(Boolean) as string[])]
      availablePollutants = [...new Set(mockViolations.map(v => v.pollutant))]
      availableHuc12s = [...new Set(mockFacilities.map(f => f.watershedHuc12).filter(Boolean) as string[])]
      availableMs4s = [...new Set(mockFacilities.map(f => f.ms4).filter(Boolean) as string[])]
      availableYears = [...new Set(mockViolations.map(v => v.reportingYear.toString()))]
    }
  }

  return (
    <div className="min-h-screen">
      {/* Mission Control Header */}
      <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border-b border-border/50">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Live Monitoring
              </span>
              {usingMockData && (
                <span className="badge-warning ml-2">Demo Mode (Sample Data)</span>
              )}
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 slide-in-bottom">
              Water Quality{" "}
              <span className="text-gradient">Command Center</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl slide-in-bottom" style={{ animationDelay: "0.1s" }}>
              Real-time tracking of industrial stormwater violations across California watersheds.
              Empowering communities to protect clean water.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Filters */}
        <div className="slide-in-bottom" style={{ animationDelay: "0.2s" }}>
          <DashboardFilters
            availablePollutants={availablePollutants}
            availableCounties={availableCounties}
            availableHuc12s={availableHuc12s}
            availableMs4s={availableMs4s}
            availableYears={availableYears}
          />
        </div>

        {/* Stats Overview */}
        <div className="slide-in-bottom" style={{ animationDelay: "0.3s" }}>
          <StatsCards violations={violations} facilities={facilities} />
        </div>

        {/* Map and Data Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Large Map Section */}
          <Card className="xl:col-span-2 overflow-hidden slide-in-bottom" style={{ animationDelay: "0.4s" }}>
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">California Facility Network</CardTitle>
                  <CardDescription className="mt-1">
                    Interactive map showing violation hotspots and watershed boundaries
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <span className="text-muted-foreground">Critical</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-muted-foreground">Active</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DashboardMap facilities={facilities} violations={violations} />
            </CardContent>
          </Card>

          {/* Top Counties Sidebar */}
          <Card className="slide-in-bottom" style={{ animationDelay: "0.5s" }}>
            <CardHeader className="border-b bg-muted/30">
              <CardTitle>Regional Hotspots</CardTitle>
              <CardDescription>Counties by violation count</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {(() => {
                  const byCounty = violations.reduce(
                    (acc: { county: string | null; count: number }[], v) => {
                      const existing = acc.find((c: { county: string | null; count: number }) => c.county === v.facility.county)
                      if (existing) {
                        existing.count++
                      } else {
                        acc.push({ county: v.facility.county, count: 1 })
                      }
                      return acc
                    },
                    [] as { county: string | null; count: number }[],
                  ).sort((a, b) => b.count - a.count).slice(0, 8)

                  return byCounty.length > 0 ? (
                    byCounty.map((item, i) => (
                      <div key={item.county || `unknown-${i}`} className="flex items-center justify-between group hover:bg-muted/50 -mx-4 px-4 py-2 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-muted-foreground w-6">
                            #{i + 1}
                          </span>
                          <span className="font-medium">{item.county}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-1.5 rounded-full bg-primary/20"
                            style={{
                              width: `${Math.max(40, (item.count / byCounty[0].count) * 100)}px`
                            }}
                          >
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{
                                width: `${(item.count / byCounty[0].count) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-lg font-bold w-8 text-right">{item.count}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No violations to display
                    </div>
                  )
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Violations Table */}
        <Card className="slide-in-bottom" style={{ animationDelay: "0.6s" }}>
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Active Violation Events</CardTitle>
                <CardDescription className="mt-1">
                  Exceedances requiring investigation and enforcement action
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {violations.length} {violations.length === 1 ? 'event' : 'events'}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ViolationsTable violations={violations} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
