# Integration Examples for Enhanced Filtering

This document provides practical examples for integrating the new filtering and table enhancement features into existing pages.

## Quick Start

### 1. Using Enhanced Violations Table in Dashboard

The enhanced violations table can be dropped into the existing dashboard page:

```tsx
// In /app/dashboard/page.tsx
import { ViolationsTableEnhanced } from "@/components/dashboard/violations-table-enhanced"

// Replace existing ViolationsTable with:
<ViolationsTableEnhanced
  violations={violations}
  showExport={true}
  filters={{
    county: params.county,
    pollutant: params.pollutant,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  }}
/>
```

**What you get:**
- Sortable columns (click headers)
- Discharge limit and screening standard columns
- Days active calculation with color coding
- Export to CSV button
- Enhanced severity badges
- Max ratio highlighting

### 2. Upgrading Samples Page with Full Filtering

Replace the existing samples page with the enhanced version:

**Option A: Complete replacement**
```bash
# Backup existing page
cp app/esmr/samples/page.tsx app/esmr/samples/page-backup.tsx

# Use enhanced version
mv app/esmr/samples/page-enhanced.tsx app/esmr/samples/page.tsx
```

**Option B: Incremental enhancement**

Add filter components to existing page:

```tsx
// In your existing samples page
import { FilterBar, DateRangeFilter, ParameterFilter } from "@/components/filters"
import { SampleTableEnhanced } from "@/components/esmr/sample-table-enhanced"

// Add state for filters
const [startDate, setStartDate] = useState<Date>()
const [endDate, setEndDate] = useState<Date>()
const [selectedParameter, setSelectedParameter] = useState("")

// Add FilterBar before your existing table
<FilterBar
  title="Search Filters"
  activeFilterCount={[startDate, endDate, selectedParameter].filter(Boolean).length}
  onClearAll={() => {
    setStartDate(undefined)
    setEndDate(undefined)
    setSelectedParameter("")
  }}
>
  <DateRangeFilter
    startDate={startDate}
    endDate={endDate}
    onStartDateChange={setStartDate}
    onEndDateChange={setEndDate}
  />

  <ParameterFilter
    parameters={parameterList}
    value={selectedParameter}
    onChange={setSelectedParameter}
  />
</FilterBar>

// Replace <SampleTable> with <SampleTableEnhanced>
<SampleTableEnhanced
  data={samples}
  onPageChange={handlePageChange}
  filters={{ startDate, endDate, parameter: selectedParameter }}
  showCompliance={true}
/>
```

### 3. Adding Facility Search to Any Page

```tsx
import { FacilitySearch } from "@/components/filters"

// Fetch facilities list (once on mount)
const [facilities, setFacilities] = useState([])

useEffect(() => {
  fetch('/api/esmr/facilities?limit=500')
    .then(res => res.json())
    .then(data => {
      setFacilities(data.facilities.map(f => ({
        id: f.facilityPlaceId,
        name: f.facilityName,
        region: f.regionName
      })))
    })
}, [])

// Add search component
<FacilitySearch
  facilities={facilities}
  value={selectedFacilityId}
  onChange={setSelectedFacilityId}
  showQuickSearch={true}
/>
```

### 4. Adding CSV Export to Any Table

```tsx
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { exportViolations, type ViolationExport } from "@/lib/export"

const handleExport = () => {
  // Transform your data to match export format
  const exportData: ViolationExport[] = violations.map(v => ({
    facilityName: v.facility.name,
    facilityId: v.facilityId || "",
    county: v.facility.county,
    pollutant: v.pollutant,
    firstDate: v.firstDate.toISOString().split("T")[0],
    lastDate: v.lastDate.toISOString().split("T")[0],
    count: v.count,
    maxRatio: String(v.maxRatio),
    severity: v.severity,
    impairedWater: v.impairedWater,
  }))

  // Export with current filters
  exportViolations(exportData, {
    county: selectedCounty,
    dateFrom: startDate?.toISOString().split("T")[0],
  })
}

// Add export button above table
<div className="flex justify-end mb-4">
  <Button variant="outline" size="sm" onClick={handleExport}>
    <Download className="h-4 w-4 mr-2" />
    Export to CSV
  </Button>
</div>
```

### 5. Making Existing Table Sortable

```tsx
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

// Add sort state
const [sortField, setSortField] = useState<"name" | "count" | "date">("date")
const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

// Create sort handler
const handleSort = (field: typeof sortField) => {
  if (sortField === field) {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  } else {
    setSortField(field)
    setSortOrder("desc")
  }
}

// Sort data
const sortedData = [...data].sort((a, b) => {
  let compareValue = 0
  if (sortField === "name") {
    compareValue = a.name.localeCompare(b.name)
  } else if (sortField === "count") {
    compareValue = a.count - b.count
  } else if (sortField === "date") {
    compareValue = new Date(a.date).getTime() - new Date(b.date).getTime()
  }
  return sortOrder === "asc" ? compareValue : -compareValue
})

// Create SortButton component
const SortButton = ({ field, children }) => (
  <Button
    variant="ghost"
    size="sm"
    className="h-8 px-2"
    onClick={() => handleSort(field)}
  >
    {children}
    {sortField === field ? (
      sortOrder === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
    ) : (
      <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
    )}
  </Button>
)

// Use in table header
<TableHead>
  <SortButton field="name">Facility Name</SortButton>
</TableHead>
```

### 6. URL Query Parameter Sync

Enable shareable filtered views:

```tsx
import { useSearchParams, useRouter } from "next/navigation"

const router = useRouter()
const searchParams = useSearchParams()

// Initialize filters from URL
const [county, setCounty] = useState(searchParams.get("county") || "")

// Update URL when filters change
useEffect(() => {
  const params = new URLSearchParams()
  if (county) params.append("county", county)
  // Add other filters...

  const queryString = params.toString()
  const newUrl = queryString ? `?${queryString}` : window.location.pathname
  router.replace(newUrl, { scroll: false })
}, [county, router])

// Now users can share URLs like: /dashboard?county=Los+Angeles&severity=HIGH
```

## Complete Page Examples

### Example: Enhanced Facility Detail Page

```tsx
"use client"

import { useState, useEffect } from "react"
import { FilterBar, DateRangeFilter, ParameterFilter } from "@/components/filters"
import { SampleTableEnhanced } from "@/components/esmr/sample-table-enhanced"

export default function FacilityDetailPage({ params }) {
  const [facility, setFacility] = useState(null)
  const [samples, setSamples] = useState(null)
  const [parameters, setParameters] = useState([])

  // Filter state
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [selectedParameter, setSelectedParameter] = useState("")

  // Fetch facility and parameters
  useEffect(() => {
    Promise.all([
      fetch(`/api/esmr/facilities/${params.id}`).then(r => r.json()),
      fetch('/api/esmr/parameters').then(r => r.json())
    ]).then(([facilityData, paramData]) => {
      setFacility(facilityData)
      setParameters(paramData.parameters.map(p => ({
        id: p.id,
        name: p.parameterName,
        category: p.category,
        count: p.sampleCount
      })))
    })
  }, [params.id])

  // Fetch samples with filters
  useEffect(() => {
    const queryParams = new URLSearchParams({
      facilityPlaceId: params.id,
      limit: "50"
    })
    if (selectedParameter) queryParams.append("parameterId", selectedParameter)
    if (startDate) queryParams.append("startDate", startDate.toISOString().split("T")[0])
    if (endDate) queryParams.append("endDate", endDate.toISOString().split("T")[0])

    fetch(`/api/esmr/samples?${queryParams}`)
      .then(r => r.json())
      .then(setSamples)
  }, [params.id, selectedParameter, startDate, endDate])

  const activeFilterCount = [startDate, endDate, selectedParameter].filter(Boolean).length

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-4xl font-bold">{facility?.facility.facilityName}</h1>

      <FilterBar
        title="Filter Samples"
        activeFilterCount={activeFilterCount}
        onClearAll={() => {
          setStartDate(undefined)
          setEndDate(undefined)
          setSelectedParameter("")
        }}
      >
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

        <ParameterFilter
          parameters={parameters}
          value={selectedParameter}
          onChange={setSelectedParameter}
        />
      </FilterBar>

      {samples && (
        <SampleTableEnhanced
          data={samples}
          onPageChange={(offset) => {/* handle pagination */}}
          filters={{ startDate, endDate, parameter: selectedParameter }}
          showCompliance={true}
        />
      )}
    </div>
  )
}
```

### Example: Violations Dashboard with Filtering

```tsx
"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { FilterBar, DateRangeFilter, SeverityFilter } from "@/components/filters"
import { ViolationsTableEnhanced } from "@/components/dashboard/violations-table-enhanced"

export default function ViolationsDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [violations, setViolations] = useState([])
  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined
  )
  const [severity, setSeverity] = useState(searchParams.get("severity") || "")

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (startDate) params.append("startDate", startDate.toISOString().split("T")[0])
    if (endDate) params.append("endDate", endDate.toISOString().split("T")[0])
    if (severity) params.append("severity", severity)

    const queryString = params.toString()
    router.replace(queryString ? `?${queryString}` : "/violations", { scroll: false })
  }, [startDate, endDate, severity, router])

  // Fetch violations with filters
  useEffect(() => {
    const params = new URLSearchParams()
    if (startDate) params.append("dateFrom", startDate.toISOString().split("T")[0])
    if (endDate) params.append("dateTo", endDate.toISOString().split("T")[0])
    if (severity) params.append("severity", severity)

    fetch(`/api/violations?${params}`)
      .then(r => r.json())
      .then(setViolations)
  }, [startDate, endDate, severity])

  const activeFilterCount = [startDate, endDate, severity].filter(Boolean).length

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-4xl font-bold">Violation Events</h1>

      <FilterBar
        title="Filter Violations"
        activeFilterCount={activeFilterCount}
        onClearAll={() => {
          setStartDate(undefined)
          setEndDate(undefined)
          setSeverity("")
        }}
      >
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

        <SeverityFilter
          value={severity}
          onChange={setSeverity}
        />
      </FilterBar>

      <ViolationsTableEnhanced
        violations={violations}
        showExport={true}
        filters={{
          startDate: startDate?.toISOString().split("T")[0],
          endDate: endDate?.toISOString().split("T")[0],
          severity
        }}
      />
    </div>
  )
}
```

## Testing Checklist

After integrating enhanced components:

- [ ] Filters update data correctly
- [ ] Sorting works on all columns
- [ ] Export produces valid CSV
- [ ] URL updates reflect filter state
- [ ] Browser back/forward navigation works
- [ ] Clear filters resets to default state
- [ ] Mobile layout is responsive
- [ ] Pagination maintains filter state
- [ ] Loading states display properly
- [ ] Error handling works
- [ ] Keyboard navigation functions
- [ ] Screen readers can access filters

## Common Issues

### Issue: Filters don't update data
**Solution:** Ensure filter state changes trigger data fetch via useEffect with proper dependencies.

### Issue: URL not updating
**Solution:** Check that router.replace is called in useEffect and scroll:false is set.

### Issue: Export button not working
**Solution:** Verify data transformation matches export type interfaces.

### Issue: Sort not persisting on page change
**Solution:** Add sort state to URL params or accept it's client-side only per page.

## Performance Tips

1. Debounce text inputs (already done in FacilitySearch)
2. Limit autocomplete results to 100-500 items
3. Use pagination for large datasets
4. Cache filter options (facilities, parameters) in parent component
5. Memoize sorted data with useMemo
6. Consider server-side sorting for very large datasets

## Next Steps

After integration:
1. Test with real data
2. Gather user feedback
3. Monitor performance metrics
4. Add custom filters as needed
5. Consider saved filter presets
6. Implement advanced features (multi-select, etc.)
