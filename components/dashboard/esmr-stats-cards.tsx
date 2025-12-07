"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Database, MapPin, Beaker, Calendar, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/utils"
import type { StatsResponse } from "@/lib/api/esmr"

interface ESMRStatsCardsProps {
  stats: StatsResponse
}

export function ESMRStatsCards({ stats }: ESMRStatsCardsProps) {
  // Laboratory card styling - clean, clinical, data-focused
  const StatCard = ({
    label,
    value,
    icon: Icon,
    iconColor,
    trend,
    className = ""
  }: {
    label: string
    value: string | number
    icon: any
    iconColor: string
    trend?: string
    className?: string
  }) => (
    <Card className={`relative overflow-hidden border ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2.5 rounded-md ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {trend && (
              <span className="text-xs text-muted-foreground">
                {trend}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              eSMR Monitoring Data
            </span>
          </div>
          <h2 className="text-2xl font-bold">
            Real Water Quality Measurements
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Laboratory-certified samples from California stormwater facilities ({stats.dateRange.earliest} to {stats.dateRange.latest})
          </p>
        </div>
        <Link href="/esmr">
          <Button className="gap-2">
            Explore Full Dataset
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Samples"
          value={formatNumber(stats.totals.samples)}
          icon={Database}
          iconColor="bg-blue-500/10 text-blue-500"
          trend="monitored measurements"
        />

        <StatCard
          label="Active Facilities"
          value={formatNumber(stats.totals.facilities)}
          icon={MapPin}
          iconColor="bg-green-500/10 text-green-500"
          trend="across California"
        />

        <StatCard
          label="Parameters Tracked"
          value={formatNumber(stats.totals.parameters)}
          icon={Beaker}
          iconColor="bg-purple-500/10 text-purple-500"
          trend="water quality metrics"
        />

        <StatCard
          label="Recent Activity"
          value={formatNumber(stats.recentActivity.samplesLast30Days)}
          icon={Calendar}
          iconColor="bg-orange-500/10 text-orange-500"
          trend="samples last 30 days"
        />
      </div>

      {/* Data Source Info */}
      <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3 border">
        <strong>Data Source:</strong> California State Water Resources Control Board Electronic Self-Monitoring Reports (eSMR) 2025 dataset.
        Laboratory-certified water quality measurements from permitted industrial stormwater facilities.
      </div>
    </div>
  )
}
