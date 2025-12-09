<objective>
Add comprehensive filtering and table enhancement features for all violation and monitoring data displays. Enable professionals to quickly find specific violations, exceedances, and monitoring results by date range, parameter, facility, severity, and other relevant criteria.

"Filtering and search functions on tables are always helpful" - domain expert feedback
</objective>

<context>
**Expert Feedback:**
"Filter windows like this by date range, parameter, etc. Would also be helpful to have a column for their discharge limits or applicable health-based screening standards."

**Current State:**
- Tables likely lack advanced filtering
- Missing discharge limit and screening standard columns
- No date range pickers
- No parameter/pollutant filtering
- No quick search functionality

**User Need:**
Water professionals need to:
- Filter violations by date range to find recent exceedances
- Search by specific pollutants (e.g., "show me all E.coli violations")
- Filter by severity level for enforcement prioritization
- See discharge limits and screening standards alongside results for context
- Export filtered results for reports
- Sort by multiple columns

Read existing table components to understand current implementation patterns.
Examine data structures to determine what filtering options are feasible.
</context>

<requirements>
**1. Violation Tables Enhancement:**

Add filtering for:
- Date range (from/to date pickers)
- Pollutant/parameter (dropdown or autocomplete)
- Severity level (low/medium/high/critical)
- County/region
- Facility name (search/autocomplete)
- Status (active/resolved)

Add columns:
- Discharge limit (permit limit for that parameter)
- Screening standard (health-based standard)
- Exceedance ratio (measured value / limit)
- Days in violation
- Enforcement status

**2. Facility Monitoring Data Tables:**

Add filtering for:
- Date range
- Parameter/pollutant
- Monitoring location (EFF-001, R-001D, etc.)
- Compliance status (in compliance / exceedance)

Add features:
- Show discharge limit column
- Show screening standard column
- Visual indicators (green = compliant, yellow = warning, red = violation)
- Sorting by any column

**3. Active Violation Events Table:**

Add filtering for:
- Date range (violation start date)
- Severity
- Pollutant
- Region/county
- Facility search

Enhance display:
- Clarify "Count" column (is it days? samples? events?)
- Add "Resolution Date" column (null if still active)
- Add "Days Active" calculation
- Show max exceedance ratio in period

**4. Search Functionality:**

Implement quick search across tables:
- Free-text search for facility names
- Parameter name search with autocomplete
- Debounced search (don't query on every keystroke)
- Clear search button

**5. Export Features:**

Add export options:
- Export filtered results to CSV
- Include all visible columns plus metadata
- Filename with timestamp and filter description
- Optional: PDF export for case packets
</requirements>

<implementation>
**Phase 1 - Create Reusable Filter Components:**

Create `./components/filters/` directory with:
- `DateRangeFilter.tsx` - From/to date pickers using react-day-picker
- `ParameterFilter.tsx` - Pollutant selection with autocomplete
- `SeverityFilter.tsx` - Severity level multi-select
- `FacilitySearch.tsx` - Facility name search with debounce
- `RegionFilter.tsx` - County/region selection
- `FilterBar.tsx` - Container component that composes all filters

**Phase 2 - Enhance Table Components:**

Find existing table components (likely in `./components/tables/*` or inline in page files).

For each table:
1. Add filter bar above table
2. Integrate filtering logic with data fetching
3. Add discharge limit and screening standard columns
4. Implement column sorting
5. Add visual indicators (status badges, severity colors)

**Phase 3 - Backend Query Updates:**

Update API routes to accept filter parameters:
- Add query params: `dateFrom`, `dateTo`, `parameter`, `severity`, `facility`, etc.
- Update Prisma queries to filter based on params
- Ensure efficient querying (use indexes, don't over-fetch)
- Return filtered count and total count

**Phase 4 - Add Export Functionality:**

Create export utilities:
- `./lib/export/csv-generator.ts` - Convert table data to CSV
- `./lib/export/pdf-generator.ts` - Generate PDF reports (using @react-pdf/renderer)
- Add export buttons to table components
- Handle large datasets (pagination vs full export)

**Phase 5 - Discharge Limits and Screening Standards:**

Integrate limits into queries:
- Join facility discharge permits with monitoring results
- Fetch applicable screening standards for each parameter
- Calculate exceedance ratios (measured / limit)
- Display limits alongside measured values in tables

Example column additions:
| Parameter | Result | Unit | Discharge Limit | Screening Standard | Ratio | Status |
|-----------|--------|------|-----------------|-------------------|-------|---------|
| E.coli    | 350    | mg/L | 200            | 126 (EPA)         | 1.75x | Violation |
</requirements>

<technical_approach>
**Filtering Architecture:**

Use URL query parameters for filters to enable:
- Shareable filtered views
- Browser back/forward navigation
- Bookmark specific filter combinations

Example: `/violations?dateFrom=2025-01-01&dateTo=2025-12-31&parameter=e-coli&severity=high`

**State Management:**

For complex filter interactions:
- Use React state for UI (selected filters)
- Sync with URL query params using Next.js router
- Debounce text search to avoid excessive requests
- Show loading states during data fetching

**Performance:**

- Implement pagination for large datasets
- Use database indexes on commonly filtered columns
- Cache filter options (parameter lists, regions) to avoid repeated queries
- Consider server-side rendering for initial page load
</technical_approach>

<constraints>
- All filtering must be accessible (keyboard navigation, screen readers)
- Mobile-responsive filter UI (collapsible on small screens)
- Clear "Clear all filters" button
- Show active filter count (e.g., "3 filters applied")
- Don't break existing functionality while enhancing
- WHY: Professionals rely on consistent, predictable interfaces
</constraints>

<output>
Create/modify:
- Filter components in `./components/filters/`
- Table components with integrated filtering
- API routes with filter query support
- Export utilities in `./lib/export/`
- Updated facility/violation page components

Document:
- Available filters for each table
- Export formats and options
- How discharge limits and screening standards are calculated
</output>

<verification>
Before completing, verify:
- [ ] Date range filtering works on all tables
- [ ] Parameter filtering shows relevant options
- [ ] Discharge limit and screening standard columns display correctly
- [ ] Sorting works on all columns
- [ ] Export to CSV produces valid, complete files
- [ ] Filter combinations work correctly (AND logic)
- [ ] Clear filters resets to unfiltered state
- [ ] URL params sync with filter state
- [ ] Mobile filter UI is usable
- [ ] Performance is acceptable with filters applied
</verification>

<success_criteria>
- Water professionals can filter any table by date range, parameter, and other criteria
- Discharge limits and screening standards are visible alongside measured values
- Filtered views can be exported to CSV for reporting
- Filter state is preserved in URL for sharing
- All tables are sortable by any column
- Search functionality is fast and intuitive
- Expert feedback requirement met: "Filter windows by date range, parameter, etc. Would also be helpful to have a column for their discharge limits"
</success_criteria>
