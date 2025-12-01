import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardMap } from "@/components/dashboard/map"
import { ViolationsTable } from "@/components/dashboard/violations-table"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { DashboardFilters } from "@/components/dashboard/filters"
import { ESMRStatsCards } from "@/components/dashboard/esmr-stats-cards"
import { ESMRRecentActivity } from "@/components/dashboard/esmr-recent-activity"
import { AlertTriangle } from "lucide-react"
import type { StatsResponse, SampleListResponse } from "@/lib/api/esmr"

// Force dynamic rendering to prevent database access during build
export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams

  // Enhanced filter support
  const counties = params.counties?.split(",") || []
  const pollutants = params.pollutants?.split(",") || []
  const huc12s = params.huc12s?.split(",") || []
  const ms4s = params.ms4s?.split(",") || []
  const years = params.years?.split(",") || []
  const minRatio = parseFloat(params.minRatio || "1.0")
  const impairedOnly = params.impairedOnly === "true"
  const hideDismissed = params.hideDismissed !== "false"
  const dateFrom = params.dateFrom ? new Date(params.dateFrom) : undefined
  const dateTo = params.dateTo ? new Date(params.dateTo) : undefined

  // Legacy support
  const county = params.county
  const pollutant = params.pollutant

  let violations: any[] = []
  let facilities: any[] = []
  let dbError: string | null = null

  try {
    // Build where clause for enhanced filters
    const whereClause: any = {
      dismissed: hideDismissed ? false : undefined,
      ...(county && { facility: { county } }),
      ...(pollutant && { pollutantKey: pollutant }),
      ...(counties.length > 0 && { facility: { county: { in: counties } } }),
      ...(pollutants.length > 0 && { pollutantKey: { in: pollutants } }),
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

    // Fetch from database
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
    // Database error - show error message
    console.error("Database error:", error)
    dbError = error instanceof Error ? error.message : "Failed to load data from database"
  }

  // Get available filter options
  let availableCounties: string[] = []
  let availablePollutants: string[] = []
  let availableHuc12s: string[] = []
  let availableMs4s: string[] = []
  let availableYears: string[] = []

  if (!dbError) {
    try {
      const [countiesRes, pollutantsRes, huc12sRes, ms4sRes, yearsRes] = await Promise.all([
        prisma.facility.findMany({ select: { county: true }, distinct: ['county'] }),
        prisma.violationEvent.findMany({ select: { pollutantKey: true }, distinct: ['pollutantKey'] }),
        prisma.facility.findMany({ select: { watershedHuc12: true }, distinct: ['watershedHuc12'] }),
        prisma.facility.findMany({ select: { ms4: true }, distinct: ['ms4'] }),
        prisma.violationEvent.findMany({ select: { reportingYear: true }, distinct: ['reportingYear'] }),
      ])
      availableCounties = countiesRes.map(x => x.county).filter(Boolean) as string[]
      availablePollutants = pollutantsRes.map(x => x.pollutantKey).filter(Boolean) as string[]
      availableHuc12s = huc12sRes.map(x => x.watershedHuc12).filter(Boolean) as string[]
      availableMs4s = ms4sRes.map(x => x.ms4).filter(Boolean) as string[]
      availableYears = yearsRes.map(x => x.reportingYear.toString())
    } catch (error) {
      console.error("Error fetching filter options:", error)
    }
  }

  // Fetch eSMR data for dashboard
  let esmrStats: StatsResponse | null = null
  let esmrRecentSamples: SampleListResponse["samples"] = []

  if (!dbError) {
    try {
      // Calculate date thresholds
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Fetch eSMR stats
      const [
        totalFacilities,
        totalLocations,
        totalSamples,
        totalParameters,
        totalRegions,
        samplesLast30Days,
        dateRange,
        topParameters,
        recentSamples,
      ] = await Promise.all([
        prisma.eSMRFacility.count(),
        prisma.eSMRLocation.count(),
        prisma.eSMRSample.count(),
        prisma.eSMRParameter.count(),
        prisma.eSMRRegion.count(),
        prisma.eSMRSample.count({
          where: { samplingDate: { gte: thirtyDaysAgo } },
        }),
        prisma.eSMRSample.aggregate({
          _min: { samplingDate: true },
          _max: { samplingDate: true },
        }),
        prisma.eSMRParameter.findMany({
          select: {
            parameterName: true,
            category: true,
            _count: { select: { samples: true } },
          },
          orderBy: { samples: { _count: "desc" } },
          take: 20,
        }),
        prisma.eSMRSample.findMany({
          select: {
            id: true,
            locationPlaceId: true,
            samplingDate: true,
            qualifier: true,
            result: true,
            units: true,
            reviewPriorityIndicator: true,
            location: {
              select: {
                locationCode: true,
                facilityPlaceId: true,
                facility: { select: { facilityName: true } },
              },
            },
            parameter: {
              select: { parameterName: true, category: true },
            },
          },
          orderBy: { samplingDate: "desc" },
          take: 8,
        }),
      ])

      esmrStats = {
        totals: {
          facilities: totalFacilities,
          locations: totalLocations,
          samples: totalSamples,
          parameters: totalParameters,
          regions: totalRegions,
        },
        recentActivity: {
          samplesLast30Days,
          samplesLast7Days: 0, // Not needed for dashboard
        },
        topParameters: topParameters.map((p) => ({
          parameterName: p.parameterName,
          category: p.category,
          sampleCount: p._count.samples,
        })),
        dateRange: {
          earliest: dateRange._min.samplingDate?.toISOString().split("T")[0] || null,
          latest: dateRange._max.samplingDate?.toISOString().split("T")[0] || null,
        },
        byQualifier: [],
        byLocationType: [],
      }

      esmrRecentSamples = recentSamples.map((s) => ({
        id: s.id,
        locationPlaceId: s.locationPlaceId,
        locationCode: s.location.locationCode,
        facilityPlaceId: s.location.facilityPlaceId,
        facilityName: s.location.facility.facilityName,
        parameterName: s.parameter.parameterName,
        parameterCategory: s.parameter.category,
        samplingDate: s.samplingDate.toISOString().split("T")[0],
        samplingTime: "00:00:00",
        qualifier: s.qualifier,
        result: s.result?.toString() || null,
        units: s.units,
        mdl: null,
        ml: null,
        rl: null,
        analyticalMethod: null,
        reviewPriorityIndicator: s.reviewPriorityIndicator,
      }))
    } catch (error) {
      console.error("Error fetching eSMR data:", error)
      // Continue without eSMR data if there's an error
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

      {/* Database Error Alert */}
      {dbError && (
        <div className="container mx-auto px-4 pt-8">
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <h3 className="font-semibold text-destructive">Unable to Load Data</h3>
                  <p className="text-sm text-muted-foreground mt-1">{dbError}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

        {/* eSMR Stats Section */}
        {esmrStats && (
          <div className="slide-in-bottom" style={{ animationDelay: "0.35s" }}>
            <ESMRStatsCards stats={esmrStats} />
          </div>
        )}

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

        {/* eSMR Recent Activity */}
        {esmrRecentSamples.length > 0 && (
          <ESMRRecentActivity samples={esmrRecentSamples} />
        )}
      </div>
    </div>
  )
}
