import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SampleChart } from "@/components/facilities/sample-chart"
import { CasePacketButton } from "@/components/facilities/case-packet-button"
import { AlertTriangle, MapPin } from "lucide-react"
import { DEV_MODE, mockFacilities, mockViolations } from "@/lib/dev-mode"

// Force dynamic rendering to prevent database access during build
export const dynamic = 'force-dynamic'

// Mock samples for demo mode
const mockSamples = [
  {
    id: "sample-001",
    pollutant: "Total Nitrogen",
    sampleDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    value: 12.5,
    unit: "mg/L",
    benchmark: 5.0,
    benchmarkUnit: "mg/L",
    exceedanceRatio: 2.5,
  },
  {
    id: "sample-002",
    pollutant: "Total Nitrogen",
    sampleDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    value: 8.0,
    unit: "mg/L",
    benchmark: 5.0,
    benchmarkUnit: "mg/L",
    exceedanceRatio: 1.6,
  },
  {
    id: "sample-003",
    pollutant: "Phosphorus",
    sampleDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    value: 1.8,
    unit: "mg/L",
    benchmark: 1.0,
    benchmarkUnit: "mg/L",
    exceedanceRatio: 1.8,
  },
]

export default async function FacilityPage({ params }: { params: { id: string } }) {
  let facility: any = null
  let usingMockData = DEV_MODE

  if (DEV_MODE) {
    // Use mock data
    const mockFacility = mockFacilities.find(f => f.id === params.id)
    if (mockFacility) {
      const facilityViolations = mockViolations
        .filter(v => v.facilityId === params.id)
        .map(v => ({
          ...v,
          firstDate: v.firstDate,
          lastDate: v.lastDate,
        }))
      facility = {
        ...mockFacility,
        violationEvents: facilityViolations,
        samples: mockSamples,
      }
    }
  } else {
    // Try to fetch from database
    try {
      facility = await prisma.facility.findUnique({
        where: { id: params.id },
        include: {
          violationEvents: {
            where: { dismissed: false },
            orderBy: { maxRatio: "desc" },
          },
          samples: {
            orderBy: { sampleDate: "desc" },
            take: 500,
          },
        },
      })
    } catch (error) {
      console.error("Database error fetching facility:", error)
      // Fall back to mock data
      usingMockData = true
      const mockFacility = mockFacilities.find(f => f.id === params.id)
      if (mockFacility) {
        const facilityViolations = mockViolations
          .filter(v => v.facilityId === params.id)
          .map(v => ({
            ...v,
            firstDate: v.firstDate,
            lastDate: v.lastDate,
          }))
        facility = {
          ...mockFacility,
          violationEvents: facilityViolations,
          samples: mockSamples,
        }
      }
    }
  }

  if (!facility) {
    notFound()
  }

  // Calculate metrics
  const ytdViolations = facility.violationEvents.filter(
    (v) => v.reportingYear === new Date().getFullYear().toString()
  ).length
  const worstViolation = facility.violationEvents[0]
  const worstPollutant = worstViolation?.pollutant || "N/A"
  const maxRatio = worstViolation ? Number(worstViolation.maxRatio) : 0

  // Get unique pollutants for charts
  const pollutants = [...new Set(facility.samples.map((s) => s.pollutant))]

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{facility.name}</h1>
          {usingMockData && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
              Demo Mode
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-2">{facility.county} County</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Permit ID</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-mono">{facility.permitId}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{facility.violationEvents.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {ytdViolations} this reporting year
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Worst Pollutant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{worstPollutant}</p>
            {maxRatio > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {maxRatio.toFixed(2)}× NAL
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Receiving Water
              {facility.violationEvents.some((v) => v.impairedWater) && (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{facility.receivingWater || "N/A"}</p>
            {facility.violationEvents.some((v) => v.impairedWater) && (
              <Badge variant="destructive" className="mt-1">
                Impaired Water
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Location & Enrichment Data */}
      {(facility.county || facility.watershedHuc12 || facility.ms4 || facility.isInDAC) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Geographic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {facility.county && (
                <div>
                  <p className="text-muted-foreground">County</p>
                  <p className="font-medium">{facility.county}</p>
                </div>
              )}
              {facility.watershedHuc12 && (
                <div>
                  <p className="text-muted-foreground">Watershed (HUC12)</p>
                  <p className="font-medium">{facility.watershedHuc12}</p>
                </div>
              )}
              {facility.ms4 && (
                <div>
                  <p className="text-muted-foreground">MS4 Jurisdiction</p>
                  <p className="font-medium">{facility.ms4}</p>
                </div>
              )}
              {facility.isInDAC && (
                <div>
                  <p className="text-muted-foreground">Environmental Justice</p>
                  <Badge className="bg-green-600">Disadvantaged Community</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts for each pollutant with violations */}
      {pollutants.map((pollutant) => {
        const violation = facility.violationEvents.find((v) => v.pollutant === pollutant)
        if (!violation) return null
        return <SampleChart key={pollutant} samples={facility.samples} pollutant={pollutant} />
      })}

      {/* Case Packet Generation */}
      {worstViolation && (
        <Card>
          <CardHeader>
            <CardTitle>Attorney Tools</CardTitle>
            <CardDescription>Generate attorney-ready case packet for violations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {facility.violationEvents.map((violation) => (
                <div key={violation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{violation.pollutant}</p>
                    <p className="text-sm text-muted-foreground">
                      {violation.count} exceedances • Max: {Number(violation.maxRatio).toFixed(2)}× NAL
                    </p>
                  </div>
                  <CasePacketButton
                    violationEventId={violation.id}
                    facilityName={facility.name}
                    permitId={facility.permitId}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {facility.violationEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pollutant</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Max Ratio</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Reporting Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facility.violationEvents.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.pollutant}</TableCell>
                    <TableCell>
                      <Badge variant={v.count >= 3 ? "destructive" : "secondary"}>
                        {v.count} {v.count >= 3 ? " (Repeat)" : ""}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={Number(v.maxRatio) > 2 ? "destructive" : "secondary"}>
                        {Number(v.maxRatio).toFixed(2)}×
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {v.firstDate.toLocaleDateString()} → {v.lastDate.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">{v.reportingYear}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Samples</CardTitle>
          <CardDescription>Last 50 samples from this facility</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Pollutant</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Benchmark</TableHead>
                <TableHead>Ratio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facility.samples.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm">{s.sampleDate.toLocaleDateString()}</TableCell>
                  <TableCell>{s.pollutant}</TableCell>
                  <TableCell>
                    {Number(s.value).toFixed(2)} {s.unit}
                  </TableCell>
                  <TableCell>
                    {Number(s.benchmark).toFixed(2)} {s.benchmarkUnit}
                  </TableCell>
                  <TableCell>
                    {s.exceedanceRatio ? (
                      <Badge variant={Number(s.exceedanceRatio) > 1 ? "destructive" : "outline"}>
                        {Number(s.exceedanceRatio).toFixed(2)}x
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
