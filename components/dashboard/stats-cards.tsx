"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, AlertTriangle, Droplets, TrendingUp } from "lucide-react"

interface Facility {
  id: string
  county: string
  [key: string]: any
}

interface Violation {
  id: string
  pollutant: string
  facility: Facility
  severity?: string
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
      [] as { county: string; count: number }[],
    )

    return {
      total: violations.length,
      impairedWater: violations.filter((v) => v.severity === "HIGH").length,
      byCounty: byCounty.sort((a, b) => b.count - a.count),
      byPollutant: byPollutant.sort((a, b) => b.count - a.count),
    }
  }, [violations])

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Violations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-muted-foreground mr-3" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Impaired Waters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">{stats.impairedWater}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Top Pollutant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Droplets className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">{stats.byPollutant[0]?.pollutant || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Top County</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">{stats.byCounty[0]?.county || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
