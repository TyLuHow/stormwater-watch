"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SampleTable } from "@/components/esmr/sample-table"
import { Database, Filter, X, Loader2 } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import type { SampleListResponse, FacilityListResponse, ParameterListResponse } from "@/lib/api/esmr"
import { formatLocationDisplay } from "@/lib/monitoring/location-parser"

function SamplesPageContent() {
  const searchParams = useSearchParams()
  const [samples, setSamples] = useState<SampleListResponse | null>(null)
  const [facilities, setFacilities] = useState<FacilityListResponse | null>(null)
  const [parameters, setParameters] = useState<ParameterListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters - check URL params first
  const [selectedFacility, setSelectedFacility] = useState(searchParams.get("facilityPlaceId") || "")
  const [selectedParameter, setSelectedParameter] = useState(searchParams.get("parameterId") || "")
  const [selectedQualifier, setSelectedQualifier] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [offset, setOffset] = useState(0)

  // Fetch filter options
  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        const [facilitiesRes, parametersRes] = await Promise.all([
          fetch('/api/esmr/facilities?limit=500'),
          fetch('/api/esmr/parameters?limit=500'),
        ])

        if (facilitiesRes.ok) {
          const facilitiesData = await facilitiesRes.json()
          setFacilities(facilitiesData)
        }

        if (parametersRes.ok) {
          const parametersData = await parametersRes.json()
          setParameters(parametersData)
        }
      } catch (err) {
        console.error('Error fetching filter options:', err)
      }
    }

    fetchFilterOptions()
  }, [])

  // Fetch samples
  const fetchSamples = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        limit: "50",
        offset: offset.toString(),
      })

      if (selectedFacility) params.append("facilityPlaceId", selectedFacility)
      if (selectedParameter) params.append("parameterId", selectedParameter)
      if (selectedQualifier) params.append("qualifier", selectedQualifier)
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const res = await fetch(`/api/esmr/samples?${params}`)
      if (!res.ok) throw new Error('Failed to fetch samples')

      const data = await res.json()
      setSamples(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load samples')
    } finally {
      setLoading(false)
    }
  }, [selectedFacility, selectedParameter, selectedQualifier, startDate, endDate, offset])

  useEffect(() => {
    fetchSamples()
  }, [fetchSamples])

  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset)
  }

  const handleClearFilters = () => {
    setSelectedFacility("")
    setSelectedParameter("")
    setSelectedQualifier("")
    setStartDate("")
    setEndDate("")
    setOffset(0)
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        limit: "10000", // Export more records
      })

      if (selectedFacility) params.append("facilityPlaceId", selectedFacility)
      if (selectedParameter) params.append("parameterId", selectedParameter)
      if (selectedQualifier) params.append("qualifier", selectedQualifier)
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const res = await fetch(`/api/esmr/samples?${params}`)
      if (!res.ok) throw new Error('Failed to fetch samples')

      const data: SampleListResponse = await res.json()

      // Convert to CSV
      const headers = [
        "Date",
        "Time",
        "Facility",
        "Location Type",
        "Location Code",
        "Parameter",
        "Category",
        "Result",
        "Units",
        "Qualifier",
        "MDL",
        "ML",
        "RL",
        "Method",
      ]

      const rows = data.samples.map((sample) => [
        sample.samplingDate,
        sample.samplingTime,
        sample.facilityName,
        formatLocationDisplay(sample.locationCode, sample.locationType, "compact"),
        sample.locationCode,
        sample.parameterName,
        sample.parameterCategory || "",
        sample.result || "",
        sample.units,
        sample.qualifier,
        sample.mdl || "",
        sample.ml || "",
        sample.rl || "",
        sample.analyticalMethod || "",
      ])

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")

      // Download
      const blob = new Blob([csv], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `esmr-samples-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting samples:', err)
      alert('Failed to export samples')
    }
  }

  const hasActiveFilters =
    selectedFacility || selectedParameter || selectedQualifier || startDate || endDate

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border-b border-border/50">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-6 w-6 text-accent" />
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                eSMR Sample Search
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Sample{" "}
              <span className="text-gradient">Explorer</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Search and filter through water quality samples with advanced options and CSV export.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Advanced Search
                </CardTitle>
                <CardDescription>
                  Filter samples by facility, parameter, date range, and more
                </CardDescription>
              </div>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Facility Filter */}
              <div className="space-y-2">
                <Label htmlFor="facility">Facility</Label>
                <Select
                  value={selectedFacility}
                  onValueChange={(value) => {
                    setSelectedFacility(value)
                    setOffset(0)
                  }}
                >
                  <SelectTrigger id="facility">
                    <SelectValue placeholder="All facilities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All facilities</SelectItem>
                    {facilities?.facilities.map((facility) => (
                      <SelectItem
                        key={facility.facilityPlaceId}
                        value={facility.facilityPlaceId.toString()}
                      >
                        {facility.facilityName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Parameter Filter */}
              <div className="space-y-2">
                <Label htmlFor="parameter">Parameter</Label>
                <Select
                  value={selectedParameter}
                  onValueChange={(value) => {
                    setSelectedParameter(value)
                    setOffset(0)
                  }}
                >
                  <SelectTrigger id="parameter">
                    <SelectValue placeholder="All parameters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All parameters</SelectItem>
                    {parameters?.parameters.map((param) => (
                      <SelectItem key={param.id} value={param.id}>
                        {param.parameterName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Qualifier Filter */}
              <div className="space-y-2">
                <Label htmlFor="qualifier">Qualifier</Label>
                <Select
                  value={selectedQualifier}
                  onValueChange={(value) => {
                    setSelectedQualifier(value)
                    setOffset(0)
                  }}
                >
                  <SelectTrigger id="qualifier">
                    <SelectValue placeholder="All qualifiers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All qualifiers</SelectItem>
                    <SelectItem value="EQUALS">EQUALS</SelectItem>
                    <SelectItem value="LESS_THAN">LESS THAN</SelectItem>
                    <SelectItem value="GREATER_THAN">GREATER THAN</SelectItem>
                    <SelectItem value="NOT_DETECTED">NOT DETECTED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setOffset(0)
                  }}
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setOffset(0)
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Samples Table */}
        <Card>
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Sample Results</CardTitle>
                <CardDescription className="mt-1">
                  {samples
                    ? `${formatNumber(samples.pagination.total)} samples found`
                    : 'Loading...'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {error ? (
              <div className="text-center py-12 text-destructive">{error}</div>
            ) : loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading samples...
              </div>
            ) : samples ? (
              <SampleTable
                data={samples}
                onPageChange={handlePageChange}
                onExport={handleExport}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border-b border-border/50">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-6 w-6 text-accent" />
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                eSMR Sample Search
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Sample{" "}
              <span className="text-gradient">Explorer</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Search and filter through water quality samples with advanced options and CSV export.
            </p>
          </div>
        </div>
      </div>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    </div>
  )
}

export default function SamplesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SamplesPageContent />
    </Suspense>
  )
}
