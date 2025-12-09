"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Download, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { formatNumber, cn } from "@/lib/utils"
import { exportSamples, type SampleExport } from "@/lib/export"
import type { SampleListResponse } from "@/lib/api/esmr"
import { LocationLabel } from "@/components/monitoring/LocationLabel"
import { formatLocationDisplay } from "@/lib/monitoring/location-parser"

interface SampleTableEnhancedProps {
  data: SampleListResponse
  onPageChange: (offset: number) => void
  onExport?: () => void
  filters?: Record<string, any>
  showCompliance?: boolean
}

type SortField = "date" | "facility" | "parameter" | "result" | "qualifier"
type SortOrder = "asc" | "desc"

export function SampleTableEnhanced({
  data,
  onPageChange,
  onExport,
  filters,
  showCompliance = false,
}: SampleTableEnhancedProps) {
  const { samples, pagination } = data
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  // Sort samples (client-side sorting for current page)
  const sortedSamples = useMemo(() => {
    return [...samples].sort((a, b) => {
      let compareValue = 0

      switch (sortField) {
        case "date":
          compareValue = a.samplingDate.localeCompare(b.samplingDate)
          break
        case "facility":
          compareValue = a.facilityName.localeCompare(b.facilityName)
          break
        case "parameter":
          compareValue = a.parameterName.localeCompare(b.parameterName)
          break
        case "result":
          const resultA = a.result ? parseFloat(a.result) : 0
          const resultB = b.result ? parseFloat(b.result) : 0
          compareValue = resultA - resultB
          break
        case "qualifier":
          compareValue = a.qualifier.localeCompare(b.qualifier)
          break
      }

      return sortOrder === "asc" ? compareValue : -compareValue
    })
  }, [samples, sortField, sortOrder])

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      onPageChange(Math.max(0, pagination.offset - pagination.limit))
    }
  }

  const handleNextPage = () => {
    if (pagination.hasMore) {
      onPageChange(pagination.offset + pagination.limit)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const handleExportClick = () => {
    if (onExport) {
      onExport()
    } else {
      // Default export behavior
      const exportData: SampleExport[] = sortedSamples.map((sample) => ({
        samplingDate: sample.samplingDate,
        samplingTime: sample.samplingTime,
        facilityName: sample.facilityName,
        locationType: formatLocationDisplay(sample.locationCode, sample.locationType, "compact"),
        locationCode: sample.locationCode,
        parameterName: sample.parameterName,
        parameterCategory: sample.parameterCategory,
        result: sample.result,
        units: sample.units,
        qualifier: sample.qualifier,
        mdl: sample.mdl,
        ml: sample.ml,
        rl: sample.rl,
        analyticalMethod: sample.analyticalMethod,
      }))

      exportSamples(exportData, filters)
    }
  }

  const getQualifierColor = (qualifier: string) => {
    switch (qualifier) {
      case "DETECTED":
        return "default"
      case "LESS_THAN":
        return "secondary"
      case "GREATER_THAN":
        return "destructive"
      case "NOT_DETECTED":
        return "outline"
      case "DETECTED_NOT_QUANTIFIED":
        return "default"
      default:
        return "default"
    }
  }

  const formatQualifier = (qualifier: string) => {
    return qualifier.replace(/_/g, " ")
  }

  // Determine compliance status (simplified - would need actual limits from database)
  const getComplianceStatus = (sample: typeof samples[0]) => {
    // This is a placeholder - actual implementation would compare against discharge limits
    if (sample.qualifier === "GREATER_THAN") {
      return { status: "warning", label: "Review Required", color: "bg-orange-500" }
    }
    if (sample.qualifier === "DETECTED") {
      return { status: "compliant", label: "Compliant", color: "bg-green-500" }
    }
    return { status: "unknown", label: "N/A", color: "bg-gray-400" }
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

  if (samples.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No samples found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {formatNumber(pagination.total)} total samples
        </div>
        <Button variant="outline" size="sm" onClick={handleExportClick}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortButton field="date">Date</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="facility">Facility</SortButton>
              </TableHead>
              <TableHead>Location</TableHead>
              <TableHead>
                <SortButton field="parameter">Parameter</SortButton>
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">
                <SortButton field="result">Result</SortButton>
              </TableHead>
              <TableHead>Units</TableHead>
              <TableHead>
                <SortButton field="qualifier">Qualifier</SortButton>
              </TableHead>
              {showCompliance && <TableHead>Compliance</TableHead>}
              <TableHead>Detection Limits</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSamples.map((sample) => {
              const compliance = showCompliance ? getComplianceStatus(sample) : null

              return (
                <TableRow key={sample.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {sample.samplingDate}
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px]">
                    <div className="truncate" title={sample.facilityName}>
                      {sample.facilityName}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <LocationLabel
                      locationCode={sample.locationCode}
                      locationType={sample.locationType}
                      format="stacked"
                      description={sample.locationDesc}
                    />
                  </TableCell>
                  <TableCell className="max-w-[150px]">
                    <div className="truncate" title={sample.parameterName}>
                      {sample.parameterName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {sample.parameterCategory || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {sample.result || "N/A"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sample.units}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getQualifierColor(sample.qualifier)} className="text-xs">
                      {formatQualifier(sample.qualifier)}
                    </Badge>
                  </TableCell>
                  {showCompliance && compliance && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", compliance.color)} />
                        <span className="text-xs">{compliance.label}</span>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="text-xs text-muted-foreground">
                    {sample.mdl && (
                      <div title="Method Detection Limit">MDL: {sample.mdl}</div>
                    )}
                    {sample.ml && (
                      <div title="Minimum Level">ML: {sample.ml}</div>
                    )}
                    {sample.rl && (
                      <div title="Reporting Limit">RL: {sample.rl}</div>
                    )}
                    {!sample.mdl && !sample.ml && !sample.rl && "N/A"}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {pagination.offset + 1}-
          {Math.min(pagination.offset + pagination.limit, pagination.total)} of{" "}
          {formatNumber(pagination.total)} samples
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={pagination.offset === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!pagination.hasMore}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
