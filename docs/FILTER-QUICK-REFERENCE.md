# Filter Components Quick Reference

## Import Statement

```tsx
import {
  FilterBar,
  DateRangeFilter,
  ParameterFilter,
  FacilitySearch,
  SeverityFilter,
  StatusFilter
} from "@/components/filters"
```

## Component Signatures

### FilterBar
```tsx
<FilterBar
  title?: string              // Default: "Filters"
  description?: string        // Optional description
  activeFilterCount?: number  // Show badge with count
  onClearAll?: () => void    // Clear all callback
  className?: string         // Additional classes
>
  {/* Filter components */}
</FilterBar>
```

### DateRangeFilter
```tsx
<DateRangeFilter
  startDate?: Date
  endDate?: Date
  onStartDateChange: (date: Date | undefined) => void
  onEndDateChange: (date: Date | undefined) => void
  className?: string
/>
```

### ParameterFilter
```tsx
<ParameterFilter
  parameters: Array<{
    id: string
    name: string
    category?: string | null
    count?: number
  }>
  value?: string
  onChange: (value: string) => void
  label?: string              // Default: "Parameter"
  placeholder?: string        // Default: "Select parameter..."
  className?: string
  allowMultiple?: boolean     // Default: false (future)
/>
```

### FacilitySearch
```tsx
<FacilitySearch
  facilities: Array<{
    id: string | number
    name: string
    region?: string
    county?: string
  }>
  value?: string
  onChange: (value: string) => void
  label?: string              // Default: "Facility"
  placeholder?: string        // Default: "Search facility..."
  className?: string
  showQuickSearch?: boolean   // Default: true (text input vs dropdown)
/>
```

### SeverityFilter
```tsx
<SeverityFilter
  value?: string              // "LOW" | "MODERATE" | "HIGH" | "CRITICAL"
  onChange: (value: string) => void
  label?: string              // Default: "Severity"
  className?: string
  showAll?: boolean           // Default: true (includes "All" option)
/>
```

### StatusFilter
```tsx
<StatusFilter
  value?: string              // "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED"
  onChange: (value: string) => void
  label?: string              // Default: "Status"
  className?: string
  showAll?: boolean           // Default: true (includes "All" option)
/>
```

## Enhanced Table Components

### ViolationsTableEnhanced
```tsx
import { ViolationsTableEnhanced } from "@/components/dashboard/violations-table-enhanced"

<ViolationsTableEnhanced
  violations: Violation[]     // Array of violation objects
  showExport?: boolean        // Default: true
  filters?: Record<string, any> // For export metadata
/>
```

### SampleTableEnhanced
```tsx
import { SampleTableEnhanced } from "@/components/esmr/sample-table-enhanced"

<SampleTableEnhanced
  data: SampleListResponse    // API response with samples + pagination
  onPageChange: (offset: number) => void
  onExport?: () => void       // Optional custom export
  filters?: Record<string, any>
  showCompliance?: boolean    // Default: false
/>
```

### FacilityTableEnhanced
```tsx
import { FacilityTableEnhanced } from "@/components/esmr/facility-table-enhanced"

<FacilityTableEnhanced
  data: FacilityListResponse  // API response with facilities + pagination
  onPageChange: (offset: number) => void
  filters?: Record<string, any>
/>
```

## Export Functions

```tsx
import {
  exportViolations,
  exportSamples,
  exportFacilities,
  type ViolationExport,
  type SampleExport,
  type FacilityExport
} from "@/lib/export"

// Export violations
exportViolations(
  data: ViolationExport[],
  filters?: Record<string, any>
)

// Export samples
exportSamples(
  data: SampleExport[],
  filters?: Record<string, any>
)

// Export facilities
exportFacilities(
  data: FacilityExport[],
  filters?: Record<string, any>
)
```

## Common Patterns

### Pattern 1: Filter State Management

```tsx
const [startDate, setStartDate] = useState<Date>()
const [endDate, setEndDate] = useState<Date>()
const [parameter, setParameter] = useState("")
const [facility, setFacility] = useState("")

const activeFilterCount = [startDate, endDate, parameter, facility]
  .filter(Boolean).length

const handleClearAll = () => {
  setStartDate(undefined)
  setEndDate(undefined)
  setParameter("")
  setFacility("")
}
```

### Pattern 2: URL Sync

```tsx
import { useSearchParams, useRouter } from "next/navigation"

const router = useRouter()
const searchParams = useSearchParams()

// Initialize from URL
const [filter, setFilter] = useState(searchParams.get("filter") || "")

// Sync to URL
useEffect(() => {
  const params = new URLSearchParams()
  if (filter) params.append("filter", filter)
  router.replace(`?${params.toString()}`, { scroll: false })
}, [filter, router])
```

### Pattern 3: Data Fetching with Filters

```tsx
useEffect(() => {
  const params = new URLSearchParams()
  if (facility) params.append("facilityPlaceId", facility)
  if (parameter) params.append("parameterId", parameter)
  if (startDate) params.append("startDate", startDate.toISOString().split("T")[0])

  fetch(`/api/esmr/samples?${params}`)
    .then(r => r.json())
    .then(setData)
}, [facility, parameter, startDate])
```

### Pattern 4: Complete Filter Integration

```tsx
"use client"

import { useState, useEffect } from "react"
import { FilterBar, DateRangeFilter, ParameterFilter } from "@/components/filters"
import { SampleTableEnhanced } from "@/components/esmr/sample-table-enhanced"

export default function MyPage() {
  const [data, setData] = useState(null)
  const [parameters, setParameters] = useState([])
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [selectedParameter, setSelectedParameter] = useState("")

  // Fetch filter options
  useEffect(() => {
    fetch('/api/esmr/parameters')
      .then(r => r.json())
      .then(res => setParameters(res.parameters.map(p => ({
        id: p.id,
        name: p.parameterName,
        category: p.category,
        count: p.sampleCount
      }))))
  }, [])

  // Fetch data with filters
  useEffect(() => {
    const params = new URLSearchParams({ limit: "50" })
    if (selectedParameter) params.append("parameterId", selectedParameter)
    if (startDate) params.append("startDate", startDate.toISOString().split("T")[0])
    if (endDate) params.append("endDate", endDate.toISOString().split("T")[0])

    fetch(`/api/esmr/samples?${params}`)
      .then(r => r.json())
      .then(setData)
  }, [selectedParameter, startDate, endDate])

  const activeFilterCount = [startDate, endDate, selectedParameter].filter(Boolean).length

  return (
    <div className="space-y-6">
      <FilterBar
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

      {data && (
        <SampleTableEnhanced
          data={data}
          onPageChange={(offset) => {/* handle */}}
          filters={{ startDate, endDate, parameter: selectedParameter }}
        />
      )}
    </div>
  )
}
```

## TypeScript Interfaces

### Filter Data Types

```typescript
// For ParameterFilter
interface Parameter {
  id: string
  name: string
  category?: string | null
  count?: number
}

// For FacilitySearch
interface Facility {
  id: string | number
  name: string
  region?: string
  county?: string
}

// For Export
interface ViolationExport {
  facilityName: string
  facilityId: string
  county: string | null
  pollutant: string
  firstDate: string
  lastDate: string
  count: number
  maxRatio: string
  severity: string
  impairedWater: boolean
  dischargeLimit?: string | null
  screeningStandard?: string | null
  exceedanceRatio?: string | null
  daysActive?: number
}

interface SampleExport {
  samplingDate: string
  samplingTime?: string
  facilityName: string
  locationCode: string
  parameterName: string
  parameterCategory: string | null
  result: string | null
  units: string
  qualifier: string
  dischargeLimit?: string | null
  screeningStandard?: string | null
  complianceStatus?: string
  mdl?: string | null
  ml?: string | null
  rl?: string | null
  analyticalMethod?: string | null
}

interface FacilityExport {
  facilityName: string
  facilityPlaceId: number | string
  regionName: string
  receivingWaterBody: string | null
  locationCount: number
  sampleCount: number
  violationCount?: number
}
```

## API Query Parameters

### Samples API (`/api/esmr/samples`)
```
?limit=50
&offset=0
&facilityPlaceId=123
&locationPlaceId=456
&parameterId=abc123
&startDate=2025-01-01
&endDate=2025-12-31
&qualifier=DETECTED
&locationType=EFFLUENT_MONITORING
&sortBy=samplingDate
&sortOrder=desc
```

### Facilities API (`/api/esmr/facilities`)
```
?limit=50
&offset=0
&regionCode=R1
&facilityName=treatment
&receivingWaterBody=river
```

### Parameters API (`/api/esmr/parameters`)
```
?limit=100
&offset=0
&category=Metals
```

## Enums Reference

### ESMRQualifier
- `DETECTED`
- `LESS_THAN`
- `GREATER_THAN`
- `NOT_DETECTED`
- `DETECTED_NOT_QUANTIFIED`

### ESMRLocationType
- `EFFLUENT_MONITORING`
- `INFLUENT_MONITORING`
- `RECEIVING_WATER_MONITORING`
- `RECYCLED_WATER_MONITORING`
- `INTERNAL_MONITORING`
- `GROUNDWATER_MONITORING`

### ViolationSeverity
- `LOW`
- `MODERATE`
- `HIGH`
- `CRITICAL`

### ViolationStatus
- `OPEN`
- `UNDER_REVIEW`
- `RESOLVED`
- `DISMISSED`

## Color Codes

### Severity Colors
- **Low:** `secondary` (gray)
- **Moderate:** `default` (blue)
- **High:** `warning` (orange) - custom class
- **Critical:** `destructive` (red)

### Compliance Colors
- **Compliant:** `bg-green-500`
- **Warning:** `bg-orange-500`
- **Unknown:** `bg-gray-400`

### Ratio Highlighting
- **>2x:** `text-destructive` (red)
- **1.5x-2x:** `text-orange-600` (orange)
- **<1.5x:** normal

### Duration Highlighting
- **>90 days:** `text-destructive` (red)
- **30-90 days:** `text-orange-600` (orange)
- **<30 days:** normal

## Dependencies

Required packages (already installed):
- `date-fns` - Date formatting and manipulation
- `lucide-react` - Icons
- `@radix-ui/*` - UI components (shadcn/ui)
- `next` - Routing and navigation
- `react` - Component framework
- `zod` - Schema validation

## Keyboard Shortcuts

- **Tab** - Navigate between filters
- **Enter** - Select/apply filter
- **Escape** - Close dropdown/popover
- **Arrow keys** - Navigate dropdown options
- **Space** - Toggle checkbox/radio

## Mobile Responsive

All filter components are mobile-responsive:
- Filter grid collapses to single column
- Date pickers are touch-friendly
- Dropdowns use full-screen on mobile
- Export buttons remain accessible

## Performance Tips

1. **Debounce text inputs** - Already implemented in FacilitySearch (300ms)
2. **Limit dropdown options** - Keep to 100-500 items max
3. **Paginate large datasets** - Default 50 records per page
4. **Memoize sorted data** - Use `useMemo` for client-side sorting
5. **Cache filter options** - Fetch once, store in parent component

## Troubleshooting

**Filters not updating?**
- Check useEffect dependencies
- Verify API endpoint is correct
- Check browser console for errors

**Export not working?**
- Check popup blocker
- Verify data transformation matches types
- Check console for CSV generation errors

**URL not syncing?**
- Ensure router.replace has `scroll: false`
- Check useSearchParams is in client component
- Verify Suspense boundary if using searchParams

## Support Files

- **Full Documentation:** `/docs/FILTERING-FEATURES.md`
- **Integration Examples:** `/docs/INTEGRATION-EXAMPLES.md`
- **Implementation Summary:** `/FILTERING-IMPLEMENTATION-SUMMARY.md`
