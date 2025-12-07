# SMARTS/CIWQS Data Automation Strategy
**Date:** December 6, 2025
**Status:** Brainstorming Phase
**Related:** TO-DOS.md > Data Integration > Automate SMARTS/CIWQS data

---

## Executive Summary

This document explores automation strategies for integrating SMARTS (Storm Water Multiple Application and Report Tracking System) data into Stormwater Watch, building on the successful eSMR automation pipeline.

**Key Decision Points:**
1. Which data sources to prioritize (SMARTS vs CIWQS vs both)
2. Integration approach (extend eSMR pattern vs new pipeline)
3. Data model strategy (new tables vs extend existing)
4. Update frequency and scheduling

---

## Current State Analysis

### Existing eSMR Pipeline (Successfully Implemented)

**Architecture:**
- **Cron endpoint:** `app/api/cron/esmr-sync/route.ts`
- **Frequency:** Weekly sync
- **Data source:** data.ca.gov CKAN API
- **Approach:** Incremental loading (fetch since last sync date)
- **Data volume:** ~5000 records per sync, 613 MB yearly file

**Database Schema:**
```
ESMRRegion (10 regions)
  ↓
ESMRFacility (facilities with place IDs)
  ↓
ESMRLocation (monitoring locations)
  ↓
ESMRSample (individual sample results)
  ↓
ViolationSample (links samples to violations)
```

**Key Success Factors:**
- Simple REST API (no auth required)
- Incremental sync reduces processing time
- Year-specific resource IDs for targeted loading
- Upsert logic prevents duplicates
- Pre-loading entity lookups for performance
- Comprehensive error handling

---

## Available Data Sources

### Option 1: Stormwater Regulatory Data (data.ca.gov) ⭐ RECOMMENDED

**Source:** https://data.ca.gov/dataset/stormwater-regulatory-including-enforcement-actions-information-and-water-quality-results

**Files Available (7 CSVs):**
1. **Industrial Discharge - Facility Information** (23.1 MB)
   - Facility details, SIC codes, permit types, NOI status

2. **Industrial Discharge - Monitoring Data** (644.6 MB) ⚠️ LARGE
   - Actual water quality monitoring results

3. **Construction Activity - Facility Information** (91.1 MB)
   - Construction site details, QSD/QISP info

4. **Construction Activity - Monitoring Data** (324.5 MB) ⚠️ LARGE
   - Construction site monitoring results

5. **Inspections** (51.4 MB)
   - Inspection records, findings, dates

6. **Violations** (32.9 MB) 🎯 HIGH VALUE
   - Documented violations with details

7. **Enforcement Actions** (35.5 MB) 🎯 HIGH VALUE
   - Enforcement activities, penalties, resolutions

**Advantages:**
- ✅ Weekly updates (better than eSMR monthly)
- ✅ CKAN API available (same as eSMR)
- ✅ No authentication required
- ✅ Directly relevant to stormwater compliance
- ✅ Includes violations and enforcement (core mission)

**Challenges:**
- ❌ No published data dictionary
- ❌ 7 separate files require integration
- ❌ Large monitoring data files (644 MB + 324 MB)
- ❌ Schema inference required

**Scoring (from research doc):** 20/25
- API: 5/5
- Value: 5/5
- Docs: 2/5
- Frequency: 5/5
- Simplicity: 3/5

### Option 2: CIWQS Interactive Reports

**Source:** https://ciwqs.waterboards.ca.gov/ciwqs/publicreports.html

**Available Reports:**
- eSMR Data Report (already covered by data.ca.gov)
- NPDES Permits Spreadsheet
- Enforcement actions
- Inspections

**Advantages:**
- ✅ Nightly refresh (most current)
- ✅ Query filters available

**Challenges:**
- ❌ Manual export required (not automatable)
- ❌ 100,000 record limit per query
- ❌ Excel format
- ❌ No API access

**Scoring:** 18/25 - NOT RECOMMENDED for automation

### Option 3: SMARTS Public Portal

**Source:** https://smarts.waterboards.ca.gov/smarts/SwPublicUserMenu.xhtml

**Challenges:**
- ❌ Web interface only
- ❌ data.ca.gov version is superior
- ❌ Format unclear
- ❌ Manual navigation

**Scoring:** 12/25 - SKIP (use data.ca.gov instead)

---

## Automation Strategy Options

### Strategy A: Phased Rollout (RECOMMENDED)

**Phase 1: High-Value, Low-Complexity**
- Focus: Violations + Enforcement Actions only
- Justification: Core mission, manageable size, high impact
- Timeline: 2-3 weeks

**Phase 2: Facility Master Data**
- Focus: Industrial + Construction Facility Information
- Justification: Context for violations, enriches facility profiles
- Timeline: 1-2 weeks

**Phase 3: Monitoring Data**
- Focus: Industrial + Construction Monitoring Data
- Justification: Enables proactive violation detection
- Timeline: 3-4 weeks (requires performance optimization)

**Phase 4: Inspections**
- Focus: Inspection records
- Justification: Enforcement context, compliance tracking
- Timeline: 1-2 weeks

**Total Timeline:** 7-11 weeks

**Advantages:**
- ✅ Quick wins (violations data immediately valuable)
- ✅ Incremental complexity
- ✅ Learn from each phase
- ✅ Can launch features earlier

**Risks:**
- ⚠️ May need schema refactoring between phases
- ⚠️ Integration complexity increases over time

### Strategy B: All-At-Once Integration

**Approach:** Build complete SMARTS pipeline with all 7 files

**Timeline:** 6-8 weeks

**Advantages:**
- ✅ Single schema design
- ✅ Complete data relationships from start
- ✅ No incremental refactoring

**Challenges:**
- ❌ Longer time to first value
- ❌ Higher upfront complexity
- ❌ All-or-nothing risk

### Strategy C: Violations-Only (Minimum Viable)

**Approach:** Import only the Violations CSV

**Timeline:** 1-2 weeks

**Advantages:**
- ✅ Fastest time to value
- ✅ Directly supports mission
- ✅ Simple schema

**Challenges:**
- ❌ Limited context without facility/monitoring data
- ❌ May need facility linkage later
- ❌ Incomplete picture of compliance

---

## Recommended Approach: Strategy A (Phased Rollout)

### Phase 1 Implementation: Violations + Enforcement

#### 1.1 Data Schema Design

**New Tables:**

```prisma
// SMARTS Violations (from violations.csv)
model SMARTSViolation {
  id                String   @id @default(cuid())

  // Identifiers
  violationId       String?  @unique // If available from source
  facilityId        String?  // Link to our Facility model
  placeId           String?  // SMARTS place ID

  // Violation details
  violationType     String   // Type of violation
  violationDate     DateTime @db.Date
  pollutant         String?
  description       String?  @db.Text
  severity          String?

  // Regional/jurisdictional
  regionCode        String?  @db.VarChar(10)
  county            String?

  // Status
  status            String   // Open, Resolved, etc.
  resolvedDate      DateTime? @db.Date

  // Source metadata
  sourceSystem      String   @default("SMARTS")
  importedAt        DateTime @default(now())
  lastUpdatedAt     DateTime @updatedAt

  // Relationships
  enforcementActions SMARTSEnforcementAction[]

  @@index([facilityId])
  @@index([violationDate])
  @@index([regionCode])
  @@index([status])
  @@index([pollutant])
  @@map("smarts_violations")
}

// SMARTS Enforcement Actions (from enforcement_actions.csv)
model SMARTSEnforcementAction {
  id                  String   @id @default(cuid())

  // Identifiers
  actionId            String?  @unique
  violationId         String?
  violation           SMARTSViolation? @relation(fields: [violationId], references: [id])
  facilityId          String?

  // Action details
  actionType          String   // Warning, Citation, Fine, etc.
  actionDate          DateTime @db.Date
  description         String?  @db.Text

  // Financial
  penaltyAmount       Decimal? @db.Decimal(12, 2)
  penaltyPaid         Decimal? @db.Decimal(12, 2)
  penaltyStatus       String?

  // Resolution
  resolutionDate      DateTime? @db.Date
  resolutionType      String?

  // Regional
  regionCode          String?  @db.VarChar(10)

  // Source metadata
  sourceSystem        String   @default("SMARTS")
  importedAt          DateTime @default(now())
  lastUpdatedAt       DateTime @updatedAt

  @@index([violationId])
  @@index([facilityId])
  @@index([actionDate])
  @@index([actionType])
  @@index([regionCode])
  @@map("smarts_enforcement_actions")
}

// Import job tracking
model SMARTSImportLog {
  id              String   @id @default(cuid())
  dataType        String   // "violations", "enforcement", "facilities", etc.
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  status          String   // "running", "completed", "failed"
  recordsProcessed Int     @default(0)
  recordsCreated   Int     @default(0)
  recordsUpdated   Int     @default(0)
  recordsSkipped   Int     @default(0)
  errors          Json?

  @@index([dataType, startedAt])
  @@map("smarts_import_logs")
}
```

#### 1.2 Cron Endpoint Architecture

**File:** `app/api/cron/smarts-sync/route.ts`

```typescript
/**
 * GET /api/cron/smarts-sync
 * Weekly cron job to sync SMARTS violations and enforcement actions
 * Protected with CRON_SECRET
 */

// data.ca.gov CKAN API endpoint
const CKAN_API_URL = "https://data.ca.gov/api/3/action/datastore_search_sql"

// Resource IDs for SMARTS datasets
const SMARTS_RESOURCE_IDS = {
  violations: "[RESOURCE_ID_FROM_DATACAGOV]",
  enforcement: "[RESOURCE_ID_FROM_DATACAGOV]",
  // Add more as we expand
}

export async function GET(request: NextRequest) {
  // 1. Verify cron secret
  // 2. Get last import date for violations
  // 3. Query violations API (WHERE date >= lastImportDate)
  // 4. Process and upsert violations
  // 5. Get last import date for enforcement
  // 6. Query enforcement API
  // 7. Process and link to violations
  // 8. Log results
  // 9. Return summary
}
```

**Key Differences from eSMR:**
- Two separate dataset fetches (violations + enforcement)
- Linking logic (match enforcement actions to violations)
- No year-based partitioning (use date filters instead)

#### 1.3 Integration Patterns

**Pattern 1: Extend Existing Facility Model**
- Add optional `smartsPlaceId` field to Facility
- Link SMARTS violations to existing facilities
- Enables cross-system correlation

**Pattern 2: Separate SMARTS Facilities**
- Create `SMARTSFacility` model
- Link to Facility via matching logic (later phase)
- Cleaner separation of concerns

**RECOMMENDATION:** Pattern 1 (extend existing)
- Simpler queries
- Single facility view in UI
- Easier for users to understand

#### 1.4 Data Mapping Challenges

**Without Data Dictionary:**
1. **Schema Inference:** Download sample, analyze first 1000 rows
2. **Field Mapping:** Map CSV columns to our schema
3. **Value Normalization:** Standardize enums, dates, units
4. **Null Handling:** Decide required vs optional fields

**Proposed Workflow:**
```bash
# 1. Download sample violations data
curl -o smarts-violations-sample.csv \
  "https://data.ca.gov/dataset/.../violations.csv" | head -1000

# 2. Analyze schema
npm run analyze-smarts-schema -- smarts-violations-sample.csv

# 3. Generate Prisma schema based on analysis
npm run generate-schema -- smarts-violations-sample.csv

# 4. Review and adjust manually
# 5. Create migration
npx prisma migrate dev --name add_smarts_violations
```

#### 1.5 Query Optimization

**Challenges with Large Datasets:**
- Violations: 32.9 MB (~200K-500K records estimated)
- Enforcement: 35.5 MB (~150K-400K records estimated)

**Strategies:**
1. **Incremental Sync:** Fetch only new records since last import
2. **Batch Processing:** Process 1000-5000 records at a time
3. **Indexing:** Add indexes on frequently queried fields
4. **Materialized Views:** Pre-compute common aggregations
5. **Archival:** Archive old resolved violations (>2 years)

#### 1.6 Success Criteria

- [ ] Can download violations CSV via CKAN API
- [ ] Can download enforcement CSV via CKAN API
- [ ] Schema captures all essential fields
- [ ] Violations linked to facilities (where possible)
- [ ] Enforcement actions linked to violations
- [ ] Weekly cron job runs successfully
- [ ] Import logs track statistics
- [ ] Data visible in admin interface
- [ ] Performance acceptable (<5 min per sync)

---

## Phase 2: Facility Master Data

### Goals
1. Enrich existing facilities with SMARTS data
2. Create SMARTS-only facilities not in eSMR
3. Enable better violation context

### Files
- Industrial Discharge - Facility Information (23.1 MB)
- Construction Activity - Facility Information (91.1 MB)

### Schema Additions

```prisma
model SMARTSFacility {
  id              String   @id @default(cuid())

  // Link to main facility (if matched)
  facilityId      String?
  facility        Facility? @relation(fields: [facilityId], references: [id])

  // SMARTS identifiers
  placeId         String   @unique
  applicationId   String?
  wdid            String?  // Waste Discharge ID

  // Facility details
  name            String
  facilityType    String   // Industrial, Construction

  // Industrial-specific
  sicCode         String?
  naicsCode       String?

  // Construction-specific
  qsdName         String?  // Qualified SWPPP Developer
  qispName        String?  // Qualified SWPPP Practitioner

  // Location
  lat             Decimal? @db.Decimal(9, 6)
  lon             Decimal? @db.Decimal(9, 6)
  county          String?
  regionCode      String?  @db.VarChar(10)

  // Status
  permitStatus    String?
  noiDate         DateTime? @db.Date // Notice of Intent
  notDate         DateTime? @db.Date // Notice of Termination

  // Metadata
  importedAt      DateTime @default(now())
  lastSeenAt      DateTime @default(now())

  @@index([facilityId])
  @@index([facilityType])
  @@index([regionCode])
  @@index([county])
  @@map("smarts_facilities")
}
```

### Facility Linking Strategy

**Matching Criteria (in order of preference):**
1. Exact permit ID match
2. Fuzzy name match + location proximity (<100m)
3. Fuzzy name match + county match
4. Manual review queue for uncertain matches

---

## Phase 3: Monitoring Data (Advanced)

### Challenges
- **Volume:** 644 MB (industrial) + 324 MB (construction) = 968 MB
- **Records:** Estimated 5M+ monitoring samples
- **Processing Time:** May exceed Vercel timeout (10 min)

### Solutions

**Option A: Serverless Background Jobs**
- Use Vercel Cron to trigger job
- Job adds work to queue (Upstash Redis)
- Separate worker processes queue items
- Status tracked in database

**Option B: External ETL Service**
- Run processing on separate infrastructure (AWS Lambda, GCP Cloud Functions)
- Triggered by cron
- Write results to database
- Report completion

**Option C: Streaming Pipeline**
- Stream CSV from data.ca.gov
- Process line-by-line without full download
- Use serverless streaming (Vercel Edge functions)
- Progress checkpointing for resume

**RECOMMENDATION:** Option A (queue-based approach)
- Stays within Vercel ecosystem
- Upstash already in tech stack
- Supports retry and monitoring
- Scalable architecture

### Performance Targets
- Process 10,000 records/minute
- Complete import in <2 hours
- Memory footprint <512 MB
- Graceful failure handling

---

## Alternative Approaches

### Approach 1: Manual Seeding + Incremental Updates

**Strategy:**
1. One-time manual import of historical data (run locally)
2. Automated cron for new/updated records only
3. Much smaller weekly sync

**Advantages:**
- ✅ Avoids timeout issues
- ✅ Faster ongoing syncs
- ✅ Lower operational cost

**Challenges:**
- ❌ One-time manual process required
- ❌ Historical data staleness

### Approach 2: API-First (When Available)

**Future Option:**
- Monitor for SMARTS/CIWQS official APIs
- Water Board GitHub: https://github.com/CAWaterBoardDataCenter
- Migrate to official API when available

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| No data dictionary | HIGH | MEDIUM | Schema inference, contact Water Board |
| CSV schema changes | MEDIUM | HIGH | Version detection, migration scripts |
| Timeout on large files | HIGH | HIGH | Queue-based processing, streaming |
| Data quality issues | MEDIUM | MEDIUM | Validation rules, error logging |
| Duplicate detection | MEDIUM | MEDIUM | Unique constraints, hash matching |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Weekly sync failures | LOW | MEDIUM | Alerting, retry logic, monitoring |
| Database growth | HIGH | MEDIUM | Archival strategy, partitioning |
| API rate limits | LOW | HIGH | Respect rate limits, exponential backoff |
| Data freshness lag | MEDIUM | LOW | Display last update timestamp |

---

## Resource Requirements

### Development Time (Phase 1)
- Schema design: 4 hours
- Download service: 4 hours
- ETL pipeline: 8 hours
- Cron endpoint: 4 hours
- Testing: 8 hours
- Documentation: 2 hours
**Total:** ~30 hours (1 week full-time, 2 weeks part-time)

### Infrastructure Costs
- Database storage: +500 MB initially, +50 MB/month
- Compute: ~5 min/week cron execution
- Estimated: <$5/month additional

### Ongoing Maintenance
- Monitor weekly sync jobs: 30 min/week
- Investigate failures: 1 hour/month (average)
- Schema updates: 2 hours/quarter

---

## Success Metrics

### Phase 1 Metrics
- [ ] Violations data imported: >90% of source records
- [ ] Enforcement actions linked: >80% have violation links
- [ ] Sync reliability: >95% successful runs
- [ ] Performance: <5 min per sync
- [ ] Data freshness: <7 days lag

### Business Metrics
- [ ] User engagement with violations data
- [ ] Actionable insights identified
- [ ] Attorney case packets generated
- [ ] Repeat offenders flagged

---

## Decision Matrix

| Criteria | Strategy A (Phased) | Strategy B (All-at-Once) | Strategy C (Violations-Only) |
|----------|---------------------|--------------------------|------------------------------|
| Time to Value | ⭐⭐⭐ (2-3 weeks) | ⭐ (6-8 weeks) | ⭐⭐⭐⭐ (1-2 weeks) |
| Complexity | ⭐⭐ (Incremental) | ⭐⭐⭐⭐ (High) | ⭐ (Low) |
| Risk | ⭐⭐ (Managed) | ⭐⭐⭐ (Higher) | ⭐ (Minimal) |
| Completeness | ⭐⭐⭐ (Eventually) | ⭐⭐⭐⭐ (Immediate) | ⭐ (Limited) |
| Flexibility | ⭐⭐⭐⭐ (Adapt per phase) | ⭐⭐ (Locked in) | ⭐⭐⭐ (Can expand) |

**RECOMMENDATION: Strategy A (Phased Rollout)**

---

## Next Steps

### Immediate Actions (This Week)
1. [ ] Download sample violations CSV (first 1000 rows)
2. [ ] Download sample enforcement CSV (first 1000 rows)
3. [ ] Analyze CSV schemas and document fields
4. [ ] Identify CKAN API resource IDs for both datasets
5. [ ] Map CSV fields to proposed Prisma schema

### Short Term (Next 2 Weeks)
1. [ ] Finalize Prisma schema for Phase 1
2. [ ] Create database migration
3. [ ] Build download service for violations
4. [ ] Build ETL pipeline for violations
5. [ ] Test with sample data

### Medium Term (Weeks 3-4)
1. [ ] Build enforcement actions pipeline
2. [ ] Implement linking logic
3. [ ] Create cron endpoint
4. [ ] Deploy to staging
5. [ ] Run full import test
6. [ ] Create admin UI for viewing SMARTS data

### Questions to Resolve

1. **Data Dictionary:** Should we request official data dictionary from Water Board?
   - Contact: Patrick.Otsuji@waterboards.ca.gov

2. **Facility Linking:** What matching threshold for fuzzy name matching?
   - Propose: 85% similarity + location/county match

3. **Historical Data:** How far back should we import?
   - Propose: Last 3 years (align with enforcement statutes)

4. **Archival Policy:** When to archive old data?
   - Propose: After 5 years, move to cold storage

5. **Update Strategy:** Full refresh or incremental?
   - Propose: Incremental (like eSMR pattern)

---

## References

- [Water Board Data Sources Research](../research/water-board-data-sources.md)
- [eSMR Sync Implementation](../app/api/cron/esmr-sync/route.ts)
- [Current Schema](../prisma/schema.prisma)
- [SMARTS Dataset on data.ca.gov](https://data.ca.gov/dataset/stormwater-regulatory-including-enforcement-actions-information-and-water-quality-results)

---

**Status:** Draft for review
**Next Review:** After sample data analysis
**Owner:** Development Team
