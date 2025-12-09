"use client"

import type { ViolationEvent, Facility } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
import { ViolationTooltip } from "./ViolationTooltip"

interface ViolationCardProps {
  violation: ViolationEvent & { facility: Facility }
  onDismiss?: () => void
}

export function ViolationCard({ violation, onDismiss }: ViolationCardProps) {
  // Calculate days in violation
  const daysInViolation = Math.floor(
    (violation.lastDate.getTime() - violation.firstDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1 // Add 1 to include both start and end dates

  // Determine if repeat violation (count >= 3 is heuristic for repeat)
  const isRepeat = violation.count >= 3

  return (
    <Card className={violation.dismissed ? "opacity-50" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{violation.facility.name}</CardTitle>
            <CardDescription>{violation.pollutantKey}</CardDescription>
          </div>
          <div className="flex gap-2">
            {violation.impairedWater && <Badge variant="destructive">Impaired Water</Badge>}
            {isRepeat && (
              <Badge variant="destructive" className="flex items-center gap-1">
                Repeat Violation
                <ViolationTooltip type="repeat" iconClassName="h-3 w-3" />
              </Badge>
            )}
            {violation.dismissed && <Badge variant="outline">Dismissed</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Violation Count
              <ViolationTooltip type="count" />
            </p>
            <p className="text-2xl font-bold">{violation.count}</p>
            <p className="text-xs text-muted-foreground mt-1">days in violation</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Max Exceedance
              <ViolationTooltip type="exceedance" />
            </p>
            <p className="text-2xl font-bold">{Number(violation.maxRatio).toFixed(2)}×</p>
            <p className="text-xs text-muted-foreground mt-1">times limit</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Violation Period
              <ViolationTooltip type="period" />
            </p>
            <p className="text-sm font-medium">
              {violation.firstDate.toLocaleDateString()}
            </p>
            <p className="text-sm font-medium">
              → {violation.lastDate.toLocaleDateString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ({daysInViolation} day{daysInViolation !== 1 ? "s" : ""})
            </p>
          </div>
        </div>

        {violation.facility.county && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{violation.facility.county} County</span>
          </div>
        )}

        {onDismiss && !violation.dismissed && (
          <Button variant="outline" size="sm" onClick={onDismiss} className="w-full bg-transparent">
            Mark as Dismissed
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
