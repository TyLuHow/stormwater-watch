"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { exportViolations, type ViolationExport } from "@/lib/export"
import type { Decimal } from "@prisma/client/runtime/library"
import { ViolationTooltip } from "@/components/violations/ViolationTooltip"

interface Facility {
  id?: string
  name: string
  county: string | null
  [key: string]: any
}

interface Violation {
  id: string
  facilityId?: string
  pollutant: string
  pollutantKey?: string
  count?: number
  exceedanceCount?: number
  maxRatio?: number | string | Decimal
  severity?: string
  maxSeverity?: string
  facility: Facility
  firstDate?: Date | string
  lastDate?: Date | string
  impairedWater?: boolean
  // Extended fields for enhanced display
  dischargeLimit?: number | string | null
  screeningStandard?: number | string | null
  exceedanceRatio?: number | string | null
}

interface ViolationsTableEnhancedProps {
  violations: Violation[]
  showExport?: boolean
  filters?: Record<string, any>
}

type SortField = "facility" | "pollutant" | "count" | "severity" | "maxRatio" | "firstDate" | "daysActive"
type SortOrder = "asc" | "desc"

const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MODERATE: 2,
  MEDIUM: 2,
  LOW: 1,
}

export function ViolationsTableEnhanced({
  violations,
  showExport = true,
  filters
}: ViolationsTableEnhancedProps) {
  const [sortField, setSortField] = useState<SortField>("maxRatio")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  // Calculate days active for each violation
  const violationsWithDays = useMemo(() => {
    return violations.map((v) => {
      let daysActive: number | null = null
      if (v.firstDate && v.lastDate) {
        const first = typeof v.firstDate === "string" ? new Date(v.firstDate) : v.firstDate
        const last = typeof v.lastDate === "string" ? new Date(v.lastDate) : v.lastDate
        daysActive = Math.floor((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24))
      }
      return { ...v, daysActive }
    })
  }, [violations])

  // Sort violations
  const sortedViolations = useMemo(() => {
    return [...violationsWithDays].sort((a, b) => {
      let compareValue = 0

      switch (sortField) {
        case "facility":
          compareValue = a.facility.name.localeCompare(b.facility.name)
          break
        case "pollutant":
          compareValue = a.pollutant.localeCompare(b.pollutant)
          break
        case "count":
          const countA = a.count ?? a.exceedanceCount ?? 0
          const countB = b.count ?? b.exceedanceCount ?? 0
          compareValue = countA - countB
          break
        case "severity":
          const severityA = a.severity ?? a.maxSeverity ?? "MEDIUM"
          const severityB = b.severity ?? b.maxSeverity ?? "MEDIUM"
          compareValue = SEVERITY_ORDER[severityA] - SEVERITY_ORDER[severityB]
          break
        case "maxRatio":
          const ratioA = typeof a.maxRatio === "number" ? a.maxRatio : parseFloat(String(a.maxRatio || 0))
          const ratioB = typeof b.maxRatio === "number" ? b.maxRatio : parseFloat(String(b.maxRatio || 0))
          compareValue = ratioA - ratioB
          break
        case "firstDate":
          if (a.firstDate && b.firstDate) {
            const dateA = typeof a.firstDate === "string" ? new Date(a.firstDate) : a.firstDate
            const dateB = typeof b.firstDate === "string" ? new Date(b.firstDate) : b.firstDate
            compareValue = dateA.getTime() - dateB.getTime()
          }
          break
        case "daysActive":
          compareValue = (a.daysActive ?? 0) - (b.daysActive ?? 0)
          break
      }

      return sortOrder === "asc" ? compareValue : -compareValue
    })
  }, [violationsWithDays, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  const handleExport = () => {
    const exportData: ViolationExport[] = sortedViolations.map((v) => ({
      facilityName: v.facility.name,
      facilityId: v.facilityId ?? v.facility.id ?? "",
      county: v.facility.county,
      pollutant: v.pollutant,
      firstDate: v.firstDate
        ? typeof v.firstDate === "string"
          ? v.firstDate
          : v.firstDate.toISOString().split("T")[0]
        : "",
      lastDate: v.lastDate
        ? typeof v.lastDate === "string"
          ? v.lastDate
          : v.lastDate.toISOString().split("T")[0]
        : "",
      count: v.count ?? v.exceedanceCount ?? 0,
      maxRatio: String(v.maxRatio ?? ""),
      severity: v.severity ?? v.maxSeverity ?? "MEDIUM",
      impairedWater: v.impairedWater ?? false,
      dischargeLimit: v.dischargeLimit ? String(v.dischargeLimit) : null,
      screeningStandard: v.screeningStandard ? String(v.screeningStandard) : null,
      exceedanceRatio: v.exceedanceRatio ? String(v.exceedanceRatio) : v.maxRatio ? String(v.maxRatio) : null,
      daysActive: v.daysActive ?? undefined,
    }))

    exportViolations(exportData, filters)
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 hover:bg-muted"
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field ? (
        sortOrder === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-2 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  )

  if (violations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No violations found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showExport && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortButton field="facility">Facility</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="pollutant">Pollutant</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="firstDate">First Violation</SortButton>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <SortButton field="daysActive">Days in Violation</SortButton>
                  <ViolationTooltip type="days" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <SortButton field="count">Violation Count</SortButton>
                  <ViolationTooltip type="count" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <SortButton field="maxRatio">Max Exceedance</SortButton>
                  <ViolationTooltip type="exceedance" />
                </div>
              </TableHead>
              <TableHead>Discharge Limit</TableHead>
              <TableHead>Screening Std</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <SortButton field="severity">Severity</SortButton>
                  <ViolationTooltip type="severity" />
                </div>
              </TableHead>
              <TableHead>County</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedViolations.map((violation) => {
              const count = violation.count ?? violation.exceedanceCount ?? 0
              const severity = violation.severity ?? violation.maxSeverity ?? "MEDIUM"
              const facilityId = violation.facilityId ?? violation.facility.id
              const maxRatio = violation.maxRatio
                ? typeof violation.maxRatio === "number"
                  ? violation.maxRatio.toFixed(2)
                  : String(violation.maxRatio)
                : "N/A"

              const firstDate = violation.firstDate
                ? typeof violation.firstDate === "string"
                  ? violation.firstDate
                  : violation.firstDate.toISOString().split("T")[0]
                : "N/A"

              const isRepeat = count >= 3

              return (
                <TableRow key={violation.id}>
                  <TableCell className="font-medium max-w-[200px]">
                    <div className="truncate" title={violation.facility.name}>
                      {violation.facility.name}
                    </div>
                    {violation.impairedWater && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Impaired Water
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{violation.pollutant}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {firstDate}
                  </TableCell>
                  <TableCell className="text-sm">
                    {violation.daysActive !== null ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-mono",
                            violation.daysActive > 90 && "text-destructive font-semibold",
                            violation.daysActive > 30 && violation.daysActive <= 90 && "text-orange-600"
                          )}
                        >
                          {violation.daysActive}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {violation.daysActive === 1 ? "day" : "days"}
                        </span>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{count}</span>
                      {isRepeat && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          Repeat
                          <ViolationTooltip type="repeat" iconClassName="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "font-mono font-semibold",
                        parseFloat(maxRatio) > 2 && "text-destructive",
                        parseFloat(maxRatio) > 1.5 && parseFloat(maxRatio) <= 2 && "text-orange-600"
                      )}
                    >
                      {maxRatio}x
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    {violation.dischargeLimit ? String(violation.dischargeLimit) : "N/A"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    {violation.screeningStandard ? String(violation.screeningStandard) : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        severity === "CRITICAL"
                          ? "destructive"
                          : severity === "HIGH"
                          ? "destructive"
                          : severity === "MODERATE" || severity === "MEDIUM"
                          ? "default"
                          : "secondary"
                      }
                      className={cn(
                        severity === "HIGH" && "bg-orange-600 hover:bg-orange-700"
                      )}
                    >
                      {severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {violation.facility.county}
                  </TableCell>
                  <TableCell>
                    {facilityId && (
                      <Link
                        href={`/facilities/${facilityId}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {sortedViolations.length} violation event{sortedViolations.length !== 1 ? "s" : ""}
      </div>
    </div>
  )
}
