<objective>
Fix any issues discovered during MVP verification testing.

This prompt addresses common deployment problems and ensures the Stormwater Watch app is production-ready.
</objective>

<context>
Review the verification report from prompt 002 (`./docs/mvp-verification-report.md`) to identify what needs fixing.

Common issues to address:
- Database connection problems
- Missing environment variables
- API endpoint errors
- UI/UX issues discovered during testing
</context>

<research>
First, gather information about any failures:

1. Read the verification report:
   @./docs/mvp-verification-report.md

2. Check Vercel deployment logs for errors:
   - Go to Vercel Dashboard → Deployments → Latest → Functions tab
   - Look for 500 errors or runtime exceptions

3. Check browser console on the live site for client-side errors
</research>

<common_fixes>

<fix_database_connection>
**Database Connection Issues**

If seeing Prisma errors in Vercel logs:

1. Verify DATABASE_URL format:
```
postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

2. Ensure Prisma binary target is set in `prisma/schema.prisma`:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

3. Redeploy after changes
</fix_database_connection>

<fix_api_errors>
**API 500 Errors**

For each failing API route:

1. Check the route file for proper error handling
2. Ensure try-catch blocks exist
3. Add DEV_MODE fallback if needed (like dashboard page does)

Example pattern:
```typescript
try {
  // Database operation
} catch (error) {
  console.error("API error:", error)
  // Return mock data or error response
}
```
</fix_api_errors>

<fix_ui_issues>
**UI/UX Issues**

Common fixes:
- Loading states for slow database queries
- Error boundaries for component failures
- Mobile responsiveness issues
- Map not displaying (check MAPBOX_TOKEN)
</fix_ui_issues>

<fix_case_packet>
**Case Packet PDF Generation**

If PDF generation fails:

1. Check if react-pdf is properly configured for serverless
2. Verify the case-packet API route handles errors
3. Test locally first: `npm run dev` then hit `/api/case-packet?violationEventId=xxx`
</fix_case_packet>

</common_fixes>

<implementation>
For each issue found:

1. Identify the root cause from logs/errors
2. Make the minimal fix needed
3. Test locally if possible
4. Commit and push to trigger Vercel redeploy
5. Verify the fix on production
</implementation>

<verification>
After fixes:
1. Re-run the verification checklist from prompt 002
2. All tests should now pass
3. Update the verification report with results
</verification>

<success_criteria>
- All verification tests from prompt 002 pass
- No console errors on the live site
- No 500 errors in Vercel function logs
- Users can view dashboard, facility details, and generate case packets
</success_criteria>

<output>
Document fixes made in `./docs/mvp-fixes-applied.md` with:
- Issue description
- Root cause
- Fix applied
- Verification that it works
</output>
