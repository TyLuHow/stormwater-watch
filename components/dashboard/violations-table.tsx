"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
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
  count?: number
  exceedanceCount?: number
  maxRatio?: number | string | Decimal
  severity?: string
  facility: Facility
}

interface ViolationsTableProps {
  violations: Violation[]
}

export function ViolationsTable({ violations }: ViolationsTableProps) {
  if (violations.length === 0) {
    return <p className="text-muted-foreground">No violations found</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Facility</TableHead>
          <TableHead>Pollutant</TableHead>
          <TableHead>
            <span className="flex items-center gap-1">
              Violation Days
              <ViolationTooltip type="count" />
            </span>
          </TableHead>
          <TableHead>
            <span className="flex items-center gap-1">
              Severity
              <ViolationTooltip type="severity" />
            </span>
          </TableHead>
          <TableHead>County</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {violations.map((violation) => {
          const count = violation.count ?? violation.exceedanceCount ?? 0
          const severity = violation.severity ?? "MEDIUM"
          const facilityId = violation.facilityId ?? violation.facility.id
          const isRepeat = count >= 3

          return (
            <TableRow key={violation.id}>
              <TableCell className="font-medium">{violation.facility.name}</TableCell>
              <TableCell>{violation.pollutant}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{count}</span>
                  {isRepeat && (
                    <Badge variant="outline" className="text-xs">
                      Repeat
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={severity === "HIGH" ? "destructive" : severity === "MEDIUM" ? "default" : "secondary"}>
                  {severity}
                </Badge>
              </TableCell>
              <TableCell>{violation.facility.county}</TableCell>
              <TableCell>
                {facilityId && (
                  <Link href={`/facilities/${facilityId}`} className="text-blue-600 hover:underline text-sm">
                    View
                  </Link>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
