"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"

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
  const [isPending, startTransition] = useTransition()
  const [isExpanded, setIsExpanded] = useState(false)

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

  // Auto-apply filters with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      updateURL()
    }, 500)

    return () => clearTimeout(timer)
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
  ])

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

    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`)
    })
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

  const removeFilter = (type: string, value?: string) => {
    switch (type) {
      case "pollutant":
        if (value) setSelectedPollutants(selectedPollutants.filter((p) => p !== value))
        break
      case "county":
        if (value) setSelectedCounties(selectedCounties.filter((c) => c !== value))
        break
      case "huc12":
        if (value) setSelectedHuc12s(selectedHuc12s.filter((h) => h !== value))
        break
      case "ms4":
        if (value) setSelectedMs4s(selectedMs4s.filter((m) => m !== value))
        break
      case "year":
        if (value) setSelectedYears(selectedYears.filter((y) => y !== value))
        break
      case "ratio":
        setMinRatio(1.0)
        break
      case "impaired":
        setImpairedOnly(false)
        break
      case "date":
        setDateFrom(undefined)
        setDateTo(undefined)
        break
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm">
      {/* Compact Header - Always Visible */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </Button>

          {/* Active Filter Chips - Collapsed State */}
          {!isExpanded && activeFilterCount > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0 no-scrollbar">
              {selectedPollutants.map((p) => (
                <Badge
                  key={p}
                  variant="secondary"
                  className="shrink-0 h-6 px-2 text-xs hover:bg-secondary/80 cursor-pointer"
                  onClick={() => removeFilter("pollutant", p)}
                >
                  {p}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
              {selectedCounties.map((c) => (
                <Badge
                  key={c}
                  variant="secondary"
                  className="shrink-0 h-6 px-2 text-xs hover:bg-secondary/80 cursor-pointer"
                  onClick={() => removeFilter("county", c)}
                >
                  {c}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
              {selectedYears.map((y) => (
                <Badge
                  key={y}
                  variant="secondary"
                  className="shrink-0 h-6 px-2 text-xs hover:bg-secondary/80 cursor-pointer"
                  onClick={() => removeFilter("year", y)}
                >
                  {y}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
              {minRatio > 1.0 && (
                <Badge
                  variant="secondary"
                  className="shrink-0 h-6 px-2 text-xs hover:bg-secondary/80 cursor-pointer"
                  onClick={() => removeFilter("ratio")}
                >
                  Ratio ≥{minRatio.toFixed(1)}×
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {impairedOnly && (
                <Badge
                  variant="secondary"
                  className="shrink-0 h-6 px-2 text-xs hover:bg-secondary/80 cursor-pointer"
                  onClick={() => removeFilter("impaired")}
                >
                  Impaired Waters
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {(dateFrom || dateTo) && (
                <Badge
                  variant="secondary"
                  className="shrink-0 h-6 px-2 text-xs hover:bg-secondary/80 cursor-pointer"
                  onClick={() => removeFilter("date")}
                >
                  {dateFrom && format(dateFrom, "MM/dd/yy")}
                  {dateFrom && dateTo && " - "}
                  {dateTo && format(dateTo, "MM/dd/yy")}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Filter Controls */}
      {isExpanded && (
        <div className="border-t border-border px-4 py-4 space-y-4">
          {/* Row 1: Main Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Pollutants Multi-Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Pollutants</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between h-9 text-xs font-normal"
                  >
                    <span className="truncate">
                      {selectedPollutants.length > 0
                        ? `${selectedPollutants.length} selected`
                        : "Any pollutant"}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availablePollutants.sort().map((pollutant) => (
                      <div key={pollutant} className="flex items-center space-x-2">
                        <Checkbox
                          id={`pollutant-${pollutant}`}
                          checked={selectedPollutants.includes(pollutant)}
                          onCheckedChange={() =>
                            toggleArrayItem(selectedPollutants, setSelectedPollutants, pollutant)
                          }
                        />
                        <Label
                          htmlFor={`pollutant-${pollutant}`}
                          className="text-xs font-normal cursor-pointer"
                        >
                          {pollutant}
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Counties Multi-Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Counties</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between h-9 text-xs font-normal"
                  >
                    <span className="truncate">
                      {selectedCounties.length > 0
                        ? `${selectedCounties.length} selected`
                        : "Any county"}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableCounties.sort().map((county) => (
                      <div key={county} className="flex items-center space-x-2">
                        <Checkbox
                          id={`county-${county}`}
                          checked={selectedCounties.includes(county)}
                          onCheckedChange={() =>
                            toggleArrayItem(selectedCounties, setSelectedCounties, county)
                          }
                        />
                        <Label
                          htmlFor={`county-${county}`}
                          className="text-xs font-normal cursor-pointer"
                        >
                          {county}
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Years Multi-Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Reporting Years</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between h-9 text-xs font-normal"
                  >
                    <span className="truncate">
                      {selectedYears.length > 0
                        ? `${selectedYears.length} selected`
                        : "Any year"}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3" align="start">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableYears.sort().reverse().map((year) => (
                      <div key={year} className="flex items-center space-x-2">
                        <Checkbox
                          id={`year-${year}`}
                          checked={selectedYears.includes(year)}
                          onCheckedChange={() =>
                            toggleArrayItem(selectedYears, setSelectedYears, year)
                          }
                        />
                        <Label
                          htmlFor={`year-${year}`}
                          className="text-xs font-normal cursor-pointer"
                        >
                          {year}
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Date Range */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Date Range</Label>
              <div className="flex gap-1.5">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 justify-start h-9 text-xs font-normal"
                    >
                      {dateFrom ? format(dateFrom, "MM/dd/yy") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 justify-start h-9 text-xs font-normal"
                    >
                      {dateTo ? format(dateTo, "MM/dd/yy") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Row 2: Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* HUC12 Watersheds */}
            {availableHuc12s.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">HUC12 Watersheds</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between h-9 text-xs font-normal"
                    >
                      <span className="truncate">
                        {selectedHuc12s.length > 0
                          ? `${selectedHuc12s.length} selected`
                          : "Any watershed"}
                      </span>
                      <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {availableHuc12s.sort().map((huc12) => (
                        <div key={huc12} className="flex items-center space-x-2">
                          <Checkbox
                            id={`huc12-${huc12}`}
                            checked={selectedHuc12s.includes(huc12)}
                            onCheckedChange={() =>
                              toggleArrayItem(selectedHuc12s, setSelectedHuc12s, huc12)
                            }
                          />
                          <Label
                            htmlFor={`huc12-${huc12}`}
                            className="text-xs font-normal cursor-pointer"
                          >
                            {huc12}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* MS4 Areas */}
            {availableMs4s.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">MS4 Areas</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between h-9 text-xs font-normal"
                    >
                      <span className="truncate">
                        {selectedMs4s.length > 0
                          ? `${selectedMs4s.length} selected`
                          : "Any MS4"}
                      </span>
                      <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {availableMs4s.sort().map((ms4) => (
                        <div key={ms4} className="flex items-center space-x-2">
                          <Checkbox
                            id={`ms4-${ms4}`}
                            checked={selectedMs4s.includes(ms4)}
                            onCheckedChange={() =>
                              toggleArrayItem(selectedMs4s, setSelectedMs4s, ms4)
                            }
                          />
                          <Label
                            htmlFor={`ms4-${ms4}`}
                            className="text-xs font-normal cursor-pointer"
                          >
                            {ms4}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Min Exceedance Ratio */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Min Ratio: {minRatio.toFixed(1)}×
              </Label>
              <Slider
                value={[minRatio]}
                onValueChange={([value]) => setMinRatio(value)}
                min={1.0}
                max={10.0}
                step={0.5}
                className="w-full mt-2"
              />
            </div>

            {/* Toggle Switches */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 h-9">
                <Checkbox
                  id="impairedOnly"
                  checked={impairedOnly}
                  onCheckedChange={(checked) => setImpairedOnly(checked === true)}
                />
                <Label htmlFor="impairedOnly" className="text-xs font-normal cursor-pointer">
                  Impaired Waters Only
                </Label>
              </div>
              <div className="flex items-center space-x-2 h-9">
                <Checkbox
                  id="hideDismissed"
                  checked={hideDismissed}
                  onCheckedChange={(checked) => setHideDismissed(checked === true)}
                />
                <Label htmlFor="hideDismissed" className="text-xs font-normal cursor-pointer">
                  Hide Dismissed Violations
                </Label>
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          {isPending && (
            <div className="text-xs text-muted-foreground text-center py-2">
              Applying filters...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
