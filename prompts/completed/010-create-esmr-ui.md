<objective>
Create a dedicated eSMR section in the app for exploring the 1.2M+ water quality samples.

Build new pages under /esmr/* that allow users to browse, search, and analyze eSMR data from California Water Board facilities.
</objective>

<context>
Read CLAUDE.md for project conventions.

API endpoints available (from previous prompt):
- GET /api/esmr/facilities - List facilities with filters
- GET /api/esmr/facilities/[id] - Single facility details
- GET /api/esmr/samples - List samples with filters
- GET /api/esmr/parameters - List parameters
- GET /api/esmr/regions - List regions
- GET /api/esmr/stats - Dashboard statistics

Existing UI components in `components/ui/` (shadcn/ui components).
Existing dashboard pattern in `app/dashboard/page.tsx`.

Data available:
- 1.2M+ samples from 2025
- Facilities across 9 California water board regions
- Parameters like Copper, BOD, Flow, pH, etc.
- Location types: Effluent, Influent, Receiving Water, etc.
</context>

<requirements>
Create the following pages:

1. **`/esmr` - eSMR Dashboard**
   - Overview statistics (total samples, facilities, parameters)
   - Regional breakdown with sample counts
   - Recent samples summary
   - Quick links to explore facilities, parameters

2. **`/esmr/facilities` - Facility Browser**
   - Searchable list of facilities
   - Filter by region
   - Show sample count, location count per facility
   - Click to view facility details
   - Pagination for large result sets

3. **`/esmr/facilities/[id]` - Facility Detail**
   - Facility information (name, region, receiving water body)
   - List of monitoring locations
   - Sample history table with pagination
   - Charts showing sample trends over time (by parameter)
   - Filter samples by parameter, date range

4. **`/esmr/parameters` - Parameter Explorer**
   - List of all measured parameters
   - Sample count per parameter
   - Click to see all samples for that parameter across facilities

5. **`/esmr/samples` - Sample Search**
   - Advanced search across all samples
   - Filter by: facility, location, parameter, date range, qualifier
   - Export functionality (CSV download)
   - Pagination with large result handling

Components to create:
- `components/esmr/stats-overview.tsx` - Stats cards for eSMR dashboard
- `components/esmr/facility-table.tsx` - Sortable facility list
- `components/esmr/sample-table.tsx` - Sample results table with pagination
- `components/esmr/parameter-chart.tsx` - Time series chart for parameter values
- `components/esmr/region-filter.tsx` - Region dropdown filter
</requirements>

<implementation>
Use Server Components where possible for initial data loading.
Use Client Components for interactive filtering and pagination.

Follow existing patterns:
- Use shadcn/ui Card, Table, Badge, Button components
- Match styling from existing dashboard
- Use the same responsive grid layouts

For charts, use existing charting library if present, or add recharts if needed.

Pages should show loading states and handle errors gracefully.
</implementation>

<output>
Create files:
- `./app/esmr/page.tsx` - Dashboard
- `./app/esmr/facilities/page.tsx` - Facility list
- `./app/esmr/facilities/[id]/page.tsx` - Facility detail
- `./app/esmr/parameters/page.tsx` - Parameter explorer
- `./app/esmr/samples/page.tsx` - Sample search
- `./components/esmr/stats-overview.tsx`
- `./components/esmr/facility-table.tsx`
- `./components/esmr/sample-table.tsx`
- `./components/esmr/parameter-chart.tsx`
- `./components/esmr/region-filter.tsx`
</output>

<verification>
Before completing:
1. Run `npm run build` - must pass
2. Navigate to /esmr and verify dashboard loads with real data
3. Verify facility list shows data and pagination works
4. Click into a facility and verify samples display
5. Test parameter explorer
6. Verify sample search filters work
</verification>

<success_criteria>
- All 5 pages created and functional
- Data loads from real eSMR tables (no mock data)
- Pagination works smoothly for large datasets
- Charts display parameter trends
- Responsive design matches existing app style
- Loading and error states handled properly
</success_criteria>
