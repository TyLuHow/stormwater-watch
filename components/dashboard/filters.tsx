"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { X, Download, Filter } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

interface DashboardFiltersProps {
  availablePollutants: string[]
  availableCounties: string[]
  availableHuc12s: string[]
  availableMs4s: string[]
  availableYears: string[]
  onExport?: () => void
}

export function DashboardFilters({
  availablePollutants,
  availableCounties,
  availableHuc12s,
  availableMs4s,
  availableYears,
  onExport,
}: DashboardFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Filter state from URL params
  const [selectedPollutants, setSelectedPollutants] = useState<string[]>(
    searchParams.get("pollutants")?.split(",").filter(Boolean) || []
  )
  const [selectedCounties, setSelectedCounties] = useState<string[]>(
    searchParams.get("counties")?.split(",").filter(Boolean) || []
  )
  const [selectedHuc12s, setSelectedHuc12s] = useState<string[]>(
    searchParams.get("huc12s")?.split(",").filter(Boolean) || []
  )
  const [selectedMs4s, setSelectedMs4s] = useState<string[]>(
    searchParams.get("ms4s")?.split(",").filter(Boolean) || []
  )
  const [selectedYears, setSelectedYears] = useState<string[]>(
    searchParams.get("years")?.split(",").filter(Boolean) || []
  )
  const [minRatio, setMinRatio] = useState<number>(
    parseFloat(searchParams.get("minRatio") || "1.0")
  )
  const [impairedOnly, setImpairedOnly] = useState<boolean>(
    searchParams.get("impairedOnly") === "true"
  )
  const [hideDismissed, setHideDismissed] = useState<boolean>(
    searchParams.get("hideDismissed") !== "false"
  )
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined
  )
  const [dateTo, setDateTo] = useState<Date | undefined>(
    searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined
  )

  // Update URL when filters change
  const updateURL = useCallback(() => {
    const params = new URLSearchParams()

    if (selectedPollutants.length > 0) {
      params.set("pollutants", selectedPollutants.join(","))
    }
    if (selectedCounties.length > 0) {
      params.set("counties", selectedCounties.join(","))
    }
    if (selectedHuc12s.length > 0) {
      params.set("huc12s", selectedHuc12s.join(","))
    }
    if (selectedMs4s.length > 0) {
      params.set("ms4s", selectedMs4s.join(","))
    }
    if (selectedYears.length > 0) {
      params.set("years", selectedYears.join(","))
    }
    if (minRatio > 1.0) {
      params.set("minRatio", minRatio.toString())
    }
    if (impairedOnly) {
      params.set("impairedOnly", "true")
    }
    if (!hideDismissed) {
      params.set("hideDismissed", "false")
    }
    if (dateFrom) {
      params.set("dateFrom", format(dateFrom, "yyyy-MM-dd"))
    }
    if (dateTo) {
      params.set("dateTo", format(dateTo, "yyyy-MM-dd"))
    }

    router.push(`/dashboard?${params.toString()}`)
  }, [
    selectedPollutants,
    selectedCounties,
    selectedHuc12s,
    selectedMs4s,
    selectedYears,
    minRatio,
    impairedOnly,
    hideDismissed,
    dateFrom,
    dateTo,
    router,
  ])

  // Persist to localStorage
  useEffect(() => {
    const filterState = {
      selectedPollutants,
      selectedCounties,
      selectedYears,
      minRatio,
      impairedOnly,
      hideDismissed,
    }
    localStorage.setItem("dashboardFilters", JSON.stringify(filterState))
  }, [selectedPollutants, selectedCounties, selectedYears, minRatio, impairedOnly, hideDismissed])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("dashboardFilters")
    if (saved) {
      try {
        const state = JSON.parse(saved)
        if (state.selectedPollutants) setSelectedPollutants(state.selectedPollutants)
        if (state.selectedCounties) setSelectedCounties(state.selectedCounties)
        if (state.selectedYears) setSelectedYears(state.selectedYears)
        if (state.minRatio) setMinRatio(state.minRatio)
        if (state.impairedOnly !== undefined) setImpairedOnly(state.impairedOnly)
        if (state.hideDismissed !== undefined) setHideDismissed(state.hideDismissed)
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [])

  const clearAllFilters = () => {
    setSelectedPollutants([])
    setSelectedCounties([])
    setSelectedHuc12s([])
    setSelectedMs4s([])
    setSelectedYears([])
    setMinRatio(1.0)
    setImpairedOnly(false)
    setHideDismissed(true)
    setDateFrom(undefined)
    setDateTo(undefined)
    router.push("/dashboard")
  }

  const activeFilterCount =
    selectedPollutants.length +
    selectedCounties.length +
    selectedHuc12s.length +
    selectedMs4s.length +
    selectedYears.length +
    (minRatio > 1.0 ? 1 : 0) +
    (impairedOnly ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0)

  const toggleArrayItem = (arr: string[], setArr: (val: string[]) => void, item: string) => {
    if (arr.includes(item)) {
      setArr(arr.filter((i) => i !== item))
    } else {
      setArr([...arr, item])
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="w-4 h-4 mr-1" />
                Export CSV
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pollutants */}
          <div className="space-y-2">
            <Label>
              Pollutants
              {selectedPollutants.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedPollutants.length}
                </Badge>
              )}
            </Label>
            <div className="space-y-2">
              <Select
                value={selectedPollutants.length > 0 ? selectedPollutants[0] : ""}
                onValueChange={(value) => {
                  if (!selectedPollutants.includes(value)) {
                    setSelectedPollutants([...selectedPollutants, value])
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add pollutant" />
                </SelectTrigger>
                <SelectContent>
                  {availablePollutants
                    .filter((p) => !selectedPollutants.includes(p))
                    .map((pollutant) => (
                      <SelectItem key={pollutant} value={pollutant}>
                        {pollutant}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPollutants.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedPollutants.map((p) => (
                  <Badge key={p} variant="secondary" className="text-xs">
                    {p}
                    <button
                      onClick={() => toggleArrayItem(selectedPollutants, setSelectedPollutants, p)}
                      className="ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* County */}
          <div className="space-y-2">
            <Label>
              County
              {selectedCounties.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedCounties.length}
                </Badge>
              )}
            </Label>
            <Select
              value={selectedCounties.length > 0 ? selectedCounties[0] : ""}
              onValueChange={(value) => {
                if (!selectedCounties.includes(value)) {
                  setSelectedCounties([...selectedCounties, value])
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add county" />
              </SelectTrigger>
              <SelectContent>
                {availableCounties
                  .filter((c) => !selectedCounties.includes(c))
                  .map((county) => (
                    <SelectItem key={county} value={county}>
                      {county}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {selectedCounties.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedCounties.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs">
                    {c}
                    <button
                      onClick={() => toggleArrayItem(selectedCounties, setSelectedCounties, c)}
                      className="ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Reporting Year */}
          <div className="space-y-2">
            <Label>
              Reporting Year
              {selectedYears.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedYears.length}
                </Badge>
              )}
            </Label>
            <Select
              value={selectedYears.length > 0 ? selectedYears[0] : ""}
              onValueChange={(value) => {
                if (!selectedYears.includes(value)) {
                  setSelectedYears([...selectedYears, value])
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears
                  .filter((y) => !selectedYears.includes(y))
                  .map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {selectedYears.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedYears.map((y) => (
                  <Badge key={y} variant="secondary" className="text-xs">
                    {y}
                    <button
                      onClick={() => toggleArrayItem(selectedYears, setSelectedYears, y)}
                      className="ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Min Ratio */}
          <div className="space-y-2">
            <Label>
              Min Exceedance Ratio: {minRatio.toFixed(1)}×
            </Label>
            <Slider
              value={[minRatio]}
              onValueChange={([value]) => setMinRatio(value)}
              min={1.0}
              max={10.0}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Sample Date Range</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {dateTo ? format(dateTo, "MMM dd, yyyy") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="impairedOnly"
                checked={impairedOnly}
                onCheckedChange={setImpairedOnly}
              />
              <Label htmlFor="impairedOnly">Impaired Waters Only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="hideDismissed"
                checked={hideDismissed}
                onCheckedChange={setHideDismissed}
              />
              <Label htmlFor="hideDismissed">Hide Dismissed</Label>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button onClick={updateURL} className="w-full">
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

