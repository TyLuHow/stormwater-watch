<objective>
Fix two production issues preventing successful Vercel deployment:
1. Vercel cron job limit exceeded (3 jobs configured, only 2 allowed on free plan)
2. React hydration error #418 on /esmr page ("Text content does not match server-rendered HTML")

User requirement: Keep ONLY the weekly eSMR sync cron job, remove the others.
</objective>

<context>
Read CLAUDE.md for project conventions.

This is a Next.js 15 app deployed on Vercel with React 19. The issues are:

1. **Cron limit**: `vercel.json` has 3 crons but free tier allows 2
   @vercel.json - current cron configuration

2. **Hydration error #418**: Server/client HTML mismatch on /esmr page
   - Error occurs when clicking "Explore this dataset" button
   - React error #418 means text content differs between server and client render
   - Common causes: dates, numbers formatted differently, conditional rendering based on browser APIs
   @app/esmr/page.tsx - the page with the error
   @components/esmr/stats-overview.tsx - stats component used on the page

The mapbox errors (ERR_BLOCKED_BY_CLIENT) are ad-blocker related and can be ignored.
</context>

<research>
Before making changes:

1. **Verify cron job configuration** in vercel.json
2. **Identify hydration mismatch** in /esmr page:
   - Look for `.toLocaleString()` on numbers (varies by locale server vs client)
   - Look for date formatting that could differ
   - Look for `Date.now()` or `new Date()` in render
   - Check if stats-overview.tsx has similar issues
3. **Check Vercel logs** via CLI if available to see exact error
</research>

<requirements>
1. **Fix cron job limit**:
   - Keep only `/api/cron/esmr-sync` in vercel.json (weekly sync)
   - Remove `/api/cron/daily` and `/api/cron/weekly` from vercel.json
   - Do NOT delete the route files - they can still be called manually
   - The weekly eSMR sync is the only automated cron needed

2. **Fix hydration error #418**:
   - The error is likely from `.toLocaleString()` used for number formatting
   - toLocaleString() can produce different output server vs client
   - Fix: Use a consistent number formatter or suppress hydration warnings
   - Common patterns to check:
     - `stats.totals.samples.toLocaleString()`
     - `stats.totals.facilities.toLocaleString()`
     - Any date formatting
   - Solution options:
     a. Use a consistent formatter function that doesn't depend on locale
     b. Use `suppressHydrationWarning` on specific elements
     c. Ensure consistent locale settings

3. **Verify the fix**:
   - Run `npm run build` to ensure it compiles
   - Check that vercel.json only has 1 cron job
</requirements>

<implementation>
Approach:

**Phase 1: Fix vercel.json**
- Edit vercel.json to keep only the esmr-sync cron
- This is the critical fix for the build failure

**Phase 2: Fix hydration mismatch**
- The /esmr page uses `.toLocaleString()` in multiple places
- Create or use a utility function for consistent number formatting
- Or use the Intl.NumberFormat with explicit locale
- Apply to all number displays on the page

WHY this matters:
- toLocaleString() uses the system locale which differs between Node.js server and browser
- Server might render "1,199,399" while client renders "1.199.399" (European locale)
- This mismatch triggers hydration error #418
</implementation>

<output>
Modify these files:
- `./vercel.json` - Remove daily/weekly crons, keep only esmr-sync
- `./app/esmr/page.tsx` - Fix number formatting to be consistent
- `./components/esmr/stats-overview.tsx` - Fix number formatting if needed
- Any other components using toLocaleString() for the esmr page

Do NOT delete:
- `./app/api/cron/daily/route.ts`
- `./app/api/cron/weekly/route.ts`
(These can still be called manually via curl/fetch if needed)
</output>

<verification>
Before declaring complete:

1. **Cron verification**:
   ```bash
   cat vercel.json | grep -A5 "crons"
   # Should show only 1 cron job: esmr-sync
   ```

2. **Build verification**:
   ```bash
   npm run build
   # Should complete without errors
   ```

3. **Code verification**:
   - No `.toLocaleString()` without consistent locale in esmr pages
   - Or suppressHydrationWarning applied where needed

4. **Check Vercel logs** (if available):
   ```bash
   vercel logs --follow
   ```
</verification>

<success_criteria>
- vercel.json contains exactly 1 cron job (esmr-sync weekly)
- No React hydration errors on /esmr page
- `npm run build` succeeds without errors
- Vercel deployment should succeed (no cron limit error)
</success_criteria>
