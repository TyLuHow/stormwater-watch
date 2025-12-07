<objective>
Design the UI/UX transformation needed to present integrated eSMR + SMARTS data to users. Define new pages, components, navigation, and user journeys that leverage the comprehensive dataset while maintaining usability for nonprofit environmental organizations.
</objective>

<context>
**Research Context:**
@research/data-schema-integration-analysis.md - Schema findings
@TO-DOS.md - Laboratory design system planned

**Current UI:**
@app/page.tsx - Dashboard
@app/facilities/[id]/page.tsx - Facility details
@components/dashboard/*.tsx - Dashboard components

**User Personas:**
- Environmental attorneys (build violation cases)
- Compliance officers (monitor regions)
- Researchers (analyze trends)

**Challenge:**
Expand from simple eSMR facility viewer to comprehensive compliance platform without overwhelming users.
</context>

<scope>
Design comprehensive UI/UX:

## 1. Navigation Architecture
**Current:** Simple facility list + detail pages
**Needed:** Multi-level navigation for:
- Dashboard (overview)
- Facilities (93K facilities)
- Violations (eSMR computed + SMARTS regulatory)
- Enforcement (29K actions)
- Inspections (45K records)
- Analytics

**Laboratory Design System Integration:**
- Sidebar navigation (from todos)
- Clinical aesthetic alignment
- Data table patterns
- Tabbed interfaces

## 2. New Page Requirements

### /violations
- List SMARTS regulatory violations (32K)
- Filter: type, severity, status, facility, region, date
- Columns: Facility, Violation Type, Date, Severity, Status, Enforcement
- Click → Violation detail with enforcement history

### /enforcement
- List enforcement actions (29K)
- Filter: action type, penalty amount, status, facility
- Statistics: Total penalties, avg per violation, trends
- Link to originating violations

### /inspections
- List inspection records (45K)
- Filter: inspector, facility, date, findings
- Inspection → Violation linkage display
- Inspector performance metrics

### /facilities/[id] (enhanced)
**Tabbed Interface:**
- Overview: Basic info, map, current status
- eSMR Monitoring: Sample data, computed violations
- SMARTS Regulatory: Permits, inspections, violations
- Enforcement History: Timeline of actions
- Compliance Score: Risk metrics

### /analytics
- Regional compliance scorecards
- Trend analysis (violations over time)
- Repeat offender identification
- Predictive risk modeling

## 3. Component Inventory

**New Components:**
- `<ViolationTable>` - Handles both eSMR + SMARTS
- `<EnforcementTimeline>` - Action history
- `<InspectionCard>` - Inspection details
- `<ComplianceScore>` - Facility risk indicator
- `<FacilityTabs>` - Multi-source data organization
- `<ViolationBadge>` - Severity/type indicators

**Modified Components:**
- `<FacilityTable>` - Now 93K facilities
- `<DashboardStats>` - Multi-source KPIs
- `<MapView>` - Layer controls, fallback for missing coords

**Reusable Patterns:**
- Virtualized tables (for large datasets)
- Advanced filters with presets
- Export to CSV functionality
- Timeline visualizations

## 4. User Journey Redesign

### Attorney Journey
**Goal:** Build violation case
1. Search facilities by region/pollutant
2. View facility violations (eSMR + SMARTS)
3. Gather enforcement history
4. Export case packet (PDF)

**Wireframe:** Describe step-by-step screens

### Compliance Officer Journey
**Goal:** Monitor regional compliance
1. Dashboard with regional alerts
2. Filter violations by severity
3. Review inspection findings
4. Track enforcement progress

**Wireframe:** Describe dashboard layout

### Researcher Journey
**Goal:** Analyze trends
1. Navigate to analytics page
2. Select region and timeframe
3. Compare facility performance
4. Generate report with charts

**Wireframe:** Describe analytics interface

## 5. Information Architecture
**Two Violation Types - User Education:**
- eSMR Computed: From monitoring data
- SMARTS Regulatory: Reported violations
- Visual distinction (icons, colors)
- Tooltips explaining difference

**Progressive Disclosure:**
- Simple view by default
- "Show advanced" for power users
- Collapsible sections
- Guided tours for new users

## 6. Laboratory Design System Timing
**Analysis:** Should Laboratory redesign happen:
- **Before** schema migration? (Delay data integration)
- **During** schema migration? (Parallel workstreams)
- **After** schema migration? (Functional first, pretty later)

**Recommendation with rationale**
</scope>

<deliverables>
Create UI/UX design document:

## UI/UX Redesign Plan
**Save to:** `./docs/UI_UX_REDESIGN.md`

### 1. Navigation Structure
- Sitemap diagram (ASCII)
- Main navigation menu
- Breadcrumb patterns
- Mobile responsiveness

### 2. Page Specifications
- Wireframe descriptions for each new page
- Component breakdowns
- Data requirements per page
- Loading states and error handling

### 3. Component Library
- New components needed
- Modified components
- Reusable pattern catalog
- Component API specifications

### 4. User Journeys
- Attorney journey wireframes
- Compliance officer wireframes
- Researcher journey wireframes
- Key interaction points

### 5. Design System Integration
- Laboratory system alignment
- Color palette for violation types
- Typography for data density
- Spacing and layout grids

### 6. Accessibility & Performance
- WCAG compliance considerations
- Performance budgets per page
- Progressive enhancement strategy
- Mobile optimization approach
</deliverables>

<success_criteria>
- [ ] All 5 new pages designed with wireframes
- [ ] Component inventory complete
- [ ] 3 user journeys documented
- [ ] Laboratory design integration analyzed
- [ ] Two violation types clearly differentiated
- [ ] Progressive disclosure strategy defined
</success_criteria>
