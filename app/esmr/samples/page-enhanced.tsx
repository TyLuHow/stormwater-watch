"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SampleTableEnhanced } from "@/components/esmr/sample-table-enhanced"
import { FilterBar, DateRangeFilter, ParameterFilter } from "@/components/filters"
import { Database, Loader2 } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import type { SampleListResponse, FacilityListResponse, ParameterListResponse } from "@/lib/api/esmr"
import { exportSamples, type SampleExport } from "@/lib/export"
import { formatLocationDisplay } from "@/lib/monitoring/location-parser"

function SamplesPageEnhancedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [samples, setSamples] = useState<SampleListResponse | null>(null)
  const [facilities, setFacilities] = useState<FacilityListResponse | null>(null)
  const [parameters, setParameters] = useState<ParameterListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters - initialize from URL params
  const [selectedFacility, setSelectedFacility] = useState(searchParams.get("facilityPlaceId") || "")
  const [selectedParameter, setSelectedParameter] = useState(searchParams.get("parameterId") || "")
  const [selectedQualifier, setSelectedQualifier] = useState(searchParams.get("qualifier") || "")
  const [selectedLocationType, setSelectedLocationType] = useState(searchParams.get("locationType") || "")
  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined
  )
  const [offset, setOffset] = useState(0)

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()

    if (selectedFacility) params.append("facilityPlaceId", selectedFacility)
    if (selectedParameter) params.append("parameterId", selectedParameter)
    if (selectedQualifier) params.append("qualifier", selectedQualifier)
    if (selectedLocationType) params.append("locationType", selectedLocationType)
    if (startDate) params.append("startDate", startDate.toISOString().split("T")[0])
    if (endDate) params.append("endDate", endDate.toISOString().split("T")[0])

    const queryString = params.toString()
    const newUrl = queryString ? `?${queryString}` : "/esmr/samples"

    // Only update if URL actually changed
    if (window.location.search !== `?${queryString}`) {
      router.replace(newUrl, { scroll: false })
    }
  }, [selectedFacility, selectedParameter, selectedQualifier, selectedLocationType, startDate, endDate, router])

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
      if (selectedLocationType) params.append("locationType", selectedLocationType)
      if (startDate) params.append("startDate", startDate.toISOString().split("T")[0])
      if (endDate) params.append("endDate", endDate.toISOString().split("T")[0])

      const res = await fetch(`/api/esmr/samples?${params}`)
      if (!res.ok) throw new Error('Failed to fetch samples')

      const data = await res.json()
      setSamples(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load samples')
    } finally {
      setLoading(false)
    }
  }, [selectedFacility, selectedParameter, selectedQualifier, selectedLocationType, startDate, endDate, offset])

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
    setSelectedLocationType("")
    setStartDate(undefined)
    setEndDate(undefined)
    setOffset(0)
    router.replace("/esmr/samples")
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        limit: "10000", // Export more records
      })

      if (selectedFacility) params.append("facilityPlaceId", selectedFacility)
      if (selectedParameter) params.append("parameterId", selectedParameter)
      if (selectedQualifier) params.append("qualifier", selectedQualifier)
      if (selectedLocationType) params.append("locationType", selectedLocationType)
      if (startDate) params.append("startDate", startDate.toISOString().split("T")[0])
      if (endDate) params.append("endDate", endDate.toISOString().split("T")[0])

      const res = await fetch(`/api/esmr/samples?${params}`)
      if (!res.ok) throw new Error('Failed to fetch samples')

      const data: SampleListResponse = await res.json()

      const exportData: SampleExport[] = data.samples.map((sample) => ({
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

      const filters = {
        facility: selectedFacility,
        parameter: selectedParameter,
        qualifier: selectedQualifier,
        locationType: selectedLocationType,
        startDate: startDate?.toISOString().split("T")[0],
        endDate: endDate?.toISOString().split("T")[0],
      }

      exportSamples(exportData, filters)
    } catch (err) {
      console.error('Error exporting samples:', err)
      alert('Failed to export samples')
    }
  }

  const activeFilterCount = [
    selectedFacility,
    selectedParameter,
    selectedQualifier,
    selectedLocationType,
    startDate,
    endDate,
  ].filter(Boolean).length

  // Prepare parameter data for filter component
  const parameterOptions = parameters
    ? parameters.parameters.map((p) => ({
        id: p.id,
        name: p.parameterName,
        category: p.category,
        count: p.sampleCount,
      }))
    : []

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
        <FilterBar
          title="Advanced Search"
          description="Filter samples by facility, parameter, date range, and more"
          activeFilterCount={activeFilterCount}
          onClearAll={handleClearFilters}
        >
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
          <ParameterFilter
            parameters={parameterOptions}
            value={selectedParameter}
            onChange={(value) => {
              setSelectedParameter(value)
              setOffset(0)
            }}
          />

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
                <SelectItem value="DETECTED">DETECTED</SelectItem>
                <SelectItem value="LESS_THAN">LESS THAN</SelectItem>
                <SelectItem value="GREATER_THAN">GREATER THAN</SelectItem>
                <SelectItem value="NOT_DETECTED">NOT DETECTED</SelectItem>
                <SelectItem value="DETECTED_NOT_QUANTIFIED">DETECTED NOT QUANTIFIED</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="locationType">Location Type</Label>
            <Select
              value={selectedLocationType}
              onValueChange={(value) => {
                setSelectedLocationType(value)
                setOffset(0)
              }}
            >
              <SelectTrigger id="locationType">
                <SelectValue placeholder="All location types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All location types</SelectItem>
                <SelectItem value="EFFLUENT_MONITORING">Effluent Monitoring</SelectItem>
                <SelectItem value="INFLUENT_MONITORING">Influent Monitoring</SelectItem>
                <SelectItem value="RECEIVING_WATER_MONITORING">Receiving Water</SelectItem>
                <SelectItem value="RECYCLED_WATER_MONITORING">Recycled Water</SelectItem>
                <SelectItem value="INTERNAL_MONITORING">Internal Monitoring</SelectItem>
                <SelectItem value="GROUNDWATER_MONITORING">Groundwater</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(date) => {
              setStartDate(date)
              setOffset(0)
            }}
            onEndDateChange={(date) => {
              setEndDate(date)
              setOffset(0)
            }}
            className="col-span-2"
          />
        </FilterBar>

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
              <SampleTableEnhanced
                data={samples}
                onPageChange={handlePageChange}
                onExport={handleExport}
                filters={{
                  facility: selectedFacility,
                  parameter: selectedParameter,
                  qualifier: selectedQualifier,
                  locationType: selectedLocationType,
                  startDate: startDate?.toISOString().split("T")[0],
                  endDate: endDate?.toISOString().split("T")[0],
                }}
                showCompliance={true}
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

export default function SamplesPageEnhanced() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SamplesPageEnhancedContent />
    </Suspense>
  )
}
