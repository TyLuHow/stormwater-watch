"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SampleTable } from "@/components/esmr/sample-table"
import { ParameterChart } from "@/components/esmr/parameter-chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Building2, MapPin, Droplets, Calendar, TrendingUp } from "lucide-react"
import Link from "next/link"
import { formatNumber } from "@/lib/utils"
import type { FacilityDetailResponse, SampleListResponse } from "@/lib/api/esmr"

export default function FacilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [facility, setFacility] = useState<FacilityDetailResponse | null>(null)
  const [samples, setSamples] = useState<SampleListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Chart filters
  const [selectedParameter, setSelectedParameter] = useState<string>("")
  const [chartData, setChartData] = useState<{ date: string; value: number | null }[]>([])

  // Fetch facility details
  useEffect(() => {
    async function fetchFacility() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/esmr/facilities/${resolvedParams.id}`)
        if (!res.ok) throw new Error('Failed to fetch facility')

        const data = await res.json()
        setFacility(data)

        // Set default parameter for chart
        if (data.recentSamples.length > 0) {
          setSelectedParameter(data.recentSamples[0].parameter)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load facility')
      } finally {
        setLoading(false)
      }
    }

    fetchFacility()
  }, [resolvedParams.id])

  // Fetch samples for the facility
  useEffect(() => {
    async function fetchSamples() {
      try {
        const res = await fetch(`/api/esmr/samples?facilityPlaceId=${resolvedParams.id}&limit=50`)
        if (!res.ok) throw new Error('Failed to fetch samples')

        const data = await res.json()
        setSamples(data)
      } catch (err) {
        console.error('Error fetching samples:', err)
      }
    }

    fetchSamples()
  }, [resolvedParams.id])

  // Fetch chart data when parameter changes
  useEffect(() => {
    if (!selectedParameter || !facility) return

    async function fetchChartData(facilityData: FacilityDetailResponse) {
      try {
        // Find the parameter ID
        const paramSample = facilityData.recentSamples.find(
          (s) => s.parameter === selectedParameter
        )
        if (!paramSample) return

        // Fetch all samples for this parameter
        const res = await fetch(
          `/api/esmr/samples?facilityPlaceId=${resolvedParams.id}&limit=500&sortBy=samplingDate&sortOrder=asc`
        )
        if (!res.ok) throw new Error('Failed to fetch chart data')

        const data: SampleListResponse = await res.json()

        // Filter samples for the selected parameter and format for chart
        const chartSamples = data.samples
          .filter((s) => s.parameterName === selectedParameter)
          .map((s) => ({
            date: s.samplingDate,
            value: s.result ? parseFloat(s.result) : null,
          }))

        setChartData(chartSamples)
      } catch (err) {
        console.error('Error fetching chart data:', err)
      }
    }

    fetchChartData(facility)
  }, [selectedParameter, resolvedParams.id, facility])

  const handlePageChange = async (newOffset: number) => {
    try {
      const res = await fetch(
        `/api/esmr/samples?facilityPlaceId=${resolvedParams.id}&limit=50&offset=${newOffset}`
      )
      if (!res.ok) throw new Error('Failed to fetch samples')

      const data = await res.json()
      setSamples(data)
    } catch (err) {
      console.error('Error fetching samples:', err)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12 text-muted-foreground">
          Loading facility details...
        </div>
      </div>
    )
  }

  if (error || !facility) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-destructive">{error || 'Facility not found'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedParamData = facility.recentSamples.find(
    (s) => s.parameter === selectedParameter
  )

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border-b border-border/50">
        <div className="container mx-auto py-12 px-4">
          <Link href="/esmr/facilities">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Facilities
            </Button>
          </Link>
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-6 w-6 text-accent" />
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Facility Details
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {facility.facility.facilityName}
            </h1>
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className="text-sm">
                {facility.facility.regionName}
              </Badge>
              {facility.facility.receivingWaterBody && (
                <Badge variant="secondary" className="text-sm">
                  {facility.facility.receivingWaterBody}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Samples</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(facility.stats.totalSamples)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locations</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {facility.stats.totalLocations}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parameters</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {facility.stats.totalParameters}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Date Range</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {facility.stats.dateRange.earliest || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                to {facility.stats.dateRange.latest || "N/A"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monitoring Locations */}
        <Card>
          <CardHeader className="border-b bg-muted/30">
            <CardTitle>Monitoring Locations</CardTitle>
            <CardDescription>
              {facility.locations.length} location{facility.locations.length !== 1 ? 's' : ''} at this facility
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {facility.locations.map((location) => (
                <Card key={location.locationPlaceId}>
                  <CardHeader>
                    <CardTitle className="text-base">{location.locationCode}</CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="text-xs">
                        {location.locationType.replace(/_/g, " ")}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {formatNumber(location.sampleCount)} samples
                    </div>
                    {location.locationDesc && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {location.locationDesc}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Parameter Trends */}
        {facility.recentSamples.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Parameter Trends</h2>
                <p className="text-sm text-muted-foreground">
                  View historical data for measured parameters
                </p>
              </div>
              <Select value={selectedParameter} onValueChange={setSelectedParameter}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select parameter" />
                </SelectTrigger>
                <SelectContent>
                  {facility.recentSamples.map((param) => (
                    <SelectItem key={param.parameter} value={param.parameter}>
                      {param.parameter} ({param.sampleCount} samples)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedParamData && (
              <ParameterChart
                data={chartData}
                parameterName={selectedParameter}
                units={selectedParamData.units || ""}
              />
            )}
          </div>
        )}

        {/* Recent Samples Table */}
        {samples && (
          <Card>
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-2xl">Sample History</CardTitle>
              <CardDescription>
                Recent water quality samples from this facility
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <SampleTable data={samples} onPageChange={handlePageChange} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
