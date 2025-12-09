"use client"

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
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import type { SampleListResponse } from "@/lib/api/esmr"
import { LocationLabel } from "@/components/monitoring/LocationLabel"

interface SampleTableProps {
  data: SampleListResponse
  onPageChange: (offset: number) => void
  onExport?: () => void
}

export function SampleTable({ data, onPageChange, onExport }: SampleTableProps) {
  const { samples, pagination } = data

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

  const getQualifierColor = (qualifier: string) => {
    switch (qualifier) {
      case "EQUALS":
        return "default"
      case "LESS_THAN":
        return "secondary"
      case "GREATER_THAN":
        return "destructive"
      case "NOT_DETECTED":
        return "outline"
      default:
        return "default"
    }
  }

  const formatQualifier = (qualifier: string) => {
    return qualifier.replace(/_/g, " ")
  }

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
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Facility</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Parameter</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Result</TableHead>
              <TableHead>Units</TableHead>
              <TableHead>Qualifier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {samples.map((sample) => (
              <TableRow key={sample.id}>
                <TableCell className="whitespace-nowrap">
                  {sample.samplingDate}
                </TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {sample.facilityName}
                </TableCell>
                <TableCell>
                  <LocationLabel
                    locationCode={sample.locationCode}
                    locationType={sample.locationType}
                    format="stacked"
                    description={sample.locationDesc}
                  />
                </TableCell>
                <TableCell>{sample.parameterName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {sample.parameterCategory || "N/A"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {sample.result || "N/A"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sample.units}
                </TableCell>
                <TableCell>
                  <Badge variant={getQualifierColor(sample.qualifier)} className="text-xs">
                    {formatQualifier(sample.qualifier)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
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
