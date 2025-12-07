"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart3, AlertTriangle, Droplets, MapPin, TrendingUp } from "lucide-react"
import type { Decimal } from "@prisma/client/runtime/library"

interface Facility {
  id: string
  county: string | null
  [key: string]: any
}

interface Violation {
  id: string
  pollutant: string
  facility: Facility
  severity?: string
  maxRatio?: number | string | Decimal
  [key: string]: any
}

interface StatsCardsProps {
  violations?: Violation[]
  facilities?: Facility[]
}

export function StatsCards({ violations = [], facilities = [] }: StatsCardsProps) {
  const stats = useMemo(() => {
    const byPollutant = violations.reduce(
      (acc, v) => {
        const existing = acc.find((p) => p.pollutant === v.pollutant)
        if (existing) {
          existing.count++
        } else {
          acc.push({ pollutant: v.pollutant, count: 1 })
        }
        return acc
      },
      [] as { pollutant: string; count: number }[],
    )

    const byCounty = violations.reduce(
      (acc, v) => {
        const existing = acc.find((c) => c.county === v.facility.county)
        if (existing) {
          existing.count++
        } else {
          acc.push({ county: v.facility.county, count: 1 })
        }
        return acc
      },
      [] as { county: string | null; count: number }[],
    )

    // Find most severe violation
    const maxExceedance = violations.reduce((max, v) => {
      const ratio = typeof v.maxRatio === 'string'
        ? parseFloat(v.maxRatio)
        : typeof v.maxRatio === 'object' && v.maxRatio !== null && 'toNumber' in v.maxRatio
        ? v.maxRatio.toNumber()
        : (v.maxRatio || 0)
      return ratio > max ? ratio : max
    }, 0)

    return {
      total: violations.length,
      impairedWater: violations.filter((v) => v.severity === "HIGH").length,
      byCounty: byCounty.sort((a, b) => b.count - a.count),
      byPollutant: byPollutant.sort((a, b) => b.count - a.count),
      facilityCount: facilities.length,
      maxExceedance,
    }
  }, [violations, facilities])

  // Laboratory card styling - clean, clinical, data-focused
  const StatCard = ({
    label,
    value,
    icon: Icon,
    iconColor,
    trend,
    alert = false,
    className = ""
  }: {
    label: string
    value: string | number
    icon: any
    iconColor: string
    trend?: string
    alert?: boolean
    className?: string
  }) => (
    <Card className={`relative overflow-hidden border ${className} ${alert ? 'border-destructive/50' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2.5 rounded-md ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          {alert && (
            <span className="status-critical">Alert</span>
          )}
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        label="Active Violations"
        value={stats.total}
        icon={BarChart3}
        iconColor="bg-primary/10 text-primary"
        trend="current monitoring period"
      />

      <StatCard
        label="Impaired Waters"
        value={stats.impairedWater}
        icon={AlertTriangle}
        iconColor="bg-destructive/10 text-destructive"
        alert={stats.impairedWater > 0}
      />

      <StatCard
        label="Facilities Tracked"
        value={stats.facilityCount}
        icon={MapPin}
        iconColor="bg-accent/10 text-accent"
        trend="across California"
      />

      <StatCard
        label="Top Pollutant"
        value={stats.byPollutant[0]?.pollutant || "—"}
        icon={Droplets}
        iconColor="bg-chart-2/10 text-[oklch(var(--chart-2))]"
        trend={stats.byPollutant[0]?.count ? `${stats.byPollutant[0].count} events` : undefined}
      />

      <StatCard
        label="Peak Exceedance"
        value={stats.maxExceedance > 0 ? `${stats.maxExceedance.toFixed(1)}x` : "—"}
        icon={TrendingUp}
        iconColor="bg-destructive/10 text-destructive"
        trend="above benchmark"
      />
    </div>
  )
}
