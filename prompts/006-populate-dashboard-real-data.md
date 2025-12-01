<objective>
Populate the dashboard with real data from the eSMR database. Currently the dashboard shows:
- Active Violations: 0
- Impaired Waters: 0
- Facilities Tracked: 0
- Top Pollutant: —
- Peak Exceedance: —

This is because after mock data cleanup, the `Facility` and `ViolationEvent` tables are empty, but we have 369 real eSMR facilities with 1.2M+ samples in the database.

The goal is to create `Facility` records from eSMR data and compute violations based on benchmark exceedances.
</objective>

<context>
Read CLAUDE.md for project conventions.

The app has two facility systems:
1. **Facility table** (original) - Used for violation tracking, subscriptions, alerts
2. **ESMRFacility table** - Real California Water Board data (369 facilities, 1.2M+ samples)

Current state:
- `Facility` table: 0 records (mock data removed)
- `ESMRFacility` table: 369 records
- `ESMRSample` table: 1.2M+ records
- `ViolationEvent` table: 0 records

The `link-esmr-facilities.ts` script was designed to link *existing* Facility records to eSMR data, but there are no Facility records to link.

Key schema relationships:
@prisma/schema.prisma

Existing scripts:
@scripts/link-esmr-facilities.ts - Links existing facilities, doesn't create new ones
@scripts/import-esmr.ts - Imports eSMR data from CSV
</context>

<research>
Before implementing, investigate:

1. **What makes a "violation"?**
   - The app computes violations from Sample records when exceedanceRatio > 1
   - But eSMRSample doesn't have exceedanceRatio or benchmark fields
   - Need to determine: Does eSMR data have benchmark values we can use?
   - Or do we need a pollutant benchmark configuration table?

2. **Check existing benchmark config**:
   - Look at `ConfigPollutant` table and schema
   - Check if it has benchmark values
   - Look at how violations were computed from mock data

3. **Determine the data mapping**:
   - ESMRFacility has: facilityPlaceId, facilityName, regionCode
   - Facility needs: permitId, lat, lon, county, etc.
   - Where do we get lat/lon for facilities? ESMRLocation has coordinates
   - How do we map eSMR region codes to counties?

4. **Check violation computation logic**:
   - Look at `/api/violations/recompute` endpoint
   - Understand how violations are computed from samples
</research>

<requirements>
## Phase 1: Create Facility Records from eSMR Data

Create a new script `scripts/create-facilities-from-esmr.ts` that:
1. Reads all ESMRFacility records
2. For each, gets the primary location's coordinates from ESMRLocation
3. Creates a Facility record with:
   - `name`: from ESMRFacility.facilityName
   - `permitId`: generated from facilityPlaceId (e.g., "ESMR-{facilityPlaceId}")
   - `lat`, `lon`: from first ESMRLocation with coordinates
   - `esmrFacilityId`: link to ESMRFacility
   - `county`: derived from region or set to null initially
4. Make the script idempotent (skip existing records)
5. Add npm script: `"db:create-facilities": "tsx scripts/create-facilities-from-esmr.ts"`

## Phase 2: Compute Violations from eSMR Samples

Option A - Direct Approach:
- Create ViolationEvent records based on eSMR samples exceeding known benchmarks
- Need a mapping of eSMR parameter names to benchmark values
- Reference ConfigPollutant for canonical pollutant keys

Option B - Use Existing Violation Recompute:
- If /api/violations/recompute works, just call it after creating Facilities
- May need Sample records too (not just ESMRSample)

Determine best approach based on research.

## Phase 3: Update Dashboard Stats

The `StatsCards` component shows:
- Active Violations: count from ViolationEvent where dismissed=false
- Impaired Waters: count of ViolationEvent where impairedWater=true
- Facilities Tracked: count of Facility records
- Top Pollutant: most common pollutant in ViolationEvent
- Peak Exceedance: max(maxRatio) from ViolationEvent

After Phase 1 & 2, these should populate automatically.
</requirements>

<implementation>
Approach step by step:

**Step 1: Research existing violation logic**
- Read the violation computation code
- Understand what data is needed
- Check ConfigPollutant for benchmark values

**Step 2: Create facility population script**
- Write scripts/create-facilities-from-esmr.ts
- Handle coordinate extraction from ESMRLocation
- Make idempotent with upsert

**Step 3: Determine violation strategy**
- If eSMR has benchmark data → compute directly
- If need Sample records → consider if worth creating 1.2M records
- Consider: start with a subset (e.g., facilities with recent samples only)

**Step 4: Execute and verify**
- Run the scripts
- Check dashboard shows real data
- Verify buttons work (they should - issue is likely cache/hydration)

WHY this order: We need Facility records first before violations can be computed, and we need to understand the existing logic before implementing.
</implementation>

<constraints>
- Do NOT delete any existing eSMR data (ESMRFacility, ESMRSample, etc.)
- Keep scripts idempotent (safe to run multiple times)
- Don't create 1.2M+ Sample records unless necessary (consider performance)
- The Facility-ESMRFacility link should be maintained via esmrFacilityId
</constraints>

<output>
Create/modify files:
- `./scripts/create-facilities-from-esmr.ts` - New script to create Facilities
- `./package.json` - Add new npm script
- Possibly `./scripts/compute-esmr-violations.ts` - If needed for violation computation

After running the scripts, verify:
- Dashboard shows Facilities Tracked > 0
- eSMR sections continue to work
- Buttons navigate correctly
</output>

<verification>
1. Run facility creation script:
   ```bash
   npm run db:create-facilities
   ```

2. Check database:
   ```bash
   npx prisma studio
   # Verify Facility table has records
   ```

3. Check dashboard:
   - Facilities Tracked should show count
   - If violations computed, those stats should populate too

4. Test navigation:
   - Click "eSMR Data" button
   - Click "Explore Full Dataset"
   - Click "View All" under Recent eSMR Activity
   - All should navigate to /esmr or /esmr/samples
</verification>

<success_criteria>
- Facility table has records created from ESMRFacility data
- Dashboard shows "Facilities Tracked" count > 0
- Navigation buttons work correctly
- No hydration errors on any page
- Build succeeds without errors
</success_criteria>
