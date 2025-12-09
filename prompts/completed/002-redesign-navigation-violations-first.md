<objective>
Redesign application navigation and information architecture to prioritize violations and exceedances for professional water quality users. Convert marketing-style landing page to About page and create violations-focused entry point.

This reflects the domain expert's core feedback: water professionals need direct access to violation data, not marketing content.
</objective>

<context>
**User Profile (from domain expert):**
"I want a way to quickly access hard data related to stormwater violations. When I open sites like SGMA Data Viewer or California Open Data I already know what I'm looking for. I don't need the marketing on the landing page, especially if you're not selling a product. Water professionals are not really 'happening along' sites like this; they are announced at conferences, put out in PR pushes, etc."

**Current Problems:**
- Landing page is "fluff" with marketing copy
- eSMR data explorer tabs bury the violations
- Users have to navigate through multiple pages to find violations
- No clear violations-first entry point

**Desired State:**
- Homepage goes directly to violations map or violations dashboard
- Current landing becomes an About page (still accessible but not primary)
- Navigation emphasizes violations and active exceedances
- All eSMR general browsing is deprioritized or removed (violations-focused approach)

Read @app/page.tsx (current landing page) to understand what needs to be moved to About.
Read @app/dashboard/page.tsx to see current dashboard structure.
Examine routing structure in app directory.
</context>

<requirements>
**1. Create New About Page:**
- Move current landing page content to `/about`
- Keep the mission statement, stats, features overview
- Make it accessible from navigation but not the homepage
- Update any "View Dashboard" CTAs to reflect new structure

**2. Redesign Homepage:**
Choose ONE of these approaches and explain your reasoning:

Option A: **Violations Map Homepage**
- Homepage becomes the violations map
- Interactive map showing active violation events
- Quick filters for severity, county, pollutant
- Click facility marker → go directly to facility violations page

Option B: **Violations Dashboard Homepage**
- Homepage is a violations-focused dashboard
- "Active Violation Events" table front and center
- Recent exceedances, severity breakdown
- Map widget embedded in dashboard

Your choice should optimize for "quickest path to violation data" based on the user profile.

**3. Update Navigation:**
Restructure navigation to reflect violations-first priority:

Current tabs (typical structure):
- Home
- Dashboard
- eSMR Data
- Facilities
- Map

New structure (violations-first):
- Violations (homepage) ← default view
- Facilities
- Map (if not homepage)
- About
- [Remove or hide general eSMR browsing tabs]

**4. Remove eSMR General Data Explorer:**
Per expert feedback: "if someone wants to see eSMR data they can pull data from eSMR directly"
- Remove or hide tabs for browsing all eSMR samples
- Keep eSMR data visible only in context: facility pages, violation details, case packets
- Focus on violations and exceedances, not general data exploration

**5. Facility Page Restructure:**
"Violations should be at the top of plant-specific pages"
- Read @app/facilities/[id]/page.tsx
- Ensure violations appear FIRST
- eSMR monitoring data secondary
- Prioritize active violations, then resolved violations, then general monitoring
</requirements>

<implementation>
**Step 1 - Create About Page:**
- Copy current landing page to `./app/about/page.tsx`
- Update metadata, remove CTA buttons or change to "Back to Dashboard"

**Step 2 - New Homepage:**
Based on your chosen approach (Map or Dashboard):
- Create new `./app/page.tsx` with violations-first design
- Ensure it loads fast (critical for professional users)
- Include prominent filters: date range, severity, county, pollutant

**Step 3 - Update Navigation Components:**
- Find navigation component (likely in `./components/navigation/*` or `./app/layout.tsx`)
- Update nav items to reflect new structure
- Set correct default/active states

**Step 4 - Update Routing:**
- Update any redirects or middleware
- Ensure `/` goes to violations view
- Add `/about` route

**Step 5 - Facility Page Reordering:**
- Restructure facility detail page component hierarchy
- Move violation section to top
- Use clear visual hierarchy (violations > exceedances > general monitoring)

**Step 6 - Remove/Hide eSMR Explorer:**
- Remove links to general eSMR browsing pages from navigation
- Consider adding a "hidden" route for internal use if needed
- Update any sidebar or tab components on eSMR-related pages
</implementation>

<constraints>
- Maintain all existing functionality - just reorder and reorganize
- Don't break deep links - keep facility URLs the same
- Preserve About page content (just move it, don't delete)
- WHY: Some users may still want background info, just not as homepage
- Ensure mobile-responsive design is maintained
</constraints>

<output>
Modified files:
- `./app/page.tsx` - New violations-first homepage
- `./app/about/page.tsx` - Moved content from old homepage
- Navigation components - Updated structure and links
- `./app/facilities/[id]/page.tsx` - Violations at top
- Remove/update eSMR explorer page links

For each file, provide clear comments explaining the violations-first rationale.
</output>

<verification>
Before completing, verify:
- [ ] Can access violations immediately from homepage (0-1 clicks)
- [ ] About page preserves all marketing/mission content
- [ ] Navigation clearly prioritizes violations
- [ ] eSMR general browsing is removed/hidden from main nav
- [ ] Facility pages show violations first
- [ ] Mobile navigation works correctly
- [ ] All routes resolve correctly
</verification>

<success_criteria>
- Water professionals can access violation data within 1 second of page load
- No marketing content blocks access to data
- Navigation structure reflects violations-first priority
- About page is accessible but not intrusive
- Expert user profile needs are met: "quickly access hard data related to stormwater violations"
</success_criteria>
