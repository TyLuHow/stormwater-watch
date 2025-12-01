# Violation Schema Migration Guide

## Overview

This document describes the redesign of the water quality violation tracking schema, transitioning from a single aggregated model to a dual-model approach that supports both high-performance dashboard queries and detailed regulatory compliance tracking.

## What Changed and Why

### Previous Schema (Aggregate-Only)

```prisma
model ViolationEvent {
  id            String   @id
  facilityId    String
  pollutant     String     // ❌ Free-text, no relation to ConfigPollutant
  firstDate     DateTime
  lastDate      DateTime
  count         Int
  maxRatio      Decimal
  reportingYear String
  impairedWater Boolean
  dismissed     Boolean
  notes         String?
  createdAt     DateTime
  alerts        Alert[]
}
```

**Problems:**
- No individual violation records - can't drilldown to specific samples
- No link to ESMRSample - can't show which measurement caused the violation
- No link to PollutantBenchmark - can't show which regulatory threshold was exceeded
- No status tracking - can't track compliance workflow (open → review → resolved)
- No severity levels - can't prioritize critical violations
- Free-text pollutant field - inconsistent naming, no benchmark validation

### New Schema (Dual-Model Approach)

#### ViolationEvent (Aggregated Summary)

```prisma
model ViolationEvent {
  id            String            @id
  facilityId    String
  facility      Facility          @relation(...)
  pollutantKey  String            // ✅ Now links to ConfigPollutant
  pollutant     ConfigPollutant   @relation(...)
  firstDate     DateTime
  lastDate      DateTime
  count         Int
  maxRatio      Decimal
  maxSeverity   ViolationSeverity // ✅ NEW: Highest severity in this group
  reportingYear String
  impairedWater Boolean
  dismissed     Boolean
  notes         String?
  createdAt     DateTime
  updatedAt     DateTime

  alerts  Alert[]
  samples ViolationSample[]      // ✅ NEW: Link to individual violations
}
```

**Changes:**
- `pollutant` (String) → `pollutantKey` (FK to ConfigPollutant)
- Added `maxSeverity` field (CRITICAL, HIGH, MODERATE, LOW)
- Added `updatedAt` timestamp
- Added `samples` relation to drill down into individual violations

#### ViolationSample (Individual Violations) - NEW MODEL

```prisma
model ViolationSample {
  id String @id

  // Relationships
  violationEventId String
  violationEvent   ViolationEvent     @relation(...)
  facilityId       String             // Denormalized for query efficiency
  facility         Facility           @relation(...)
  esmrSampleId     String
  esmrSample       ESMRSample         @relation(...)
  benchmarkId      String
  benchmark        PollutantBenchmark @relation(...)
  pollutantKey     String             // Denormalized for filtering

  // Violation details
  detectedAt      DateTime
  measuredValue   Decimal
  measuredUnit    String
  benchmarkValue  Decimal
  benchmarkUnit   String
  exceedanceRatio Decimal
  severity        ViolationSeverity

  // Compliance tracking
  status      ViolationStatus
  reviewedAt  DateTime?
  reviewedBy  String?
  reviewNotes String?

  createdAt DateTime
  updatedAt DateTime
}
```

**Key Features:**
- Links to source ESMRSample (traceability to raw data)
- Links to PollutantBenchmark (shows which regulatory threshold was exceeded)
- Stores measured vs benchmark values (compliance reporting)
- Status workflow: OPEN → UNDER_REVIEW → RESOLVED → DISMISSED
- Severity levels: LOW → MODERATE → HIGH → CRITICAL
- Unique constraint on (esmrSampleId, benchmarkId) prevents duplicates

#### New Enums

```prisma
enum ViolationStatus {
  OPEN          // Detected, not yet reviewed
  UNDER_REVIEW  // Being investigated
  RESOLVED      // Addressed by facility
  DISMISSED     // False positive or acceptable
}

enum ViolationSeverity {
  LOW       // 1x - 2x benchmark
  MODERATE  // 2x - 5x benchmark
  HIGH      // 5x - 10x benchmark
  CRITICAL  // 10x+ benchmark
}
```

## How the New Schema Addresses Original Issues

| Original Issue | Solution |
|----------------|----------|
| **Schema mismatch**: ViolationEvent expected aggregates but script tried to create individual records | New ViolationSample model stores individual violations; ViolationEvent remains aggregate |
| **Missing fields**: No sampleId, benchmarkValue, measuredValue, severity, status | ViolationSample includes all these fields with proper types |
| **Wrong relationships**: Script used facilityPlaceId but schema expected facilityId | compute-violations.ts now maps ESMRFacility → Facility, creates missing Facility records |
| **No sample reference**: Can't link back to ESMRSample | ViolationSample.esmrSampleId links directly to ESMRSample |
| **No benchmark reference**: Can't show regulatory threshold | ViolationSample.benchmarkId links to PollutantBenchmark |

## Migration Strategy

### For New Installations

Simply run migrations - no data migration needed:

```bash
npx prisma migrate dev --name add_violation_samples
```

### For Existing Installations with ViolationEvent Data

The new schema is **backward compatible** - existing ViolationEvent records remain valid. However, to leverage the new features:

#### Option 1: Recompute from ESMRSample (Recommended)

```bash
# 1. Backup existing violations
npx prisma db execute --stdin < backup_violations.sql

# 2. Clear existing violations (optional - they'll be recreated)
# DELETE FROM "ViolationEvent";

# 3. Run migration
npx prisma migrate deploy

# 4. Recompute violations with new schema
npm run compute-violations
```

This creates both ViolationEvent (aggregated) and ViolationSample (individual) records.

#### Option 2: Keep Existing ViolationEvents, Add New ViolationSamples

Existing ViolationEvent records will continue to work with Alerts and APIs. New violations detected will use the dual-model approach.

**Note**: The `pollutant` field was renamed to `pollutantKey` and now requires a foreign key to ConfigPollutant. The migration will need to:
1. Ensure all pollutant values exist in ConfigPollutant
2. Update the unique constraint from `facilityId_pollutant_reportingYear` to `facilityId_pollutantKey_reportingYear`

### Handling API Breaking Changes

The following APIs reference ViolationEvent and may need updates:

1. **`/api/violations/route.ts`**: Update filter on `pollutant` → `pollutantKey`
2. **`/api/violations/dismiss/route.ts`**: No changes needed (uses violationEventId)
3. **`lib/violations/detector.ts`**: Update `recomputeViolations()` to use `pollutantKey`
4. **Alert matching**: Update `lib/subscriptions/matcher.ts` if it filters by pollutant

**Migration Path for APIs:**

```typescript
// Before
where: {
  pollutant: { in: pollutants }
}

// After
where: {
  pollutantKey: { in: pollutants }
}
```

## Data Consistency

The dual-model approach requires maintaining consistency between aggregates and individual records. This is handled by the compute script:

**Consistency Rules:**
1. ViolationEvent.count MUST equal the number of related ViolationSamples
2. ViolationEvent.maxRatio MUST equal the max exceedanceRatio of related ViolationSamples
3. ViolationEvent.maxSeverity MUST equal the highest severity of related ViolationSamples
4. ViolationEvent.firstDate and lastDate MUST span all related ViolationSamples' detectedAt dates

**Maintained By:**
- `scripts/compute-violations.ts` creates/updates both models in sync
- ViolationSample.violationEventId CASCADE deletes ensure orphans are removed
- Unique constraints prevent duplicate ViolationSamples

**Validation Query:**
```sql
-- Find ViolationEvents with mismatched counts
SELECT
  ve.id,
  ve.count as event_count,
  COUNT(vs.id) as sample_count
FROM "ViolationEvent" ve
LEFT JOIN "violation_samples" vs ON vs."violationEventId" = ve.id
GROUP BY ve.id
HAVING ve.count != COUNT(vs.id);
```

## Index Strategy

The new schema includes optimized indexes for common query patterns:

### ViolationEvent Indexes
```prisma
@@index([facilityId, pollutantKey, reportingYear]) // Dashboard filters
@@index([dismissed])                                // Active violations
@@index([maxRatio])                                 // Severity sorting
@@index([maxSeverity])                              // Severity filtering
```

### ViolationSample Indexes
```prisma
@@index([violationEventId])                         // Drilldown from event
@@index([facilityId, pollutantKey, detectedAt])     // Facility timeline
@@index([status, severity])                         // Compliance dashboard
@@index([detectedAt])                               // Time-based filtering
```

**Why Denormalize facilityId and pollutantKey in ViolationSample?**

Allows direct queries on ViolationSample without joining through ViolationEvent:
```typescript
// Fast query: All critical violations for a facility
const violations = await prisma.violationSample.findMany({
  where: {
    facilityId: 'xyz',
    severity: 'CRITICAL',
  }
});
```

## Performance Considerations

### Dashboard Queries (Aggregates)

**Unchanged** - Still query ViolationEvent for fast aggregations:

```typescript
// Facility-level summary
const summary = await prisma.violationEvent.groupBy({
  by: ['facilityId'],
  where: { dismissed: false },
  _count: true,
  _max: { maxRatio: true },
});
```

**Expected Performance**: < 500ms for 10,000+ ViolationEvents

### Drilldown Queries (Individual Samples)

**New capability** - Query ViolationSamples for detailed view:

```typescript
// Get all violations for a facility/pollutant
const violations = await prisma.violationSample.findMany({
  where: {
    facilityId: 'xyz',
    pollutantKey: 'COPPER',
  },
  include: {
    esmrSample: {
      include: {
        location: true,
        parameter: true,
      },
    },
    benchmark: true,
  },
  orderBy: { detectedAt: 'desc' },
});
```

**Expected Performance**: < 1s for 1,000 ViolationSamples with includes

### Write Performance

Creating violations requires 2 operations (event + samples), but this is **batch processed**:

```typescript
// 1. Upsert ViolationEvent (1 query per facility/pollutant/year)
// 2. Create ViolationSamples (batched, ~100 per facility/pollutant/year)
```

**Expected**: 10,000 violations processed in ~2-3 minutes

## Rollback Plan

If issues arise, rollback is straightforward:

1. **Revert migration:**
   ```bash
   npx prisma migrate rollback
   ```

2. **Restore backup:**
   ```bash
   psql $DATABASE_URL < backup_violations.sql
   ```

3. **Old code still works** - ViolationEvent structure is backward compatible (except pollutant→pollutantKey rename)

## Testing Checklist

Before deploying to production:

- [ ] Run `npx prisma migrate dev` successfully
- [ ] Run `npm run compute-violations` with sample data
- [ ] Verify ViolationEvent counts match ViolationSample counts
- [ ] Test dashboard APIs with new pollutantKey field
- [ ] Test facility detail page drilldown
- [ ] Verify Alert matching still works
- [ ] Check case packet generation includes violation details
- [ ] Verify dismissed violations are excluded from dashboards
- [ ] Test status updates (OPEN → UNDER_REVIEW → RESOLVED)

## Support

For questions or issues with the migration:
- Review query examples in `docs/VIOLATION_QUERY_PATTERNS.md`
- Check implementation in `scripts/compute-violations.ts`
- Validate schema: `npx prisma validate`
