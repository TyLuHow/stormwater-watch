<objective>
Perform comprehensive due diligence on Vercel deployments to ensure stormwater-watch.vercel.app is the authoritative production site with all features and data, while safely auditing and removing the incorrectly created 'code' Vercel project.

This matters because an incorrect Vercel project was accidentally created during deployment, and we need to ensure no valuable configuration, code, or data was left behind before deletion. The end goal is a clean deployment state with stormwater-watch.vercel.app as the single source of truth.
</objective>

<context>
**Background:**
- A Vercel project called "code" was accidentally created when deploying
- The local directory .vercel/project.json was initially linked to "code" instead of "stormwater-watch"
- Subsequent deployment corrected this by relinking to "stormwater-watch" and redeploying
- Both projects share the same DATABASE_URL, so database data (violations, facilities, etc.) is shared
- The violations data (3 ViolationEvent records, 30 ViolationSample records) was created in the shared database

**Tech Stack:**
- Next.js 15.5.6 with App Router
- Vercel for deployment
- Prisma + PostgreSQL (Supabase)
- Project name: stormwater-watch (should be the only active project)

**Current State:**
- Local directory linked to: stormwater-watch (via `npx vercel link`)
- Production URL should be: https://stormwater-watch.vercel.app
- Incorrect project to be removed: "code" (project ID: prj_pelBHW2DN0EA32Kvi9OGdsYl4tue)
</context>

<requirements>
This task requires thorough investigation and documentation before any destructive actions.

**Phase 1: Root Cause Analysis**
1. Investigate why the 'code' Vercel project was created instead of using 'stormwater-watch'
   - Check .vercel/project.json history (if available via git)
   - Review deployment logs/history for both projects
   - Document the sequence of events that led to the wrong project being created

**Phase 2: Deployment Audit**
2. Compare both Vercel projects thoroughly:
   - List all deployments for each project (use `npx vercel ls --project=code` and `npx vercel ls --project=stormwater-watch`)
   - Check deployment timestamps to understand the timeline
   - Identify which code/commits were deployed where
   - Document any differences in deployment configuration

**Phase 3: Settings & Configuration Review**
3. Compare environment variables and project settings:
   - Export env vars from both projects (use `npx vercel env pull`)
   - Document any differences in environment variables
   - Check domain configurations for both projects
   - Review build settings, serverless function configurations, etc.
   - Save all findings to `./docs/vercel-audit-[timestamp].md`

**Phase 4: Production Verification**
4. Verify stormwater-watch.vercel.app is fully functional:
   - Test the dashboard loads: https://stormwater-watch.vercel.app/dashboard
   - Verify violations are visible (should show 3 violation events)
   - Check the violations display the correct data:
     * Eureka City Elk River WWTP - 1 HIGH severity Oil & Grease violation (7.6x)
     * Point Loma WWTP & Ocean Outfall - 28 MODERATE severity violations (up to 3.65x)
     * Brawley City WWTP - 1 LOW severity Oil & Grease violation (1.73x)
   - Test other critical pages/features work correctly
   - Verify the latest deployment includes all recent code changes

**Phase 5: Port Missing Configuration**
5. If any valuable settings are found only in 'code' project:
   - Document exactly what needs to be ported
   - Apply those settings to 'stormwater-watch'
   - Verify the ported settings work correctly

**Phase 6: Safe Deletion**
6. Only after all above phases are complete and verified:
   - Create a final backup documentation of what was in 'code' project
   - Remove the 'code' Vercel project: `npx vercel remove code --yes`
   - Verify local .vercel/project.json still points to stormwater-watch
   - Confirm stormwater-watch.vercel.app still works after deletion
</requirements>

<implementation>
**Investigation Tools:**
- Use `npx vercel ls` to list projects and deployments
- Use `npx vercel env pull` to export environment variables
- Use `npx vercel inspect [deployment-url]` to get deployment details
- Use git history to understand .vercel/project.json changes
- Use curl or browser to test live URLs

**Documentation Requirements:**
- Create comprehensive audit report at `./docs/vercel-audit-[timestamp].md`
- Include timestamps, deployment IDs, environment variable diffs, and all findings
- Document the root cause analysis with specific evidence
- Include verification checklist showing what was tested

**Safety Measures:**
- DO NOT delete anything until all verification phases are complete
- If you find something unexpected, document it and ask the user before proceeding
- Keep the audit documentation as a permanent record
- Verify stormwater-watch works AFTER each configuration change
</implementation>

<verification>
Before declaring this task complete, verify:

**Completeness Checks:**
- [ ] Root cause analysis completed and documented
- [ ] Full deployment audit with timeline created
- [ ] Environment variables compared and documented
- [ ] stormwater-watch.vercel.app dashboard tested and shows 3 violations
- [ ] All valuable configuration ported to stormwater-watch
- [ ] Audit report saved to ./docs/vercel-audit-[timestamp].md
- [ ] 'code' project safely deleted from Vercel
- [ ] Local .vercel/project.json still points to stormwater-watch
- [ ] stormwater-watch.vercel.app still works after deletion

**Quality Checks:**
- [ ] Audit report is comprehensive and includes all required sections
- [ ] Root cause includes specific evidence (not speculation)
- [ ] No valuable configuration was lost during cleanup
- [ ] Documentation is clear enough for future reference
</verification>

<success_criteria>
1. Complete understanding of why the 'code' project was created (documented root cause)
2. Comprehensive audit trail of what was deployed where and when
3. stormwater-watch.vercel.app is verified as fully functional with violations visible
4. All valuable configuration from 'code' project has been ported or documented as unnecessary
5. 'code' Vercel project has been safely deleted
6. Detailed audit report exists at ./docs/vercel-audit-[timestamp].md
7. No loss of functionality or data
8. Clean deployment state with single authoritative project
</success_criteria>

<output>
Create comprehensive audit documentation at:
- `./docs/vercel-audit-[timestamp].md` - Full audit report with all findings

Format the audit report with these sections:
1. Executive Summary
2. Root Cause Analysis
3. Deployment Timeline & Audit
4. Environment Variables Comparison
5. Configuration Differences
6. Verification Results
7. Actions Taken
8. Final State
9. Recommendations
</output>
