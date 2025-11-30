<objective>
Create a comprehensive API layer for querying eSMR data.

Build Next.js API routes that expose the 1.2M+ eSMR samples for the frontend to consume. These APIs should support filtering, pagination, and aggregation queries.
</objective>

<context>
Read CLAUDE.md for project conventions.

Database schema (in prisma/schema.prisma):
- ESMRRegion: code, name
- ESMRFacility: facilityPlaceId, facilityName, regionCode, receivingWaterBody
- ESMRLocation: locationPlaceId, facilityPlaceId, locationCode, locationType, lat/lon
- ESMRParameter: parameterName, category, canonicalKey
- ESMRAnalyticalMethod: methodCode, methodName
- ESMRSample: locationPlaceId, parameterId, samplingDate, qualifier, result, units, etc.

Existing API pattern: Check `app/api/` for existing route patterns in this project.
</context>

<requirements>
1. Create API routes under `app/api/esmr/`:

   **GET /api/esmr/facilities**
   - List facilities with pagination (limit, offset)
   - Filter by: regionCode, facilityName (search), receivingWaterBody
   - Include sample counts and location counts

   **GET /api/esmr/facilities/[id]**
   - Get single facility with all locations
   - Include recent samples aggregated by parameter

   **GET /api/esmr/samples**
   - List samples with pagination
   - Filter by: facilityPlaceId, locationPlaceId, parameterId, dateRange, qualifier
   - Support sorting by samplingDate, result

   **GET /api/esmr/parameters**
   - List all unique parameters with sample counts
   - Group by category if available

   **GET /api/esmr/regions**
   - List all regions with facility counts

   **GET /api/esmr/stats**
   - Dashboard statistics: total samples, facilities, parameters
   - Recent activity (samples in last 30 days)
   - Top parameters by sample count

2. Use proper TypeScript types for all responses
3. Add query validation (zod recommended if already in project)
4. Include proper error handling
</requirements>

<implementation>
Create these files:
- `app/api/esmr/facilities/route.ts` - List facilities
- `app/api/esmr/facilities/[id]/route.ts` - Single facility
- `app/api/esmr/samples/route.ts` - List samples
- `app/api/esmr/parameters/route.ts` - List parameters
- `app/api/esmr/regions/route.ts` - List regions
- `app/api/esmr/stats/route.ts` - Dashboard stats
- `lib/api/esmr.ts` - Shared types and query helpers

Use the existing prisma client from `lib/prisma.ts`.

For large result sets, always use pagination with reasonable defaults (limit: 50, max: 500).
</implementation>

<output>
Create files with relative paths:
- `./app/api/esmr/facilities/route.ts`
- `./app/api/esmr/facilities/[id]/route.ts`
- `./app/api/esmr/samples/route.ts`
- `./app/api/esmr/parameters/route.ts`
- `./app/api/esmr/regions/route.ts`
- `./app/api/esmr/stats/route.ts`
- `./lib/api/esmr.ts`
</output>

<verification>
Before completing:
1. Run `npm run build` - must pass
2. Test each endpoint manually with curl or browser:
   - GET /api/esmr/stats should return counts
   - GET /api/esmr/facilities?limit=10 should return facilities
   - GET /api/esmr/samples?limit=10 should return samples
3. Verify pagination works correctly
4. Verify filters work as expected
</verification>

<success_criteria>
- All 6 API routes created and functional
- Proper TypeScript types for all responses
- Pagination working with reasonable defaults
- Filters working for each endpoint
- No N+1 query problems (use includes/joins appropriately)
</success_criteria>
