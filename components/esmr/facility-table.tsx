"use client"

import { useState } from "react"
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
import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import type { FacilityListResponse } from "@/lib/api/esmr"

interface FacilityTableProps {
  data: FacilityListResponse
  onPageChange: (offset: number) => void
}

export function FacilityTable({ data, onPageChange }: FacilityTableProps) {
  const { facilities, pagination } = data

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

  if (facilities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No facilities found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Facility Name</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Receiving Water Body</TableHead>
              <TableHead className="text-right">Locations</TableHead>
              <TableHead className="text-right">Samples</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facilities.map((facility) => (
              <TableRow key={facility.facilityPlaceId}>
                <TableCell className="font-medium">
                  {facility.facilityName}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{facility.regionName}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {facility.receivingWaterBody || "N/A"}
                </TableCell>
                <TableCell className="text-right">
                  {facility.locationCount}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(facility.sampleCount)}
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
