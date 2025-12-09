# Filtering and Table Enhancement Features

## Overview

Comprehensive filtering and search functionality has been added to all violation and monitoring data displays to enable water quality professionals to quickly find specific violations, exceedances, and monitoring results.

## Features Implemented

### 1. Reusable Filter Components

Located in `/components/filters/`:

#### DateRangeFilter
- Interactive date pickers for start and end dates
- Prevents selecting end date before start date
- Clear button for each date
- Integrated with react-day-picker and Calendar component

```tsx
<DateRangeFilter
  startDate={startDate}
  endDate={endDate}
  onStartDateChange={setStartDate}
  onEndDateChange={setEndDate}
/>
```

#### ParameterFilter
- Searchable autocomplete for parameters/pollutants
- Grouped by category (Metals, Nutrients, Bacteria, etc.)
- Shows sample count for each parameter
- Clear selection button

```tsx
<ParameterFilter
  parameters={parameterList}
  value={selectedParameter}
  onChange={setSelectedParameter}
  label="Parameter"
  placeholder="Select parameter..."
/>
```

#### FacilitySearch
- Debounced text search (300ms delay)
- Quick search mode with instant filtering
- Dropdown mode with full facility list
- Shows facility region/county

```tsx
<FacilitySearch
  facilities={facilityList}
  value={selectedFacility}
  onChange={setSelectedFacility}
  showQuickSearch={true}
/>
```

#### SeverityFilter
- Filter by violation severity (Low, Moderate, High, Critical)
- Color-coded badges
- Optional "All" option

```tsx
<SeverityFilter
  value={severity}
  onChange={setSeverity}
  showAll={true}
/>
```

#### StatusFilter
- Filter by compliance status (Open, Under Review, Resolved, Dismissed)
- Badge visualization for each status

```tsx
<StatusFilter
  value={status}
  onChange={setStatus}
  showAll={true}
/>
```

#### FilterBar
- Container component for organizing filters
- Shows active filter count
- "Clear All" button
- Responsive grid layout

```tsx
<FilterBar
  title="Filters"
  description="Filter data by multiple criteria"
  activeFilterCount={5}
  onClearAll={handleClearAll}
>
  {/* Filter components */}
</FilterBar>
```

### 2. Enhanced Table Components

#### ViolationsTableEnhanced
**Location:** `/components/dashboard/violations-table-enhanced.tsx`

**New Features:**
- Sortable columns (click headers to sort)
- Discharge limit column
- Screening standard column
- Days active calculation
- Max exceedance ratio with color coding
- First violation date
- Export to CSV with metadata
- Visual indicators for severity and duration

**Columns:**
| Column | Description | Sortable |
|--------|-------------|----------|
| Facility | Facility name with impaired water badge | Yes |
| Pollutant | Parameter name | Yes |
| First Violation | Date of first exceedance | Yes |
| Days Active | Days between first and last violation | Yes |
| Count | Number of exceedance samples | Yes |
| Max Ratio | Highest exceedance ratio | Yes |
| Discharge Limit | Permit limit value | No |
| Screening Std | Health-based standard | No |
| Severity | Violation severity level | Yes |
| County | Facility county | No |

**Color Coding:**
- Red (>2x): Critical exceedances
- Orange (1.5x-2x): High exceedances
- Yellow (>90 days): Long-duration violations
- Orange (30-90 days): Medium-duration violations

#### SampleTableEnhanced
**Location:** `/components/esmr/sample-table-enhanced.tsx`

**New Features:**
- Sortable columns
- Compliance status indicators
- Detection limits (MDL, ML, RL) display
- Qualifier badges with color coding
- Export to CSV
- Pagination controls

**Columns:**
| Column | Description | Sortable |
|--------|-------------|----------|
| Date | Sampling date | Yes |
| Facility | Facility name | Yes |
| Location | Monitoring location code | No |
| Parameter | Parameter/pollutant name | Yes |
| Category | Parameter category | No |
| Result | Measured value | Yes |
| Units | Measurement units | No |
| Qualifier | Result qualifier (detected, <, >, etc.) | Yes |
| Compliance | Status indicator (optional) | No |
| Detection Limits | MDL, ML, RL values | No |

**Compliance Indicators:**
- Green dot: Compliant
- Orange dot: Review required
- Gray dot: Status unknown

#### FacilityTableEnhanced
**Location:** `/components/esmr/facility-table-enhanced.tsx`

**New Features:**
- Sortable columns
- Sample count highlighting (bold for >1000)
- Export to CSV
- Pagination
- Responsive truncation

**Columns:**
| Column | Description | Sortable |
|--------|-------------|----------|
| Facility Name | Full facility name | Yes |
| Region | Water board region | Yes |
| Receiving Water Body | Name of receiving water | Yes |
| Locations | Count of monitoring locations | Yes |
| Samples | Total sample count | Yes |

### 3. CSV Export Functionality

**Location:** `/lib/export/csv-generator.ts`

**Features:**
- Proper CSV escaping (handles commas, quotes, newlines)
- Metadata headers (export date, record count, applied filters)
- Filter description in filename
- Timestamp in filename
- Type-safe export functions

**Export Functions:**

```typescript
// Export violations
exportViolations(violations: ViolationExport[], filters?: Record<string, any>)

// Export samples
exportSamples(samples: SampleExport[], filters?: Record<string, any>)

// Export facilities
exportFacilities(facilities: FacilityExport[], filters?: Record<string, any>)
```

**CSV Format:**
```csv
# Export Metadata
# Export Date: 2025-12-09T10:30:00.000Z
# Total Records: 145
# Applied Filters: parameter-e-coli_date-from-2025-01-01

Facility Name,Facility ID,County,Pollutant,First Violation Date,...
Example Facility,FAC-001,Los Angeles,E.coli,2025-01-15,...
```

### 4. URL Query Parameter Sync

**Benefits:**
- Shareable filtered views (copy URL to share)
- Browser back/forward navigation works
- Bookmark specific filter combinations
- SEO-friendly URLs

**Example URLs:**
```
/esmr/samples?parameterId=abc123&startDate=2025-01-01&endDate=2025-12-31
/dashboard?county=Los+Angeles&pollutant=e-coli&severity=HIGH
/esmr/facilities?regionCode=R1&facilityName=treatment
```

**Implementation:**
- Uses Next.js `useSearchParams` and `useRouter`
- Updates URL without page reload
- Initializes filters from URL on page load
- Resets offset when filters change

### 5. Enhanced Samples Page

**Location:** `/app/esmr/samples/page-enhanced.tsx`

**Available Filters:**
- Facility (dropdown)
- Parameter (searchable with categories)
- Qualifier (dropdown)
- Location Type (dropdown)
- Date Range (from/to date pickers)

**Filter Combinations:**
All filters work together with AND logic:
- Example: Show all E.coli samples from Facility XYZ between Jan-Mar 2025 at effluent monitoring locations

**Features:**
- Real-time URL updates
- Active filter count badge
- Clear all filters button
- Export filtered results to CSV
- Pagination maintains filters
- Compliance status column (optional)

## Usage Examples

### Example 1: Find Recent E.coli Violations in Los Angeles

1. Navigate to Dashboard
2. Open Filters panel
3. Select:
   - County: "Los Angeles"
   - Pollutant: "E.coli"
   - Date From: "2025-01-01"
4. Click on facility name to see details
5. Click "Export to CSV" to download results

### Example 2: Search High-Volume Facilities

1. Navigate to Facilities page
2. Click "Samples" column header to sort by sample count (descending)
3. Facilities with >1000 samples appear in bold
4. Export top facilities to CSV

### Example 3: Track Parameter Over Time

1. Navigate to Sample Explorer
2. Apply filters:
   - Facility: Select specific facility
   - Parameter: "Total Suspended Solids"
   - Date Range: Last 12 months
3. View samples table
4. Export to CSV for trend analysis in Excel

### Example 4: Enforcement Case Preparation

1. Navigate to Dashboard
2. Filter violations:
   - Severity: "Critical"
   - Days Active: Sort descending
3. Click "View" on facility
4. Review violation history
5. Export violation table with discharge limits
6. Use CSV for case packet documentation

## Technical Details

### Sortable Column Implementation

All enhanced tables use consistent sorting:
```tsx
const [sortField, setSortField] = useState<SortField>("date")
const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

const handleSort = (field: SortField) => {
  if (sortField === field) {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  } else {
    setSortField(field)
    setSortOrder("desc")
  }
}
```

### Filter State Management

```tsx
// Initialize from URL
const searchParams = useSearchParams()
const [filter, setFilter] = useState(searchParams.get("param") || "")

// Sync to URL
useEffect(() => {
  const params = new URLSearchParams()
  if (filter) params.append("param", filter)
  router.replace(`?${params.toString()}`)
}, [filter])
```

### API Query Building

```typescript
// Client-side
const params = new URLSearchParams({
  limit: "50",
  offset: offset.toString(),
})
if (selectedFacility) params.append("facilityPlaceId", selectedFacility)
if (startDate) params.append("startDate", startDate.toISOString().split("T")[0])

// Server-side (API route)
const where: any = {}
if (params.facilityPlaceId) {
  where.location = { facilityPlaceId: params.facilityPlaceId }
}
if (params.startDate) {
  where.samplingDate = { gte: new Date(params.startDate) }
}
```

## Accessibility

All filter components support:
- Keyboard navigation (Tab, Enter, Arrow keys)
- Screen reader labels
- Focus indicators
- ARIA attributes
- Mobile-responsive layouts

## Performance Considerations

1. **Debounced Search:** Text inputs wait 300ms before triggering API calls
2. **Pagination:** Large datasets limited to 50 rows per page (configurable)
3. **Database Indexes:** All filterable columns have indexes
4. **Client-Side Sorting:** Current page sorted in browser to reduce API calls
5. **Lazy Loading:** Filter options loaded separately from main data

## Future Enhancements

Potential additions:
- [ ] Multi-select filters (select multiple counties, parameters)
- [ ] Saved filter presets (bookmark common queries)
- [ ] Advanced date filters (last 30 days, this quarter, etc.)
- [ ] PDF export with charts
- [ ] Batch operations (bulk dismiss violations)
- [ ] Real-time filter result preview
- [ ] Filter suggestions based on data
- [ ] Mobile-optimized filter drawer

## Troubleshooting

### Filters not working
- Check browser console for errors
- Verify API route is accessible
- Confirm database indexes exist
- Check URL parameters are valid

### Export fails
- Limit export to <10,000 records
- Check browser popup blocker
- Verify sufficient memory
- Try clearing filters to reduce dataset

### Slow performance
- Add database indexes on filtered columns
- Reduce pagination limit
- Use more specific filters
- Consider caching frequent queries

## Migration Guide

### Replacing old components

**Old:**
```tsx
<ViolationsTable violations={data} />
```

**New:**
```tsx
<ViolationsTableEnhanced
  violations={data}
  showExport={true}
  filters={currentFilters}
/>
```

**Old:**
```tsx
<SampleTable data={data} onPageChange={handlePage} />
```

**New:**
```tsx
<SampleTableEnhanced
  data={data}
  onPageChange={handlePage}
  filters={currentFilters}
  showCompliance={true}
/>
```

## API Changes

### New Query Parameters

**Samples API** (`/api/esmr/samples`):
- `locationType`: ESMRLocationType enum
- Existing: `facilityPlaceId`, `parameterId`, `qualifier`, `startDate`, `endDate`, `sortBy`, `sortOrder`

### Response Format (unchanged)

All enhanced components use existing API response formats. No breaking changes.

## Contact

For questions or issues with filtering features:
- Review this documentation
- Check component source code in `/components/filters/` and `/components/*/table-enhanced.tsx`
- Review API route implementations in `/app/api/esmr/*/route.ts`
