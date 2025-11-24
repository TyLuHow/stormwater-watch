"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { Decimal } from "@prisma/client/runtime/library"

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
          <TableHead>Count</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>County</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {violations.map((violation) => {
          const count = violation.count ?? violation.exceedanceCount ?? 0
          const severity = violation.severity ?? "MEDIUM"
          const facilityId = violation.facilityId ?? violation.facility.id

          return (
            <TableRow key={violation.id}>
              <TableCell className="font-medium">{violation.facility.name}</TableCell>
              <TableCell>{violation.pollutant}</TableCell>
              <TableCell>{count}</TableCell>
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
