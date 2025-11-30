import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatsOverview } from "@/components/esmr/stats-overview"
import { ArrowRight, Building2, FlaskConical, Database } from "lucide-react"
import Link from "next/link"
import type { StatsResponse, RegionListResponse } from "@/lib/api/esmr"

// Force dynamic rendering to prevent database access during build
export const dynamic = 'force-dynamic'

async function getStats(): Promise<StatsResponse | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/esmr/stats`, {
      cache: 'no-store',
    })
    if (!res.ok) throw new Error('Failed to fetch stats')
    return res.json()
  } catch (error) {
    console.error('Error fetching stats:', error)
    return null
  }
}

async function getRegions(): Promise<RegionListResponse | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/esmr/regions`, {
      cache: 'no-store',
    })
    if (!res.ok) throw new Error('Failed to fetch regions')
    return res.json()
  } catch (error) {
    console.error('Error fetching regions:', error)
    return null
  }
}

export default async function ESMRDashboardPage() {
  const [stats, regions] = await Promise.all([getStats(), getRegions()])

  if (!stats || !regions) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load dashboard data</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border-b border-border/50">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                eSMR Data Explorer
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Water Quality{" "}
              <span className="text-gradient">Monitoring</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Explore {stats.totals.samples.toLocaleString()}+ water quality samples from California facilities.
              Real-time access to electronic Self-Monitoring Reports (eSMR) data.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Stats Overview */}
        <StatsOverview stats={stats} />

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Explore Facilities</CardTitle>
                  <CardDescription>Browse all monitored facilities</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View {stats.totals.facilities.toLocaleString()} facilities across California water board regions with detailed monitoring data.
              </p>
              <Link href="/esmr/facilities">
                <Button className="w-full">
                  View Facilities
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FlaskConical className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Parameters</CardTitle>
                  <CardDescription>View measured parameters</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Explore {stats.totals.parameters.toLocaleString()} different water quality parameters including metals, nutrients, and more.
              </p>
              <Link href="/esmr/parameters">
                <Button className="w-full">
                  View Parameters
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Search Samples</CardTitle>
                  <CardDescription>Advanced sample search</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Search and filter through {stats.totals.samples.toLocaleString()} samples with advanced filtering and export options.
              </p>
              <Link href="/esmr/samples">
                <Button className="w-full">
                  Search Samples
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Regional Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="border-b bg-muted/30">
              <CardTitle>Regional Breakdown</CardTitle>
              <CardDescription>Sample counts by California water board region</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {regions.regions
                  .sort((a, b) => b.sampleCount - a.sampleCount)
                  .slice(0, 9)
                  .map((region, i) => {
                    const maxSamples = regions.regions[0]?.sampleCount || 1
                    const percentage = (region.sampleCount / maxSamples) * 100

                    return (
                      <div key={region.code} className="flex items-center justify-between group hover:bg-muted/50 -mx-4 px-4 py-2 rounded-lg transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-sm font-bold text-muted-foreground w-6">
                            #{i + 1}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium">{region.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {region.facilityCount} facilities, {region.locationCount} locations
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div
                            className="h-2 rounded-full bg-primary/20 hidden sm:block"
                            style={{ width: "100px" }}
                          >
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-lg font-bold w-20 text-right">
                            {region.sampleCount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b bg-muted/30">
              <CardTitle>Top Parameters</CardTitle>
              <CardDescription>Most frequently measured parameters</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {stats.topParameters.slice(0, 10).map((param, i) => {
                  const maxSamples = stats.topParameters[0]?.sampleCount || 1
                  const percentage = (param.sampleCount / maxSamples) * 100

                  return (
                    <div key={param.parameterName} className="flex items-center justify-between group hover:bg-muted/50 -mx-4 px-4 py-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm font-bold text-muted-foreground w-6">
                          #{i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium">{param.parameterName}</div>
                          <div className="text-xs text-muted-foreground">
                            {param.category || "Uncategorized"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-2 rounded-full bg-primary/20 hidden sm:block"
                          style={{ width: "100px" }}
                        >
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-lg font-bold w-20 text-right">
                          {param.sampleCount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
