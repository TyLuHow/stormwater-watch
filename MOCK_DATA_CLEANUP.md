# Mock Data Cleanup - Production Readiness

**Date:** 2025-11-30
**Status:** ✅ Complete

## Overview

This document details the removal of all mock/test data from the Stormwater Watch application and the transition to exclusively using real California Water Board eSMR (Electronic Self-Monitoring Report) facility data.

## Motivation

The application was initially developed with mock facilities and sample data for development and testing purposes. These included facilities like:
- Oakland Industrial Park (WDID-001)
- Fremont Manufacturing (WDID-002)
- Berkeley Chemical Works (WDID-004)
- And 7 other fictional facilities

However, for **production readiness**, stakeholders need to see real water quality data from actual California facilities, not placeholder information. We now have access to:
- **369 real eSMR facilities** from the California Water Boards
- **1.2M+ actual water quality samples** with real monitoring data
- Geographic coverage across all California regions

## What Was Removed

### 1. Database Records (via cleanup script)

Deleted from production database:
- ✓ **10 mock facilities** with patterns like `fac-001`, `fac-002`, etc.
- ✓ **22 mock samples** with test pollutant data
- ✓ **10 mock violation events** based on fake exceedances
- ✓ **0 alerts** (none were linked to mock facilities)

### 2. Seed Files Updated

#### `/prisma/seed.ts`
**Before:** Created 10 mock facilities with random sample data
**After:**
- Creates only essential configuration (users, pollutant configs, subscriptions)
- Does NOT create any facilities or samples
- Provides helpful messages directing users to import real eSMR data
- Preserves existing eSMR data in the database

#### `/prisma/seed.sql`
**Before:** SQL script to manually seed 10 facilities, 22 samples, and 10 violations
**After:**
- Only seeds users, pollutant configs, and example subscriptions
- All facility/sample creation sections removed
- Updated with clear comments explaining the change

### 3. Test Fixtures Marked as Test-Only

Updated test fixture files with prominent warnings:

#### `/__tests__/fixtures/mock-facilities.ts`
- Added ⚠️ WARNING header
- Clearly marked as "TESTING ONLY"
- Explains these should never be in production database

#### `/__tests__/fixtures/mock-violations.ts`
- Added ⚠️ WARNING header
- Clearly marked as "TESTING ONLY"
- Documents proper source of violation data (computed from real eSMR samples)

### 4. Infrastructure Added

Created `/scripts/cleanup-mock-data.ts`:
- Idempotent cleanup script (safe to run multiple times)
- Identifies mock facilities by ID patterns and names
- Handles cascading deletes for samples, violations, and alerts
- Provides detailed reporting of what was removed
- Available via: `npm run db:cleanup-mock`

Added npm script in `package.json`:
```json
"db:cleanup-mock": "tsx scripts/cleanup-mock-data.ts"
```

## What The App Now Uses

### Real Data Sources

The application now exclusively relies on:

1. **eSMR Facilities** (`esmr_facilities` table)
   - 369 real facilities from California Water Boards
   - Actual facility names and locations
   - Regional organization (9 water board regions)

2. **eSMR Samples** (`esmr_samples` table)
   - 1,199,399+ real water quality samples
   - Actual monitoring data with parameters like pH, metals, nutrients
   - Real timestamps and analytical methods
   - Quality control indicators

3. **Optional Facility Linking** (`Facility` table with `esmrFacilityId`)
   - The app can create `Facility` records linked to eSMR data
   - This enables violation tracking and subscriptions
   - Script available: `npm run link:facilities`

### Data Import Workflow

To populate the database with real data:

```bash
# 1. Import eSMR facility and sample data
npm run import:esmr

# 2. (Optional) Create Facility records linked to eSMR data
# This enables violation tracking for specific facilities
npm run link:facilities

# 3. Seed configuration data (users, pollutants, subscriptions)
npm run db:seed
```

## Files Modified

### Created
- `/scripts/cleanup-mock-data.ts` - Database cleanup utility

### Updated
- `/prisma/seed.ts` - Removed mock facility creation
- `/prisma/seed.sql` - Removed mock facility SQL inserts
- `/__tests__/fixtures/mock-facilities.ts` - Added test-only warnings
- `/__tests__/fixtures/mock-violations.ts` - Added test-only warnings
- `/package.json` - Added `db:cleanup-mock` script

### Not Modified (Intentionally)
- `/app/facilities/[id]/page.tsx` - Works with both mock IDs (for tests) and real facility IDs
- `/app/dashboard/page.tsx` - Already queries real database data dynamically
- `/prisma/schema.prisma` - No schema changes needed
- Test files - Still can use mock fixtures for unit tests

## Verification Results

### Database State After Cleanup

```bash
✅ No mock facilities found in database. Already clean!

Real data in database:
  - Facility records: 0 (can be created via link:facilities)
  - eSMR Facilities: 369
  - eSMR Samples: 1,199,399
```

### Codebase Verification

Mock facility IDs (`fac-001`, etc.) now only appear in:
- ✓ Test fixture files (clearly marked as test-only)
- ✓ Cleanup script (for pattern matching)
- ✓ This documentation

They do NOT appear in:
- ✗ Seed files
- ✗ Production components
- ✗ API routes
- ✗ Database

### Build Verification

```bash
# Type checking
npm run type-check    # ✅ Passes

# Linting
npm run lint          # ✅ Passes

# Production build
npm run build         # ✅ Succeeds
```

## UI Impact

### Before Cleanup
- Dashboard showed 10 mock facilities with fictional names
- Facility detail pages showed made-up sample data
- Map displayed fake Bay Area locations
- Violations were based on random test data

### After Cleanup
- Dashboard shows 0 Facility records (until linking is done)
- Dashboard can show 369 eSMR facilities with real data
- eSMR pages display real water quality samples
- All data is from actual California Water Board monitoring

### User Experience

1. **Dashboard** (`/dashboard`)
   - Shows real violation events when Facility records exist
   - Falls back gracefully if no facilities (shows helpful message)
   - eSMR stats card shows 1.2M+ real samples

2. **Facility Pages** (`/facilities/[id]`)
   - Only accessible for facilities that exist in database
   - If linked to eSMR data, shows real monitoring samples
   - Returns 404 for non-existent IDs (including old mock IDs)

3. **eSMR Pages** (`/esmr/*`)
   - Displays all 369 real facilities
   - Shows 1.2M+ real water quality samples
   - Region-based filtering and analysis

## Migration Guide for Developers

### If You See Mock Data
If mock facilities somehow reappear:

```bash
# Run the cleanup script
npm run db:cleanup-mock
```

### For Testing
Use the clearly-marked test fixtures:

```typescript
import { mockFacilities } from "@/__tests__/fixtures/mock-facilities"
import { mockViolations } from "@/__tests__/fixtures/mock-violations"

// These are for tests only - never seed to database
```

### For Development
To work with real data locally:

```bash
# 1. Fresh database
npm run db:reset

# 2. Import real eSMR data
npm run import:esmr

# 3. Seed config
npm run db:seed

# 4. (Optional) Link facilities for violation tracking
npm run link:facilities
```

## Production Deployment Checklist

Before deploying to production:

- [x] Mock facilities removed from database
- [x] Seed scripts updated to not create mock data
- [x] Test fixtures clearly marked as test-only
- [x] Cleanup script available for maintenance
- [x] eSMR data imported (369 facilities, 1.2M+ samples)
- [x] Build succeeds without errors
- [x] Type checking passes
- [x] No hardcoded mock facility IDs in production code

## Rollback Procedure

If you need to restore mock data for development:

```bash
# Option 1: Use old seed-test-data.ts if it exists
npm run db:seed:test-data

# Option 2: Manually create from test fixtures
# (Not recommended for production)
```

**Note:** In production, there is NO rollback. The app should only use real eSMR data.

## Future Considerations

### Facility Linking Strategy
The app currently has two approaches for facilities:

1. **eSMR-only approach**
   - Use `esmr_facilities` and `esmr_samples` directly
   - No `Facility` table records needed
   - Simpler but limits some features (violations, subscriptions)

2. **Linked approach**
   - Create `Facility` records with `esmrFacilityId`
   - Enables full violation tracking and alerts
   - Run: `npm run link:facilities`

Choose based on stakeholder requirements.

### Violation Computation
If using linked facilities, violations can be computed from real eSMR samples:
- Define benchmark values for eSMR parameters
- Map eSMR parameters to canonical pollutant keys
- Run violation detection: `/api/violations/recompute`

### Data Refresh
eSMR data should be refreshed periodically:
- Weekly cron job: `/api/cron/esmr-sync`
- Manual re-import: `npm run import:esmr`
- Incremental updates (check for new samples)

## Contact

For questions about this cleanup or real data usage:
- Check `/app/esmr/*` pages for eSMR data examples
- Review `/scripts/import-esmr.ts` for import logic
- See `/lib/services/esmr/*` for eSMR service layer

---

**Summary:** All mock data has been successfully removed. The application now uses 369 real California Water Board facilities with 1.2M+ actual water quality samples. Stakeholders can now see real monitoring data and actual environmental compliance information.
