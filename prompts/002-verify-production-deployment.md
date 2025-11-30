<objective>
Verify the Stormwater Watch MVP is fully functional on Vercel production deployment.

This prompt guides testing of all core features to ensure the app works end-to-end after database setup.
</objective>

<context>
- Database should now be set up with seeded test data (from prompt 001)
- Vercel deployment with all environment variables configured
- App should be accessible at the Vercel URL

Features to verify:
1. Dashboard with map - showing real facilities and violations
2. Facility detail pages - clicking "View Details" works
3. Filters - county, pollutant, year filters work
4. Case packet generation - PDF download works
5. API endpoints - violations, subscriptions APIs respond
</context>

<requirements>
Systematically test each feature and document any issues found.
</requirements>

<verification_checklist>

<test_1_dashboard>
**Dashboard Map & Data Display**

1. Visit `/dashboard`
2. Verify:
   - [ ] "Demo Mode" badge is NOT showing
   - [ ] Map loads with facility markers (should see 10 markers in Bay Area)
   - [ ] Stats cards show real numbers (not the 3 mock violations)
   - [ ] Regional Hotspots sidebar shows counties with violation counts
   - [ ] Violations table shows data

If issues:
- Check browser console for errors
- Check Vercel Function logs for database errors
</test_1_dashboard>

<test_2_facility_details>
**Facility Detail Pages**

1. Click on any map marker
2. Click "View Details" in the popup
3. Verify:
   - [ ] Facility page loads (no 404 or error page)
   - [ ] Shows facility name, permit ID, county
   - [ ] Shows violations table if any exist
   - [ ] Shows sample history table
   - [ ] Charts render (if samples exist for pollutants with violations)

If 404: The facility ID in the URL should match a real database record
</test_2_facility_details>

<test_3_filters>
**Dashboard Filters**

1. Go to `/dashboard`
2. Test each filter:
   - [ ] County filter - select a county, violations should filter
   - [ ] Pollutant filter - select a pollutant type
   - [ ] Year filter - select reporting year
   - [ ] Clear filters - reset button works

Verify URL updates with filter params (e.g., `?counties=Alameda`)
</test_3_filters>

<test_4_case_packet>
**Case Packet PDF Generation**

1. Go to a facility detail page (e.g., `/facilities/[id]`)
2. Find "Attorney Tools" section
3. Click "Generate Case Packet" for any violation
4. Verify:
   - [ ] PDF downloads successfully
   - [ ] PDF contains facility info, violation data, disclaimer
   - [ ] Provenance section shows data source and timestamps
</test_4_case_packet>

<test_5_api_endpoints>
**API Endpoint Health**

Test these endpoints directly:

```bash
# Health check
curl https://[your-vercel-url]/api/health

# Violations API
curl https://[your-vercel-url]/api/violations

# Should return JSON with violations array and filters
```

Verify:
- [ ] `/api/health` returns `{"status":"healthy",...}`
- [ ] `/api/violations` returns violations data (not errors)
</test_5_api_endpoints>

<test_6_subscriptions_page>
**Subscriptions Page**

1. Visit `/subscriptions`
2. Verify:
   - [ ] Page loads without errors
   - [ ] Can view subscription options

Note: Creating subscriptions requires auth which is currently disabled
</test_6_subscriptions_page>

</verification_checklist>

<troubleshooting>
**Common Issues:**

1. **Still showing Demo Mode**
   - Check SUPABASE_URL is set in Vercel environment variables
   - Redeploy after adding env vars

2. **Database connection errors in logs**
   - Verify DATABASE_URL format includes `?pgbouncer=true` for Supabase pooler
   - Check Prisma binary target is set for `rhel-openssl-3.0.x`

3. **Facility pages 404**
   - Run `npm run db:seed` to ensure facilities exist
   - Check the ID format matches database records

4. **Case packet fails**
   - Check Vercel function logs for errors
   - Verify puppeteer/react-pdf dependencies are bundled correctly
</troubleshooting>

<success_criteria>
All checkboxes above should be checked. Document any failures for the next prompt to fix.
</success_criteria>

<output>
Create a verification report at `./docs/mvp-verification-report.md` with:
- Date tested
- Vercel URL tested
- Results for each test (PASS/FAIL)
- Any issues found with error details
- Screenshots if helpful
</output>
