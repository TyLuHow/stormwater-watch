# Facility Linking System - Setup Guide

This document describes the facility linking system that connects Facility records to ESMRFacility records for unified monitoring data views.

## Overview

The facility linking system enables:
- Unified views showing both violation tracking and eSMR monitoring data
- Automatic and manual linking of facilities based on name similarity and location
- Admin UI for managing facility links
- Display of eSMR monitoring data on facility detail pages

## Files Created/Modified

### Schema Changes
- **prisma/schema.prisma** - Added `esmrFacilityId` field and relation to Facility model

### New Files
- **scripts/link-esmr-facilities.ts** - CLI tool for linking facilities
- **app/admin/facility-linking/page.tsx** - Admin UI for manual linking
- **app/api/admin/facility-link/route.ts** - API endpoints for link/unlink operations

### Modified Files
- **app/facilities/[id]/page.tsx** - Added eSMR data display section
- **package.json** - Added `link:facilities` script

## Database Migration

### Step 1: Create Migration

Run the following command to create a migration for the schema changes:

```bash
npx prisma migrate dev --name add-facility-esmr-linking
```

This will:
1. Create a new migration file in `prisma/migrations/`
2. Apply the migration to your database
3. Regenerate the Prisma Client with updated types

### Step 2: Verify Migration

Check that the migration was successful:

```bash
npx prisma db push
npx prisma generate
```

## Using the Linking System

### Automatic Linking via CLI

The linking script provides automated matching based on:
1. Exact name match (case-insensitive)
2. Fuzzy name match (Levenshtein distance < 3)
3. Geographic proximity (within 100m if coordinates available)

#### Dry Run (Preview Matches)

```bash
npm run link:facilities -- --dry-run
```

This will show potential matches without making any changes.

#### Auto-Link Exact Matches

```bash
npm run link:facilities -- --auto-link
```

This automatically links facilities with exact name matches.

#### Full Auto-Link (Dry Run First)

```bash
# First see what would be linked
npm run link:facilities -- --auto-link --dry-run

# Then apply if satisfied
npm run link:facilities -- --auto-link
```

### Manual Linking via Admin UI

1. Navigate to `/admin/facility-linking`
2. Browse unlinked facilities in the left panel
3. Click "Link" on a facility
4. Search for the corresponding eSMR facility in the right panel
5. Click "Link" to create the connection

To unlink:
1. Find the linked facility
2. Click "Unlink"

### Viewing Linked Data

Once facilities are linked:
1. Visit any facility detail page (`/facilities/[id]`)
2. If linked, you'll see an "eSMR Monitoring Data" section
3. This shows:
   - eSMR facility information
   - Monitoring locations
   - Recent sample results by location

## Matching Logic

### Exact Name Match (Score: 100)
- Case-insensitive comparison
- Normalized (no special characters, extra spaces)
- Auto-link candidate

### Fuzzy Name Match (Score: 50-30)
- Levenshtein distance < 3
- Lower score = less similar
- Requires manual review

### Geographic Proximity
- Within 100m: +50 points
- Within 500m: +20 points
- Helps confirm name matches

### Ambiguous Matches
Facilities with multiple potential matches or low confidence scores require manual review via the admin UI.

## TypeScript Type Errors

**Note:** After schema changes, you may see TypeScript errors until you run:

```bash
npx prisma generate
```

This regenerates the Prisma Client types to match the new schema.

## Example Workflow

### Initial Setup
```bash
# 1. Run migration
npx prisma migrate dev --name add-facility-esmr-linking

# 2. Preview automatic matches
npm run link:facilities -- --dry-run

# 3. Auto-link exact matches
npm run link:facilities -- --auto-link

# 4. Review report for ambiguous matches
```

### Manual Review
1. Review the linking report output
2. Note facilities marked as "AMBIGUOUS"
3. Use admin UI at `/admin/facility-linking` to manually link these
4. Check facility detail pages to verify linked data appears correctly

## Data Model

### Facility Model
```prisma
model Facility {
  // ... existing fields
  esmrFacilityId Int?
  esmrFacility   ESMRFacility? @relation(fields: [esmrFacilityId], references: [facilityPlaceId])
}
```

### ESMRFacility Model
```prisma
model ESMRFacility {
  // ... existing fields
  linkedFacilities Facility[]
}
```

## API Endpoints

### GET /api/admin/facility-link
Query parameters:
- `type=facilities` - Get all facilities with link status
- `type=esmr` - Get all eSMR facilities

### POST /api/admin/facility-link
Body:
```json
{
  "facilityId": "cuid",
  "esmrFacilityId": 12345
}
```

### DELETE /api/admin/facility-link
Body:
```json
{
  "facilityId": "cuid"
}
```

## Troubleshooting

### TypeScript Errors After Schema Change
```bash
npx prisma generate
```

### Links Not Appearing on Detail Pages
1. Check that migration was applied: `npx prisma db push`
2. Verify link exists in admin UI
3. Clear Next.js cache: `rm -rf .next`

### Script Won't Run
```bash
# Ensure tsx is installed
npm install

# Run with explicit tsx command
npx tsx scripts/link-esmr-facilities.ts --help
```

## Next Steps

After running the migration:

1. **Link Facilities**: Run the linking script to establish initial connections
2. **Review Matches**: Check ambiguous matches in the admin UI
3. **Verify Data**: Visit linked facility pages to ensure eSMR data displays correctly
4. **Monitor**: Use the admin UI to manage links as new facilities are added

## Support

For issues or questions:
1. Check this guide
2. Review the linking script output for detailed match information
3. Use the admin UI to inspect link status and manually correct as needed
