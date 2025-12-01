import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, MapPin, FlaskConical, Droplets, Calendar } from "lucide-react"
import type { StatsResponse } from "@/lib/api/esmr"
import { formatNumber } from "@/lib/utils"

interface StatsOverviewProps {
  stats: StatsResponse
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Samples</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(stats.totals.samples)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatNumber(stats.recentActivity.samplesLast30Days)} in last 30 days
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Facilities</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(stats.totals.facilities)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Across {stats.totals.regions} regions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Locations</CardTitle>
          <Droplets className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(stats.totals.locations)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Monitoring points
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Parameters</CardTitle>
          <FlaskConical className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(stats.totals.parameters)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Measured types
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Date Range</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm font-bold">
            {stats.dateRange.earliest || "N/A"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            to {stats.dateRange.latest || "N/A"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
