"use client"

import type { ViolationEvent, Facility } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"

interface ViolationCardProps {
  violation: ViolationEvent & { facility: Facility }
  onDismiss?: () => void
}

export function ViolationCard({ violation, onDismiss }: ViolationCardProps) {
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
            {violation.dismissed && <Badge variant="outline">Dismissed</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Exceedances</p>
            <p className="text-2xl font-bold">{violation.count}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Max Ratio</p>
            <p className="text-2xl font-bold">{Number(violation.maxRatio).toFixed(2)}x</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Period</p>
            <p className="text-sm">
              {violation.firstDate.toLocaleDateString()} to {violation.lastDate.toLocaleDateString()}
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
