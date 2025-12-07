# UI/UX Redesign Plan: Integrated eSMR + SMARTS Platform

**Document Version:** 1.0
**Created:** December 6, 2025
**Status:** Design Specification
**Related Documents:**
- `/research/data-schema-integration-analysis.md` - Schema findings
- `/docs/architecture/BACKEND_REDESIGN.md` - API endpoints and data flows
- `/TO-DOS.md` - Laboratory design system planned

---

## Executive Summary

This document defines the comprehensive UI/UX transformation needed to present integrated eSMR + SMARTS data to nonprofit environmental organizations. The redesign expands from a simple facility viewer (5K facilities, computed violations only) to a comprehensive compliance platform (93K facilities, regulatory violations, enforcement actions, inspections).

### Transformation Scope

| Aspect | Current (eSMR Only) | Integrated (eSMR + SMARTS) |
|--------|-------------------|----------------------------|
| **Facilities** | ~5K | ~93K (+1,760%) |
| **Data Types** | Monitoring samples, computed violations | + Regulatory violations, enforcement actions, inspections |
| **Pages** | 2 (Dashboard, Facility Detail) | 7 (+5 new) |
| **Navigation** | Simple list | Multi-level hierarchical |
| **User Personas** | General public | Attorneys, compliance officers, researchers |
| **Complexity** | Single data source | Dual data sources, cross-linking |

### Design Philosophy

**Clinical Data Density + Progressive Disclosure**
- Professional, data-driven aesthetic (Laboratory design system alignment)
- Simple views by default, advanced features on-demand
- Clear distinction between eSMR computed vs SMARTS regulatory data
- Accessible to nonprofits, powerful enough for legal professionals

---

## 1. Navigation Architecture

### 1.1 Sitemap

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STORMWATER WATCH                              │
│                    Water Quality Compliance Platform                 │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
         ┌──────▼──────┐                  ┌──────▼──────┐
         │  Main Nav   │                  │  User Menu  │
         │  (Sidebar)  │                  │  (Top Right)│
         └──────┬──────┘                  └─────────────┘
                │
    ┌───────────┼───────────┬─────────────┬──────────────┬──────────────┐
    │           │           │             │              │              │
┌───▼───┐  ┌───▼───┐  ┌────▼────┐  ┌─────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
│ Home  │  │Facil- │  │Viola-   │  │Enforce-   │  │Inspec-  │  │Analytics  │
│ (Dash)│  │ities  │  │tions    │  │ment       │  │tions    │  │           │
└───┬───┘  └───┬───┘  └────┬────┘  └─────┬─────┘  └────┬────┘  └───────────┘
    │          │           │             │              │
    │          │           │             │              │
    │      ┌───▼────────┐  │             │              │
    │      │/facilities │  │             │              │
    │      │  (List)    │  │             │              │
    │      └───┬────────┘  │             │              │
    │          │           │             │              │
    │      ┌───▼──────────────────┐      │              │
    │      │/facilities/[id]      │      │              │
    │      │  ┌───────────────┐   │      │              │
    │      │  │ Overview (Tab)│   │      │              │
    │      │  ├───────────────┤   │      │              │
    │      │  │ eSMR Monitor  │   │      │              │
    │      │  ├───────────────┤   │      │              │
    │      │  │ SMARTS Regul. │   │      │              │
    │      │  ├───────────────┤   │      │              │
    │      │  │ Enforcement   │   │      │              │
    │      │  ├───────────────┤   │      │              │
    │      │  │ Compliance    │   │      │              │
    │      │  └───────────────┘   │      │              │
    │      └──────────────────────┘      │              │
    │                                    │              │
    └────────────────────────────────────┴──────────────┴──────────────┘
```

### 1.2 Main Navigation Menu (Sidebar)

**Laboratory Design System Integration:**
- Sidebar navigation (left-aligned, collapsible)
- Sterile white background (slate-50)
- Teal-600 active state indicators
- Clinical typography (Inter, system fonts)

```
┌──────────────────────┐
│  🌊 STORMWATER       │  ← Logo + Title
│     WATCH            │
├──────────────────────┤
│                      │
│  📊 Dashboard        │  ← Active (teal-600 border-l-4)
│  🏭 Facilities       │
│  ⚠️  Violations      │
│  ⚖️  Enforcement     │
│  🔍 Inspections      │
│  📈 Analytics        │
│                      │
├──────────────────────┤  ← Divider
│                      │
│  ⚙️  Settings        │
│  💾 Exports          │
│  ❓ Help             │
│                      │
└──────────────────────┘
```

**Navigation States:**
- **Default:** Slate-700 text, transparent background
- **Hover:** Slate-900 text, slate-100 background
- **Active:** Teal-600 text, teal-50 background, 4px left border

**Mobile Responsiveness:**
- Sidebar collapses to hamburger menu on screens < 1024px
- Bottom navigation bar on mobile (< 768px)
- Icons-only mode for intermediate sizes

### 1.3 Breadcrumb Navigation

**Pattern:**
```
Home > Facilities > San Diego County > Acme Industrial Site > Violations
```

**Use Cases:**
- Facility detail pages (deep navigation)
- Filtered lists (preserve filter context)
- Cross-linking between violations → enforcement → facility

**Implementation:**
```tsx
<Breadcrumb className="mb-4">
  <BreadcrumbItem><Link href="/">Dashboard</Link></BreadcrumbItem>
  <BreadcrumbItem><Link href="/facilities">Facilities</Link></BreadcrumbItem>
  <BreadcrumbItem active>Acme Industrial Site</BreadcrumbItem>
</Breadcrumb>
```

### 1.4 Responsive Behavior

**Desktop (≥ 1024px):**
- Sidebar always visible (256px width)
- Content area: calc(100vw - 256px)
- Dual-column layouts supported

**Tablet (768px - 1023px):**
- Sidebar collapses to icon-only (72px width)
- Content area expands
- Single-column layouts

**Mobile (< 768px):**
- Sidebar hidden, hamburger menu
- Bottom tab bar for main sections
- Single-column, vertical scrolling

---

## 2. Page Specifications

### 2.1 Dashboard (/) - Enhanced

**Purpose:** Multi-source compliance overview with regional intelligence

#### Wireframe Description

```
┌────────────────────────────────────────────────────────────────────┐
│  HEADER: Water Quality Command Center                              │
│  Subtitle: Real-time tracking across 93K facilities                │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  FILTERS (Collapsible)                                             │
│  [County ▼] [Pollutant ▼] [Date Range] [Source: All ▼]           │
│  [Advanced Filters +]                                              │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  KPI CARDS (5 columns)                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │Active    │ │eSMR      │ │SMARTS    │ │Enforce-  │ │Inspect-  ││
│  │Facilities│ │Violations│ │Violations│ │ment      │ │ions      ││
│  │          │ │          │ │          │ │Actions   │ │          ││
│  │  93,240  │ │    452   │ │  1,234   │ │    289   │ │    156   ││
│  │          │ │(computed)│ │(official)│ │(active)  │ │(30 days) ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘│
└────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┬──────────────────────────────────┐
│  MAP VIEW (2/3 width)           │  REGIONAL HOTSPOTS (1/3 width)  │
│                                 │                                  │
│  [California map with markers]  │  Top Counties by Violations:     │
│  • Red = SMARTS regulatory      │  1. Los Angeles      247         │
│  • Orange = eSMR computed       │  2. San Diego        189         │
│  • Yellow = Both                │  3. Orange           145         │
│  • Size = severity              │  4. Riverside        112         │
│                                 │  5. San Bernardino    98         │
│  [Layer controls]               │  ...                             │
│  ☑ SMARTS Violations           │                                  │
│  ☑ eSMR Violations             │  [View Regional Report →]        │
│  ☐ Enforcement Actions         │                                  │
│  ☐ Recent Inspections          │                                  │
└─────────────────────────────────┴──────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  RECENT ACTIVITY TIMELINE                                          │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ [Icon] SMARTS Violation • Acme Industrial • Lead exceedance  │ │
│  │        12/05/2025 • Serious Violation • View Details →      │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ [Icon] Enforcement Action • Harbor Chem • NOV issued         │ │
│  │        12/04/2025 • 3 violations addressed • View →         │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ [Icon] Inspection • Riverside Mfg • B-Type compliance       │ │
│  │        12/03/2025 • 0 violations found • View →             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│  [Load More Activity]                                              │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  CRITICAL ALERTS (If any)                                          │
│  ⚠️  3 new serious violations requiring immediate action           │
│  ⚠️  12 facilities with repeat violations (>3 in 12 months)       │
│  [View All Alerts →]                                              │
└────────────────────────────────────────────────────────────────────┘
```

#### Component Breakdown

**Components:**
1. `<DashboardHeader>` - Hero section with live status indicator
2. `<MultiSourceFilters>` - NEW: Enhanced filters with source toggle
3. `<IntegratedKPICards>` - NEW: 5-card grid showing eSMR + SMARTS stats
4. `<LayeredMap>` - MODIFIED: Support violation type layers
5. `<RegionalHotspots>` - Existing, styled for Laboratory
6. `<ActivityTimeline>` - NEW: Cross-source activity feed
7. `<CriticalAlerts>` - NEW: Attention-required items

**Data Requirements:**
```typescript
interface DashboardData {
  stats: {
    totalFacilities: number
    esmrViolations: number
    smartsViolations: number
    activeEnforcement: number
    recentInspections: number
  }
  recentActivity: UnifiedActivity[]  // Mixed eSMR + SMARTS events
  criticalAlerts: Alert[]
  topCounties: CountySummary[]
  mapData: {
    facilities: FacilityMapPoint[]
    violations: ViolationMapPoint[]
  }
}

interface UnifiedActivity {
  id: string
  type: 'VIOLATION_ESMR' | 'VIOLATION_SMARTS' | 'ENFORCEMENT' | 'INSPECTION'
  timestamp: Date
  facilityName: string
  description: string
  severity?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  detailUrl: string
}
```

**Loading States:**
- Skeleton cards for KPIs (instant feedback)
- Progressive map loading (facilities first, violations layer)
- Infinite scroll for activity timeline

**Error Handling:**
- Graceful degradation if SMARTS data unavailable
- Show eSMR-only view with notice
- Retry button for failed data fetches

---

### 2.2 Facilities List (/facilities) - Enhanced

**Purpose:** Searchable registry of 93K facilities with data source indicators

#### Wireframe Description

```
┌────────────────────────────────────────────────────────────────────┐
│  HEADER: Facility Registry                                         │
│  Subtitle: 93,240 facilities • Industrial (15K) • Construction (78K)│
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  SEARCH & FILTERS                                                  │
│  [🔍 Search by name, permit ID, or WDID____________]  [Export CSV]│
│                                                                     │
│  [County ▼] [Region ▼] [Permit Type ▼] [Status: Active ▼]        │
│  [Has Violations ☐] [Has Enforcement ☐] [Data Source: All ▼]     │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  RESULTS TABLE (Virtualized, 100 rows visible)                    │
│  ┌───┬─────────────────┬─────────┬────────┬──────┬──────┬────────┐│
│  │ # │ Facility Name   │ County  │ Type   │ Data │Viols │Actions ││
│  ├───┼─────────────────┼─────────┼────────┼──────┼──────┼────────┤│
│  │ 1 │ Acme Industrial │ LA      │Indust. │ E+S  │  12  │   3    ││
│  │   │ Permit: 1234567 │         │        │ [🟢🔵]│      │        ││
│  ├───┼─────────────────┼─────────┼────────┼──────┼──────┼────────┤│
│  │ 2 │ Harbor Chemical │ SD      │Indust. │  S   │   5  │   1    ││
│  │   │ WDID: 1 08I...  │         │        │ [🔵] │      │        ││
│  ├───┼─────────────────┼─────────┼────────┼──────┼──────┼────────┤│
│  │ 3 │ Oceanview Const.│ Orange  │Constr. │  S   │   2  │   0    ││
│  │   │ WDID: 1 08C...  │         │        │ [🔵] │      │        ││
│  └───┴─────────────────┴─────────┴────────┴──────┴──────┴────────┘│
│                                                                     │
│  Showing 1-100 of 93,240 • [Load More] or [∞ Virtual Scroll]      │
└────────────────────────────────────────────────────────────────────┘

LEGEND:
🟢 = eSMR data available    🔵 = SMARTS data available
```

#### Component Breakdown

**Components:**
1. `<FacilitySearchBar>` - NEW: Search with autocomplete
2. `<FacilityFilters>` - NEW: Multi-source filtering
3. `<VirtualizedFacilityTable>` - NEW: Handle 93K rows efficiently
4. `<DataSourceBadge>` - NEW: Show eSMR/SMARTS indicators
5. `<BulkActions>` - NEW: Multi-select for export

**Data Requirements:**
```typescript
interface FacilityListItem {
  id: string
  name: string
  permitId?: string
  wdid?: string
  county: string
  permitType: 'Industrial' | 'Construction' | 'NPDES'
  status: 'Active' | 'Terminated'

  // Data source indicators
  hasESMRData: boolean
  hasSMARTSData: boolean

  // Summary counts
  violationCount: number
  enforcementActionCount: number
  lastInspectionDate?: Date
}
```

**Performance Considerations:**
- Virtual scrolling (react-virtual or similar)
- Load 100 rows at a time
- Debounced search (300ms)
- Server-side filtering and sorting

---

### 2.3 Facility Detail (/facilities/[id]) - Enhanced with Tabs

**Purpose:** Comprehensive facility profile with eSMR + SMARTS data

#### Wireframe Description

```
┌────────────────────────────────────────────────────────────────────┐
│  ← Back to Facilities                                              │
│                                                                     │
│  🏭 ACME INDUSTRIAL MANUFACTURING                                  │
│  San Diego County • Permit: CAS001234 • WDID: 1 08I004046         │
│                                                                     │
│  [Download Case Packet PDF]  [Subscribe to Alerts]  [Report Issue]│
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  TABS                                                              │
│  [Overview] [eSMR Monitoring] [SMARTS Regulatory] [Enforcement]   │
│  [Compliance Score]                                                │
└────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────── TAB: OVERVIEW ──────────────────────┐
│                                                                     │
│  KEY METRICS (4 cards)                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐     │
│  │ Compliance │ │ Violations │ │ Last       │ │ Worst      │     │
│  │ Score      │ │            │ │ Inspection │ │ Pollutant  │     │
│  │            │ │  17 Total  │ │            │ │            │     │
│  │    68/100  │ │  12 eSMR   │ │ 11/15/2024 │ │ Lead       │     │
│  │   ⚠️ Fair  │ │   5 SMARTS │ │            │ │ 4.2× NAL   │     │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘     │
│                                                                     │
│  FACILITY INFO                                                     │
│  ┌────────────────────┬─────────────────────────────────────┐     │
│  │ Location           │ 123 Industrial Way, San Diego, CA   │     │
│  │ Coordinates        │ 32.7157° N, 117.1611° W [View Map]  │     │
│  │ Industry (SIC)     │ 4212 - Local Trucking               │     │
│  │ Operator           │ Acme Corp                           │     │
│  │ Status             │ Active (since 2005)                 │     │
│  │ Receiving Water    │ San Diego Bay ⚠️ Impaired          │     │
│  │ Watershed (HUC12)  │ 180700030501                        │     │
│  │ MS4 Jurisdiction   │ City of San Diego                   │     │
│  └────────────────────┴─────────────────────────────────────┘     │
│                                                                     │
│  QUICK LINKS                                                       │
│  [View All Violations] [Recent Samples] [Enforcement History]     │
└────────────────────────────────────────────────────────────────────┘

┌──────────────────────── TAB: eSMR MONITORING ──────────────────────┐
│                                                                     │
│  MONITORING LOCATIONS (3)                                          │
│  [Location: Effluent-001 ▼]                                       │
│                                                                     │
│  SAMPLE DATA (Chart + Table)                                      │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  Lead Concentration Over Time                            │     │
│  │  [Line chart with NAL threshold line]                    │     │
│  │  • Blue dots = compliant                                 │     │
│  │  • Red dots = exceedance                                 │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                     │
│  RECENT SAMPLES (Table, 50 rows)                                  │
│  [Date] [Parameter] [Result] [Units] [Qualifier] [Method]         │
│  12/05  Lead, Total  0.032    mg/L    =           E200.7          │
│  12/04  pH           7.2      SU      =           A4500HB         │
│  ...                                                               │
│                                                                     │
│  [Export Sample Data CSV]                                         │
└────────────────────────────────────────────────────────────────────┘

┌─────────────────────── TAB: SMARTS REGULATORY ─────────────────────┐
│                                                                     │
│  PERMIT INFORMATION                                                │
│  • Permit Type: Industrial General Permit                         │
│  • WDID: 1 08I004046 • APP_ID: 178203                             │
│  • NOI Processed: 03/12/2005                                      │
│  • Status: Active                                                 │
│                                                                     │
│  REGULATORY VIOLATIONS (5 official)                                │
│  ┌────────┬──────────────────┬────────┬──────────┬──────────┐     │
│  │ Date   │ Type             │ Serious│ Status   │ Linked   │     │
│  ├────────┼──────────────────┼────────┼──────────┼──────────┤     │
│  │11/20/24│ Unauthorized     │  Yes ⚠️│ Violation│ Enforced │     │
│  │        │ Discharge        │        │          │          │     │
│  ├────────┼──────────────────┼────────┼──────────┼──────────┤     │
│  │08/15/24│ Late Report      │  No    │ Violation│ NNC      │     │
│  │        │                  │        │          │          │     │
│  └────────┴──────────────────┴────────┴──────────┴──────────┘     │
│                                                                     │
│  INSPECTIONS (Last 3)                                              │
│  • 11/15/2024 - B Type Compliance - 0 violations                  │
│  • 08/20/2024 - Enforcement Follow-up - 1 violation               │
│  • 04/10/2024 - Complaint Investigation - 0 violations            │
│                                                                     │
│  [View All Inspections]                                           │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────── TAB: ENFORCEMENT ────────────────────────┐
│                                                                     │
│  ENFORCEMENT TIMELINE                                              │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  2024 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │     │
│  │   │                    │              │                  │     │
│  │  NNC (3/15)          NOV (8/20)     CAO (11/25)         │     │
│  │  $0                   $2,500         $15,000             │     │
│  │  [Details]            [Details]      [Details]           │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                     │
│  ENFORCEMENT ACTION DETAILS                                        │
│  ┌────────────────────────────────────────────────────────┐       │
│  │ 📋 Cleanup and Abatement Order (CAO)                   │       │
│  │ Issued: 11/25/2024 • Order #: R1-2024-0123             │       │
│  │                                                         │       │
│  │ Violations Addressed: 2                                │       │
│  │ • Unauthorized discharge (11/20/24)                    │       │
│  │ • Deficient BMP (10/15/24)                             │       │
│  │                                                         │       │
│  │ Financial:                                             │       │
│  │ • Assessment: $15,000                                  │       │
│  │ • Received: $15,000 ✓                                  │       │
│  │ • Balance: $0                                          │       │
│  │                                                         │       │
│  │ Corrective Actions Required:                           │       │
│  │ ☑ Install secondary containment                        │       │
│  │ ☑ Update SWPPP                                         │       │
│  │ ☐ Quarterly monitoring (ongoing)                       │       │
│  │                                                         │       │
│  │ Status: Active • Due Date: 05/25/2025                  │       │
│  └────────────────────────────────────────────────────────┘       │
│                                                                     │
│  [Download Enforcement Documents]                                 │
└────────────────────────────────────────────────────────────────────┘

┌───────────────────── TAB: COMPLIANCE SCORE ────────────────────────┐
│                                                                     │
│  OVERALL COMPLIANCE SCORE: 68/100 (Fair)                          │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  [Gauge chart showing 68/100 in orange zone]            │     │
│  │                                                          │     │
│  │  0-49: Poor | 50-74: Fair | 75-89: Good | 90-100: Excellent│
│  └──────────────────────────────────────────────────────────┘     │
│                                                                     │
│  SCORE BREAKDOWN                                                   │
│  ┌────────────────────┬────────┬──────────────────────────┐       │
│  │ Factor             │ Score  │ Trend                    │       │
│  ├────────────────────┼────────┼──────────────────────────┤       │
│  │ Violation Frequency│  60/100│ ↓ Improving (last 6mo)   │       │
│  │ Violation Severity │  55/100│ → Stable                 │       │
│  │ Enforcement History│  70/100│ ↑ Worsening              │       │
│  │ Inspection Results │  85/100│ ↑ Worsening (1 fail)     │       │
│  │ Repeat Offenses    │  50/100│ ⚠️ 3 repeat violations   │       │
│  └────────────────────┴────────┴──────────────────────────┘       │
│                                                                     │
│  RISK FACTORS                                                      │
│  ⚠️  Serious violations: 2 in last 12 months                      │
│  ⚠️  Repeat offender: Lead exceedances (3 times)                  │
│  ⚠️  Discharges to impaired water: San Diego Bay                  │
│  ✓  Corrective actions completed: 85% compliance                  │
│                                                                     │
│  RECOMMENDATIONS                                                   │
│  1. Upgrade lead treatment system (high priority)                 │
│  2. Increase monitoring frequency for Lead                        │
│  3. Review SWPPP and update BMPs                                  │
│                                                                     │
│  [Generate Compliance Report PDF]                                 │
└────────────────────────────────────────────────────────────────────┘
```

#### Component Breakdown

**New Components:**
1. `<FacilityTabs>` - Tabbed interface for data organization
2. `<ComplianceScoreCard>` - Risk indicator visualization
3. `<EnforcementTimeline>` - Chronological action history
4. `<ViolationTypeIndicator>` - Distinguish eSMR vs SMARTS
5. `<InspectionHistory>` - Inspection records list
6. `<DataSourceSection>` - Separate eSMR/SMARTS sections

**Modified Components:**
- `<SampleChart>` - Existing, enhanced with NAL threshold lines
- `<CasePacketButton>` - Enhanced to include SMARTS data

**Data Requirements:**
```typescript
interface FacilityComplete {
  facility: FacilityCore
  esmr: {
    facilityId: number
    locations: ESMRLocation[]
    recentSamples: ESMRSample[]
    sampleCount: number
  } | null
  smarts: {
    wdid: string
    appId: string
    permitType: string
    status: string
    violations: SMARTSViolation[]
    inspections: SMARTSInspection[]
  } | null
  enforcement: {
    actions: EnforcementAction[]
    totalAssessed: number
    totalPaid: number
    activeActions: number
  }
  complianceScore: {
    overall: number
    breakdown: ScoreBreakdown
    riskFactors: string[]
    recommendations: string[]
  }
}
```

---

### 2.4 Violations List (/violations) - NEW

**Purpose:** Unified view of eSMR computed + SMARTS regulatory violations

#### Wireframe Description

```
┌────────────────────────────────────────────────────────────────────┐
│  HEADER: Violation Registry                                        │
│  Subtitle: 1,686 total violations (452 eSMR computed, 1,234 SMARTS)│
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  FILTERS & VIEWS                                                   │
│  [Source: All ▼] [Type ▼] [Severity ▼] [Status ▼] [Date Range]   │
│  [County ▼] [Pollutant ▼] [Has Enforcement ☐]                    │
│                                                                     │
│  View: [Table] [Map] [Timeline]                                   │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  SUMMARY CARDS                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ eSMR     │ │ SMARTS   │ │ Serious  │ │ With     │            │
│  │ Computed │ │Regulatory│ │          │ │Enforc.   │            │
│  │   452    │ │  1,234   │ │   312    │ │   289    │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  VIOLATIONS TABLE                                                  │
│  ┌──┬─────────────┬──────────┬──────────┬────────┬──────┬───────┐│
│  │ 🏷│ Facility    │ Type     │ Date     │ Source │Sever.│Action ││
│  ├──┼─────────────┼──────────┼──────────┼────────┼──────┼───────┤│
│  │🔵│ Acme Ind.   │Unauth.   │11/20/2024│ SMARTS │Serious│ CAO  ││
│  │  │ SD County   │Discharge │          │ [🔵]   │  ⚠️  │       ││
│  ├──┼─────────────┼──────────┼──────────┼────────┼──────┼───────┤│
│  │🟢│ Harbor Chem │Lead      │11/18/2024│ eSMR   │ High │ None ││
│  │  │ LA County   │4.2× NAL  │          │ [🟢]   │  ⚠️  │       ││
│  ├──┼─────────────┼──────────┼──────────┼────────┼──────┼───────┤│
│  │🔵│ Oceanview   │Late      │11/15/2024│ SMARTS │ Low  │ NNC  ││
│  │  │ Orange Co.  │Report    │          │ [🔵]   │      │       ││
│  └──┴─────────────┴──────────┴──────────┴────────┴──────┴───────┘│
│                                                                     │
│  Showing 1-50 of 1,686 • [Load More]                              │
└────────────────────────────────────────────────────────────────────┘

COLOR LEGEND:
🟢 Green badge = eSMR computed violation (from monitoring data)
🔵 Blue badge = SMARTS regulatory violation (official record)
```

#### Component Breakdown

**New Components:**
1. `<ViolationTable>` - ENHANCED: Handle both violation types
2. `<ViolationBadge>` - Source indicator (eSMR vs SMARTS)
3. `<ViolationTypeFilter>` - Filter by source type
4. `<ViolationMapView>` - Geographic visualization

**Data Requirements:**
```typescript
interface UnifiedViolation {
  id: string
  source: 'ESMR_COMPUTED' | 'SMARTS_REGULATORY'
  facilityId: string
  facilityName: string
  county: string
  occurrenceDate: Date
  violationType: string
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  status: string

  // eSMR-specific
  pollutantKey?: string
  exceedanceRatio?: number

  // SMARTS-specific
  seriousViolation?: boolean
  linkedEnforcement?: boolean
  enforcementType?: string
}
```

**User Education: Two Violation Types**

Display tooltip/help text:
```
ℹ️ Understanding Violation Types

🟢 eSMR Computed Violations
   • Detected from monitoring data analysis
   • Exceedances of NAL benchmarks
   • Early warning indicators
   • Not official regulatory violations (yet)

🔵 SMARTS Regulatory Violations
   • Official violations on record
   • Reported by Water Board inspectors
   • Legal enforcement potential
   • May result from eSMR computed violations

Both types are important for compliance tracking!
```

---

### 2.5 Enforcement Actions (/enforcement) - NEW

**Purpose:** Track enforcement actions and financial penalties

#### Wireframe Description

```
┌────────────────────────────────────────────────────────────────────┐
│  HEADER: Enforcement Actions                                       │
│  Subtitle: 289 active actions • $2.4M total assessed               │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  FILTERS                                                           │
│  [Type: All ▼] [Status: Active ▼] [County ▼] [Date Range]        │
│  [Min Penalty: $____]                                              │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  STATISTICS                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Active   │ │Historical│ │ Total    │ │ Collected│            │
│  │ Actions  │ │ Actions  │ │ Assessed │ │          │            │
│  │   289    │ │  1,845   │ │ $2.4M    │ │  $1.8M   │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  ENFORCEMENT TYPE DISTRIBUTION (Pie Chart)                         │
│  • NNC (Notice of Non-Compliance): 40%                            │
│  • NOV (Notice of Violation): 25%                                 │
│  • CAO (Cleanup & Abatement): 10%                                 │
│  • SEL (Staff Enforcement Letter): 8%                             │
│  • Other: 17%                                                      │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  ACTIONS TABLE                                                     │
│  ┌──────────┬──────────┬──────┬────────┬──────────┬──────┬──────┐│
│  │ Date     │ Facility │ Type │ Order# │ Penalty  │ Paid │Status││
│  ├──────────┼──────────┼──────┼────────┼──────────┼──────┼──────┤│
│  │11/25/2024│Acme Ind. │ CAO  │R1-2024-│ $15,000  │$15,000│Active││
│  │          │          │      │ 0123   │          │  ✓   │      ││
│  ├──────────┼──────────┼──────┼────────┼──────────┼──────┼──────┤│
│  │08/20/2024│Harbor Ch.│ NOV  │R2-2024-│ $2,500   │$2,500│Hist. ││
│  │          │          │      │ 0089   │          │  ✓   │      ││
│  └──────────┴──────────┴──────┴────────┴──────────┴──────┴──────┘│
│                                                                     │
│  [Export Enforcement Data CSV]                                    │
└────────────────────────────────────────────────────────────────────┘
```

#### Component Breakdown

**New Components:**
1. `<EnforcementTable>` - Action listing with financial data
2. `<EnforcementTypeChart>` - Distribution visualization
3. `<EnforcementStats>` - Financial summary cards
4. `<EnforcementDetail>` - Expandable action details

---

### 2.6 Inspections (/inspections) - NEW

**Purpose:** Inspection records with findings and follow-up actions

#### Wireframe Description

```
┌────────────────────────────────────────────────────────────────────┐
│  HEADER: Inspection Records                                        │
│  Subtitle: 156 inspections last 30 days • 28 violations found     │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  FILTERS                                                           │
│  [Purpose: All ▼] [Inspector: All ▼] [County ▼] [Date Range]     │
│  [With Violations ☐] [Follow-up Required ☐]                      │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  INSPECTION CALENDAR (Monthly View)                                │
│  [< Nov 2024 >]                                                    │
│  ┌───┬───┬───┬───┬───┬───┬───┐                                    │
│  │Sun│Mon│Tue│Wed│Thu│Fri│Sat│                                    │
│  ├───┼───┼───┼───┼───┼───┼───┤                                    │
│  │   │   │   │ 1 │ 2 │ 3 │ 4 │                                    │
│  │   │   │   │ • │   │   │ • │  • = inspection(s) conducted       │
│  ├───┼───┼───┼───┼───┼───┼───┤                                    │
│  │...│                         │                                    │
│  └───┴───┴───┴───┴───┴───┴───┘                                    │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  INSPECTIONS LIST                                                  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 📋 B-Type Compliance Inspection                             │  │
│  │ Acme Industrial • 11/15/2024 • Inspector: J. Smith (State) │  │
│  │                                                             │  │
│  │ Findings: 0 violations                                      │  │
│  │ Follow-up: No further action required                      │  │
│  │                                                             │  │
│  │ [View Details] [Download Report]                           │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 📋 Enforcement Follow-up                                    │  │
│  │ Harbor Chemical • 08/20/2024 • Inspector: M. Lee (Regional)│  │
│  │                                                             │  │
│  │ Findings: 1 violation (Deficient BMP)                      │  │
│  │ Follow-up: Additional info required ⚠️                     │  │
│  │ Linked Violations: V-2024-0892                             │  │
│  │                                                             │  │
│  │ [View Details] [View Violation]                            │  │
│  └─────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

#### Component Breakdown

**New Components:**
1. `<InspectionCalendar>` - Monthly calendar view
2. `<InspectionCard>` - Inspection summary card
3. `<InspectionDetail>` - Full inspection report
4. `<InspectorPerformance>` - Inspector metrics (admin only)

---

### 2.7 Analytics (/analytics) - NEW

**Purpose:** Trend analysis, scorecards, and predictive risk modeling

#### Wireframe Description

```
┌────────────────────────────────────────────────────────────────────┐
│  HEADER: Compliance Analytics                                      │
│  Subtitle: Regional trends and predictive risk modeling            │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  ANALYSIS TYPE                                                     │
│  [Regional Scorecard] [Trend Analysis] [Repeat Offenders]         │
│  [Pollutant Tracking] [Predictive Risk]                           │
└────────────────────────────────────────────────────────────────────┘

┌─────────────────── REGIONAL SCORECARD VIEW ────────────────────────┐
│                                                                     │
│  REGION SELECTOR: [Region 1 ▼]                                    │
│                                                                     │
│  REGION 1 COMPLIANCE SCORECARD                                     │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  Overall Score: 72/100 (Good)                            │     │
│  │  [Gauge chart]                                           │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                     │
│  METRICS                                                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│  │ Facilities │ │ Violations │ │ Enforcement│ │ Inspection │    │
│  │   4,521    │ │    234     │ │     45     │ │    128     │    │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │
│                                                                     │
│  COMPLIANCE TRENDS (Last 12 Months)                                │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  [Line chart showing violations over time]              │     │
│  │  • Blue line = Total violations                         │     │
│  │  • Red line = Serious violations                        │     │
│  │  • Trend: ↓ 15% decrease from last year                │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                     │
│  TOP 5 COUNTIES IN REGION                                          │
│  1. Del Norte - 67 violations                                     │
│  2. Humboldt - 54 violations                                      │
│  3. Lake - 42 violations                                          │
│  ...                                                               │
│                                                                     │
│  [Download Regional Report PDF]                                   │
└────────────────────────────────────────────────────────────────────┘

┌──────────────────── REPEAT OFFENDERS VIEW ────────────────────────┐
│                                                                     │
│  DEFINITION: Facilities with 3+ violations in last 12 months      │
│                                                                     │
│  REPEAT OFFENDER RANKING                                           │
│  ┌──┬──────────────┬────────┬──────────┬────────────────────┐    │
│  │ #│ Facility     │ County │Violations│ Pattern            │    │
│  ├──┼──────────────┼────────┼──────────┼────────────────────┤    │
│  │ 1│ Acme Ind.    │ SD     │    12    │ Lead (monthly)     │    │
│  ├──┼──────────────┼────────┼──────────┼────────────────────┤    │
│  │ 2│ Harbor Chem  │ LA     │     8    │ pH (quarterly)     │    │
│  ├──┼──────────────┼────────┼──────────┼────────────────────┤    │
│  │ 3│ Oceanview    │ Orange │     6    │ TSS (irregular)    │    │
│  └──┴──────────────┴────────┴──────────┴────────────────────┘    │
│                                                                     │
│  INTERVENTION RECOMMENDATIONS                                      │
│  • 12 facilities require enhanced monitoring                      │
│  • 5 facilities recommended for CAO escalation                    │
│  • 8 facilities showing improvement after enforcement             │
│                                                                     │
│  [Export Repeat Offender List CSV]                                │
└────────────────────────────────────────────────────────────────────┘
```

#### Component Breakdown

**New Components:**
1. `<AnalyticsSelector>` - Analysis type switcher
2. `<RegionalScorecard>` - Regional compliance metrics
3. `<TrendChart>` - Time-series visualization
4. `<RepeatOffenderTable>` - Facilities with multiple violations
5. `<PredictiveRiskModel>` - Machine learning risk scores (future)

---

## 3. Component Library

### 3.1 New Components Needed

#### Data Visualization

**`<ViolationBadge>`**
```tsx
interface ViolationBadgeProps {
  source: 'ESMR_COMPUTED' | 'SMARTS_REGULATORY'
  severity?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  tooltip?: boolean
}

// Visual:
// eSMR: 🟢 Green circle + "Computed" label
// SMARTS: 🔵 Blue circle + "Regulatory" label
// With severity color overlay (orange/red for high/critical)
```

**`<EnforcementTimeline>`**
```tsx
interface EnforcementTimelineProps {
  actions: EnforcementAction[]
  interactive?: boolean
  compact?: boolean
}

// Horizontal timeline with:
// - Date markers
// - Action type icons
// - Penalty amounts
// - Status indicators
// - Click to expand details
```

**`<ComplianceScoreGauge>`**
```tsx
interface ComplianceScoreGaugeProps {
  score: number  // 0-100
  breakdown?: ScoreBreakdown
  size?: 'sm' | 'md' | 'lg'
}

// Semi-circular gauge:
// 0-49: Red (Poor)
// 50-74: Orange (Fair)
// 75-89: Yellow (Good)
// 90-100: Green (Excellent)
```

**`<LayeredMap>`**
```tsx
interface LayeredMapProps {
  facilities: FacilityMapPoint[]
  violations?: ViolationMapPoint[]
  enforcement?: EnforcementMapPoint[]
  inspections?: InspectionMapPoint[]
  layers: {
    esmrViolations: boolean
    smartsViolations: boolean
    enforcementActions: boolean
    inspections: boolean
  }
  onLayerToggle: (layer: string) => void
}

// Mapbox GL JS map with:
// - Multiple data layers (toggleable)
// - Cluster visualization
// - Click → facility detail modal
// - Legend with layer controls
```

#### Tables

**`<VirtualizedFacilityTable>`**
```tsx
interface VirtualizedFacilityTableProps {
  facilities: FacilityListItem[]
  totalCount: number
  onLoadMore: () => void
  onSort: (column: string, direction: 'asc' | 'desc') => void
}

// Features:
// - Virtual scrolling (react-window)
// - Sort by column
// - Multi-select rows
// - Inline filters
// - Export selection
```

**`<UnifiedViolationTable>`**
```tsx
interface UnifiedViolationTableProps {
  violations: UnifiedViolation[]
  showSource?: boolean
  showEnforcement?: boolean
  groupBy?: 'facility' | 'pollutant' | 'date'
}

// Columns:
// - Source indicator badge
// - Facility name (linked)
// - Violation type
// - Date
// - Severity badge
// - Enforcement status
// - Actions (view details)
```

#### Filters

**`<MultiSourceFilters>`**
```tsx
interface MultiSourceFiltersProps {
  onFilterChange: (filters: FilterState) => void
  availableOptions: {
    counties: string[]
    pollutants: string[]
    violationTypes: string[]
    sources: DataSource[]
  }
}

// Layout:
// [Source: All ▼] [County ▼] [Pollutant ▼] [Date Range]
// [Advanced Filters +] ← Collapsible
//   └─ [Severity] [Status] [Has Enforcement] [Impaired Water]
```

#### Cards

**`<InspectionCard>`**
```tsx
interface InspectionCardProps {
  inspection: SMARTSInspection
  compact?: boolean
  showLinkedViolations?: boolean
}

// Display:
// - Inspector name and type
// - Inspection date and purpose
// - Violations found count
// - Follow-up action required
// - Links to violations (if any)
// - Download report button
```

**`<IntegratedKPICard>`**
```tsx
interface IntegratedKPICardProps {
  label: string
  value: string | number
  icon: React.ComponentType
  subtitle?: string
  trend?: {
    direction: 'up' | 'down' | 'stable'
    value: string
  }
  alert?: boolean
  dataSource?: 'esmr' | 'smarts' | 'both'
}

// Laboratory styling:
// - Minimal shadows
// - Slate-50 background
// - Teal-600 accent for active
// - Icons in colored circles
// - Trend indicators
```

### 3.2 Modified Components

**`<FacilityTable>` → `<VirtualizedFacilityTable>`**
- Add virtual scrolling for 93K facilities
- Add data source indicators
- Add inline violation/enforcement counts
- Add multi-select for bulk actions

**`<DashboardStats>` → `<IntegratedKPICards>`**
- Add eSMR vs SMARTS breakdown
- Add source indicators
- Add drill-down links

**`<ViolationsTable>` → `<UnifiedViolationTable>`**
- Add source badge column
- Add enforcement link column
- Add grouping options
- Add export functionality

**`<MapView>` → `<LayeredMap>`**
- Add layer toggle controls
- Add legend with source colors
- Add cluster visualization
- Add fallback for missing coordinates (county centroid)

### 3.3 Reusable Patterns

#### Advanced Filters with Presets

```tsx
<FilterPresets
  presets={[
    { name: 'Serious Violations', filters: { serious: true, source: 'SMARTS' } },
    { name: 'Repeat Offenders', filters: { count: { gte: 3 } } },
    { name: 'Recent Activity', filters: { dateFrom: '30daysAgo' } }
  ]}
  onApply={(filters) => setFilters(filters)}
/>
```

#### Virtualized Tables

Use `react-window` or `@tanstack/react-virtual`:
```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

const rowVirtualizer = useVirtualizer({
  count: facilities.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 64,  // Row height
  overscan: 10
})
```

#### Export to CSV

```tsx
<ExportButton
  data={violations}
  filename="violations-export.csv"
  columns={['facilityName', 'violationType', 'date', 'severity']}
  transform={(row) => ({
    ...row,
    source: row.source === 'ESMR_COMPUTED' ? 'eSMR (Computed)' : 'SMARTS (Regulatory)'
  })}
/>
```

#### Timeline Visualizations

Use `@visx/timeline` or custom implementation:
```tsx
<Timeline>
  {actions.map(action => (
    <TimelineEvent
      key={action.id}
      date={action.issuanceDate}
      type={action.enforcementType}
      icon={getEnforcementIcon(action.type)}
      onClick={() => openActionDetail(action)}
    />
  ))}
</Timeline>
```

---

## 4. User Journey Redesign

### 4.1 Attorney Journey: Build Violation Case

**Goal:** Gather evidence for legal enforcement action

**Screens:**

```
Step 1: Search & Filter
┌────────────────────────────────────────────────────────────────────┐
│  /facilities                                                        │
│  Search: "Industrial" + County: "San Diego" + Has Violations: ☑   │
│  → Results: 247 facilities                                         │
└────────────────────────────────────────────────────────────────────┘
                               ↓
Step 2: Identify Target Facility
┌────────────────────────────────────────────────────────────────────┐
│  Acme Industrial Manufacturing                                     │
│  • 12 violations (5 eSMR computed, 7 SMARTS regulatory)           │
│  • 3 enforcement actions (2 active)                               │
│  • Compliance Score: 68/100 (Fair)                                │
│  [View Facility →]                                                │
└────────────────────────────────────────────────────────────────────┘
                               ↓
Step 3: Review Violations (Tabbed Interface)
┌────────────────────────────────────────────────────────────────────┐
│  /facilities/[id] - SMARTS Regulatory Tab                         │
│  • 7 regulatory violations (2 serious)                            │
│  • Unauthorized discharge (11/20/24) - Serious ⚠️                │
│  • Late report (08/15/24) - Not serious                           │
│  [View eSMR Monitoring Tab] ← Cross-reference computed violations │
└────────────────────────────────────────────────────────────────────┘
                               ↓
Step 4: Gather Enforcement History
┌────────────────────────────────────────────────────────────────────┐
│  /facilities/[id] - Enforcement Tab                               │
│  • Timeline: NNC (3/15) → NOV (8/20) → CAO (11/25)               │
│  • Total penalties: $17,500 (all paid)                            │
│  • Current status: CAO active, due 5/25/2025                      │
│  [Download Enforcement Documents]                                 │
└────────────────────────────────────────────────────────────────────┘
                               ↓
Step 5: Generate Case Packet
┌────────────────────────────────────────────────────────────────────┐
│  [Download Case Packet PDF] button                                │
│  PDF Contents:                                                     │
│  • Facility profile                                               │
│  • All violations (eSMR + SMARTS) with evidence                   │
│  • Enforcement history timeline                                   │
│  • Inspection reports                                             │
│  • Compliance score analysis                                      │
│  • Recommended enforcement escalation                             │
└────────────────────────────────────────────────────────────────────┘
```

**Key Features for Attorneys:**
- One-click case packet export (PDF)
- Clear distinction between computed (potential) vs regulatory (official) violations
- Enforcement escalation timeline
- Evidence trail: Monitoring data → Violation → Inspection → Enforcement
- Legal citation support (order numbers, violation codes)

**Interaction Points:**
1. Initial search: Fast filtering with legal-relevant criteria
2. Facility selection: Compliance score + violation count preview
3. Tabbed navigation: Separate eSMR evidence from SMARTS official record
4. Enforcement timeline: Visual progression of enforcement actions
5. Export: Attorney-ready PDF with all necessary documentation

---

### 4.2 Compliance Officer Journey: Monitor Regional Compliance

**Goal:** Track violations and enforcement in assigned region

**Screens:**

```
Step 1: Dashboard Overview
┌────────────────────────────────────────────────────────────────────┐
│  / (Dashboard)                                                     │
│  KPIs:                                                             │
│  • 93K facilities (4.5K in Region 9)                              │
│  • 234 active violations (45 in Region 9)                         │
│  • 12 serious violations (3 in Region 9) ← ALERT                  │
│                                                                     │
│  Regional Hotspots:                                                │
│  1. San Diego County - 67 violations                              │
│  2. Orange County - 54 violations                                 │
│                                                                     │
│  [Filter: Region 9 ▼] ← Pre-select assigned region                │
└────────────────────────────────────────────────────────────────────┘
                               ↓
Step 2: Filter Serious Violations
┌────────────────────────────────────────────────────────────────────┐
│  /violations                                                       │
│  Filters: Region 9 + Serious: Yes + Status: Active                │
│  → Results: 3 serious violations requiring attention               │
│                                                                     │
│  1. Acme Industrial - Unauthorized discharge (11/20)              │
│  2. Harbor Chemical - Lead 5.2× NAL (11/18) ← eSMR computed       │
│  3. Oceanview Construction - Turbidity 3× (11/10)                │
└────────────────────────────────────────────────────────────────────┘
                               ↓
Step 3: Review Inspection Findings
┌────────────────────────────────────────────────────────────────────┐
│  /inspections                                                      │
│  Filter: Region 9 + Last 30 days + With Violations                │
│  → Results: 8 inspections found violations                        │
│                                                                     │
│  • 5 require follow-up action ⚠️                                  │
│  • 2 additional info required                                     │
│  • 1 enforcement recommended                                      │
│                                                                     │
│  [Schedule Follow-up Inspections] ← Action item                   │
└────────────────────────────────────────────────────────────────────┘
                               ↓
Step 4: Track Enforcement Progress
┌────────────────────────────────────────────────────────────────────┐
│  /enforcement                                                      │
│  Filter: Region 9 + Status: Active                                │
│  → Results: 12 active enforcement actions                         │
│                                                                     │
│  Due Soon (< 30 days):                                            │
│  • Acme Industrial CAO - Due 5/25/2025 (6 months left)           │
│  • Harbor Chemical NOV - Due 1/15/2025 (40 days) ⚠️               │
│                                                                     │
│  Overdue:                                                          │
│  • Oceanview Construction - Overdue by 15 days 🚨                 │
│                                                                     │
│  [Generate Regional Compliance Report]                            │
└────────────────────────────────────────────────────────────────────┘
```

**Key Features for Compliance Officers:**
- Regional pre-filtering (remember user's assigned region)
- Alert system for serious violations and overdue enforcement
- Inspection scheduling workflow
- Progress tracking for enforcement actions
- Regional compliance reports (PDF)

**Interaction Points:**
1. Dashboard: At-a-glance regional summary with alerts
2. Violation filtering: Severity-based prioritization
3. Inspection review: Follow-up action tracking
4. Enforcement monitoring: Due date tracking with alerts
5. Reporting: Generate regional summary for management

---

### 4.3 Researcher Journey: Analyze Trends

**Goal:** Study compliance patterns and publish findings

**Screens:**

```
Step 1: Navigate to Analytics
┌────────────────────────────────────────────────────────────────────┐
│  /analytics                                                        │
│  Analysis Types:                                                   │
│  • [Regional Scorecard] ← Select                                  │
│  • Trend Analysis                                                 │
│  • Repeat Offenders                                               │
│  • Pollutant Tracking                                             │
└────────────────────────────────────────────────────────────────────┘
                               ↓
Step 2: Select Region and Timeframe
┌────────────────────────────────────────────────────────────────────┐
│  Region: [All Regions ▼] ← Compare all regions                    │
│  Timeframe: [Last 5 Years ▼] ← Trend analysis                     │
│  Metric: [Violations per 1,000 facilities]                        │
│                                                                     │
│  [Generate Analysis →]                                            │
└────────────────────────────────────────────────────────────────────┘
                               ↓
Step 3: Review Trend Charts
┌────────────────────────────────────────────────────────────────────┐
│  REGIONAL COMPLIANCE TRENDS (2020-2025)                           │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  [Multi-line chart]                                      │     │
│  │  • Region 9: ↓ 25% decrease (best)                      │     │
│  │  • Region 5: → Stable                                    │     │
│  │  • Region 2: ↑ 15% increase (worst)                     │     │
│  │                                                          │     │
│  │  Key Finding: Industrial violations decreasing,          │     │
│  │  construction violations increasing                      │     │
│  └──────────────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────────────┘
                               ↓
Step 4: Compare Facility Performance
┌────────────────────────────────────────────────────────────────────┐
│  Top 10 Best-Performing Counties (by compliance score):           │
│  1. Alpine County - 94/100 (12 facilities)                       │
│  2. Sierra County - 92/100 (8 facilities)                        │
│  ...                                                               │
│                                                                     │
│  Top 10 Worst-Performing Counties:                                │
│  1. Los Angeles - 58/100 (8,542 facilities)                      │
│  2. Riverside - 61/100 (3,245 facilities)                        │
│  ...                                                               │
│                                                                     │
│  [Export Data for Statistical Analysis]                          │
└────────────────────────────────────────────────────────────────────┘
                               ↓
Step 5: Generate Report with Charts
┌────────────────────────────────────────────────────────────────────┐
│  [Export Options]                                                  │
│  • Download charts as PNG/SVG                                     │
│  • Export data as CSV (for R/Python analysis)                     │
│  • Generate research report PDF with:                             │
│    - Executive summary                                            │
│    - Methodology                                                  │
│    - Charts and tables                                            │
│    - Statistical analysis                                         │
│    - Data sources and citations                                   │
└────────────────────────────────────────────────────────────────────┘
```

**Key Features for Researchers:**
- Flexible time range selection (5+ years)
- Multi-region comparison
- Statistical aggregations (avg, median, trend)
- Export raw data (CSV) for external analysis
- Citation-ready reports with methodology

**Interaction Points:**
1. Analytics selector: Choose analysis type
2. Parameter selection: Region, timeframe, metrics
3. Visualization: Interactive charts with hover details
4. Comparison tools: Side-by-side region/county analysis
5. Export: Multiple formats (charts, data, reports)

---

## 5. Design System Integration: Laboratory Aesthetic

### 5.1 Color Palette for Violation Types

**Base Colors (Laboratory System):**
- **Background:** White (#FFFFFF) / Slate-50 (#F8FAFC)
- **Surface:** Slate-100 (#F1F5F9)
- **Border:** Slate-200 (#E2E8F0)
- **Text:** Slate-900 (#0F172A)
- **Muted:** Slate-600 (#475569)

**Accent Colors:**
- **Primary (Teal):** Teal-600 (#0D9488) - Active states, links
- **Success:** Green-600 (#16A34A) - Compliant, no violations
- **Warning:** Orange-500 (#F97316) - Moderate severity
- **Danger:** Red-600 (#DC2626) - High/critical severity

**Data Source Indicators:**
```
eSMR Computed:
  • Badge: Green-100 background, Green-700 text
  • Icon: 🟢 Green circle
  • Border: Green-300

SMARTS Regulatory:
  • Badge: Blue-100 background, Blue-700 text
  • Icon: 🔵 Blue circle
  • Border: Blue-300
```

**Severity Colors:**
```
LOW:       Slate-500 (muted gray)
MODERATE:  Orange-500 (warning orange)
HIGH:      Red-600 (danger red)
CRITICAL:  Red-700 + pulsing animation
```

### 5.2 Typography for Data Density

**Font Stack:**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
             Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

**Type Scale:**
```
Hero (H1):        48px / font-bold / tracking-tight
Section (H2):     32px / font-bold / tracking-tight
Subsection (H3):  24px / font-semibold
Card Title:       18px / font-semibold
Body:             16px / font-normal
Small:            14px / font-normal
Caption:          12px / font-normal / text-muted-foreground
Code/Mono:        14px / font-mono (for permit IDs, dates)
```

**Data-Heavy Pages:**
- Tables: 14px body text
- Cards: 16px body text
- Density toggle: Allow users to switch between comfortable/compact

### 5.3 Spacing and Layout Grids

**Grid System:**
```
Container max-width: 1400px
Gutter: 24px (desktop), 16px (mobile)
Columns: 12-column grid

Page layout:
├─ Sidebar: 256px fixed (desktop)
├─ Content: calc(100% - 256px)
└─ Max content width: 1400px
```

**Spacing Scale (Tailwind):**
```
xs:  4px   (p-1)
sm:  8px   (p-2)
md:  16px  (p-4)
lg:  24px  (p-6)
xl:  32px  (p-8)
2xl: 48px  (p-12)
```

**Card Spacing:**
```tsx
<Card className="p-6 space-y-4">
  <CardHeader className="pb-4 border-b">
    <CardTitle>...</CardTitle>
  </CardHeader>
  <CardContent className="pt-4">
    ...
  </CardContent>
</Card>
```

### 5.4 Component Styling Examples

**KPI Card (Laboratory Style):**
```tsx
<Card className="relative overflow-hidden bg-white border-slate-200
                 hover:shadow-lg transition-shadow duration-300">
  <CardContent className="p-6">
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 rounded-lg bg-teal-50">
        <Icon className="w-6 h-6 text-teal-600" />
      </div>
    </div>
    <p className="text-sm font-medium text-slate-600 uppercase tracking-wider mb-1">
      {label}
    </p>
    <p className="text-4xl font-bold tracking-tight text-slate-900">
      {value}
    </p>
    {trend && (
      <p className="text-xs text-slate-500 mt-2">{trend}</p>
    )}
  </CardContent>
</Card>
```

**Data Table (Clinical Aesthetic):**
```tsx
<Table>
  <TableHeader className="bg-slate-50">
    <TableRow className="border-b border-slate-200">
      <TableHead className="text-slate-700 font-semibold">Facility</TableHead>
      <TableHead className="text-slate-700 font-semibold">Violation</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="border-b border-slate-100 hover:bg-slate-50">
      <TableCell className="font-medium text-slate-900">Acme Industrial</TableCell>
      <TableCell className="text-slate-700">Unauthorized Discharge</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Badge (Source Indicator):**
```tsx
// eSMR Computed
<Badge className="bg-green-100 text-green-700 border-green-300
                  font-medium hover:bg-green-200">
  <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
  eSMR Computed
</Badge>

// SMARTS Regulatory
<Badge className="bg-blue-100 text-blue-700 border-blue-300
                  font-medium hover:bg-blue-200">
  <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5" />
  SMARTS Regulatory
</Badge>
```

---

## 6. Progressive Disclosure Strategy

### 6.1 Default Views (Simple)

**Dashboard:**
- Show top-level KPIs only
- Map with single violation layer (combined eSMR + SMARTS)
- Recent activity timeline (last 7 days)
- Hide: Advanced filters, detailed breakdowns

**Facility List:**
- Show: Name, County, Violation Count, Status
- Hide: eSMR/SMARTS breakdown, detailed metrics

**Facility Detail:**
- Default tab: Overview only
- Hide: eSMR Monitoring, SMARTS Regulatory tabs until clicked

### 6.2 Advanced Views (On-Demand)

**Trigger: "Show Advanced" Button**

```tsx
<Button
  variant="ghost"
  onClick={() => setShowAdvanced(!showAdvanced)}
>
  {showAdvanced ? 'Hide' : 'Show'} Advanced Options
</Button>

{showAdvanced && (
  <AdvancedFilters />
)}
```

**Dashboard Advanced:**
- Separate eSMR vs SMARTS KPI cards
- Map layer controls (toggle violation types)
- Extended activity timeline (30 days)
- Regional breakdown charts

**Facility List Advanced:**
- Data source indicators (eSMR/SMARTS badges)
- Compliance score column
- Last inspection date
- Enforcement action count

**Facility Detail Advanced:**
- All tabs visible
- Compliance score tab
- Full sample data tables
- Downloadable reports

### 6.3 Collapsible Sections

**Pattern:**
```tsx
<Collapsible open={isOpen} onOpenChange={setIsOpen}>
  <CollapsibleTrigger className="flex items-center justify-between w-full p-4
                                  hover:bg-slate-50 rounded-lg">
    <span className="font-semibold">Advanced Filters</span>
    <ChevronDown className={cn("transition-transform", isOpen && "rotate-180")} />
  </CollapsibleTrigger>
  <CollapsibleContent className="px-4 pb-4">
    {/* Advanced filter controls */}
  </CollapsibleContent>
</Collapsible>
```

**Use Cases:**
- Advanced filters (county, HUC12, MS4, date range)
- Facility details (less important info)
- Historical data (older inspections, archived violations)

### 6.4 Guided Tours for New Users

**First Visit Detection:**
```tsx
const [showTour, setShowTour] = useState(false)

useEffect(() => {
  const hasSeenTour = localStorage.getItem('hasSeenDashboardTour')
  if (!hasSeenTour) {
    setShowTour(true)
  }
}, [])
```

**Tour Steps (Dashboard):**
1. **KPI Cards:** "These show overall compliance statistics"
2. **Data Source Toggle:** "Choose eSMR computed or SMARTS regulatory data"
3. **Map Layers:** "Toggle different violation types on the map"
4. **Violations Table:** "Click any facility to see details"

**Implementation:** Use `react-joyride` or similar

---

## 7. Accessibility & Performance

### 7.1 WCAG 2.1 AA Compliance

**Color Contrast:**
- All text: Minimum 4.5:1 contrast ratio
- Large text (18px+): Minimum 3:1 contrast ratio
- Interactive elements: Minimum 3:1 against background

**Test:**
```
Background: White (#FFFFFF)
Primary text (Slate-900 #0F172A): 17.9:1 ✓
Muted text (Slate-600 #475569): 7.5:1 ✓
Teal accent (Teal-600 #0D9488): 4.8:1 ✓
```

**Keyboard Navigation:**
- All interactive elements focusable (tab order)
- Focus indicators visible (2px teal-600 outline)
- Skip to main content link
- Keyboard shortcuts for common actions:
  - `/` = Focus search
  - `Esc` = Close modals
  - `?` = Show keyboard shortcuts

**Screen Reader Support:**
- Semantic HTML (`<nav>`, `<main>`, `<article>`)
- ARIA labels for icons and controls
- ARIA live regions for dynamic updates
- Table headers properly associated

**Example:**
```tsx
<Button aria-label="Download case packet PDF">
  <Download className="w-4 h-4" aria-hidden="true" />
  Download
</Button>

<div role="status" aria-live="polite">
  {loading ? 'Loading violations...' : `${violations.length} violations found`}
</div>
```

### 7.2 Performance Budgets

**Per Page:**
- **First Contentful Paint (FCP):** < 1.5s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.5s
- **Total Blocking Time (TBT):** < 300ms
- **Cumulative Layout Shift (CLS):** < 0.1

**Bundle Size:**
- **Initial JS:** < 200 KB (gzipped)
- **Total JS:** < 500 KB (with code splitting)
- **CSS:** < 50 KB (with purging)
- **Images:** WebP format, lazy loading

**Strategies:**
1. **Code Splitting:** Route-based chunks
   ```tsx
   const Analytics = lazy(() => import('./pages/analytics'))
   ```

2. **Image Optimization:** Next.js Image component
   ```tsx
   <Image
     src="/facility.jpg"
     width={800}
     height={600}
     loading="lazy"
     placeholder="blur"
   />
   ```

3. **Virtual Scrolling:** For large tables (93K facilities)
4. **Debounced Search:** 300ms delay
5. **Memoization:** Expensive calculations
   ```tsx
   const stats = useMemo(() => calculateStats(violations), [violations])
   ```

### 7.3 Progressive Enhancement

**Core Functionality Without JS:**
- Server-rendered HTML for initial page load
- Forms work with native HTML submission
- Links navigate without JS
- Basic filtering via URL params

**Enhanced with JS:**
- Client-side filtering (instant feedback)
- Interactive maps (fallback to static image)
- Virtual scrolling (fallback to pagination)
- Real-time updates (fallback to manual refresh)

**Example:**
```tsx
// Server component (no JS required)
export default async function ViolationsPage({ searchParams }) {
  const violations = await getViolations(searchParams)
  return <ViolationsTable violations={violations} />
}

// Client enhancement
'use client'
export function ViolationsTable({ violations }) {
  const [filtered, setFiltered] = useState(violations)

  // Client-side filtering enhances but doesn't replace server filtering
  const handleFilter = (filters) => {
    setFiltered(violations.filter(v => matchesFilters(v, filters)))
  }

  return (...)
}
```

### 7.4 Mobile Optimization

**Responsive Breakpoints:**
```css
/* Mobile first */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

**Mobile Adjustments:**
- Single-column layouts
- Stacked cards (no grid)
- Bottom navigation bar
- Swipeable tabs
- Collapsible filters (drawer)
- Touch-friendly tap targets (min 48×48px)

**Example:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* 1 column mobile, 2 tablet, 4 desktop */}
</div>

<Button className="h-12 px-6 text-base">
  {/* 48px height for touch targets */}
</Button>
```

---

## 8. Laboratory Design System Timing Analysis

### 8.1 Options

**Option A: Before Schema Migration**
- **Timeline:** 2-3 weeks design system → 4-5 weeks schema migration
- **Pros:** Clean slate, no refactoring
- **Cons:** Delays data integration, two parallel workstreams

**Option B: During Schema Migration**
- **Timeline:** Parallel tracks, 4-5 weeks total
- **Pros:** Faster overall delivery
- **Cons:** Complex coordination, potential conflicts

**Option C: After Schema Migration**
- **Timeline:** 4-5 weeks schema migration → 2-3 weeks redesign
- **Pros:** Functional first, iterative improvement
- **Cons:** Users see old UI initially, double work (old → new)

### 8.2 Recommendation: Option C (After)

**Rationale:**

1. **Functional First:**
   - Users get integrated data immediately
   - Can start using SMARTS violations/enforcement right away
   - Old UI still works, just not as polished

2. **Incremental Refinement:**
   - Apply Laboratory design system page by page
   - Less risky than big-bang redesign
   - Easier to test and iterate

3. **Backend Stability:**
   - Schema migration is complex (24 tables, 87 indexes)
   - Need stable data layer before UI work
   - Avoid refactoring during active development

4. **Resource Allocation:**
   - Backend team can focus on data quality
   - Frontend team can plan design system properly
   - No context switching

**Implementation Plan:**

**Phase 1 (Weeks 1-5): Schema Migration**
- Deploy integrated schema
- Import historical SMARTS data
- Create new API endpoints
- Use existing UI components (minimal changes)

**Phase 2 (Weeks 6-8): Laboratory Redesign**
- Apply clinical aesthetic to existing pages
- Update color palette (teal accents)
- Implement sidebar navigation
- Refactor cards/tables with new styles

**Phase 3 (Weeks 9-10): New Pages**
- Add /violations, /enforcement, /inspections
- Build Analytics page
- Implement tabbed facility details

**Phase 4 (Weeks 11-12): Polish**
- Progressive disclosure
- Guided tours
- Performance optimization
- Accessibility audit

**Total Timeline:** 12 weeks (vs 7-8 weeks for Option B, but less risky)

---

## Appendices

### Appendix A: Component API Specifications

**`<ViolationBadge>`**
```tsx
interface ViolationBadgeProps {
  source: 'ESMR_COMPUTED' | 'SMARTS_REGULATORY'
  severity?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  tooltip?: boolean
  compact?: boolean
}

// Usage
<ViolationBadge
  source="SMARTS_REGULATORY"
  severity="HIGH"
  tooltip={true}
/>
```

**`<EnforcementTimeline>`**
```tsx
interface EnforcementTimelineProps {
  actions: Array<{
    id: string
    type: string
    issuanceDate: Date
    penaltyAmount?: number
    status: string
  }>
  interactive?: boolean
  onActionClick?: (action: EnforcementAction) => void
}
```

**`<LayeredMap>`**
```tsx
interface LayeredMapProps {
  center?: [number, number]
  zoom?: number
  facilities: Array<{
    id: string
    name: string
    lat: number
    lon: number
    violationCount: number
  }>
  layers: {
    esmrViolations: boolean
    smartsViolations: boolean
    enforcementActions: boolean
    inspections: boolean
  }
  onLayerToggle: (layer: keyof LayeredMapProps['layers']) => void
  onMarkerClick?: (facility: Facility) => void
}
```

### Appendix B: Wireframe Assets

**Icon Library:**
- Facilities: 🏭 `<Building2>` (Lucide)
- Violations: ⚠️ `<AlertTriangle>`
- Enforcement: ⚖️ `<Gavel>`
- Inspections: 🔍 `<Search>`
- Analytics: 📈 `<TrendingUp>`
- eSMR: 🟢 `<Circle className="fill-green-500">`
- SMARTS: 🔵 `<Circle className="fill-blue-500">`

**Color Swatches:**
```css
/* eSMR Computed */
--esmr-bg: #F0FDF4;      /* green-50 */
--esmr-border: #86EFAC;  /* green-300 */
--esmr-text: #15803D;    /* green-700 */

/* SMARTS Regulatory */
--smarts-bg: #EFF6FF;    /* blue-50 */
--smarts-border: #93C5FD; /* blue-300 */
--smarts-text: #1D4ED8;  /* blue-700 */

/* Severity */
--severity-low: #64748B;     /* slate-500 */
--severity-moderate: #F97316; /* orange-500 */
--severity-high: #DC2626;    /* red-600 */
--severity-critical: #B91C1C; /* red-700 */
```

### Appendix C: Implementation Checklist

**Navigation:**
- [ ] Sidebar component with collapsible behavior
- [ ] Breadcrumb navigation component
- [ ] Mobile hamburger menu
- [ ] Bottom tab bar (mobile)
- [ ] Active state styling

**Dashboard:**
- [ ] Multi-source KPI cards
- [ ] Layered map with toggles
- [ ] Activity timeline
- [ ] Regional hotspots
- [ ] Critical alerts section

**Facility Pages:**
- [ ] Virtualized facility table
- [ ] Data source badges
- [ ] Tabbed facility detail
- [ ] Compliance score visualization
- [ ] Enforcement timeline

**New Pages:**
- [ ] Violations list (/violations)
- [ ] Enforcement actions (/enforcement)
- [ ] Inspections (/inspections)
- [ ] Analytics (/analytics)

**Components:**
- [ ] ViolationBadge
- [ ] EnforcementTimeline
- [ ] ComplianceScoreGauge
- [ ] LayeredMap
- [ ] InspectionCard
- [ ] VirtualizedTable
- [ ] MultiSourceFilters

**Design System:**
- [ ] Laboratory color palette applied
- [ ] Typography scale implemented
- [ ] Spacing system (Tailwind utilities)
- [ ] Component styling (cards, badges, tables)
- [ ] Dark mode support (optional)

**Accessibility:**
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Focus indicators
- [ ] ARIA labels

**Performance:**
- [ ] Code splitting (route-based)
- [ ] Virtual scrolling (tables)
- [ ] Image optimization
- [ ] Debounced search
- [ ] Caching strategy

---

## Success Criteria Summary

- [x] All 5 new pages designed with wireframes
  - Dashboard (enhanced)
  - Facilities list (enhanced)
  - Facility detail (tabbed)
  - Violations list (NEW)
  - Enforcement actions (NEW)
  - Inspections (NEW)
  - Analytics (NEW)

- [x] Component inventory complete
  - 15+ new components specified
  - Modified components documented
  - Reusable patterns defined

- [x] 3 user journeys documented
  - Attorney journey (build case)
  - Compliance officer journey (monitor region)
  - Researcher journey (analyze trends)

- [x] Laboratory design integration analyzed
  - Color palette defined
  - Typography scale specified
  - Spacing/layout grids documented
  - Timing recommendation: After schema migration

- [x] Two violation types clearly differentiated
  - eSMR computed: Green badges, "Computed" label
  - SMARTS regulatory: Blue badges, "Regulatory" label
  - User education tooltips designed

- [x] Progressive disclosure strategy defined
  - Default views (simple)
  - Advanced views (on-demand)
  - Collapsible sections
  - Guided tours

---

**Document Complete**

This UI/UX redesign plan provides a comprehensive blueprint for transforming Stormwater Watch into a professional compliance platform capable of serving environmental attorneys, compliance officers, and researchers while maintaining usability for nonprofit organizations.

**Next Steps:**
1. Review and approve design direction
2. Prioritize pages/components for MVP
3. Begin schema migration (backend first)
4. Implement Laboratory design system (frontend)
5. Build new pages incrementally
6. User testing and iteration
