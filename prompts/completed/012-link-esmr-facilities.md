<objective>
Create a mapping system to link ESMRFacility records to existing Facility records where possible.

This enables unified facility views showing both eSMR monitoring data and violation tracking data for the same physical facility.
</objective>

<context>
Read CLAUDE.md for project conventions.

Two facility tables exist:
1. **Facility** (original model)
   - Fields: id, name, permitId, lat/lon, county, watershedHuc12, ms4
   - Has: samples, violationEvents, alerts
   - Uses CUID for id

2. **ESMRFacility** (new eSMR model)
   - Fields: facilityPlaceId (int PK), facilityName, regionCode, receivingWaterBody
   - Has: locations -> samples
   - Uses Water Board's place ID as primary key

Potential matching strategies:
- Name similarity (fuzzy match)
- Geographic proximity (lat/lon)
- Permit ID patterns (if extractable from eSMR data)
</context>

<requirements>
1. **Add linking field to schema**
   - Add `esmrFacilityId Int?` to Facility model (optional foreign key)
   - Add relation to ESMRFacility
   - Run migration

2. **Create linking script**
   - Script at `scripts/link-esmr-facilities.ts`
   - Matching logic:
     a. Exact name match (case-insensitive)
     b. Fuzzy name match (Levenshtein distance < 3)
     c. Geographic proximity (within 100m if lat/lon available)
   - Generate report of: matched, unmatched, ambiguous
   - Require manual review for ambiguous matches

3. **Create admin UI for manual linking**
   - Page at `/admin/facility-linking`
   - Show unlinked Facility records
   - Search ESMRFacility by name
   - Button to link/unlink facilities
   - Show link status on facility detail pages

4. **Update facility pages**
   - If Facility is linked to ESMRFacility, show eSMR data on facility detail page
   - Add "eSMR Monitoring Data" section with samples from linked ESMRFacility
</requirements>

<implementation>
Schema change:
```prisma
model Facility {
  // ... existing fields
  esmrFacilityId Int?
  esmrFacility   ESMRFacility? @relation(fields: [esmrFacilityId], references: [facilityPlaceId])
}

model ESMRFacility {
  // ... existing fields
  linkedFacilities Facility[]
}
```

Script approach:
1. Fetch all Facility records without esmrFacilityId
2. For each, search ESMRFacility by name
3. Score matches by similarity
4. Auto-link high-confidence matches (exact name)
5. Log ambiguous matches for manual review

Admin page:
- Server component that lists facilities
- Client component for linking UI
- API route for link/unlink actions
</implementation>

<output>
Modify files:
- `./prisma/schema.prisma` - Add relation

Create files:
- `./scripts/link-esmr-facilities.ts` - Linking script
- `./app/admin/facility-linking/page.tsx` - Admin UI
- `./app/api/admin/facility-link/route.ts` - Link/unlink API

Modify files:
- `./app/facilities/[id]/page.tsx` - Show linked eSMR data
</output>

<verification>
Before completing:
1. Run `npx prisma db push` to apply schema changes
2. Run `npx prisma generate` to update client
3. Run `npm run build` - must pass
4. Run the linking script in dry-run mode first
5. Test admin UI for manual linking
6. Verify linked eSMR data shows on facility pages
</verification>

<success_criteria>
- Schema updated with linking relation
- Linking script created and documented
- Admin UI functional for manual linking
- Facility detail pages show eSMR data when linked
- No data loss or broken relations
</success_criteria>
