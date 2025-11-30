<objective>
Integrate eSMR data into the main dashboard to show water quality metrics alongside existing violation tracking.

Add eSMR statistics, recent samples, and facility coverage to the main Water Quality Command Center dashboard.
</objective>

<context>
Read CLAUDE.md for project conventions.

Main dashboard at `app/dashboard/page.tsx` currently shows:
- ViolationEvent data from original Facility/Sample models
- Map of California facilities
- Stats cards (violations, facilities, etc.)
- Regional hotspots by county
- Violations table

eSMR data available:
- 1.2M+ samples in ESMRSample table
- Facilities across 9 California regions
- Real water quality data (not mock)

API endpoints:
- GET /api/esmr/stats - Quick dashboard stats
- GET /api/esmr/facilities - Facility data
- GET /api/esmr/samples - Sample data
</context>

<requirements>
Enhance the main dashboard with eSMR data:

1. **Add eSMR Stats Section**
   - New row of stat cards showing:
     - Total eSMR samples monitored
     - Active monitoring facilities
     - Parameters tracked
     - Samples this month
   - Link to /esmr for full exploration

2. **Recent eSMR Activity Widget**
   - Show last 5-10 samples submitted
   - Display: facility name, parameter, result, date
   - "View All" link to /esmr/samples

3. **Regional Coverage Map Integration**
   - If the map component supports it, show eSMR facility locations
   - Or add a toggle to switch between violation facilities and eSMR facilities

4. **Update Header/Navigation**
   - Add link to /esmr section in the app navigation
   - Add "eSMR Data" or "Monitoring Data" to any nav menus

5. **Data Source Indicator**
   - Show where data is coming from (eSMR 2025 dataset)
   - Include last import date if available from ESMRImport table
</requirements>

<implementation>
Create new components for eSMR widgets:
- `components/dashboard/esmr-stats-cards.tsx`
- `components/dashboard/esmr-recent-activity.tsx`

Modify existing:
- `app/dashboard/page.tsx` - Add eSMR sections
- Navigation component (find and update)

Fetch eSMR stats server-side alongside existing violation data.
Keep existing violation tracking intact - this is additive.
</implementation>

<output>
Create files:
- `./components/dashboard/esmr-stats-cards.tsx`
- `./components/dashboard/esmr-recent-activity.tsx`

Modify files:
- `./app/dashboard/page.tsx`
- Navigation/header components as needed
</output>

<verification>
Before completing:
1. Run `npm run build` - must pass
2. Visit /dashboard and verify:
   - Original violation data still displays
   - New eSMR stats cards show real counts
   - Recent eSMR activity shows samples
   - Navigation includes link to /esmr
3. Verify responsive layout works on mobile
</verification>

<success_criteria>
- eSMR stats visible on main dashboard
- Original violation tracking unchanged
- Navigation updated with eSMR link
- Data loading efficiently (no slow page loads)
- Consistent styling with existing dashboard
</success_criteria>
