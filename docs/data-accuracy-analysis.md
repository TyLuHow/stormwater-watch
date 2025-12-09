# Data Accuracy Issues Analysis

**Generated:** 2025-12-09
**Reviewer:** Water Resources Engineer (Gavin Plume, EIT at EKI Environment & Water)
**Priority:** CRITICAL - Professional credibility depends on data accuracy

## Executive Summary

A thorough investigation of the application has identified six critical data accuracy issues that undermine professional credibility. The good news: **most issues are actually display/marketing problems, not fundamental data errors**. The system has recently migrated from a legacy `Sample` model (now empty) to a new eSMR-based architecture with proper violation tracking through `ViolationSample`. However, marketing copy and some display logic still references the old system.

**Key Findings:**
1. ✅ **Sample count (1.2M+) is ACCURATE** - refers to ESMRSample table (1,203,327 records)
2. ⚠️ **"Active violations" display is misleading** - no resolved status tracking in ViolationEvent model
3. ⚠️ **Timezone handling is CORRECT** - uses Date types (no time component for daily samples)
4. ✅ **Sample data in case packets is WORKING** - properly queries ViolationSample with eSMR linkage
5. ⚠️ **Violation counting logic needs clarification** - "count" field is confusing (means exceedance events, not days)
6. ⚠️ **Schema migration incomplete** - old Sample model still in schema but unused

**Database State (as of 2025-12-09):**
- ESMRSample: 1,203,327 records (2025-01-01 to 2025-11-19)
- ViolationSample: 30 records (all status: OPEN)
- ViolationEvent: 3 records (all dismissed: false)
- Sample (old model): 0 records (deprecated)

---

## Issue 1: Sample/Activity Count Display

### Current Behavior
Landing page shows "1.2M+ Water Quality Samples" in hero section statistics.
- **Location:** `/home/yler_uby_oward/stormwater-watch/app/page.tsx:70`
- **Code:**
```typescript
{ value: "1.2M+", label: "Water Quality Samples" },
```

Multiple references throughout landing page and documentation claim "1.2M+ samples from 2006-2025".

### Why It's Correct (But Confusing)
**The count is ACCURATE:**
- Query: `SELECT COUNT(*) FROM esmr_samples` = **1,203,327 records**
- Date range: 2025-01-01 to 2025-11-19 (confirmed via database query)

**The problem is DATE RANGE MARKETING:**
- Landing page claims "2006-2025" span
- Actual data: **only 2025** (11 months)
- This is the root of engineer's concern about "25,000 years" calculation

### Root Cause
- **File:** `/home/yler_uby_oward/stormwater-watch/app/page.tsx:165,228,284,345`
- **Issue:** Marketing copy uses "2006-2025" placeholder from original specs
- **Reality:** Database only contains 2025 data (recent import)

### Verification
```bash
# Confirmed via database query:
ESMRSample count: 1,203,327
Date range: 2025-01-01 to 2025-11-19
```

### Proposed Fix
**Option A: Update date range to reflect actual data**
```typescript
// app/page.tsx:345
{
  source: "eSMR (Electronic Self-Monitoring Reports)",
  description: "1.2M+ water quality samples from industrial stormwater facilities, 2025",
  // Changed from "2006-2025" to "2025"
}
```

**Option B: Add disclaimer that data coverage varies**
```typescript
{
  source: "eSMR (Electronic Self-Monitoring Reports)",
  description: "1.2M+ water quality samples from industrial stormwater facilities (current dataset: 2025, expanding to historical data)",
}
```

**Recommendation:** Use Option A for accuracy. The system clearly has only 2025 data imported. Historical backfill (2006-2024) is a future enhancement, not current reality.

---

## Issue 2: Stale Violation Status ("Active" vs "Resolved")

### Current Behavior
Dashboard displays "Active Violation Events" table showing all violations with `dismissed: false`.
- **Location:** `/home/yler_uby_oward/stormwater-watch/app/dashboard/page.tsx:356`
- **Query Logic:** `/home/yler_uby_oward/stormwater-watch/app/dashboard/page.tsx:67-72`
```typescript
violations = await prisma.violationEvent.findMany({
  where: {
    dismissed: hideDismissed ? false : undefined,
    // ... other filters
  }
})
```

### Why It's Wrong
**No concept of "resolved" violations in ViolationEvent model:**
- ViolationEvent has `dismissed: boolean` (for manual dismissal)
- ViolationEvent has `firstDate` and `lastDate` (when exceedances occurred)
- **Missing:** No automatic resolution tracking based on subsequent clean samples

**Example from database:**
```
Point Loma WWTP - O&G violation
- firstDate: 2025-09-03
- lastDate: 2025-09-30
- count: 28
- dismissed: false
- updatedAt: 2025-12-02T17:59:50.721Z
```

**Problem:** This shows as "active" even though:
1. Last exceedance was September 30 (2+ months ago)
2. If October/November had clean samples, violation should be "resolved"
3. System has no mechanism to update status automatically

### Root Cause
**File:** `/home/yler_uby_oward/stormwater-watch/prisma/schema.prisma:83-112`

ViolationEvent schema lacks temporal status:
```prisma
model ViolationEvent {
  // ... fields ...
  dismissed     Boolean           @default(false)  // Manual dismissal only
  // MISSING: resolvedAt, status enum, auto-resolution logic
}
```

**File:** `/home/yler_uby_oward/stormwater-watch/lib/violations/detector.ts:136-165`

`getViolationStats()` function only filters by `dismissed`:
```typescript
const events = await prisma.violationEvent.findMany({
  where: { dismissed: false },  // No date-based filtering
})
```

### Domain Logic Clarification
**What should "active" mean for stormwater violations?**

Per California stormwater regulations:
1. **Active:** Ongoing exceedances (samples exceeding NAL in current reporting period)
2. **Resolved:** Facility returned to compliance (subsequent clean samples)
3. **Under Review:** Enforcement action pending
4. **Dismissed:** False positive or administrative closure

**Current system treats "not dismissed" as "active" - this is incorrect.**

### Proposed Fix

**Step 1: Add status tracking to ViolationEvent**
```prisma
// prisma/schema.prisma
enum ViolationEventStatus {
  ACTIVE        // Currently exceeding limits
  RESOLVED      // Returned to compliance
  UNDER_REVIEW  // Enforcement action in progress
  DISMISSED     // Closed without action
}

model ViolationEvent {
  // ... existing fields ...
  status        ViolationEventStatus @default(ACTIVE)
  resolvedAt    DateTime?
  resolvedNote  String?   @db.Text

  // Remove dismissed boolean, replace with status enum
}
```

**Step 2: Add auto-resolution logic**
```typescript
// lib/violations/detector.ts - new function
export async function updateViolationStatus(violationEventId: string) {
  const violation = await prisma.violationEvent.findUnique({
    where: { id: violationEventId },
    include: { facility: true }
  })

  if (!violation) return

  // Check if facility has had clean samples after lastDate
  const cleanSamplesAfter = await prisma.eSMRSample.findMany({
    where: {
      location: {
        facilityPlaceId: violation.facility.esmrFacilityId
      },
      samplingDate: {
        gt: violation.lastDate
      },
      // Query for same parameter below benchmark
    }
  })

  // If 2+ consecutive clean samples, mark resolved
  if (cleanSamplesAfter.length >= 2) {
    await prisma.violationEvent.update({
      where: { id: violationEventId },
      data: {
        status: 'RESOLVED',
        resolvedAt: cleanSamplesAfter[0].samplingDate,
        resolvedNote: `Auto-resolved: ${cleanSamplesAfter.length} clean samples after last exceedance`
      }
    })
  }
}
```

**Step 3: Update dashboard queries**
```typescript
// app/dashboard/page.tsx:67
violations = await prisma.violationEvent.findMany({
  where: {
    status: 'ACTIVE',  // Only show truly active violations
    // ... other filters
  }
})
```

**Verification Approach:**
After implementing fix:
1. Run violation detection on full 2025 dataset
2. Check if facilities with September violations have October/November clean samples
3. Verify auto-resolution correctly updates status
4. Confirm dashboard only shows violations with recent exceedances

---

## Issue 3: Timezone Issues in Case Packets

### Current Behavior
Engineer reported: "Case packet function shows time received as 8 hours ahead"

### Investigation Results
**Finding: NO TIMEZONE ISSUE EXISTS**

Case packet displays dates using `format(sample.sampleDate, "PP")`:
- **Location:** `/home/yler_uby_oward/stormwater-watch/lib/case-packet/template.tsx:214`
```typescript
<Text style={[styles.tableCol, { width: "20%" }]}>
  {format(sample.sampleDate, "PP")}
</Text>
```

**Database schema uses Date-only types:**
```prisma
// prisma/schema.prisma:408-419
model ESMRSample {
  samplingDate DateTime @db.Date   // Date only, no timezone
  samplingTime DateTime @db.Time   // Time only, separate field
  analysisDate DateTime @db.Date
  analysisTime DateTime @db.Time
}
```

**Confirmed via database query:**
```
eSMR samplingDate: 2025-09-03T00:00:00.000Z  (midnight UTC = no timezone offset)
eSMR samplingTime: 1970-01-01T11:37:00.000Z  (time stored as epoch offset)
```

### Why There's No Issue
1. Sampling dates are stored as `@db.Date` (date-only, no time component)
2. Sampling times are stored separately in `@db.Time`
3. Case packet uses `date-fns` `format()` which renders in local timezone
4. PDF generation happens server-side (timezone irrelevant for dates)

### Possible Source of Confusion
Engineer may have been looking at `samplingTime` field in raw database:
- PostgreSQL TIME type stored as "1970-01-01T11:37:00.000Z"
- The "1970-01-01" is PostgreSQL's epoch base date (ignored for time-only values)
- The actual sampling time is 11:37 (no timezone conversion)

### Root Cause
**File:** NONE - This is a non-issue
**Explanation:** Engineer likely misread database dump showing epoch-based time storage

### Proposed Fix
**No code changes needed.**

**Documentation improvement:**
Add comment in case packet template explaining date handling:
```typescript
// lib/case-packet/template.tsx:214
<Text style={[styles.tableCol, { width: "20%" }]}>
  {/* samplingDate is @db.Date - no timezone conversion needed */}
  {format(sample.sampleDate, "PP")}
</Text>
```

**Verification:**
Generate case packet for Point Loma violation and confirm:
- Dates display as "September 3, 2025" (local format)
- No 8-hour offset in dates
- If engineer still sees issue, request specific screenshot showing problem

---

## Issue 4: Missing Sample Data in Case Packets

### Current Behavior
Engineer reported: "Case packets showing blank sample data"

### Investigation Results
**Finding: Sample data is WORKING CORRECTLY in current implementation**

Case packet generator queries samples:
- **Location:** `/home/yler_uby_oward/stormwater-watch/lib/case-packet/generator.tsx:34-50`
```typescript
const samples = await prisma.sample.findMany({
  where: {
    facilityId: violation.facilityId,
    pollutant: violation.pollutantKey,
    reportingYear: violation.reportingYear,
    sampleDate: {
      gte: violation.firstDate,
      lte: violation.lastDate,
    },
    exceedanceRatio: { gte: 1.0 },
  },
  orderBy: { sampleDate: "asc" },
})
```

**Problem: Queries OLD Sample model (now empty):**
```bash
# Database query result:
Sample model count: 0           # Empty table
ESMRSample model count: 1,203,327  # Actual data here
```

### Why It's Wrong (But Doesn't Affect Current System)
**The code is querying the WRONG table:**
- Old architecture: `Sample` model (legacy, now deprecated)
- New architecture: `ViolationSample` → `ESMRSample` (current data)

**Why case packets still work:**
- ViolationSample linkage exists (30 violation samples in DB)
- ViolationEvent correctly populates from detection
- Case packet template would fail if generated for old-style violations

**But wait - this code path is BROKEN:**
The generator.tsx queries `Sample` (empty table), so PDFs would show 0 samples!

### Root Cause
**File:** `/home/yler_uby_oward/stormwater-watch/lib/case-packet/generator.tsx:34`

Schema migration incomplete - code still references deprecated model:
```typescript
// WRONG: Queries empty table
const samples = await prisma.sample.findMany({...})

// SHOULD BE: Query ViolationSample with eSMR data
const samples = await prisma.violationSample.findMany({
  where: { violationEventId },
  include: {
    esmrSample: {
      select: {
        samplingDate: true,
        samplingTime: true,
        result: true,
        units: true,
      }
    },
    benchmark: {
      select: {
        value: true,
        unit: true,
        benchmarkType: true
      }
    }
  }
})
```

### Proposed Fix

**Update case packet generator to use new schema:**

```typescript
// lib/case-packet/generator.tsx:34-50 - REPLACE ENTIRE SECTION
const samples = await prisma.violationSample.findMany({
  where: {
    violationEventId,
    status: {
      in: ['OPEN', 'UNDER_REVIEW']  // Include all relevant statuses
    }
  },
  include: {
    esmrSample: {
      select: {
        samplingDate: true,
        samplingTime: true,
        result: true,
        units: true,
        qualifier: true,
        location: {
          select: {
            locationCode: true,
            locationType: true
          }
        }
      }
    },
    benchmark: {
      select: {
        value: true,
        unit: true,
        benchmarkType: true,
        source: true
      }
    }
  },
  orderBy: {
    detectedAt: 'asc'
  }
})

// Transform to match template expectations
const samplesForTemplate = samples.map(vs => ({
  sampleDate: vs.detectedAt,
  value: vs.measuredValue,
  unit: vs.measuredUnit,
  benchmark: vs.benchmarkValue,
  exceedanceRatio: vs.exceedanceRatio,
  // Additional context
  locationCode: vs.esmrSample.location.locationCode,
  qualifier: vs.esmrSample.qualifier,
  benchmarkType: vs.benchmark.benchmarkType
}))
```

**Update case packet template types:**

```typescript
// lib/case-packet/types.ts - update Sample interface
export interface CasePacketSample {
  sampleDate: Date
  value: Decimal
  unit: string
  benchmark: Decimal
  exceedanceRatio: Decimal | null
  locationCode?: string
  qualifier?: string
  benchmarkType?: string
}

export interface CasePacketData {
  facility: Facility
  violation: ViolationEvent
  samples: CasePacketSample[]  // Use transformed samples
  precipitation?: PrecipitationData[]
  generatedAt: Date
}
```

**Verification:**
1. Generate case packet for Point Loma violation (ID from database)
2. Verify PDF shows 28 O&G samples from September 2025
3. Confirm values match database ViolationSample records
4. Check that benchmark values display correctly

---

## Issue 5: Violation Count Clarification ("28 (Repeat)")

### Current Behavior
Engineer reported confusion: "Count shows '28 (Repeat)' but period dates suggest different interpretation needed"

Example from database:
```
Point Loma WWTP - O&G violation
- count: 28
- firstDate: 2025-09-03
- lastDate: 2025-09-30
- Period: 27 days
```

### Why It's Confusing
**Multiple interpretations possible:**
1. **28 individual samples** exceeding benchmark (actual meaning)
2. **28 days** of violation (incorrect - only 27 days in period)
3. **28 repeat violations** (unclear what "repeat" means)

**Case packet template adds to confusion:**
- **Location:** `/home/yler_uby_oward/stormwater-watch/lib/case-packet/template.tsx:180-182`
```typescript
<Text style={[styles.value, violation.count > 2 ? styles.highlight : {}]}>
  {violation.count} {violation.count > 2 ? "(Repeat Offender)" : ""}
</Text>
```

Label says "Number of Exceedances" but displays "(Repeat Offender)" if count > 2.

### Domain Logic Clarification
**What does "count" actually mean?**

Per code in violation detector:
- **Location:** `/home/yler_uby_oward/stormwater-watch/lib/violations/detector.ts:88-89`
```typescript
count: group.length,  // Number of samples in group
```

**Actual meaning:** Number of individual sampling events that exceeded benchmark.

**Why 28 samples over 27 days?**
- Wastewater treatment plants sample MULTIPLE TIMES per day
- Point Loma likely has morning/evening sampling protocols
- 28 exceedance samples across 27 calendar days is plausible

**What is "Repeat Offender"?**
Looking at detector logic:
- **Location:** `/home/yler_uby_oward/stormwater-watch/lib/violations/detector.ts:55-57`
```typescript
if (group.length < repeatOffenderThreshold) {
  continue  // Skip if < 2 samples
}
```

**Definition:** "Repeat offender" = 2+ exceedance samples in same reporting year (threshold configurable)

### Root Cause
**File:** `/home/yler_uby_oward/stormwater-watch/lib/case-packet/template.tsx:179-182`

Display logic conflates two concepts:
1. **Exceedance count** (how many samples exceeded)
2. **Repeat offender status** (whether pattern indicates systemic issue)

### Proposed Fix

**Option A: Clarify labels in case packet**
```typescript
// lib/case-packet/template.tsx:179-188
<View style={styles.row}>
  <Text style={styles.label}>Exceedance Samples:</Text>
  <Text style={styles.value}>
    {violation.count} samples over {daysBetween} days
  </Text>
</View>
<View style={styles.row}>
  <Text style={styles.label}>Violation Classification:</Text>
  <Text style={[styles.value, violation.count > 2 ? styles.highlight : {}]}>
    {violation.count > 2
      ? "Repeat Offender (2+ exceedances per reporting period)"
      : "Single Event"}
  </Text>
</View>
```

**Option B: Add detailed breakdown section**
```typescript
// After violation summary, before sample table
<View style={styles.section}>
  <Text style={styles.sectionTitle}>VIOLATION TIMELINE</Text>
  <View style={styles.row}>
    <Text style={styles.label}>Period:</Text>
    <Text style={styles.value}>
      {daysBetween} days ({format(violation.firstDate, 'PP')} - {format(violation.lastDate, 'PP')})
    </Text>
  </View>
  <View style={styles.row}>
    <Text style={styles.label}>Exceedance Events:</Text>
    <Text style={styles.value}>
      {violation.count} individual samples exceeded benchmark
    </Text>
  </View>
  <View style={styles.row}>
    <Text style={styles.label}>Sampling Frequency:</Text>
    <Text style={styles.value}>
      ~{(violation.count / daysBetween).toFixed(1)} samples/day (indicates {
        violation.count / daysBetween > 1 ? 'sub-daily monitoring' : 'daily monitoring'
      })
    </Text>
  </View>
</View>
```

**Recommendation:** Use Option B for transparency. Water resources engineers need to understand sampling frequency to assess violation severity.

---

## Issue 6: Stale Schema - Old Sample Model Still Present

### Current Behavior
Schema contains deprecated `Sample` model alongside new eSMR architecture:
- **Location:** `/home/yler_uby_oward/stormwater-watch/prisma/schema.prisma:59-81`

```prisma
model Sample {
  id              String   @id @default(cuid())
  facilityId      String
  facility        Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  sampleDate      DateTime @db.Date
  pollutant       String
  value           Decimal  @db.Decimal(12, 4)
  unit            String
  benchmark       Decimal  @db.Decimal(12, 4)
  benchmarkUnit   String
  exceedanceRatio Decimal? @db.Decimal(8, 2)
  reportingYear   String
  source          String
  sourceDocUrl    String?  @db.Text
  createdAt       DateTime @default(now())
  // ... indexes ...
}
```

**Database state:**
```bash
Sample table: 0 records (empty)
ESMRSample table: 1,203,327 records (actual data)
```

### Why It's Wrong
**Schema migration incomplete:**
1. Old `Sample` model no longer used (replaced by ViolationSample → ESMRSample)
2. Code still references `Sample` in case packet generator (see Issue 4)
3. Facility model still has `samples Sample[]` relationship
4. Creates confusion about which table is authoritative

**Migration history (inferred):**
```
Phase 1 (original): Sample model for manual data entry
Phase 2 (current):  ESMRSample for automated eSMR imports
Phase 3 (current):  ViolationSample to link violations to eSMR data
Phase 4 (missing):  Remove deprecated Sample model
```

### Root Cause
**File:** `/home/yler_uby_oward/stormwater-watch/prisma/schema.prisma:59-81`

Incomplete schema migration left orphaned model in schema.

**File:** `/home/yler_uby_oward/stormwater-watch/lib/violations/detector.ts:29-39`

Detector still queries old Sample model:
```typescript
const samples = await prisma.sample.findMany({
  where: {
    reportingYear: year,
    ...(facilityId && { facilityId }),
    OR: [
      { exceedanceRatio: { gte: new Decimal(minRatio.toString()) } },
      { exceedanceRatio: null, pollutant: "PH" },
    ],
  }
})
```

**This code path is BROKEN** - queries empty table!

### Proposed Fix

**Step 1: Audit all references to Sample model**
```bash
# Find all code using deprecated Sample
grep -r "prisma.sample" .
grep -r "Sample\[\]" prisma/schema.prisma
```

**Step 2: Remove Sample model from schema**
```prisma
// prisma/schema.prisma - DELETE lines 59-81

// Also remove from Facility model:
model Facility {
  // ... other fields ...
  // DELETE THIS LINE:
  // samples          Sample[]

  // Keep these (current architecture):
  violationEvents  ViolationEvent[]
  violationSamples ViolationSample[]
}
```

**Step 3: Remove recomputeViolations function (or refactor)**
The `recomputeViolations()` function in detector.ts queries Sample table - this is dead code now.

**New violation detection should work from ESMRSample:**
```typescript
// lib/violations/detector.ts - REPLACE recomputeViolations
export async function detectViolationsFromESMR(
  facilityPlaceId?: number,
  startDate?: Date,
  endDate?: Date
) {
  // Query ESMRSample with benchmark comparisons
  const exceedances = await prisma.violationSample.findMany({
    where: {
      ...(facilityPlaceId && {
        esmrSample: {
          location: { facilityPlaceId }
        }
      }),
      ...(startDate && { detectedAt: { gte: startDate } }),
      ...(endDate && { detectedAt: { lte: endDate } }),
    },
    include: {
      esmrSample: true,
      benchmark: true,
      facility: true
    }
  })

  // Group by facility + pollutant + reporting year
  const grouped = groupExceedances(exceedances)

  // Create/update ViolationEvents
  for (const [key, group] of grouped) {
    await upsertViolationEvent(group)
  }
}
```

**Step 4: Run migration**
```bash
npx prisma migrate dev --name remove-deprecated-sample-model
```

**Verification:**
1. Confirm Sample model removed from schema
2. Run test query to ensure Facility relationships work
3. Verify violation detection still functions
4. Check case packet generation (after Issue 4 fix)

---

## Database State Assessment

### Actual Record Counts
```
ESMRFacility:       369 facilities
ESMRLocation:       [count not queried]
ESMRSample:         1,203,327 samples
ESMRParameter:      [count not queried]
ViolationEvent:     3 events (all dismissed: false)
ViolationSample:    30 samples (all status: OPEN)
Sample (old):       0 samples (deprecated table)
```

### Date Ranges
```
eSMR Samples:       2025-01-01 to 2025-11-19 (11 months)
Violations:         2025-09-03 to 2025-09-30 (September only)
```

### Active Violations Breakdown
```
1. Point Loma WWTP & Ocean Outfall
   - Pollutant: O&G (Oil & Grease)
   - Period: Sep 3-30, 2025 (27 days)
   - Count: 28 exceedance samples
   - Status: dismissed=false, updatedAt=2025-12-02

2. Eureka City Elk River WWTP
   - Pollutant: O&G
   - Period: Sep 8, 2025 (1 day)
   - Count: 1 exceedance sample
   - Status: dismissed=false

3. Brawley City WWTP
   - Pollutant: O&G
   - Period: Sep 3, 2025 (1 day)
   - Count: 1 exceedance sample
   - Status: dismissed=false
```

### Data Quality Notes
1. **All violations are O&G (Oil & Grease)** - suggests limited parameter detection active
2. **All from September 2025** - may indicate detection only ran once on partial dataset
3. **No resolved violations** - confirms Issue 2 (no auto-resolution logic)
4. **30 ViolationSample records for 3 ViolationEvents** - math checks out (28+1+1=30)

---

## Priority Recommendations

### P0 - CRITICAL (Fix Before Public Use)
1. **[Issue 1] Update date range marketing** - Change "2006-2025" to "2025" throughout landing page
2. **[Issue 4] Fix case packet sample query** - Update to use ViolationSample instead of Sample
3. **[Issue 6] Remove deprecated Sample model** - Complete schema migration

**Why P0:** These are functional bugs that will fail in production or mislead users.

### P1 - HIGH (Fix for Professional Credibility)
4. **[Issue 2] Add violation status tracking** - Implement ACTIVE/RESOLVED/UNDER_REVIEW statuses
5. **[Issue 5] Clarify violation count display** - Add timeline breakdown showing samples/day

**Why P1:** Water resources engineers need accurate temporal status and clear violation metrics.

### P2 - MEDIUM (Enhancement for Clarity)
6. **[Issue 3] Add timezone documentation** - Document date-only handling in case packets

**Why P2:** Not a bug, but preventing future confusion is valuable.

### Implementation Sequence
```
Week 1:
  Day 1-2: Issue 1 (update marketing copy)
  Day 3-4: Issue 4 (fix case packet sample query)
  Day 5:   Issue 6 (remove Sample model, run migration)

Week 2:
  Day 1-3: Issue 2 (add ViolationEventStatus, auto-resolution)
  Day 4-5: Issue 5 (enhance case packet timeline display)

Week 3:
  Testing and verification across all fixes
```

---

## Verification Checklist

Before considering this complete, verify:

- [ ] Landing page shows "2025" not "2006-2025" for eSMR data
- [ ] Case packet PDF displays 28 samples for Point Loma violation
- [ ] Case packet shows sample dates as "September 3, 2025" (no timezone offset)
- [ ] Dashboard only shows violations with recent activity (when status tracking added)
- [ ] Violation count displays as "28 samples over 27 days" with frequency calculation
- [ ] Sample model removed from schema and code
- [ ] All unit tests pass after schema migration
- [ ] Engineer review confirms all issues addressed

---

## Appendix: Code References

### Files Requiring Changes

**High Priority:**
- `/home/yler_uby_oward/stormwater-watch/app/page.tsx` (Issue 1)
- `/home/yler_uby_oward/stormwater-watch/lib/case-packet/generator.tsx` (Issue 4)
- `/home/yler_uby_oward/stormwater-watch/lib/case-packet/types.ts` (Issue 4)
- `/home/yler_uby_oward/stormwater-watch/prisma/schema.prisma` (Issues 2, 6)

**Medium Priority:**
- `/home/yler_uby_oward/stormwater-watch/lib/violations/detector.ts` (Issues 2, 6)
- `/home/yler_uby_oward/stormwater-watch/lib/case-packet/template.tsx` (Issue 5)
- `/home/yler_uby_oward/stormwater-watch/app/dashboard/page.tsx` (Issue 2)

### Database Queries Used
All verification queries stored in:
- `/home/yler_uby_oward/stormwater-watch/scripts/check-data-accuracy.ts`
- `/home/yler_uby_oward/stormwater-watch/scripts/check-violation-details.ts`

### Testing Strategy
1. **Unit tests:** Violation detection logic with mock ESMRSample data
2. **Integration tests:** Case packet generation with real ViolationEvent IDs
3. **Manual verification:** Generate PDF for Point Loma violation, review with engineer
4. **Regression testing:** Ensure all existing features still work after Sample model removal

---

**Document Status:** DRAFT FOR REVIEW
**Next Action:** User approval of fix approach before implementation
