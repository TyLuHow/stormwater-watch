# Backend Architecture Redesign for Integrated eSMR + SMARTS System

**Document Version:** 1.0
**Created:** December 6, 2025
**Status:** Design Specification
**Related Documents:**
- `/research/data-schema-integration-analysis.md` - Complete schema analysis
- `/prisma/schema-integrated-proposed.prisma` - Production schema (24 tables)

---

## Executive Summary

This document outlines the backend architecture changes required to transform Stormwater Watch from an eSMR-only system (10 tables, ~5M records) to an integrated eSMR + SMARTS platform (24 tables, 8.5M records, ~1.15 GB data). The redesign addresses API restructuring, service layer patterns, data flows, caching strategies, and performance optimization.

### Key Challenges

1. **Schema Migration**: 14 new SMARTS tables with complex M:N relationships
2. **Data Volume**: 8.5M records across 8 datasets (5.5M SMARTS industrial monitoring, 2.8M construction monitoring)
3. **Facility Linking**: Unify eSMR (integer IDs) and SMARTS (WDID strings) facility identification
4. **Dual Violations**: eSMR computed violations vs SMARTS regulatory violations
5. **Query Performance**: 87 indexes, multi-dataset aggregations, real-time vs cached decisions

### Transformation Impact

| Aspect | Current (eSMR Only) | Integrated (eSMR + SMARTS) |
|--------|-------------------|----------------------------|
| **Tables** | 10 | 24 (+14) |
| **Total Records** | ~5M | ~8.5M (+70%) |
| **Data Sources** | 1 (eSMR) | 8 (1 eSMR + 7 SMARTS) |
| **Facilities** | ~5K | ~93K (+1,760%) |
| **Entity Types** | Samples, Violations (computed) | Samples, Violations (both types), Enforcement, Inspections |
| **API Endpoints** | ~15 | ~30 (+15 new) |
| **Sync Jobs** | 1 weekly | 2 weekly (eSMR + SMARTS) |

---

## 1. Schema Migration Impact Assessment

### 1.1 Breaking Changes

#### Facility Model Extension

**Current Schema** (`/prisma/schema.prisma`):
```prisma
model Facility {
  id             String @id @default(cuid())
  name           String
  permitId       String @unique
  // ... other fields

  // Link to eSMR only
  esmrFacilityId Int?
  esmrFacility   ESMRFacility? @relation(...)
}
```

**New Schema** (`/prisma/schema-integrated-proposed.prisma`):
```prisma
model Facility {
  id             String @id @default(cuid())
  name           String
  permitId       String @unique
  // ... other fields

  // === EXTENDED: Links to eSMR or SMARTS or both ===
  esmrFacilityId Int?
  esmrFacility   ESMRFacility? @relation(...)
  smartsWdid     String?
  smartsAppId    String?
  smartsFacility SMARTSFacility? @relation(fields: [smartsWdid, smartsAppId], ...)
}
```

**Migration Strategy:**
```sql
-- Add new columns (non-breaking, nullable)
ALTER TABLE "Facility" ADD COLUMN "smartsWdid" VARCHAR(50);
ALTER TABLE "Facility" ADD COLUMN "smartsAppId" VARCHAR(50);
ALTER TABLE "Facility" ADD INDEX "Facility_smartsWdid_smartsAppId_idx" ("smartsWdid", "smartsAppId");

-- No data loss, existing facilities unaffected
-- SMARTS facilities added incrementally via linking service
```

#### New Entity Types

**14 New Tables** (non-breaking, additive only):
- `SMARTSFacility` - Industrial and construction facilities (93K records)
- `SMARTSViolation` - Regulatory violations (31K records)
- `SMARTSEnforcementAction` - Enforcement actions (29K records)
- `SMARTSInspection` - Inspection records (45K records)
- `SMARTSMonitoringReport` - Storm event reports (~100K estimated)
- `SMARTSMonitoringSample` - Parameter samples (8.3M records)
- `SMARTSInspectionViolationLink` - M:N relationship
- `SMARTSImportLog` - Import tracking
- `FacilityLink` - Manual facility matching
- `DataQualityIssue` - Track data issues
- `GeocodeCache` - Geocoding results cache

**Impact:** No breaking changes. Existing APIs continue to work.

### 1.2 Relationship Complexity

#### M:N Patterns Introduced

**Inspection ↔ Violation** (Many-to-Many):
```prisma
model SMARTSInspectionViolationLink {
  id String @id @default(cuid())

  inspectionWdid  String
  inspectionAppId String
  inspectionId    String
  inspection      SMARTSInspection @relation(...)

  violationWdid  String
  violationAppId String
  violationId    String
  violation      SMARTSViolation @relation(...)

  @@unique([inspectionWdid, inspectionAppId, inspectionId,
            violationWdid, violationAppId, violationId])
}
```

**Why M:N?**
- One inspection can identify multiple violations
- One violation can be referenced in multiple inspections (follow-ups)
- SMARTS data doesn't always provide explicit links (heuristic matching needed)

**Enforcement ↔ Violation** (One-to-Many, Optional FK):
```prisma
model SMARTSEnforcementAction {
  // Optional violation link (not always provided in source data)
  violationWdid  String?
  violationAppId String?
  violationId    String?
  violation      SMARTSViolation? @relation(...)

  // Alternative: COUNT_OF_VIOLATIONS field when explicit links unavailable
  countOfViolations Int?
}
```

**Why Optional?**
- SMARTS data inconsistently links enforcement to specific violations
- Some enforcement actions address multiple violations (count provided, not IDs)
- Heuristic linking used when explicit IDs missing

### 1.3 Data Type Changes and Migrations

| Field Type | eSMR Format | SMARTS Format | Resolution |
|------------|-------------|---------------|------------|
| **Facility ID** | Integer (facilityPlaceId) | String (WDID: "1 08I004046") | Store both, link via junction table |
| **Dates** | DateTime | String (may be empty) | Parse to DateTime?, null if invalid |
| **Booleans** | Boolean | "Y"/"N" string | Transform: Y→true, N→false, NA→null |
| **Nulls** | null | "NA", "NaN", "" | Standardize all to null on import |
| **Coordinates** | Decimal(9,6) | Number (variable precision) | Normalize to Decimal(9,6) |
| **Result Values** | Decimal(18,6) | Number or "NaN" string | Parse, null if invalid |

**Import Transformation Utilities:**
```typescript
// lib/services/smarts/transformers.ts
export function parseSMARTSBoolean(value: string): boolean | null {
  if (value === "Y") return true
  if (value === "N") return false
  return null
}

export function parseSMARTSDate(value: string): Date | null {
  if (!value || value === "NA" || value === "") return null
  const date = new Date(value)
  return isNaN(date.getTime()) ? null : date
}

export function parseSMARTSNumber(value: string): number | null {
  if (!value || value === "NaN" || value === "NA") return null
  const num = parseFloat(value)
  return isNaN(num) ? null : num
}

export function parseSMARTSCoordinate(value: string): number | null {
  const num = parseSMARTSNumber(value)
  if (num === null) return null
  // Validate reasonable lat/lon range
  if (Math.abs(num) > 180) return null
  return num
}
```

---

## 2. API Endpoint Redesign

### 2.1 New Endpoints Needed

#### Violations API (`/api/violations`)

**Current Implementation:**
- Returns eSMR computed violations only (ViolationEvent model)
- Based on benchmark exceedances from monitoring samples

**Challenge:**
- SMARTS has separate regulatory violations (SMARTSViolation)
- Need unified interface that returns both types

**Solution: Source-Aware Violations API**

```typescript
// GET /api/violations?source=all|esmr|smarts
interface ViolationsResponse {
  violations: Array<{
    id: string
    facilityId: string
    facilityName: string
    source: 'ESMR_COMPUTED' | 'SMARTS_REGULATORY'

    // Common fields
    violationType: string
    occurrenceDate: Date
    status: string
    severity?: string

    // ESMR-specific (when source=ESMR_COMPUTED)
    pollutantKey?: string
    maxRatio?: number
    sampleCount?: number

    // SMARTS-specific (when source=SMARTS_REGULATORY)
    violationId?: string
    seriousViolation?: boolean
    linkedEnforcement?: boolean
    description?: string
  }>
  total: number
  pagination: PaginationInfo
}
```

**Implementation:**
```typescript
// app/api/violations/route.ts (MODIFIED)
export async function GET(request: NextRequest) {
  const source = searchParams.get('source') || 'all'

  let violations: ViolationUnion[] = []

  if (source === 'all' || source === 'esmr') {
    const esmrViolations = await prisma.violationEvent.findMany({
      where: buildESMRWhereClause(filters),
      include: { facility: true, samples: true }
    })
    violations.push(...esmrViolations.map(formatESMRViolation))
  }

  if (source === 'all' || source === 'smarts') {
    const smartsViolations = await prisma.sMARTSViolation.findMany({
      where: buildSMARTSWhereClause(filters),
      include: { facility: true, enforcementActions: true }
    })
    violations.push(...smartsViolations.map(formatSMARTSViolation))
  }

  // Sort by date descending
  violations.sort((a, b) =>
    new Date(b.occurrenceDate).getTime() - new Date(a.occurrenceDate).getTime()
  )

  return NextResponse.json({
    violations: violations.slice(offset, offset + limit),
    total: violations.length,
    pagination: { limit, offset, hasMore: offset + limit < violations.length }
  })
}
```

#### SMARTS Violations API (`/api/smarts/violations`)

**Purpose:** SMARTS-specific violation queries with full field access

```typescript
// GET /api/smarts/violations
// Query params: wdid, appId, violationType, status, seriousOnly, dateFrom, dateTo

interface SMARTSViolationsResponse {
  violations: Array<{
    id: string
    wdid: string
    appId: string
    violationId: string

    violationType: string
    seriousViolation: boolean
    violationPriority: string
    occurrenceDate: Date
    discoveryDate: Date | null
    violationStatus: 'Violation' | 'Potential' | 'Dismissed'

    description: string
    linkedEnforcement: boolean

    facility: {
      name: string
      permitType: string
      county: string
    }
  }>
  total: number
  stats: {
    serious: number
    withEnforcement: number
    byType: Record<string, number>
  }
}
```

#### SMARTS Enforcement API (`/api/smarts/enforcement`)

```typescript
// GET /api/smarts/enforcement?wdid=&enforcementType=&status=&dateFrom=&dateTo=

interface SMARTSEnforcementResponse {
  actions: Array<{
    id: string
    wdid: string
    appId: string
    enforcementId: string

    enforcementType: 'NNC' | 'NOV' | 'CAO' | 'SEL' | ...
    enforcementStatus: 'Active' | 'Historical' | 'Withdrawn'
    issuanceDate: Date
    dueDate: Date | null

    description: string
    correctiveAction: string | null
    orderNumber: string | null

    // Financial (mostly null)
    totalAssessment: number | null
    receivedAmount: number | null
    balanceDue: number | null

    // Related violations
    violation: {
      violationId: string
      violationType: string
      occurrenceDate: Date
    } | null
    countOfViolations: number | null

    facility: {
      name: string
      county: string
    }
  }>
  total: number
  stats: {
    active: number
    byType: Record<string, number>
    totalAssessed: number
    totalReceived: number
  }
}
```

#### SMARTS Inspections API (`/api/smarts/inspections`)

```typescript
// GET /api/smarts/inspections?wdid=&purpose=&dateFrom=&dateTo=

interface SMARTSInspectionsResponse {
  inspections: Array<{
    id: string
    wdid: string
    appId: string
    inspectionId: string

    inspectionDate: Date
    inspectionPurpose: string
    inspectionStatus: string
    inspectorType: string
    inspectorName: string

    followUpAction: string | null
    generalNotes: string | null
    virtualInspection: boolean
    countOfViolations: number

    // Linked violations (M:N)
    violations: Array<{
      violationId: string
      violationType: string
      occurrenceDate: Date
    }>

    facility: {
      name: string
      permitType: string
    }
  }>
  total: number
}
```

#### Facilities Unified API (`/api/facilities/[id]/complete`)

**Purpose:** Single endpoint returning ALL facility data (eSMR + SMARTS)

```typescript
// GET /api/facilities/[id]/complete

interface FacilityCompleteResponse {
  facility: {
    id: string
    name: string
    permitId: string
    lat: number
    lon: number
    county: string
  }

  // eSMR data (if linked)
  esmr: {
    facilityPlaceId: number
    regionCode: string
    locations: Array<{
      locationPlaceId: number
      locationType: string
      lat: number | null
      lon: number | null
    }>
    recentSamples: {
      parameter: string
      latestDate: Date
      count: number
    }[]
  } | null

  // SMARTS data (if linked)
  smarts: {
    wdid: string
    appId: string
    permitType: 'Industrial' | 'Construction'
    status: 'Active' | 'Terminated'

    // Industrial-specific
    primarySic?: string
    operatorName?: string

    // Construction-specific
    siteDisturbedAcreage?: number
    constructionType?: string
  } | null

  // Aggregated violations (both types)
  violations: {
    esmrComputed: number
    smartsRegulatory: number
    recentViolations: Array<{
      source: 'ESMR_COMPUTED' | 'SMARTS_REGULATORY'
      date: Date
      type: string
      severity?: string
    }>
  }

  // Enforcement actions (SMARTS only)
  enforcement: {
    activeActions: number
    historicalActions: number
    recentActions: Array<{
      enforcementType: string
      issuanceDate: Date
      status: string
    }>
  }

  // Inspections (SMARTS only)
  inspections: {
    totalInspections: number
    lastInspectionDate: Date | null
    recentInspections: Array<{
      inspectionDate: Date
      purpose: string
      countOfViolations: number
    }>
  }

  // Monitoring data summary
  monitoring: {
    esmrSamples: number
    smartsSamples: number
    dateRange: {
      earliest: Date | null
      latest: Date | null
    }
  }
}
```

**Implementation:**
```typescript
// app/api/facilities/[id]/complete/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const facility = await prisma.facility.findUnique({
    where: { id: params.id },
    include: {
      esmrFacility: {
        include: {
          locations: {
            include: {
              _count: { select: { samples: true } }
            }
          }
        }
      },
      smartsFacility: true
    }
  })

  // Fetch violations (parallel queries)
  const [esmrViolations, smartsViolations, enforcement, inspections] =
    await Promise.all([
      prisma.violationEvent.findMany({
        where: { facilityId: params.id },
        orderBy: { lastDate: 'desc' }
      }),
      facility.smartsWdid ? prisma.sMARTSViolation.findMany({
        where: { wdid: facility.smartsWdid, appId: facility.smartsAppId },
        orderBy: { occurrenceDate: 'desc' }
      }) : [],
      facility.smartsWdid ? prisma.sMARTSEnforcementAction.findMany({
        where: { wdid: facility.smartsWdid, appId: facility.smartsAppId },
        orderBy: { issuanceDate: 'desc' }
      }) : [],
      facility.smartsWdid ? prisma.sMARTSInspection.findMany({
        where: { wdid: facility.smartsWdid, appId: facility.smartsAppId },
        orderBy: { inspectionDate: 'desc' }
      }) : []
    ])

  return NextResponse.json(buildCompleteResponse(
    facility, esmrViolations, smartsViolations, enforcement, inspections
  ))
}
```

### 2.2 Modified Endpoints

#### `/api/facilities` (Enhanced)

**Current:** Lists facilities with basic info (name, permitId, lat/lon)

**Enhanced:** Include SMARTS data source indicator

```typescript
interface FacilityListItem {
  id: string
  name: string
  permitId: string
  county: string
  lat: number
  lon: number

  // NEW: Data source indicators
  hasESMRData: boolean
  hasSMARTSData: boolean

  // NEW: Summary counts
  violationCount: number
  enforcementActionCount: number
  lastInspectionDate: Date | null
}
```

#### `/api/dashboard` (New)

**Purpose:** Multi-source aggregation for dashboard analytics

```typescript
// GET /api/dashboard?county=&region=&dateFrom=&dateTo=

interface DashboardResponse {
  summary: {
    totalFacilities: number
    esmrFacilities: number
    smartsFacilities: number
    linkedFacilities: number
  }

  violations: {
    esmrComputed: number
    smartsRegulatory: number
    seriousViolations: number
    withEnforcement: number
  }

  enforcement: {
    activeActions: number
    historicalActions: number
    byType: Record<string, number>
  }

  recentActivity: {
    newViolations: number
    newEnforcement: number
    newInspections: number
  }

  topOffenders: Array<{
    facilityId: string
    facilityName: string
    violationCount: number
    enforcementActionCount: number
  }>

  timeline: Array<{
    date: Date
    violations: number
    enforcement: number
    inspections: number
  }>
}
```

### 2.3 Query Pattern Examples

#### Cross-Dataset Query: Facilities with Violations AND Enforcement

```typescript
// "Find all facilities with both regulatory violations and enforcement actions"

const facilitiesWithEnforcement = await prisma.facility.findMany({
  where: {
    smartsFacility: {
      violations: { some: {} },
      enforcementActions: { some: {} }
    }
  },
  include: {
    smartsFacility: {
      include: {
        violations: {
          where: { violationStatus: 'Violation' },
          orderBy: { occurrenceDate: 'desc' },
          take: 5
        },
        enforcementActions: {
          where: { enforcementStatus: 'Active' },
          orderBy: { issuanceDate: 'desc' },
          take: 5
        }
      }
    }
  }
})
```

**Performance:** Uses indexes on `wdid`, `appId`, `violationStatus`, `enforcementStatus`

#### Aggregation Query: Violations by County

```typescript
// "Count violations by county (both eSMR and SMARTS)"

const violationsByCounty = await prisma.$queryRaw<Array<{
  county: string
  esmr_violations: number
  smarts_violations: number
  total: number
}>>`
  SELECT
    f.county,
    COUNT(DISTINCT ve.id) as esmr_violations,
    COUNT(DISTINCT sv.id) as smarts_violations,
    COUNT(DISTINCT ve.id) + COUNT(DISTINCT sv.id) as total
  FROM "Facility" f
  LEFT JOIN "ViolationEvent" ve ON ve."facilityId" = f.id AND ve.dismissed = false
  LEFT JOIN "smarts_facilities" sf ON sf.wdid = f."smartsWdid" AND sf."appId" = f."smartsAppId"
  LEFT JOIN "smarts_violations" sv ON sv.wdid = sf.wdid AND sv."appId" = sf."appId"
  WHERE f.county IS NOT NULL
  GROUP BY f.county
  ORDER BY total DESC
`
```

#### Real-time Query: Recent Activity

```typescript
// "Show all activity in last 7 days (violations, enforcement, inspections)"

const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

const [newViolations, newEnforcement, newInspections] = await Promise.all([
  prisma.sMARTSViolation.count({
    where: { createdAt: { gte: sevenDaysAgo } }
  }),
  prisma.sMARTSEnforcementAction.count({
    where: { createdAt: { gte: sevenDaysAgo } }
  }),
  prisma.sMARTSInspection.count({
    where: { createdAt: { gte: sevenDaysAgo } }
  })
])
```

---

## 3. Service Layer Design

### 3.1 Facility Matching Service

**Purpose:** Link eSMR facilities to SMARTS facilities using 3-tier matching strategy

```typescript
// lib/services/facility-matching/index.ts

export interface FacilityMatchResult {
  facilityId: string
  esmrFacilityId?: number
  smartsWdid?: string
  smartsAppId?: string
  linkMethod: 'DIRECT' | 'FUZZY' | 'MANUAL' | 'UNLINKED'
  confidence: number // 0.0-1.0
  notes?: string
}

export class FacilityMatchingService {
  /**
   * Tier 1: Direct WDID Parsing
   * Extract potential facility ID from WDID format
   * Example: "1 08I004046" → try 4046, 04046, 004046
   */
  async matchDirect(wdid: string): Promise<FacilityMatchResult | null> {
    const numericPart = this.extractFacilityIdFromWdid(wdid)
    if (!numericPart) return null

    const esmrFacility = await prisma.eSMRFacility.findUnique({
      where: { facilityPlaceId: numericPart }
    })

    if (!esmrFacility) return null

    return {
      facilityId: `facility_${Date.now()}`,
      esmrFacilityId: esmrFacility.facilityPlaceId,
      smartsWdid: wdid,
      linkMethod: 'DIRECT',
      confidence: 0.95,
      notes: 'Matched via WDID parsing'
    }
  }

  /**
   * Tier 2: Fuzzy Name + Location Matching
   * Match by: name similarity (>85%) + geographic proximity (<100m) + county
   */
  async matchFuzzy(
    smartsFacility: SMARTSFacility
  ): Promise<FacilityMatchResult | null> {
    // Query potential matches using PostgreSQL similarity
    const candidates = await prisma.$queryRaw<Array<{
      facilityPlaceId: number
      facilityName: string
      similarity: number
    }>>`
      SELECT
        ef."facilityPlaceId",
        ef."facilityName",
        similarity(ef."facilityName", ${smartsFacility.facilityName}) as similarity
      FROM "esmr_facilities" ef
      JOIN "esmr_locations" el ON el."facilityPlaceId" = ef."facilityPlaceId"
      WHERE similarity(ef."facilityName", ${smartsFacility.facilityName}) > 0.85
        AND ef."regionCode" = ${this.extractRegionFromWdid(smartsFacility.wdid)}
      ORDER BY similarity DESC
      LIMIT 10
    `

    // Filter by geographic proximity if coordinates available
    if (smartsFacility.facilityLatitude && smartsFacility.facilityLongitude) {
      const geoFiltered = await this.filterByProximity(
        candidates,
        smartsFacility.facilityLatitude,
        smartsFacility.facilityLongitude,
        100 // meters
      )

      if (geoFiltered.length > 0) {
        const best = geoFiltered[0]
        return {
          facilityId: `facility_${Date.now()}`,
          esmrFacilityId: best.facilityPlaceId,
          smartsWdid: smartsFacility.wdid,
          smartsAppId: smartsFacility.appId,
          linkMethod: 'FUZZY',
          confidence: best.similarity * 0.9, // Reduce confidence for fuzzy
          notes: `Matched via name similarity (${(best.similarity * 100).toFixed(1)}%) and proximity`
        }
      }
    }

    return null
  }

  /**
   * Tier 3: Manual Mapping
   * Store user-verified links
   */
  async createManualLink(
    esmrFacilityId: number,
    smartsWdid: string,
    smartsAppId: string,
    verifiedBy: string,
    notes?: string
  ): Promise<FacilityMatchResult> {
    // Create or update facility
    const facility = await prisma.facility.upsert({
      where: {
        // Try to find existing facility first
        esmrFacilityId
      },
      update: {
        smartsWdid,
        smartsAppId
      },
      create: {
        name: 'To be updated',
        permitId: `MANUAL_${Date.now()}`,
        lat: 0,
        lon: 0,
        esmrFacilityId,
        smartsWdid,
        smartsAppId
      }
    })

    // Store link metadata
    await prisma.facilityLink.create({
      data: {
        facilityId: facility.id,
        esmrFacilityId,
        smartsWdid,
        smartsAppId,
        linkMethod: 'MANUAL',
        confidence: 1.0,
        notes,
        verifiedBy,
        verifiedAt: new Date()
      }
    })

    return {
      facilityId: facility.id,
      esmrFacilityId,
      smartsWdid,
      smartsAppId,
      linkMethod: 'MANUAL',
      confidence: 1.0,
      notes
    }
  }

  /**
   * Batch processing for initial import
   */
  async matchBatch(smartsFacilities: SMARTSFacility[]): Promise<{
    directMatches: number
    fuzzyMatches: number
    unmatched: number
    errors: string[]
  }> {
    const results = {
      directMatches: 0,
      fuzzyMatches: 0,
      unmatched: 0,
      errors: []
    }

    for (const smartsFacility of smartsFacilities) {
      try {
        // Try Tier 1 first
        let match = await this.matchDirect(smartsFacility.wdid)
        if (match) {
          results.directMatches++
          await this.saveFacilityLink(match)
          continue
        }

        // Try Tier 2
        match = await this.matchFuzzy(smartsFacility)
        if (match) {
          results.fuzzyMatches++
          await this.saveFacilityLink(match)
          continue
        }

        // No match found
        results.unmatched++
        await this.createUnlinkedFacility(smartsFacility)
      } catch (error) {
        results.errors.push(
          `Error matching ${smartsFacility.wdid}: ${error.message}`
        )
      }
    }

    return results
  }

  // Helper methods
  private extractFacilityIdFromWdid(wdid: string): number | null {
    const match = wdid.match(/\d+[ICX](\d+)/)
    if (!match) return null
    return parseInt(match[1], 10)
  }

  private extractRegionFromWdid(wdid: string): string {
    const match = wdid.match(/^(\d+)\s/)
    return match ? `R${match[1]}` : 'R0'
  }

  private async filterByProximity(
    candidates: any[],
    lat: number,
    lon: number,
    maxDistanceMeters: number
  ): Promise<any[]> {
    // Use PostGIS or calculate distance manually
    // This is a simplified version
    return candidates.filter(candidate => {
      // Get location coordinates for candidate
      // Calculate distance
      // Return if within maxDistanceMeters
      return true // Placeholder
    })
  }
}
```

**Usage Example:**
```typescript
// scripts/link-facilities.ts
const matchingService = new FacilityMatchingService()

const smartsFacilities = await prisma.sMARTSFacility.findMany({
  where: { permitType: 'Industrial' },
  take: 1000
})

const results = await matchingService.matchBatch(smartsFacilities)
console.log('Direct matches:', results.directMatches)
console.log('Fuzzy matches:', results.fuzzyMatches)
console.log('Unmatched:', results.unmatched)
```

### 3.2 Violation Engine Service

**Purpose:** Unified interface for both eSMR computed violations and SMARTS regulatory violations

```typescript
// lib/services/violations/engine.ts

export type ViolationSource = 'ESMR_COMPUTED' | 'SMARTS_REGULATORY'

export interface UnifiedViolation {
  id: string
  source: ViolationSource
  facilityId: string
  facilityName: string
  occurrenceDate: Date
  discoveryDate?: Date
  violationType: string
  status: string
  severity?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'

  // ESMR-specific
  pollutantKey?: string
  exceedanceRatio?: number
  sampleCount?: number

  // SMARTS-specific
  violationId?: string
  seriousViolation?: boolean
  linkedEnforcement?: boolean
  description?: string
}

export class ViolationEngine {
  /**
   * Get all violations for a facility (both types)
   */
  async getFacilityViolations(
    facilityId: string,
    options?: {
      source?: ViolationSource
      dateFrom?: Date
      dateTo?: Date
      includeResolved?: boolean
    }
  ): Promise<UnifiedViolation[]> {
    const violations: UnifiedViolation[] = []

    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        esmrFacility: true,
        smartsFacility: true
      }
    })

    if (!facility) throw new Error('Facility not found')

    // Get eSMR violations
    if (!options?.source || options.source === 'ESMR_COMPUTED') {
      const esmrViolations = await prisma.violationEvent.findMany({
        where: {
          facilityId,
          ...(options?.dateFrom && { lastDate: { gte: options.dateFrom } }),
          ...(options?.dateTo && { firstDate: { lte: options.dateTo } }),
          ...(!options?.includeResolved && { dismissed: false })
        },
        include: { pollutant: true }
      })

      violations.push(...esmrViolations.map(this.formatESMRViolation))
    }

    // Get SMARTS violations
    if ((!options?.source || options.source === 'SMARTS_REGULATORY')
        && facility.smartsWdid) {
      const smartsViolations = await prisma.sMARTSViolation.findMany({
        where: {
          wdid: facility.smartsWdid,
          appId: facility.smartsAppId,
          ...(options?.dateFrom && { occurrenceDate: { gte: options.dateFrom } }),
          ...(options?.dateTo && { occurrenceDate: { lte: options.dateTo } }),
          ...(!options?.includeResolved && { violationStatus: 'Violation' })
        },
        include: { facility: true }
      })

      violations.push(...smartsViolations.map(this.formatSMARTSViolation))
    }

    // Sort by occurrence date descending
    return violations.sort((a, b) =>
      b.occurrenceDate.getTime() - a.occurrenceDate.getTime()
    )
  }

  /**
   * Detect potential duplicate violations
   * (Same facility, similar date, similar type)
   */
  async detectDuplicates(
    facilityId: string
  ): Promise<Array<{
    esmrViolation: UnifiedViolation
    smartsViolation: UnifiedViolation
    similarity: number
  }>> {
    const violations = await this.getFacilityViolations(facilityId)

    const esmrViolations = violations.filter(v => v.source === 'ESMR_COMPUTED')
    const smartsViolations = violations.filter(v => v.source === 'SMARTS_REGULATORY')

    const duplicates: any[] = []

    for (const esmr of esmrViolations) {
      for (const smarts of smartsViolations) {
        // Check if dates are within 7 days
        const daysDiff = Math.abs(
          esmr.occurrenceDate.getTime() - smarts.occurrenceDate.getTime()
        ) / (1000 * 60 * 60 * 24)

        if (daysDiff <= 7) {
          // Potential duplicate
          const similarity = this.calculateViolationSimilarity(esmr, smarts)
          if (similarity > 0.7) {
            duplicates.push({ esmrViolation: esmr, smartsViolation: smarts, similarity })
          }
        }
      }
    }

    return duplicates
  }

  /**
   * Compute eSMR violations from monitoring samples
   * (Existing logic from /lib/violations/detector.ts)
   */
  async recomputeESMRViolations(
    reportingYear: string,
    facilityId?: string
  ): Promise<{ created: number; updated: number }> {
    // Import existing logic from detector.ts
    // This method stays the same
    return { created: 0, updated: 0 }
  }

  /**
   * Import SMARTS violations from CSV
   */
  async importSMARTSViolations(
    csvRecords: any[]
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    const results = { created: 0, updated: 0, errors: [] }

    for (const record of csvRecords) {
      try {
        await prisma.sMARTSViolation.upsert({
          where: {
            smarts_violation_unique: {
              wdid: record.WDID,
              appId: record.APP_ID,
              violationId: record.VIOLATION_ID
            }
          },
          update: {
            violationStatus: record.VIOLATION_STATUS,
            linkedEnforcement: this.parseBool(record.LINKED_ENFORCEMENT_ACTION),
            updatedAt: new Date()
          },
          create: {
            wdid: record.WDID,
            appId: record.APP_ID,
            violationId: record.VIOLATION_ID,
            violationType: record.VIOLATION_TYPE,
            seriousViolation: this.parseBool(record.SERIOUS_VIOLATION),
            occurrenceDate: this.parseDate(record.OCCURRENCE_DATE),
            discoveryDate: this.parseDate(record.DISCOVERY_DATE),
            violationStatus: record.VIOLATION_STATUS,
            description: record.DESCRIPTION,
            linkedEnforcement: this.parseBool(record.LINKED_ENFORCEMENT_ACTION),
            // ... other fields
          }
        })
        results.created++
      } catch (error) {
        results.errors.push(`Error importing ${record.VIOLATION_ID}: ${error.message}`)
      }
    }

    return results
  }

  // Helper methods
  private formatESMRViolation(violation: any): UnifiedViolation {
    return {
      id: violation.id,
      source: 'ESMR_COMPUTED',
      facilityId: violation.facilityId,
      facilityName: violation.facility?.name || 'Unknown',
      occurrenceDate: violation.firstDate,
      violationType: `Benchmark Exceedance - ${violation.pollutant?.aliases?.[0] || violation.pollutantKey}`,
      status: violation.dismissed ? 'RESOLVED' : 'OPEN',
      severity: violation.maxSeverity,
      pollutantKey: violation.pollutantKey,
      exceedanceRatio: Number(violation.maxRatio),
      sampleCount: violation.count
    }
  }

  private formatSMARTSViolation(violation: any): UnifiedViolation {
    return {
      id: violation.id,
      source: 'SMARTS_REGULATORY',
      facilityId: violation.facility?.linkedFacilities?.[0]?.id || 'unlinked',
      facilityName: violation.facility?.facilityName || violation.placeName,
      occurrenceDate: violation.occurrenceDate,
      discoveryDate: violation.discoveryDate,
      violationType: violation.violationType,
      status: violation.violationStatus,
      severity: violation.seriousViolation ? 'HIGH' : 'MODERATE',
      violationId: violation.violationId,
      seriousViolation: violation.seriousViolation,
      linkedEnforcement: violation.linkedEnforcement,
      description: violation.description
    }
  }

  private calculateViolationSimilarity(v1: UnifiedViolation, v2: UnifiedViolation): number {
    // Simple similarity based on date proximity
    // Could be enhanced with text similarity on descriptions
    const daysDiff = Math.abs(
      v1.occurrenceDate.getTime() - v2.occurrenceDate.getTime()
    ) / (1000 * 60 * 60 * 24)

    return 1 - (daysDiff / 7) // 1.0 if same day, 0.0 if 7+ days apart
  }

  private parseBool(value: string): boolean | null {
    if (value === 'Y') return true
    if (value === 'N') return false
    return null
  }

  private parseDate(value: string): Date | null {
    if (!value || value === 'NA') return null
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
  }
}
```

### 3.3 Data Sync Orchestrator

**Purpose:** Coordinate weekly sync of eSMR and SMARTS datasets

```typescript
// lib/services/sync/orchestrator.ts

export interface SyncJob {
  id: string
  dataType: 'esmr' | 'smarts_violations' | 'smarts_enforcement' | 'smarts_inspections' | 'smarts_facilities' | 'smarts_monitoring'
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt?: Date
  completedAt?: Date
  recordsProcessed: number
  recordsCreated: number
  recordsUpdated: number
  errors: string[]
}

export class DataSyncOrchestrator {
  private jobs: Map<string, SyncJob> = new Map()

  /**
   * Run weekly sync for all datasets
   */
  async syncAll(): Promise<{
    jobs: SyncJob[]
    totalDuration: number
    overallStatus: 'success' | 'partial' | 'failed'
  }> {
    const startTime = Date.now()
    const jobIds: string[] = []

    // Sync eSMR (existing pattern)
    const esmrJob = await this.syncESMR()
    jobIds.push(esmrJob.id)

    // Sync SMARTS facilities first (dependencies)
    const facilitiesJob = await this.syncSMARTSFacilities()
    jobIds.push(facilitiesJob.id)

    // Sync SMARTS violations, enforcement, inspections (parallel)
    const [violationsJob, enforcementJob, inspectionsJob] = await Promise.all([
      this.syncSMARTSViolations(),
      this.syncSMARTSEnforcement(),
      this.syncSMARTSInspections()
    ])
    jobIds.push(violationsJob.id, enforcementJob.id, inspectionsJob.id)

    // Sync SMARTS monitoring (large dataset, run last)
    const monitoringJob = await this.syncSMARTSMonitoring()
    jobIds.push(monitoringJob.id)

    // Run facility matching on newly added facilities
    await this.runFacilityMatching()

    const jobs = jobIds.map(id => this.jobs.get(id)!)
    const failedJobs = jobs.filter(j => j.status === 'failed')

    return {
      jobs,
      totalDuration: Date.now() - startTime,
      overallStatus: failedJobs.length === 0 ? 'success'
        : failedJobs.length === jobs.length ? 'failed'
        : 'partial'
    }
  }

  /**
   * Sync eSMR data (existing implementation)
   */
  private async syncESMR(): Promise<SyncJob> {
    const job: SyncJob = {
      id: `esmr_${Date.now()}`,
      dataType: 'esmr',
      status: 'running',
      startedAt: new Date(),
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      errors: []
    }
    this.jobs.set(job.id, job)

    try {
      // Use existing logic from /app/api/cron/esmr-sync/route.ts
      // ... (existing implementation)

      job.status = 'completed'
      job.completedAt = new Date()
    } catch (error) {
      job.status = 'failed'
      job.errors.push(error.message)
    }

    return job
  }

  /**
   * Sync SMARTS facilities
   */
  private async syncSMARTSFacilities(): Promise<SyncJob> {
    const job: SyncJob = {
      id: `smarts_facilities_${Date.now()}`,
      dataType: 'smarts_facilities',
      status: 'running',
      startedAt: new Date(),
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      errors: []
    }
    this.jobs.set(job.id, job)

    try {
      // Download industrial + construction facilities CSVs
      const [industrialRecords, constructionRecords] = await Promise.all([
        this.downloadCSV('https://data.ca.gov/.../industrial_facilities.csv'),
        this.downloadCSV('https://data.ca.gov/.../construction_facilities.csv')
      ])

      // Import facilities
      for (const record of [...industrialRecords, ...constructionRecords]) {
        try {
          await prisma.sMARTSFacility.upsert({
            where: {
              smarts_facility_unique: {
                wdid: record.WDID,
                appId: record.APP_ID
              }
            },
            update: {
              status: record.STATUS,
              facilityName: record.FACILITY_NAME,
              facilityLatitude: this.parseCoordinate(record.FACILITY_LATITUDE),
              facilityLongitude: this.parseCoordinate(record.FACILITY_LONGITUDE),
              // ... other fields
              updatedAt: new Date(),
              lastSeenAt: new Date()
            },
            create: {
              wdid: record.WDID,
              appId: record.APP_ID,
              permitType: record.PERMIT_TYPE,
              status: record.STATUS,
              facilityName: record.FACILITY_NAME,
              // ... all fields
            }
          })

          job.recordsProcessed++
          job.recordsCreated++ // or recordsUpdated++
        } catch (error) {
          job.errors.push(`Error importing facility ${record.WDID}: ${error.message}`)
        }
      }

      job.status = 'completed'
      job.completedAt = new Date()
    } catch (error) {
      job.status = 'failed'
      job.errors.push(error.message)
    }

    return job
  }

  /**
   * Sync SMARTS violations
   */
  private async syncSMARTSViolations(): Promise<SyncJob> {
    // Similar pattern to syncSMARTSFacilities
    // Download CSV, parse, upsert records
    return { id: 'violations', dataType: 'smarts_violations', status: 'completed', recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0, errors: [] }
  }

  /**
   * Sync SMARTS enforcement actions
   */
  private async syncSMARTSEnforcement(): Promise<SyncJob> {
    // Similar pattern
    return { id: 'enforcement', dataType: 'smarts_enforcement', status: 'completed', recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0, errors: [] }
  }

  /**
   * Sync SMARTS inspections
   */
  private async syncSMARTSInspections(): Promise<SyncJob> {
    // Similar pattern
    return { id: 'inspections', dataType: 'smarts_inspections', status: 'completed', recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0, errors: [] }
  }

  /**
   * Sync SMARTS monitoring data (large dataset, streaming CSV parser)
   */
  private async syncSMARTSMonitoring(): Promise<SyncJob> {
    const job: SyncJob = {
      id: `smarts_monitoring_${Date.now()}`,
      dataType: 'smarts_monitoring',
      status: 'running',
      startedAt: new Date(),
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      errors: []
    }
    this.jobs.set(job.id, job)

    try {
      // Stream large CSV files (616 MB + 310 MB)
      const industrialUrl = 'https://data.ca.gov/.../industrial_monitoring.csv'
      const constructionUrl = 'https://data.ca.gov/.../construction_monitoring.csv'

      // Process industrial monitoring
      await this.streamCSV(industrialUrl, async (record) => {
        try {
          // Create or update monitoring report
          await prisma.sMARTSMonitoringReport.upsert({
            where: {
              smarts_monitoring_report_unique: {
                wdid: record.WDID,
                appId: record.APP_ID,
                reportId: record.REPORT_ID
              }
            },
            update: { updatedAt: new Date() },
            create: {
              wdid: record.WDID,
              appId: record.APP_ID,
              reportId: record.REPORT_ID,
              reportYear: parseInt(record.REPORTING_YEAR),
              eventType: record.EVENT_TYPE,
              // ... other fields
            }
          })

          // Create monitoring sample
          await prisma.sMARTSMonitoringSample.upsert({
            where: {
              smarts_monitoring_sample_unique: {
                reportWdid: record.WDID,
                reportAppId: record.APP_ID,
                reportId: record.REPORT_ID,
                sampleId: record.SAMPLE_ID,
                parameter: record.PARAMETER,
                sampleDate: new Date(record.SAMPLE_DATE)
              }
            },
            update: {},
            create: {
              reportWdid: record.WDID,
              reportAppId: record.APP_ID,
              reportId: record.REPORT_ID,
              sampleId: record.SAMPLE_ID,
              sampleDate: new Date(record.SAMPLE_DATE),
              parameter: record.PARAMETER,
              result: this.parseNumber(record.RESULT),
              resultQualifier: record.RESULT_QUALIFIER,
              units: record.UNITS,
              // ... other fields
            }
          })

          job.recordsProcessed++
        } catch (error) {
          job.errors.push(error.message)
        }
      })

      // Process construction monitoring (similar)

      job.status = 'completed'
      job.completedAt = new Date()

      // Log import to database
      await prisma.sMARTSImportLog.create({
        data: {
          dataType: 'monitoring',
          startedAt: job.startedAt!,
          completedAt: job.completedAt,
          status: 'completed',
          recordsProcessed: job.recordsProcessed,
          recordsCreated: job.recordsCreated,
          recordsUpdated: job.recordsUpdated,
          errors: job.errors.length > 0 ? job.errors : null
        }
      })
    } catch (error) {
      job.status = 'failed'
      job.errors.push(error.message)
    }

    return job
  }

  /**
   * Run facility matching on new facilities
   */
  private async runFacilityMatching(): Promise<void> {
    const matchingService = new FacilityMatchingService()

    // Find SMARTS facilities not yet linked
    const unlinkedFacilities = await prisma.sMARTSFacility.findMany({
      where: {
        linkedFacilities: { none: {} }
      },
      take: 1000 // Process in batches
    })

    if (unlinkedFacilities.length > 0) {
      await matchingService.matchBatch(unlinkedFacilities)
    }
  }

  // Helper methods
  private async downloadCSV(url: string): Promise<any[]> {
    // Download and parse CSV
    return []
  }

  private async streamCSV(
    url: string,
    processor: (record: any) => Promise<void>
  ): Promise<void> {
    // Stream CSV line by line, call processor for each record
    // Avoids loading entire 616 MB file into memory
  }

  private parseCoordinate(value: string): number | null {
    if (!value || value === 'NA') return null
    const num = parseFloat(value)
    return isNaN(num) || Math.abs(num) > 180 ? null : num
  }

  private parseNumber(value: string): number | null {
    if (!value || value === 'NaN' || value === 'NA') return null
    const num = parseFloat(value)
    return isNaN(num) ? null : num
  }
}
```

**Usage (Cron Job):**
```typescript
// app/api/cron/smarts-sync/route.ts
import { DataSyncOrchestrator } from '@/lib/services/sync/orchestrator'

export async function GET(request: NextRequest) {
  const orchestrator = new DataSyncOrchestrator()
  const result = await orchestrator.syncAll()

  return NextResponse.json({
    success: result.overallStatus === 'success',
    duration: `${(result.totalDuration / 1000).toFixed(2)}s`,
    jobs: result.jobs.map(j => ({
      dataType: j.dataType,
      status: j.status,
      recordsProcessed: j.recordsProcessed,
      errors: j.errors.length
    }))
  })
}
```

---

## 4. Data Flow Diagrams

### 4.1 Facility Data Aggregation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FACILITY DATA AGGREGATION                        │
└─────────────────────────────────────────────────────────────────────┘

User Request: GET /api/facilities/[id]/complete

   │
   ▼
┌──────────────────┐
│  API Handler     │
│  (Next.js)       │
└────────┬─────────┘
         │
         │ 1. Query Facility
         ▼
┌──────────────────────────────────────┐
│  Prisma Query                        │
│  - Facility (main record)            │
│  - esmrFacility (if linked)          │
│  - smartsFacility (if linked)        │
└────────┬─────────────────────────────┘
         │
         │ 2. Parallel Queries (Promise.all)
         ▼
┌────────────────────────────────────────────────────────────────────┐
│  Data Collection (Parallel)                                         │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ eSMR Locations  │  │ SMARTS Violations│  │ SMARTS Enforc.  │  │
│  │ + Samples       │  │                  │  │ Actions          │  │
│  └─────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                     │
│  ┌─────────────────┐  ┌──────────────────┐                        │
│  │ eSMR Violations │  │ SMARTS Inspect.  │                        │
│  │ (computed)      │  │                  │                        │
│  └─────────────────┘  └──────────────────┘                        │
│                                                                     │
└────────┬────────────────────────────────────────────────────────────┘
         │
         │ 3. Aggregate & Format
         ▼
┌──────────────────────────────────────┐
│  Response Builder                    │
│  - Merge eSMR + SMARTS data          │
│  - Calculate summaries               │
│  - Format for JSON response          │
└────────┬─────────────────────────────┘
         │
         │ 4. Return Complete Response
         ▼
┌──────────────────────────────────────┐
│  FacilityCompleteResponse            │
│  {                                   │
│    facility: {...},                  │
│    esmr: {...},                      │
│    smarts: {...},                    │
│    violations: {...},                │
│    enforcement: {...},               │
│    inspections: {...},               │
│    monitoring: {...}                 │
│  }                                   │
└──────────────────────────────────────┘

Performance:
- Total queries: 7 (1 main + 6 parallel)
- Estimated time: 100-300ms (indexed queries)
- Caching: Cache response for 5 minutes
```

### 4.2 Violation Detection and Tracking Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    VIOLATION DETECTION FLOW                          │
└─────────────────────────────────────────────────────────────────────┘

Two Parallel Paths:

PATH 1: eSMR COMPUTED VIOLATIONS (Proactive)
────────────────────────────────────────────

┌──────────────────┐
│  Monitoring      │  (Weekly eSMR Sync)
│  Samples         │
│  (ESMRSample)    │
└────────┬─────────┘
         │
         │ Cron: /api/cron/esmr-sync
         ▼
┌──────────────────────────────────────┐
│  Violation Detector                  │
│  (/lib/violations/detector.ts)       │
│  - Query samples with ratio >= 1.0   │
│  - Group by facility + pollutant     │
│  - Count repeat offenders (>= 2)     │
└────────┬─────────────────────────────┘
         │
         │ For each violation group
         ▼
┌──────────────────────────────────────┐
│  Create/Update ViolationEvent        │
│  - firstDate, lastDate               │
│  - count, maxRatio                   │
│  - maxSeverity (computed)            │
│  - reportingYear                     │
└────────┬─────────────────────────────┘
         │
         │ If new violation
         ▼
┌──────────────────────────────────────┐
│  Create ViolationSample records      │
│  - Links to ESMRSample               │
│  - Links to PollutantBenchmark       │
│  - Status: OPEN                      │
└────────┬─────────────────────────────┘
         │
         │ Trigger alerts
         ▼
┌──────────────────────────────────────┐
│  Subscription Matching               │
│  - Check user subscriptions          │
│  - Create Alert records              │
│  - Send email/Slack notifications    │
└──────────────────────────────────────┘


PATH 2: SMARTS REGULATORY VIOLATIONS (Reactive)
────────────────────────────────────────────────

┌──────────────────┐
│  SMARTS CSV      │  (Weekly SMARTS Sync)
│  violations.csv  │
└────────┬─────────┘
         │
         │ Cron: /api/cron/smarts-sync
         ▼
┌──────────────────────────────────────┐
│  SMARTS Import Service               │
│  - Download violations CSV           │
│  - Parse records                     │
│  - Transform data types              │
└────────┬─────────────────────────────┘
         │
         │ For each violation record
         ▼
┌──────────────────────────────────────┐
│  Upsert SMARTSViolation              │
│  Unique: [wdid, appId, violationId]  │
│  Update: violationStatus             │
│  Create: all fields                  │
└────────┬─────────────────────────────┘
         │
         │ If VIOLATION_SOURCE = "Inspection"
         ▼
┌──────────────────────────────────────┐
│  Link to Inspection                  │
│  - Find inspection by               │
│    VIOLATION_SOURCE_ID               │
│  - Create InspectionViolationLink    │
└────────┬─────────────────────────────┘
         │
         │ If LINKED_ENFORCEMENT = "Y"
         ▼
┌──────────────────────────────────────┐
│  Link to Enforcement Action          │
│  - Find enforcement by WDID/APP_ID   │
│    and date proximity                │
│  - Update enforcement.violationId    │
└──────────────────────────────────────┘


UNIFIED VIEW:
─────────────

User Request: GET /api/violations

         │
         ▼
┌──────────────────────────────────────┐
│  Violation Engine                    │
│  - Query ViolationEvent (eSMR)       │
│  - Query SMARTSViolation (SMARTS)    │
│  - Merge & deduplicate               │
│  - Sort by date                      │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  UnifiedViolation[]                  │
│  - source: ESMR_COMPUTED |           │
│             SMARTS_REGULATORY        │
│  - Common fields normalized          │
│  - Source-specific fields optional   │
└──────────────────────────────────────┘
```

### 4.3 Cross-System Query Pattern

```
┌─────────────────────────────────────────────────────────────────────┐
│          CROSS-SYSTEM QUERY: Facilities with Violations             │
│                       AND Enforcement Actions                        │
└─────────────────────────────────────────────────────────────────────┘

Query: "Find all facilities with regulatory violations that have
        enforcement actions, show last inspection date"

Step 1: Query Facilities with SMARTS data
─────────────────────────────────────────
SELECT f.id, f.name, f."smartsWdid", f."smartsAppId"
FROM "Facility" f
WHERE f."smartsWdid" IS NOT NULL

        │
        ▼ (Returns 10-20K facilities with SMARTS links)

Step 2: Filter by Violations + Enforcement
───────────────────────────────────────────
SELECT DISTINCT f.id, f.name,
       COUNT(DISTINCT sv.id) as violation_count,
       COUNT(DISTINCT se.id) as enforcement_count
FROM "Facility" f
JOIN "smarts_facilities" sf
  ON sf.wdid = f."smartsWdid" AND sf."appId" = f."smartsAppId"
JOIN "smarts_violations" sv
  ON sv.wdid = sf.wdid AND sv."appId" = sf."appId"
JOIN "smarts_enforcement_actions" se
  ON se.wdid = sf.wdid AND se."appId" = sf."appId"
WHERE sv."violationStatus" = 'Violation'
  AND se."enforcementStatus" = 'Active'
GROUP BY f.id, f.name
HAVING COUNT(DISTINCT sv.id) > 0
   AND COUNT(DISTINCT se.id) > 0

        │
        ▼ (Returns ~500 facilities)

Step 3: Enrich with Inspection Data
────────────────────────────────────
SELECT f.id,
       MAX(si."inspectionDate") as last_inspection
FROM "Facility" f
JOIN "smarts_facilities" sf
  ON sf.wdid = f."smartsWdid" AND sf."appId" = f."smartsAppId"
JOIN "smarts_inspections" si
  ON si.wdid = sf.wdid AND si."appId" = sf."appId"
WHERE f.id IN (/* facility IDs from Step 2 */)
GROUP BY f.id

        │
        ▼

Step 4: Combine Results
───────────────────────
Merge data from Steps 2 & 3

        │
        ▼

Final Result:
─────────────
[
  {
    facilityId: "abc123",
    facilityName: "Example Industrial Site",
    violationCount: 5,
    enforcementActionCount: 2,
    lastInspectionDate: "2024-11-15"
  },
  ...
]

Performance Optimization:
─────────────────────────
1. Use composite indexes:
   - [wdid, appId] on all SMARTS tables
   - [wdid, violationStatus] on violations
   - [wdid, enforcementStatus] on enforcement

2. Cache result for 1 hour (data changes weekly)

3. Materialize view for common queries:
   CREATE MATERIALIZED VIEW facility_compliance_summary AS
   SELECT f.id, f.name,
          COUNT(DISTINCT sv.id) as total_violations,
          COUNT(DISTINCT se.id) as total_enforcement,
          MAX(si."inspectionDate") as last_inspection
   FROM "Facility" f
   LEFT JOIN ...
   REFRESH MATERIALIZED VIEW facility_compliance_summary;
```

---

## 5. Caching Strategy

### 5.1 What to Cache

**Problem:** 8.5M records cannot all be in memory. Need intelligent caching strategy.

#### Redis Cache Tiers

**Tier 1: Hot Data (Redis, 5-minute TTL)**
- Recent violations (last 30 days): ~10K records
- Active enforcement actions: ~5K records
- Facility summaries (frequently accessed): ~1K facilities
- Dashboard aggregates: Pre-computed stats

**Tier 2: Warm Data (Redis, 1-hour TTL)**
- Facility complete responses: ~10K facilities
- Violation lists by county: ~50 counties × ~1K violations
- Monitoring sample aggregates: Parameter summaries

**Tier 3: Cold Data (Database, no cache)**
- Historical monitoring samples (>1 year old): 5M+ records
- Archived violations (resolved/dismissed)
- Terminated facilities

### 5.2 Cache Implementation

```typescript
// lib/cache/strategy.ts

import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

export enum CacheTier {
  HOT = 'hot',      // 5 minutes
  WARM = 'warm',    // 1 hour
  COLD = 'cold'     // No cache
}

export class CacheManager {
  private getTTL(tier: CacheTier): number {
    switch (tier) {
      case CacheTier.HOT: return 5 * 60         // 5 minutes
      case CacheTier.WARM: return 60 * 60       // 1 hour
      case CacheTier.COLD: return 0             // No cache
    }
  }

  /**
   * Get or compute cached value
   */
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    tier: CacheTier = CacheTier.WARM
  ): Promise<T> {
    if (tier === CacheTier.COLD) {
      return compute()
    }

    // Try to get from cache
    const cached = await redis.get(key)
    if (cached) {
      return JSON.parse(cached)
    }

    // Compute value
    const value = await compute()

    // Store in cache
    const ttl = this.getTTL(tier)
    await redis.set(key, JSON.stringify(value), 'EX', ttl)

    return value
  }

  /**
   * Invalidate cache key
   */
  async invalidate(pattern: string): Promise<number> {
    const keys = await redis.keys(pattern)
    if (keys.length === 0) return 0
    return redis.del(...keys)
  }

  /**
   * Preload hot data into cache
   */
  async preloadHotData(): Promise<void> {
    // Recent violations
    const recentViolations = await prisma.sMARTSViolation.findMany({
      where: {
        occurrenceDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    })
    await redis.set(
      'hot:recent_violations',
      JSON.stringify(recentViolations),
      'EX',
      5 * 60
    )

    // Dashboard stats
    const stats = await this.computeDashboardStats()
    await redis.set(
      'hot:dashboard_stats',
      JSON.stringify(stats),
      'EX',
      5 * 60
    )
  }

  private async computeDashboardStats(): Promise<any> {
    // Compute expensive aggregations
    return {}
  }
}

// Usage in API routes
const cache = new CacheManager()

export async function getRecentViolations() {
  return cache.getOrCompute(
    'violations:recent',
    async () => {
      return prisma.sMARTSViolation.findMany({
        where: { occurrenceDate: { gte: new Date('2024-01-01') } }
      })
    },
    CacheTier.HOT
  )
}
```

### 5.3 Cache Invalidation Strategy

**Event-Driven Invalidation:**

```typescript
// lib/cache/invalidation.ts

export class CacheInvalidator {
  private cache: CacheManager

  /**
   * Invalidate facility-related caches when facility updated
   */
  async onFacilityUpdate(facilityId: string): Promise<void> {
    await this.cache.invalidate(`facility:${facilityId}:*`)
    await this.cache.invalidate(`violations:facility:${facilityId}`)
  }

  /**
   * Invalidate violation caches when new violations imported
   */
  async onViolationsImport(wdids: string[]): Promise<void> {
    for (const wdid of wdids) {
      await this.cache.invalidate(`violations:wdid:${wdid}`)
    }
    await this.cache.invalidate('violations:recent')
    await this.cache.invalidate('dashboard:*')
  }

  /**
   * Invalidate all caches (use sparingly)
   */
  async invalidateAll(): Promise<void> {
    await this.cache.invalidate('*')
  }
}
```

**Weekly Sync Invalidation:**

```typescript
// After successful SMARTS sync
const invalidator = new CacheInvalidator()
await invalidator.onViolationsImport(importedWdids)
await cache.preloadHotData() // Repopulate hot cache
```

### 5.4 CDN Caching for Static Data

**Vercel Edge Caching:**

```typescript
// app/api/facilities/route.ts
export async function GET(request: NextRequest) {
  const response = NextResponse.json(await getFacilities())

  // Cache at CDN edge for 5 minutes
  response.headers.set(
    'Cache-Control',
    's-maxage=300, stale-while-revalidate=600'
  )

  return response
}
```

**Cache-Control Headers:**

| Endpoint | Cache Strategy | TTL | Reason |
|----------|---------------|-----|--------|
| `/api/facilities` | Edge + Redis | 5 min | Rarely changes |
| `/api/violations` | Redis only | 5 min | Updates weekly |
| `/api/facilities/[id]/complete` | Redis only | 1 hour | Expensive query |
| `/api/dashboard` | Redis only | 5 min | Aggregations |
| `/api/smarts/violations` | Redis only | 5 min | Updates weekly |

---

## 6. Performance Optimization

### 6.1 Critical Index Recommendations

**87 total indexes in proposed schema. Focus on these high-impact indexes:**

#### Tier 1: Query Performance Indexes (Highest Priority)

```sql
-- SMARTS Violations (most queried)
CREATE INDEX "smarts_violations_wdid_appId_idx"
  ON "smarts_violations" ("wdid", "appId");

CREATE INDEX "smarts_violations_occurrenceDate_idx"
  ON "smarts_violations" ("occurrenceDate" DESC);

CREATE INDEX "smarts_violations_violationType_idx"
  ON "smarts_violations" ("violationType");

CREATE INDEX "smarts_violations_seriousViolation_idx"
  ON "smarts_violations" ("seriousViolation")
  WHERE "seriousViolation" = true;

-- Composite index for common query pattern
CREATE INDEX "smarts_violations_wdid_date_type_idx"
  ON "smarts_violations" ("wdid", "appId", "occurrenceDate", "violationType");

-- SMARTS Enforcement Actions
CREATE INDEX "smarts_enforcement_wdid_appId_idx"
  ON "smarts_enforcement_actions" ("wdid", "appId");

CREATE INDEX "smarts_enforcement_issuanceDate_idx"
  ON "smarts_enforcement_actions" ("issuanceDate" DESC);

CREATE INDEX "smarts_enforcement_status_idx"
  ON "smarts_enforcement_actions" ("enforcementStatus");

-- SMARTS Monitoring Samples (largest table)
CREATE INDEX "smarts_monitoring_reportId_idx"
  ON "smarts_monitoring_samples" ("reportWdid", "reportAppId", "reportId");

CREATE INDEX "smarts_monitoring_sampleDate_idx"
  ON "smarts_monitoring_samples" ("sampleDate" DESC);

CREATE INDEX "smarts_monitoring_parameter_idx"
  ON "smarts_monitoring_samples" ("parameter");

-- Critical composite for monitoring queries
CREATE INDEX "smarts_monitoring_wdid_date_param_idx"
  ON "smarts_monitoring_samples" (
    "reportWdid", "sampleDate", "parameter"
  );
```

#### Tier 2: Join Performance Indexes

```sql
-- Facility linking
CREATE INDEX "Facility_smartsWdid_smartsAppId_idx"
  ON "Facility" ("smartsWdid", "smartsAppId");

-- Inspection-Violation links
CREATE INDEX "inspection_violation_links_inspection_idx"
  ON "smarts_inspection_violation_links" (
    "inspectionWdid", "inspectionAppId", "inspectionId"
  );

CREATE INDEX "inspection_violation_links_violation_idx"
  ON "smarts_inspection_violation_links" (
    "violationWdid", "violationAppId", "violationId"
  );
```

#### Tier 3: Aggregation Indexes

```sql
-- County-based filtering (common in dashboards)
CREATE INDEX "smarts_facilities_county_idx"
  ON "smarts_facilities" ("county", "permitType");

-- Regional filtering
CREATE INDEX "smarts_violations_regionalBoard_idx"
  ON "smarts_violations" ("regionalBoard", "violationStatus");
```

### 6.2 Query Optimization Patterns

#### Pattern 1: Avoid N+1 Queries

**Bad:**
```typescript
// N+1 query problem
const facilities = await prisma.facility.findMany()
for (const facility of facilities) {
  const violations = await prisma.sMARTSViolation.findMany({
    where: { wdid: facility.smartsWdid }
  })
  // Process violations
}
```

**Good:**
```typescript
// Single query with include
const facilities = await prisma.facility.findMany({
  include: {
    smartsFacility: {
      include: {
        violations: {
          where: { violationStatus: 'Violation' }
        }
      }
    }
  }
})
```

#### Pattern 2: Batch Queries

**Bad:**
```typescript
// Multiple sequential queries
const v1 = await prisma.sMARTSViolation.findMany({ where: { wdid: 'A' } })
const v2 = await prisma.sMARTSViolation.findMany({ where: { wdid: 'B' } })
const v3 = await prisma.sMARTSViolation.findMany({ where: { wdid: 'C' } })
```

**Good:**
```typescript
// Single query with IN clause
const violations = await prisma.sMARTSViolation.findMany({
  where: { wdid: { in: ['A', 'B', 'C'] } }
})
// Group by wdid in application code
const grouped = groupBy(violations, 'wdid')
```

#### Pattern 3: Use Raw SQL for Complex Aggregations

**When to use:**
- Multi-table JOINs with aggregations
- Window functions
- Complex WHERE clauses with subqueries

**Example:**
```typescript
const topOffenders = await prisma.$queryRaw<Array<{
  facility_name: string
  violation_count: number
  enforcement_count: number
}>>`
  SELECT
    sf."facilityName" as facility_name,
    COUNT(DISTINCT sv.id) as violation_count,
    COUNT(DISTINCT se.id) as enforcement_count,
    MAX(sv."occurrenceDate") as latest_violation
  FROM "smarts_facilities" sf
  LEFT JOIN "smarts_violations" sv
    ON sv.wdid = sf.wdid AND sv."appId" = sf."appId"
  LEFT JOIN "smarts_enforcement_actions" se
    ON se.wdid = sf.wdid AND se."appId" = sf."appId"
  WHERE sf.county = ${county}
    AND sv."occurrenceDate" >= ${dateFrom}
  GROUP BY sf."facilityName"
  HAVING COUNT(DISTINCT sv.id) >= 3
  ORDER BY violation_count DESC
  LIMIT 20
`
```

### 6.3 Pagination Best Practices

**Cursor-Based Pagination for Large Tables:**

```typescript
// Bad: Offset pagination (slow for large offsets)
const violations = await prisma.sMARTSViolation.findMany({
  take: 100,
  skip: 10000 // SLOW: Scans 10K rows
})

// Good: Cursor-based pagination
const violations = await prisma.sMARTSViolation.findMany({
  take: 100,
  cursor: lastSeenId ? { id: lastSeenId } : undefined,
  skip: lastSeenId ? 1 : 0, // Skip cursor itself
  orderBy: { occurrenceDate: 'desc' }
})
```

### 6.4 Database Connection Pooling

**Vercel Serverless:** Limited connection pool

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Use Prisma Accelerate for connection pooling
// DATABASE_URL=prisma://accelerate.prisma-data.net/?api_key=...
```

**Connection Limits:**
- Vercel Free: 60 connections
- Vercel Pro: 100 connections
- Recommendation: Use Supabase Supavisor or PgBouncer

### 6.5 Load Testing Scenarios

**Scenario 1: Dashboard Load (10 concurrent users)**
```bash
# Test /api/dashboard endpoint
artillery quick \
  --count 10 \
  --num 100 \
  https://stormwater-watch.vercel.app/api/dashboard

# Target: < 500ms p95, < 1s p99
```

**Scenario 2: Facility Complete Query (Single User, Heavy Query)**
```bash
# Test /api/facilities/[id]/complete
artillery quick \
  --count 1 \
  --num 50 \
  https://stormwater-watch.vercel.app/api/facilities/abc123/complete

# Target: < 300ms p95, < 500ms p99 (with caching)
```

**Scenario 3: Violation List (100 concurrent users, typical usage)**
```bash
artillery quick \
  --count 100 \
  --num 1000 \
  https://stormwater-watch.vercel.app/api/violations?limit=50

# Target: < 200ms p95, < 400ms p99 (with caching)
```

---

## 7. Code Structure Recommendations

### 7.1 File Organization

```
stormwater-watch/
├── app/
│   └── api/
│       ├── facilities/
│       │   ├── route.ts                    # List facilities
│       │   └── [id]/
│       │       ├── route.ts                # Single facility
│       │       └── complete/
│       │           └── route.ts            # NEW: Complete facility data
│       ├── violations/
│       │   ├── route.ts                    # MODIFIED: Unified violations
│       │   ├── stats/
│       │   │   └── route.ts
│       │   └── dismiss/
│       │       └── route.ts
│       ├── smarts/                         # NEW: SMARTS-specific endpoints
│       │   ├── violations/
│       │   │   └── route.ts
│       │   ├── enforcement/
│       │   │   └── route.ts
│       │   ├── inspections/
│       │   │   └── route.ts
│       │   └── facilities/
│       │       └── route.ts
│       ├── dashboard/                      # NEW: Multi-source dashboard
│       │   └── route.ts
│       └── cron/
│           ├── esmr-sync/
│           │   └── route.ts
│           └── smarts-sync/                # NEW: SMARTS weekly sync
│               └── route.ts
├── lib/
│   ├── services/
│   │   ├── facility-matching/              # NEW: Facility linking service
│   │   │   ├── index.ts
│   │   │   ├── direct-matcher.ts
│   │   │   ├── fuzzy-matcher.ts
│   │   │   └── manual-matcher.ts
│   │   ├── violations/                     # ENHANCED: Violation engine
│   │   │   ├── engine.ts
│   │   │   ├── detector.ts                 # Existing eSMR logic
│   │   │   ├── smarts-importer.ts          # NEW: SMARTS import
│   │   │   └── deduplicator.ts             # NEW: Duplicate detection
│   │   ├── sync/                           # NEW: Data sync orchestrator
│   │   │   ├── orchestrator.ts
│   │   │   ├── esmr-sync.ts
│   │   │   └── smarts-sync.ts
│   │   └── smarts/                         # NEW: SMARTS utilities
│   │       ├── transformers.ts             # Data type transformations
│   │       ├── validators.ts               # Data validation
│   │       └── parsers.ts                  # CSV parsing
│   ├── cache/                              # NEW: Caching layer
│   │   ├── strategy.ts
│   │   └── invalidation.ts
│   ├── api/
│   │   ├── esmr.ts                         # Existing eSMR types
│   │   └── smarts.ts                       # NEW: SMARTS API types
│   └── types/
│       ├── esmr.ts
│       ├── smarts.ts                       # NEW: SMARTS types
│       └── unified.ts                      # NEW: Unified violation types
├── prisma/
│   ├── schema.prisma                       # Current schema (10 tables)
│   ├── schema-integrated-proposed.prisma   # NEW schema (24 tables)
│   └── migrations/
│       └── 20251206_add_smarts_tables/     # Migration for new tables
│           └── migration.sql
└── scripts/
    ├── import-smarts-historical.ts         # NEW: One-time historical import
    ├── link-facilities.ts                  # NEW: Batch facility matching
    └── geocode-facilities.ts               # NEW: Geocode missing coords
```

### 7.2 Service Layer Patterns

**Pattern: Repository Pattern**

```typescript
// lib/repositories/violations-repository.ts

export class ViolationsRepository {
  // eSMR violations
  async getESMRViolations(filters: ViolationFilters): Promise<ViolationEvent[]> {
    return prisma.violationEvent.findMany({
      where: this.buildESMRWhereClause(filters),
      include: { facility: true, samples: true }
    })
  }

  // SMARTS violations
  async getSMARTSViolations(filters: ViolationFilters): Promise<SMARTSViolation[]> {
    return prisma.sMARTSViolation.findMany({
      where: this.buildSMARTSWhereClause(filters),
      include: { facility: true, enforcementActions: true }
    })
  }

  // Unified violations
  async getUnifiedViolations(filters: ViolationFilters): Promise<UnifiedViolation[]> {
    const [esmr, smarts] = await Promise.all([
      this.getESMRViolations(filters),
      this.getSMARTSViolations(filters)
    ])

    return [
      ...esmr.map(formatESMRViolation),
      ...smarts.map(formatSMARTSViolation)
    ].sort((a, b) => b.occurrenceDate.getTime() - a.occurrenceDate.getTime())
  }

  private buildESMRWhereClause(filters: ViolationFilters): any {
    // Build Prisma where clause for eSMR
  }

  private buildSMARTSWhereClause(filters: ViolationFilters): any {
    // Build Prisma where clause for SMARTS
  }
}
```

**Pattern: Service Layer Composition**

```typescript
// lib/services/facility-service.ts

export class FacilityService {
  constructor(
    private violationsRepo: ViolationsRepository,
    private enforcementRepo: EnforcementRepository,
    private inspectionsRepo: InspectionsRepository,
    private cache: CacheManager
  ) {}

  async getFacilityComplete(facilityId: string): Promise<FacilityCompleteResponse> {
    return this.cache.getOrCompute(
      `facility:${facilityId}:complete`,
      async () => {
        const [facility, violations, enforcement, inspections] = await Promise.all([
          this.getFacility(facilityId),
          this.violationsRepo.getUnifiedViolations({ facilityId }),
          this.enforcementRepo.getEnforcementActions({ facilityId }),
          this.inspectionsRepo.getInspections({ facilityId })
        ])

        return this.buildCompleteResponse(facility, violations, enforcement, inspections)
      },
      CacheTier.WARM
    )
  }
}
```

### 7.3 Type Definitions Strategy

**Shared Types:**

```typescript
// lib/types/unified.ts

export type DataSource = 'ESMR' | 'SMARTS'
export type ViolationSource = 'ESMR_COMPUTED' | 'SMARTS_REGULATORY'

export interface UnifiedViolation {
  id: string
  source: ViolationSource
  facilityId: string
  facilityName: string
  occurrenceDate: Date
  // ... (as defined in section 3.2)
}

export interface FacilityCompleteResponse {
  facility: FacilityCore
  esmr: ESMRData | null
  smarts: SMARTSData | null
  violations: ViolationsSummary
  enforcement: EnforcementSummary
  inspections: InspectionsSummary
  monitoring: MonitoringSummary
}
```

---

## Implementation Roadmap

### Phase 1: Schema Migration (Week 1)

- [ ] Review and finalize schema-integrated-proposed.prisma
- [ ] Create migration SQL
- [ ] Test migration on staging database
- [ ] Deploy schema to production (non-breaking, additive only)
- [ ] Verify existing APIs still work

### Phase 2: Data Import (Week 2)

- [ ] Implement SMARTS transformers and validators
- [ ] Create import scripts for violations, enforcement, inspections, facilities
- [ ] Run historical data import (locally, not on Vercel)
- [ ] Verify data integrity (row counts, foreign keys, nulls)
- [ ] Create SMARTSImportLog records

### Phase 3: Facility Linking (Week 3)

- [ ] Implement FacilityMatchingService (Tier 1, 2)
- [ ] Run batch facility matching
- [ ] Manual verification of top 100 facilities
- [ ] Create FacilityLink records

### Phase 4: API Implementation (Week 4-5)

- [ ] Implement /api/smarts/violations
- [ ] Implement /api/smarts/enforcement
- [ ] Implement /api/smarts/inspections
- [ ] Modify /api/violations for unified violations
- [ ] Implement /api/facilities/[id]/complete
- [ ] Implement /api/dashboard

### Phase 5: Services and Caching (Week 6)

- [ ] Implement ViolationEngine
- [ ] Implement CacheManager with Redis
- [ ] Add cache invalidation hooks
- [ ] Preload hot data

### Phase 6: Sync Jobs (Week 7)

- [ ] Implement DataSyncOrchestrator
- [ ] Create /api/cron/smarts-sync
- [ ] Test weekly sync (dry run)
- [ ] Deploy and schedule cron job

### Phase 7: Testing and Optimization (Week 8)

- [ ] Run load tests (Artillery)
- [ ] Optimize slow queries (EXPLAIN ANALYZE)
- [ ] Add missing indexes
- [ ] Fine-tune cache TTLs
- [ ] Monitor database connection pool

### Phase 8: Frontend Integration (Week 9-10)

- [ ] Update dashboard to show SMARTS data
- [ ] Add violation source indicators
- [ ] Enhance facility profile pages
- [ ] Add enforcement action timeline
- [ ] Add inspection history

---

## Appendices

### A. Index Size Estimates

| Index | Table | Estimated Size | Priority |
|-------|-------|----------------|----------|
| smarts_violations_wdid_appId_idx | smarts_violations | 15 MB | High |
| smarts_monitoring_wdid_date_param_idx | smarts_monitoring_samples | 500 MB | High |
| smarts_enforcement_wdid_appId_idx | smarts_enforcement_actions | 12 MB | High |
| smarts_violations_occurrenceDate_idx | smarts_violations | 10 MB | High |

**Total Index Size:** ~600 MB (< 10% of data size, acceptable)

### B. Query Performance Targets

| Query Type | Target (p95) | Target (p99) | Notes |
|------------|-------------|-------------|-------|
| Simple facility lookup | 50ms | 100ms | Single record, indexed |
| Facility complete query | 300ms | 500ms | Multi-table joins, cached |
| Violation list (paginated) | 200ms | 400ms | Indexed, cached |
| Dashboard aggregations | 500ms | 1s | Complex queries, cached |
| Cross-system query | 500ms | 1s | Multi-source, may use raw SQL |

### C. Data Volume Projections (5 Years)

| Year | Total Records | Database Size | Estimated Indexes | Total Storage |
|------|--------------|---------------|-------------------|---------------|
| 2025 (Initial) | 8.5M | 6.5 GB | 600 MB | 7.1 GB |
| 2026 | 9.8M | 7.2 GB | 650 MB | 7.85 GB |
| 2027 | 11.1M | 7.9 GB | 700 MB | 8.6 GB |
| 2028 | 12.4M | 8.6 GB | 750 MB | 9.35 GB |
| 2029 | 13.7M | 9.3 GB | 800 MB | 10.1 GB |
| 2030 | 15M | 10 GB | 850 MB | 10.85 GB |

**Recommendation:** Consider archival strategy at Year 3 (move data >3 years old to cold storage)

---

**Document End**

For questions or clarifications, refer to:
- `/research/data-schema-integration-analysis.md` - Detailed schema design rationale
- `/prisma/schema-integrated-proposed.prisma` - Complete schema definition
- `/app/api/cron/esmr-sync/route.ts` - Existing sync job pattern
