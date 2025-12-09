"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
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
import { exportFacilities, type FacilityExport } from "@/lib/export"
import type { FacilityListResponse } from "@/lib/api/esmr"

interface FacilityTableEnhancedProps {
  data: FacilityListResponse
  onPageChange: (offset: number) => void
  filters?: Record<string, any>
}

type SortField = "name" | "region" | "locations" | "samples" | "receivingWater"
type SortOrder = "asc" | "desc"

export function FacilityTableEnhanced({
  data,
  onPageChange,
  filters,
}: FacilityTableEnhancedProps) {
  const { facilities, pagination } = data
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  // Sort facilities (client-side sorting for current page)
  const sortedFacilities = useMemo(() => {
    return [...facilities].sort((a, b) => {
      let compareValue = 0

      switch (sortField) {
        case "name":
          compareValue = a.facilityName.localeCompare(b.facilityName)
          break
        case "region":
          compareValue = a.regionName.localeCompare(b.regionName)
          break
        case "locations":
          compareValue = a.locationCount - b.locationCount
          break
        case "samples":
          compareValue = a.sampleCount - b.sampleCount
          break
        case "receivingWater":
          const waterA = a.receivingWaterBody || ""
          const waterB = b.receivingWaterBody || ""
          compareValue = waterA.localeCompare(waterB)
          break
      }

      return sortOrder === "asc" ? compareValue : -compareValue
    })
  }, [facilities, sortField, sortOrder])

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
      setSortOrder(field === "samples" || field === "locations" ? "desc" : "asc")
    }
  }

  const handleExport = () => {
    const exportData: FacilityExport[] = sortedFacilities.map((facility) => ({
      facilityName: facility.facilityName,
      facilityPlaceId: facility.facilityPlaceId,
      regionName: facility.regionName,
      receivingWaterBody: facility.receivingWaterBody,
      locationCount: facility.locationCount,
      sampleCount: facility.sampleCount,
    }))

    exportFacilities(exportData, filters)
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

  if (facilities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No facilities found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortButton field="name">Facility Name</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="region">Region</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="receivingWater">Receiving Water Body</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="locations">Locations</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="samples">Samples</SortButton>
              </TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFacilities.map((facility) => (
              <TableRow key={facility.facilityPlaceId}>
                <TableCell className="font-medium max-w-[300px]">
                  <div className="truncate" title={facility.facilityName}>
                    {facility.facilityName}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{facility.regionName}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[200px]">
                  <div className="truncate" title={facility.receivingWaterBody || "N/A"}>
                    {facility.receivingWaterBody || "N/A"}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {facility.locationCount}
                </TableCell>
                <TableCell className="text-right font-mono">
                  <span
                    className={cn(
                      facility.sampleCount > 1000 && "font-semibold text-primary"
                    )}
                  >
                    {formatNumber(facility.sampleCount)}
                  </span>
                </TableCell>
                <TableCell>
                  <Link href={`/esmr/facilities/${facility.facilityPlaceId}`}>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
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
          {formatNumber(pagination.total)} facilities
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
