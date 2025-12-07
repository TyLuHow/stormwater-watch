# TO-DOS

## Pending

### UI/UX Improvements
- [ ] Add back buttons on some pages (navigation improvement)

### Data Integration
- [ ] Research, plan, and strategize how to automate finding, ingesting, and integrating SMARTS/CIWQS data into the system
  - Refer back to the feasibility matrix
  - Consider automation workflows similar to eSMR cron sync

## Map Light Mode Update - 2025-12-07 13:24

- **Update map to support light mode** - Configure Mapbox map style to adapt based on theme. **Problem:** Currently hardcoded to use `mapbox://styles/mapbox/dark-v11` which doesn't match when users switch to light mode. **Files:** `components/dashboard/map.tsx:55` (map style configuration). **Solution:** Detect theme (light/dark) using next-themes and switch between `mapbox://styles/mapbox/light-v11` and `mapbox://styles/mapbox/dark-v11`, or use a custom Mapbox style that supports both themes.

## Fix eSMR Database Connection - 2025-12-07 13:40

- **Fix eSMR explorer page database connection** - Resolve "Failed to load dashboard data" error on /esmr route. **Problem:** The /esmr page exists but shows error when loading. Page tries to fetch from API endpoints (`/api/esmr/stats` and `/api/esmr/regions`) during server-side rendering, but these requests are failing. Button was removed from landing page as temporary workaround. **Files:** `app/esmr/page.tsx:12-35` (getStats and getRegions functions), `app/api/esmr/stats/route.ts`, `app/api/esmr/regions/route.ts`. **Solution:** Debug why API endpoints return errors - likely database connection issue during SSR, or NEXT_PUBLIC_APP_URL not set correctly for internal fetch calls. Consider using direct Prisma queries instead of internal HTTP requests, or add proper error handling with fallback UI.

## Completed

### 2025-11-30
- [x] Validate weekly eSMR cron job works correctly
  - Fixed resource IDs for data.ca.gov CKAN API
  - Fixed field name mismatches in API response
  - Fixed region code parsing (R2 format)
  - Fixed NaN string value handling
- [x] Remove all mock data from codebase and database
  - Cleanup script: `npm run db:cleanup-mock`
  - Documentation: `MOCK_DATA_CLEANUP.md`
  - Test fixtures marked as TEST ONLY
- [x] Push all changes to GitHub (commit 1378f16)
