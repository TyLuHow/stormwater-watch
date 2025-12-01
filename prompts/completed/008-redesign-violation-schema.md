<objective>
Redesign the water quality violation tracking schema to support hierarchical navigation and efficient querying across both aggregated and individual violation data.

The current ViolationEvent schema was created as a placeholder before real eSMR data existed. Now that we have 1.2M actual water quality samples with benchmark comparisons, we need a schema that:
- Supports dashboard performance with aggregated views (facility-level, pollutant-level summaries)
- Enables detailed drilldown into individual sample violations for regulatory compliance tracking
- Matches the actual eSMR data structure (ESMRSample fields)
- Enables hierarchical navigation: facility → pollutant → individual samples

This redesign is critical for the violation detection system to function properly and provide actionable compliance insights.
</objective>

<context>
## Current State

**Existing ViolationEvent Schema** (designed for aggregates):
```prisma
model ViolationEvent {
  id            String   @id @default(cuid())
  facilityId    String
  facility      Facility @relation(fields: [facilityId], references: [id])
  pollutant     String
  firstDate     DateTime @db.Date
  lastDate      DateTime @db.Date
  count         Int
  maxRatio      Decimal  @db.Decimal(8, 2)
  reportingYear String
  impairedWater Boolean  @default(false)
  dismissed     Boolean  @default(false)
  @@unique([facilityId, pollutant, reportingYear])
}
```

**Actual eSMR Data Structure**:
```prisma
model ESMRSample {
  id String @id @default(cuid())
  locationPlaceId    Int
  location           ESMRLocation @relation(...)
  parameterId        String
  parameter          ESMRParameter @relation(...)
  samplingDate DateTime @db.Date
  samplingTime DateTime @db.Time
  qualifier        ESMRQualifier
  result           Decimal? @db.Decimal(18, 6)
  units            String @db.VarChar(50)
  mdl Decimal? @db.Decimal(18, 6)
  ml  Decimal? @db.Decimal(18, 6)
  rl  Decimal? @db.Decimal(18, 6)
  // ... more fields
}

model ESMRLocation {
  locationPlaceId Int @id
  facilityPlaceId Int
  facility        ESMRFacility @relation(...)
  locationCode String
  locationType ESMRLocationType
  latitude  Decimal? @db.Decimal(9, 6)
  longitude Decimal? @db.Decimal(9, 6)
}

model ESMRParameter {
  id            String @id
  parameterName String @unique
  category      String?
  canonicalKey  String?  // Maps to ConfigPollutant key
}
```

**Failed Violation Computation Script** attempted to create:
```typescript
{
  facilityPlaceId: sample.location.facility.facilityPlaceId,
  sampleId: violation.sampleId,
  pollutantKey: violation.pollutantKey,
  detectedAt: sample.sampleDate,
  exceedanceRatio: violation.exceedanceRatio,
  benchmarkValue: violation.benchmarkValue,
  measuredValue: violation.sampleValue,
  status: 'OPEN',
  severity: violation.exceedanceRatio > 2 ? 'CRITICAL' : 'MODERATE',
}
```

## Current Issues

1. **Schema mismatch**: ViolationEvent expects aggregated data but script tries to create individual records
2. **Missing fields**: Current schema lacks individual violation tracking (sampleId, benchmarkValue, measuredValue, severity, status)
3. **Wrong relationships**: Script uses `facilityPlaceId` (ESMRFacility) but ViolationEvent uses `facilityId` (Facility)
4. **No sample reference**: Can't link violations back to specific ESMRSample records
5. **No benchmark reference**: Can't show which regulatory threshold was exceeded

Read these files to understand the full context:
- @prisma/schema.prisma (ESMRSample, ESMRLocation, ESMRFacility, ViolationEvent, PollutantBenchmark models)
- @scripts/compute-violations.ts (failed script showing what data we're trying to track)
- @prisma/seed-benchmarks.ts (53 regulatory benchmarks we're comparing against)
</context>

<requirements>
## Functional Requirements

1. **Dashboard Performance**: Fast queries for aggregated violation summaries
   - Facility-level: "Facility X has 3 pollutants with violations in 2024"
   - Pollutant-level: "TSS violations occurred at 15 facilities in 2024"
   - Time-based: "24 violations detected this month"

2. **Detailed Drilldown**: Ability to view individual violation events
   - Which specific sample exceeded the benchmark
   - What was measured vs. what the limit is
   - When and where the sample was taken
   - Which regulatory threshold was exceeded
   - Current status (open, under review, resolved, dismissed)

3. **Hierarchical Navigation**: Support UI navigation patterns
   - Dashboard → Facility detail → Pollutant violations → Individual samples
   - Filter by severity, status, time period, location type

4. **Regulatory Compliance Tracking**:
   - Link violations to specific PollutantBenchmark records
   - Track violation status workflow (open → under_review → resolved → dismissed)
   - Support compliance reporting by benchmark type (NAL, MCL, CMC, CCC)
   - Distinguish severity levels based on exceedance ratio

5. **Data Integrity**:
   - No duplicate violation records for same sample
   - Maintain referential integrity with ESMRSample records
   - Support both eSMR-linked facilities and manually-created facilities

## Performance Requirements

- Dashboard queries should return in < 500ms for 10,000+ violations
- Support efficient filtering by facility, pollutant, date range, severity, status
- Optimize for read-heavy workload (violations computed in batch, read frequently)
- Consider indexing strategy for common query patterns
</requirements>

<analysis>
Before implementing, thoroughly analyze these architectural options:

## Option 1: Dual Model Approach
Keep ViolationEvent for aggregates, add ViolationSample for individual records.

**Pros:**
- Clear separation of concerns
- Aggregates precomputed for dashboard performance
- Individual samples available for drilldown

**Cons:**
- Data duplication between models
- Must maintain consistency between aggregate and individual records
- More complex write operations (update both models)

**Schema sketch:**
```prisma
model ViolationEvent {
  // Aggregated violation summary
  id, facilityId, pollutantKey, firstDate, lastDate,
  count, maxRatio, reportingYear, severity
  samples ViolationSample[]
}

model ViolationSample {
  // Individual violation instance
  id, violationEventId, esmrSampleId, benchmarkId,
  detectedAt, measuredValue, benchmarkValue, exceedanceRatio
}
```

## Option 2: Single Redesigned Model
Replace ViolationEvent entirely with a model that tracks individual violations only. Generate aggregates via queries/views.

**Pros:**
- Single source of truth
- No data duplication
- Simpler write operations

**Cons:**
- Dashboard queries require aggregation on every request
- Potentially slower for common dashboard views
- More complex query logic

**Schema sketch:**
```prisma
model Violation {
  id, facilityId, esmrSampleId, pollutantKey, benchmarkId,
  detectedAt, measuredValue, benchmarkValue, exceedanceRatio,
  severity, status
  // Indexes optimized for aggregation queries
}
```

## Option 3: Hierarchical Structure
Multiple related models representing different aggregation levels.

**Pros:**
- Explicit hierarchical relationships
- Can query at any level of detail
- Clear representation of data model

**Cons:**
- Most complex schema
- Most complex write operations
- Potential for inconsistency across levels

**Schema sketch:**
```prisma
model ViolationSummary {
  // Facility-pollutant-year level
  id, facilityId, pollutantKey, year, count, maxRatio
  events ViolationEvent[]
}

model ViolationEvent {
  // Individual occurrence (may span multiple samples)
  id, summaryId, firstDate, lastDate, status, severity
  samples ViolationSample[]
}

model ViolationSample {
  // Individual sample measurement
  id, eventId, esmrSampleId, benchmarkId, exceedanceRatio
}
```

Consider:
- Query patterns from dashboard requirements
- Write frequency vs read frequency
- Data volume (1.2M samples, unknown violation percentage)
- Maintenance complexity
- Future extensibility (e.g., adding compliance workflows, notifications)
</analysis>

<implementation>
## Decision Process

1. **Analyze trade-offs** between the three options, considering:
   - Dashboard query performance for aggregated views
   - Drilldown query performance for individual samples
   - Write complexity when computing violations from samples
   - Data consistency challenges
   - Schema maintenance burden
   - Future extensibility

2. **Choose the optimal approach** and justify your decision with clear reasoning about:
   - Why this approach best serves the use cases
   - How it handles the performance requirements
   - What trade-offs you're accepting and why they're acceptable

3. **Design the complete schema** including:
   - All model definitions with proper field types
   - Relationships between models (@relation fields)
   - Unique constraints to prevent duplicates
   - Indexes for query optimization
   - Status enums, severity levels
   - Proper mapping to ESMRSample, ESMRFacility, PollutantBenchmark

4. **Handle the Facility relationship complexity**:
   - Some facilities link to ESMRFacility (have esmrFacilityId)
   - Some facilities are manually created (no esmrFacilityId)
   - Violations from eSMR samples should link via ESMRFacility → Facility
   - Schema should support both paths cleanly

5. **Update the schema file**: Modify @prisma/schema.prisma with your new design
   - Add/modify violation models
   - Add necessary enums (ViolationStatus, ViolationSeverity if needed)
   - Add proper indexes based on query patterns
   - Add @@map directives for table names if using snake_case

6. **Create a migration strategy document**: Save to ./docs/VIOLATION_SCHEMA_MIGRATION.md explaining:
   - What changed and why
   - How to migrate existing data (if any)
   - How the new schema addresses the original issues
   - Query patterns for common use cases
   - Example: "Get all critical violations for facility X in 2024"

7. **Update the compute-violations script**: Modify @scripts/compute-violations.ts to:
   - Use the new schema structure
   - Create the appropriate violation records
   - Handle batch processing efficiently
   - Add proper error handling
   - Include progress logging

## Constraints

- **Maintain backward compatibility** where possible with existing Facility and Alert models that reference ViolationEvent
- **Preserve referential integrity**: All foreign keys must properly cascade on delete
- **Use Prisma best practices**: Proper relation fields, indexes, unique constraints
- **Consider data volume**: Design must scale to millions of samples
- **Support the Alert system**: Alerts currently link to ViolationEvent - ensure this still works

## What to Avoid (and WHY)

- **Don't create generic JSONB fields** for violation metadata - use proper typed fields so queries are efficient and the schema is self-documenting
- **Don't duplicate ESMRSample fields** into violation models - link via foreign key and join when needed to avoid data inconsistency
- **Don't use overly complex hierarchies** - more than 3 levels of aggregation adds complexity without proportional benefit
- **Don't ignore the existing Facility model** - violations must work with the current Facility structure that links to ESMRFacility
</implementation>

<output>
1. **Updated schema file**: Modify @prisma/schema.prisma with new/updated models
2. **Migration strategy document**: Create ./docs/VIOLATION_SCHEMA_MIGRATION.md
3. **Updated compute script**: Modify @scripts/compute-violations.ts to use new schema
4. **Example queries document**: Create ./docs/VIOLATION_QUERY_PATTERNS.md showing:
   - Dashboard aggregation queries
   - Drilldown navigation queries
   - Status update mutations
   - Performance considerations
</output>

<verification>
Before declaring complete, verify:

1. **Schema compiles**: Run `npx prisma validate` successfully
2. **Relationships are correct**: All @relation fields have proper references and cascade rules
3. **Indexes support queries**: Common query patterns have supporting indexes
4. **No breaking changes**: Existing models that reference ViolationEvent still work or have clear migration path
5. **Script type-checks**: Run `npm run type-check` successfully on updated compute-violations.ts
6. **Documentation is complete**: Migration and query pattern docs explain the new system clearly

Run these commands to verify:
```bash
npx prisma validate
npm run type-check
```
</verification>

<success_criteria>
- New violation schema supports both aggregated and individual violation tracking
- Dashboard queries can be executed efficiently (< 500ms for common views)
- Individual violations link to ESMRSample, PollutantBenchmark, and Facility
- Hierarchical drilldown is supported through proper relationships
- Schema mismatch issues in compute-violations.ts are resolved
- Clear migration path documented for any breaking changes
- Query patterns documented with examples
- All verification checks pass
</success_criteria>
