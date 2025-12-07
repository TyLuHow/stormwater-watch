# TO-DOS

## Pending

### UI/UX Improvements
- [ ] Add back buttons on some pages (navigation improvement)

### Data Integration
- [ ] Research, plan, and strategize how to automate finding, ingesting, and integrating SMARTS/CIWQS data into the system
  - Refer back to the feasibility matrix
  - Consider automation workflows similar to eSMR cron sync

## Fix eSMR Database Connection - 2025-12-07 13:40

- **Fix eSMR explorer page database connection** - Resolve "Failed to load dashboard data" error on /esmr route. **Problem:** The /esmr page exists but shows error when loading. Page tries to fetch from API endpoints (`/api/esmr/stats` and `/api/esmr/regions`) during server-side rendering, but these requests are failing. Button was removed from landing page as temporary workaround. **Files:** `app/esmr/page.tsx:12-35` (getStats and getRegions functions), `app/api/esmr/stats/route.ts`, `app/api/esmr/regions/route.ts`. **Solution:** Debug why API endpoints return errors - likely database connection issue during SSR, or NEXT_PUBLIC_APP_URL not set correctly for internal fetch calls. Consider using direct Prisma queries instead of internal HTTP requests, or add proper error handling with fallback UI.

## Complete Landing Page Infrastructure - 2025-12-07 13:42

- **Download and configure CalEnviroScreen DAC geodata** - Make DAC boundaries functional for spatial enrichment. **Problem:** Code infrastructure exists (`lib/enrichment/spatial.ts`) but only has placeholder GeoJSON file (761 bytes). Landing page lists as "Infrastructure Ready" but needs real data. **Files:** `public/geodata/calenviroscreen-dacs.geojson` (placeholder), `public/geodata/README.md:40-59` (download instructions). **Solution:** Follow instructions in README to download CalEnviroScreen 4.0 shapefile from OEHHA, filter for CIscoreP >= 75 (disadvantaged communities), convert to GeoJSON using ogr2ogr, and replace placeholder file.

- **Download and configure USGS HUC12 watershed geodata** - Make watershed boundaries functional for spatial enrichment. **Problem:** Code infrastructure exists but only has placeholder GeoJSON file (601 bytes). Landing page lists as "Infrastructure Ready" but needs real data. **Files:** `public/geodata/huc12-california.geojson` (placeholder), `public/geodata/README.md:22-38` (download instructions). **Solution:** Download HUC-12 boundaries from USGS National Map Downloader for California (Region 18), convert shapefile to GeoJSON, and replace placeholder. File may be large (>100MB), consider simplifying geometries for web performance.

- **Test and validate NOAA precipitation API integration** - Verify precipitation data fetching works end-to-end. **Problem:** Code exists (`lib/providers/precipitation.ts`, `app/api/precipitation/route.ts`) and is integrated into case packet generation, but hasn't been tested with real API calls. Landing page lists as "Infrastructure Ready (untested)". **Files:** `lib/providers/precipitation.ts:32-85` (getNWSGridPoint), `lib/providers/precipitation.ts:92-193` (getPrecipitationForDate), `lib/case-packet/generator.tsx` (integration point). **Solution:** Test with real coordinates and dates, ensure NWS_USER_AGENT env var is set, verify Redis caching works (or degrades gracefully), and confirm case packets include precipitation data correctly.

- **Complete SMARTS violation data import** - Move from "In Development" to "Functional" status. **Problem:** Landing page lists SMARTS/CIWQS violations as "In Development" with manual import. Need to automate similar to eSMR weekly sync. Already in todo list above but duplicating here for landing page context. **Files:** Sample CSVs exist in `data/samples/smarts-*.csv`. **Solution:** Refer to existing "Research, plan, and strategize SMARTS/CIWQS data integration" todo above.

- **Implement EPA 303(d) impaired waters integration** - Move from "Planned" to functional. **Problem:** Landing page lists EPA 303(d) as "Planned" for receiving water analysis. Need to determine data source, download method, and integration approach. **Files:** None yet (new feature). **Solution:** Research EPA ATTAINS database API or download options, design schema for impaired water body tracking, integrate with facility receiving water fields, and add to spatial enrichment pipeline.

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
