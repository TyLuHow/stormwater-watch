<objective>
Thoroughly analyze and remove ALL mock data from the codebase and database, ensuring the application exclusively uses real facilities from the validated eSMR (Electronic Self-Monitoring Report) data import.

The app currently has mock facilities like `fac-001`, `fac-002`, `WDID-001` that were created for development. These need to be completely replaced with real California Water Board eSMR facilities that have actual monitoring data.

This is critical for production readiness - stakeholders need to see real water quality data, not placeholder information.
</objective>

<context>
Read CLAUDE.md for project conventions.

This is a Next.js application with:
- Prisma ORM connected to Supabase PostgreSQL
- Two facility systems: `Facility` (original) and `ESMRFacility` (from eSMR import)
- 1.2M+ real water quality samples from California Water Board eSMR data
- Mock data scattered through seed files, fixtures, and possibly hardcoded in components

Key files to examine:
@prisma/schema.prisma - understand both Facility and ESMRFacility models
@prisma/seed.ts - likely contains mock facility seeding
@prisma/seed-test-data.ts - test data seeding
@__tests__/fixtures/* - test fixtures with mock data
@app/facilities/* - facility pages that may reference mock IDs
@app/dashboard/* - dashboard may have mock data displays
@lib/mock-data.ts or similar - any mock data modules
</context>

<research>
Before making changes, thoroughly investigate:

1. **Database state**: Query to find all facilities with mock patterns
   - IDs like `fac-001`, `fac-002`, etc.
   - PermitIds like `WDID-001`, `WDID-002`, etc.
   - Generic names like "Oakland Industrial Park", "Fremont Manufacturing"

2. **Mock data sources**: Search codebase for:
   - Seed files that create mock facilities
   - Hardcoded facility IDs in components
   - Mock data fixture files
   - Any fallback mock data in API routes

3. **Real data availability**: Confirm eSMR data exists:
   - Count of ESMRFacility records
   - Count of ESMRSample records
   - Regional distribution of real facilities

4. **Dependencies**: Find what relies on mock facility IDs:
   - Violations linked to mock facilities
   - Subscriptions referencing mock facilities
   - Any UI components with hardcoded mock IDs
</research>

<requirements>
1. **Remove mock facilities from database**
   - Delete all Facility records with mock IDs (fac-001, fac-002, etc.)
   - Handle foreign key constraints (violations, subscriptions) appropriately
   - Create a migration script or seed cleanup script

2. **Remove mock data from codebase**
   - Delete or update seed files that create mock data
   - Remove mock fixture files or clearly mark them as test-only
   - Remove any hardcoded mock facility references from components
   - Clean up any mock data modules/utilities

3. **Bridge real eSMR data to Facility model** (if needed)
   - Option A: Create Facility records from ESMRFacility data
   - Option B: Refactor app to use ESMRFacility directly
   - Option C: Use the existing facility linking system
   - Choose the approach that best serves the app architecture

4. **Update UI components**
   - Ensure facility lists show real eSMR facilities
   - Update facility detail pages to work with real data
   - Fix any broken references to mock IDs
   - Dashboard should display real facility counts and data

5. **Verify data integrity**
   - All facility pages should load without 404s
   - Sample data should display correctly for real facilities
   - No references to mock IDs remain in the codebase
</requirements>

<implementation>
Approach this systematically:

**Phase 1: Audit**
- Run database queries to identify all mock data
- Search codebase for mock patterns: `fac-`, `WDID-`, mock facility names
- Document all locations where mock data exists

**Phase 2: Create cleanup scripts**
- Write a script to safely remove mock facilities
- Handle cascading deletes for related records
- Make the script idempotent (safe to run multiple times)

**Phase 3: Update data sources**
- Modify seed files to use real eSMR data or remove mock seeding
- Update any API routes that fall back to mock data
- Ensure dashboard queries pull from real data

**Phase 4: Fix UI references**
- Update components that hardcode facility IDs
- Ensure facility lists query real data
- Fix any broken links or 404s

**Phase 5: Verify**
- Run the app and test all facility-related pages
- Verify no TypeScript errors related to mock types
- Confirm real data appears throughout the app

WHY this order matters: We need to understand what exists before removing it, then remove safely, then fix what breaks, then verify everything works.
</implementation>

<constraints>
- Do NOT delete ESMRFacility, ESMRSample, or other eSMR tables - these contain the real data
- Preserve test fixtures that are explicitly for unit tests (but clearly mark them)
- Do NOT break the build - ensure TypeScript compiles after changes
- Keep the facility linking system intact if it's being used
- Create backup/rollback capability for database changes
</constraints>

<output>
Create/modify files as needed:

- `./scripts/cleanup-mock-data.ts` - Script to remove mock data from database
- `./prisma/seed.ts` - Updated to not create mock facilities (or create from real data)
- Update any components in `./app/` that reference mock IDs
- `./MOCK_DATA_CLEANUP.md` - Document what was removed and why

Run the cleanup script and verify the app works with real data only.
</output>

<verification>
Before declaring complete, verify:

1. Database verification:
   - `SELECT COUNT(*) FROM facilities WHERE id LIKE 'fac-%'` returns 0
   - `SELECT COUNT(*) FROM esmr_facilities` returns > 0 (real data exists)
   - `SELECT COUNT(*) FROM esmr_samples` returns > 0

2. Codebase verification:
   - `grep -r "fac-001" .` returns no results (excluding git history)
   - `grep -r "WDID-001" .` returns no results
   - `npm run type-check` passes
   - `npm run build` succeeds

3. Runtime verification:
   - Homepage loads without errors
   - Dashboard shows real facility counts
   - Facility list pages show real eSMR facilities
   - Facility detail pages load with real data
   - No 404 errors for facility routes
</verification>

<success_criteria>
- Zero mock facilities remain in the database
- Zero hardcoded mock facility references in the codebase (except clearly-marked test files)
- All UI pages display real eSMR facility data
- TypeScript compiles without errors
- App builds successfully
- A cleanup script exists for future use
- Documentation explains what was changed
</success_criteria>
