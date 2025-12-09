import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SampleChart } from "@/components/facilities/sample-chart"
import { CasePacketButton } from "@/components/facilities/case-packet-button"
import { BackButton } from "@/components/ui/back-button"
import { AlertTriangle } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { LocationLabel, LocationBadge } from "@/components/monitoring/LocationLabel"
import { ESMRLocationType } from "@prisma/client"
import { ViolationTooltip } from "@/components/violations/ViolationTooltip"

// Force dynamic rendering to prevent database access during build
export const dynamic = 'force-dynamic'

// Type definitions for facility data
interface ViolationEvent {
  id: string
  pollutantKey: string
  count: number
  maxRatio: number | { toNumber(): number }
  reportingYear: string
  impairedWater: boolean
  firstDate: Date
  lastDate: Date
}

interface Sample {
  id: string
  pollutant: string
  sampleDate: Date
  value: number | { toNumber(): number }
  unit: string
  benchmark: number | { toNumber(): number }
  benchmarkUnit: string
  exceedanceRatio?: number | { toNumber(): number } | null
}

interface ESMRSample {
  id: string
  samplingDate: Date
  result: number | { toNumber(): number } | null
  units: string
  qualifier: string
  parameter: {
    parameterName: string
    category: string | null
  }
  analyticalMethod: {
    methodCode: string
    methodName: string
  } | null
}

interface ESMRLocation {
  locationCode: string
  locationType: string
  latitude: number | { toNumber(): number } | null
  longitude: number | { toNumber(): number } | null
  samples: ESMRSample[]
}

interface ESMRFacilityData {
  facilityPlaceId: number
  facilityName: string
  regionCode: string
  receivingWaterBody: string | null
  locations: ESMRLocation[]
}

interface FacilityData {
  id: string
  name: string
  permitId: string
  county: string | null
  receivingWater: string | null
  watershedHuc12: string | null
  ms4: string | null
  isInDAC: boolean
  violationEvents: ViolationEvent[]
  samples: Sample[]
  esmrFacilityId: number | null
  esmrFacility: ESMRFacilityData | null
}

export default async function FacilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let facility: FacilityData | null = null

  try {
    facility = await prisma.facility.findUnique({
      where: { id },
      include: {
        violationEvents: {
          where: { dismissed: false },
          orderBy: { maxRatio: "desc" },
        },
        samples: {
          orderBy: { sampleDate: "desc" },
          take: 500,
        },
        esmrFacility: {
          include: {
            locations: {
              include: {
                samples: {
                  include: {
                    parameter: true,
                    analyticalMethod: true,
                  },
                  orderBy: { samplingDate: "desc" },
                  take: 100,
                },
              },
            },
          },
        },
      },
    })
  } catch (error) {
    console.error("Database error fetching facility:", error)
    // Let it fall through to the notFound() check below
  }

  if (!facility) {
    notFound()
  }

  // Calculate metrics
  const ytdViolations = facility.violationEvents.filter(
    (v: ViolationEvent) => v.reportingYear === new Date().getFullYear().toString()
  ).length
  const worstViolation = facility.violationEvents[0]
  const worstPollutant = worstViolation?.pollutantKey || "N/A"
  const maxRatio = worstViolation ? Number(worstViolation.maxRatio) : 0

  // Get unique pollutants for charts
  const pollutants: string[] = [...new Set(facility.samples.map((s: Sample) => s.pollutant))]

  // VIOLATIONS-FIRST FACILITY PAGE
  // Per domain expert feedback: "Violations should be at the top of plant-specific pages"
  // Structure: violations → exceedances → general monitoring data

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <BackButton href="/dashboard" label="Back to Violations" />
        <h1 className="text-3xl font-bold mt-4">{facility.name}</h1>
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
              {facility.violationEvents.some((v: ViolationEvent) => v.impairedWater) && (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{facility.receivingWater || "N/A"}</p>
            {facility.violationEvents.some((v: ViolationEvent) => v.impairedWater) && (
              <Badge variant="destructive" className="mt-1">
                Impaired Water
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* VIOLATIONS FIRST - Active Violations Table */}
      {facility.violationEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Violations</CardTitle>
            <CardDescription>
              Exceedances requiring investigation and enforcement action.
              Each day in violation counts as a separate enforceable violation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pollutant</TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1">
                      Violation Days
                      <ViolationTooltip type="count" />
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1">
                      Max Exceedance
                      <ViolationTooltip type="exceedance" />
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1">
                      Period
                      <ViolationTooltip type="period" />
                    </span>
                  </TableHead>
                  <TableHead>Reporting Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facility.violationEvents.map((v: ViolationEvent) => {
                  const daysInViolation = Math.floor(
                    (v.lastDate.getTime() - v.firstDate.getTime()) / (1000 * 60 * 60 * 24)
                  ) + 1
                  const isRepeat = v.count >= 3

                  return (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.pollutantKey}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={isRepeat ? "destructive" : "secondary"} className="font-mono">
                            {v.count}
                          </Badge>
                          {isRepeat && (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              Repeat
                              <ViolationTooltip type="repeat" iconClassName="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={Number(v.maxRatio) > 2 ? "destructive" : "secondary"}>
                          {Number(v.maxRatio).toFixed(2)}× limit
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          <div>{v.firstDate.toLocaleDateString()} → {v.lastDate.toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            ({daysInViolation} {daysInViolation === 1 ? "day" : "days"})
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{v.reportingYear}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Case Packet Generation - High priority for attorneys */}
      {worstViolation && (
        <Card>
          <CardHeader>
            <CardTitle>Attorney Tools</CardTitle>
            <CardDescription>Generate attorney-ready case packet for violations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {facility.violationEvents.map((violation: ViolationEvent) => (
                <div key={violation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{violation.pollutantKey}</p>
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

      {/* Charts for each pollutant with violations */}
      {pollutants.map((pollutant: string) => {
        const violation = facility.violationEvents.find((v: ViolationEvent) => v.pollutantKey === pollutant)
        if (!violation) return null
        return <SampleChart key={pollutant} samples={facility.samples as any} pollutant={pollutant} />
      })}

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

      {/* eSMR Monitoring Data - DEPRIORITIZED per expert feedback */}
      {/* "if someone wants to see eSMR data they can pull data from eSMR directly" */}
      {facility.esmrFacility && (
        <Card>
          <CardHeader>
            <CardTitle>eSMR Monitoring Data</CardTitle>
            <CardDescription>
              Electronic Self-Monitoring Reports from {facility.esmrFacility.facilityName} (Region {facility.esmrFacility.regionCode})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* eSMR Facility Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pb-4 border-b">
                <div>
                  <p className="text-muted-foreground">eSMR Facility ID</p>
                  <p className="font-medium">{facility.esmrFacility.facilityPlaceId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Region</p>
                  <Badge variant="outline">{facility.esmrFacility.regionCode}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Monitoring Locations</p>
                  <p className="font-medium">{facility.esmrFacility.locations.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Samples</p>
                  <p className="font-medium">
                    {formatNumber(facility.esmrFacility.locations.reduce((sum, loc) => sum + loc.samples.length, 0))}
                  </p>
                </div>
              </div>

              {/* Recent eSMR Samples by Location */}
              {facility.esmrFacility.locations.map((location: ESMRLocation) => {
                if (location.samples.length === 0) return null;

                return (
                  <div key={location.locationCode} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">
                            <LocationLabel
                              locationCode={location.locationCode}
                              locationType={location.locationType as ESMRLocationType}
                              format="compact"
                            />
                          </h4>
                          <LocationBadge
                            locationCode={location.locationCode}
                            locationType={location.locationType as ESMRLocationType}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {location.locationCode}
                          {location.latitude && location.longitude && (
                            <> • {typeof location.latitude === 'number' ? location.latitude.toFixed(4) : location.latitude.toNumber().toFixed(4)}, {typeof location.longitude === 'number' ? location.longitude.toFixed(4) : location.longitude.toNumber().toFixed(4)}</>
                          )}
                        </p>
                      </div>
                      <Badge variant="secondary">{location.samples.length} samples</Badge>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Parameter</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Qualifier</TableHead>
                          <TableHead>Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {location.samples.slice(0, 20).map((sample: ESMRSample) => (
                          <TableRow key={sample.id}>
                            <TableCell className="text-sm">
                              {sample.samplingDate.toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{sample.parameter.parameterName}</p>
                                {sample.parameter.category && (
                                  <p className="text-xs text-muted-foreground">{sample.parameter.category}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {sample.result !== null ? (
                                <span>
                                  {typeof sample.result === 'number'
                                    ? sample.result.toFixed(2)
                                    : sample.result.toNumber().toFixed(2)
                                  } {sample.units}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={sample.qualifier === 'DETECTED' ? 'default' : 'outline'}
                                className={
                                  sample.qualifier === 'DETECTED' ? 'bg-blue-600' :
                                  sample.qualifier === 'NOT_DETECTED' ? 'bg-gray-500' :
                                  ''
                                }
                              >
                                {sample.qualifier.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {sample.analyticalMethod ? (
                                <span title={sample.analyticalMethod.methodName}>
                                  {sample.analyticalMethod.methodCode}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {location.samples.length > 20 && (
                      <p className="text-sm text-muted-foreground text-center">
                        Showing 20 of {location.samples.length} samples for this location
                      </p>
                    )}
                  </div>
                );
              })}

              {facility.esmrFacility.locations.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No monitoring locations found for this eSMR facility
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Samples - General monitoring data for context */}
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
              {facility.samples.map((s: Sample) => (
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
