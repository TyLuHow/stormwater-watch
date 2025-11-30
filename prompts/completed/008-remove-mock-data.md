<objective>
Remove all mock/demo data from the application and convert it to test fixtures.

The app currently has a DEV_MODE flag that falls back to mock data when the database is unavailable. Now that we have 1.2M real eSMR samples in the database, this mock data system should be removed and converted to test fixtures for future testing.
</objective>

<context>
Read CLAUDE.md for project conventions.

Key files to modify:
- `lib/dev-mode.ts` - Contains DEV_MODE flag and mock data exports
- `app/dashboard/page.tsx` - Uses DEV_MODE and mock data fallback
- `app/facilities/[id]/page.tsx` - Uses DEV_MODE and mock data fallback
- Any other files importing from `lib/dev-mode.ts`

The app now has real data in:
- ESMRFacility, ESMRLocation, ESMRSample tables (1.2M+ records)
- These will be used instead of mock data
</context>

<requirements>
1. Find all files that import from `lib/dev-mode.ts`
2. Create a test fixtures directory at `__tests__/fixtures/` with the mock data for future tests
3. Remove the DEV_MODE flag and all mock data fallback logic from pages
4. Update pages to handle database errors gracefully (show error UI, not mock data)
5. Delete `lib/dev-mode.ts` after migration
6. Ensure the app still builds and type-checks after changes
</requirements>

<implementation>
Steps:
1. Search for all imports of `lib/dev-mode.ts` or `@/lib/dev-mode`
2. Create `__tests__/fixtures/mock-facilities.ts` and `__tests__/fixtures/mock-violations.ts`
3. Move mock data to fixtures (keep the same structure for test compatibility)
4. Update each page that uses DEV_MODE:
   - Remove the DEV_MODE import
   - Remove mock data fallback branches
   - Add proper error handling UI (e.g., "Unable to load data" message)
5. Delete `lib/dev-mode.ts`
6. Run `npm run build` to verify everything compiles
</implementation>

<output>
Files to create:
- `__tests__/fixtures/mock-facilities.ts`
- `__tests__/fixtures/mock-violations.ts`

Files to modify:
- `app/dashboard/page.tsx`
- `app/facilities/[id]/page.tsx`
- Any other files using dev-mode imports

Files to delete:
- `lib/dev-mode.ts`
</output>

<verification>
Before completing:
1. Run `npm run build` - must pass with no errors
2. Run `npm run type-check` if available - must pass
3. Verify no remaining imports of `lib/dev-mode`
4. Confirm test fixtures are properly typed
</verification>

<success_criteria>
- All DEV_MODE references removed from production code
- Mock data preserved in test fixtures
- App builds successfully
- Pages handle database errors gracefully without crashing
</success_criteria>
