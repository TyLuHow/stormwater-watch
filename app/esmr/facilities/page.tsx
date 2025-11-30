"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FacilityTable } from "@/components/esmr/facility-table"
import { RegionFilter } from "@/components/esmr/region-filter"
import { Search, Building2 } from "lucide-react"
import type { FacilityListResponse, RegionListResponse } from "@/lib/api/esmr"

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<FacilityListResponse | null>(null)
  const [regions, setRegions] = useState<RegionListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("all")
  const [offset, setOffset] = useState(0)

  // Fetch regions once on mount
  useEffect(() => {
    async function fetchRegions() {
      try {
        const res = await fetch('/api/esmr/regions')
        if (!res.ok) throw new Error('Failed to fetch regions')
        const data = await res.json()
        setRegions(data)
      } catch (err) {
        console.error('Error fetching regions:', err)
      }
    }
    fetchRegions()
  }, [])

  // Fetch facilities when filters change
  useEffect(() => {
    async function fetchFacilities() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          limit: "50",
          offset: offset.toString(),
        })

        if (selectedRegion !== "all") {
          params.append("regionCode", selectedRegion)
        }

        if (searchTerm) {
          params.append("facilityName", searchTerm)
        }

        const res = await fetch(`/api/esmr/facilities?${params}`)
        if (!res.ok) throw new Error('Failed to fetch facilities')

        const data = await res.json()
        setFacilities(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load facilities')
      } finally {
        setLoading(false)
      }
    }

    fetchFacilities()
  }, [selectedRegion, searchTerm, offset])

  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset)
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setOffset(0) // Reset to first page when searching
  }

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value)
    setOffset(0) // Reset to first page when filtering
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border-b border-border/50">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-6 w-6 text-accent" />
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                eSMR Facilities
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Facility{" "}
              <span className="text-gradient">Browser</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Browse and search water quality monitoring facilities across California water board regions.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find facilities by name or region</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search facility name..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {regions && (
                <RegionFilter
                  regions={regions.regions}
                  value={selectedRegion}
                  onChange={handleRegionChange}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Facilities Table */}
        <Card>
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Facilities</CardTitle>
                <CardDescription className="mt-1">
                  {facilities ? `${facilities.pagination.total.toLocaleString()} facilities found` : 'Loading...'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {error ? (
              <div className="text-center py-12 text-destructive">
                {error}
              </div>
            ) : loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading facilities...
              </div>
            ) : facilities ? (
              <FacilityTable data={facilities} onPageChange={handlePageChange} />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
