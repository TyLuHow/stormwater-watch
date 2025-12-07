# SMARTS Data Integration: Implementation Roadmap & Migration Plan

**Document Version:** 1.0
**Created:** December 6, 2025
**Status:** Planning Phase
**Estimated Duration:** 9-12 weeks
**Related Documents:**
- `/research/data-schema-integration-analysis.md` - Complete schema research
- `/research/SCHEMA_INTEGRATION_SUMMARY.md` - 3-phase implementation plan
- `/docs/architecture/BACKEND_REDESIGN.md` - Backend architecture
- `/docs/UI_UX_REDESIGN.md` - Frontend design specifications
- `/prisma/schema-integrated-proposed.prisma` - Target schema (24 tables)

---

## Executive Summary

This roadmap provides a comprehensive, step-by-step plan to integrate SMARTS (Storm Water Multiple Application and Report Tracking System) data into Stormwater Watch. The integration transforms the platform from a 10-table eSMR system (~5M records) to a 24-table integrated compliance platform (8.5M records, ~1.15 GB CSV data).

### Transformation Scope

| Metric | Current (eSMR Only) | Integrated (eSMR + SMARTS) | Change |
|--------|---------------------|----------------------------|--------|
| **Database Tables** | 10 | 24 | +14 tables |
| **Total Records** | ~5M | ~8.5M | +70% |
| **Data Sources** | 1 (eSMR) | 8 (1 eSMR + 7 SMARTS) | +700% |
| **Facilities** | ~5K | ~93K | +1,760% |
| **Database Size** | ~2 GB | ~8.6 GB (year 1) | +330% |
| **API Endpoints** | ~15 | ~30 | +100% |
| **Weekly Sync Jobs** | 1 | 2 (orchestrated) | +100% |

### Key Objectives

1. **Zero Downtime Migration:** Additive schema changes, no breaking modifications
2. **Data Quality:** Facility linking >70% automated, <10% null critical fields
3. **Performance:** API responses <2s (p95), dashboard load <3s
4. **Cost Control:** Stay within free tiers ($0-5/month infrastructure)
5. **User Value:** Enforcement tracking, regulatory violations, compliance scoring

### Critical Success Factors

- ✅ Staging environment testing before production deployment
- ✅ Rollback procedures for each migration phase
- ✅ Data integrity validation at every step
- ✅ Performance benchmarking post-deployment
- ✅ User communication and training materials

---

## Table of Contents

1. [Phase Breakdown](#phase-breakdown)
2. [Database Migration Plan](#database-migration-plan)
3. [Testing Strategy](#testing-strategy)
4. [Risk Assessment & Mitigation](#risk-assessment--mitigation)
5. [Resource Requirements](#resource-requirements)
6. [Success Metrics](#success-metrics)
7. [Rollout Strategy](#rollout-strategy)
8. [Decision Points](#decision-points)
9. [Timeline Scenarios](#timeline-scenarios)
10. [Appendices](#appendices)

---

## Phase Breakdown

### Phase 1: Violations + Enforcement (Weeks 1-3)

**Goal:** Add highest-value SMARTS data with minimal risk

#### Backend Tasks

**Week 1: Schema Migration & Setup**
- [ ] **Day 1-2:** Review and finalize schema modifications
  - Validate `schema-integrated-proposed.prisma` against production
  - Create migration SQL scripts
  - Set up staging database (Supabase duplicate)
  - Document rollback procedure

- [ ] **Day 3-4:** Deploy schema migration to staging
  ```bash
  # Migration creates new tables only, no modifications
  npx prisma migrate dev --name add_smarts_violations_enforcement
  ```
  - Deploy 14 new tables: SMARTSFacility, SMARTSViolation, SMARTSEnforcementAction, etc.
  - Verify existing eSMR tables unaffected
  - Test existing API endpoints (no breakage)

- [ ] **Day 5:** Production schema deployment (Friday evening, low traffic)
  - Run migration on production database
  - Verify schema changes via Prisma Studio
  - Smoke test existing features (facility list, dashboard)
  - Monitor error logs for 24 hours

**Week 2: Data Import Infrastructure**
- [ ] **Day 1-2:** Build SMARTS import utilities
  - Create `/lib/services/smarts/transformers.ts` (data type conversion)
  - Create `/lib/services/smarts/validators.ts` (validation rules)
  - Create `/lib/services/smarts/parsers.ts` (CSV streaming)
  - Unit tests for each utility (100% coverage)

- [ ] **Day 3-4:** Implement violations import script
  - Create `/scripts/import-smarts-violations.ts`
  - Download violations CSV (31.5 MB, ~31K records estimated)
  - Parse and validate records
  - Batch insert with upsert logic (1000 records/batch)
  - Track import progress (SMARTSImportLog)

- [ ] **Day 5:** Implement enforcement import script
  - Create `/scripts/import-smarts-enforcement.ts`
  - Download enforcement CSV (34.0 MB, ~29K records)
  - Link to violations (VIOLATION_ID foreign key)
  - Handle missing financial data (90%+ nulls)
  - Batch insert with progress tracking

**Week 3: API Development & Facility Linking**
- [ ] **Day 1-2:** Create SMARTS API endpoints
  - `/api/smarts/violations` - Query SMARTS violations
  - `/api/smarts/enforcement` - Query enforcement actions
  - Implement filtering (wdid, date range, type, status)
  - Add pagination (cursor-based, 50 records default)
  - Response caching (Redis, 5-minute TTL)

- [ ] **Day 3-4:** Implement facility matching service
  - Create `/lib/services/facility-matching/index.ts`
  - **Tier 1:** Direct WDID parsing (extract facility ID)
  - **Tier 2:** Fuzzy name matching + geographic proximity
  - Run batch matching on imported facilities
  - Generate match confidence scores (0.0-1.0)
  - Create FacilityLink records for high-confidence matches

- [ ] **Day 5:** Testing and validation
  - Integration tests for API endpoints
  - Data integrity checks (foreign keys, nulls)
  - Performance benchmarks (query time <2s)
  - Deploy to staging for QA review

#### Frontend Tasks

**Week 1-2: Component Development**
- [ ] Create `<ViolationBadge>` component (source indicator)
- [ ] Create `<UnifiedViolationTable>` component
  - Support both eSMR computed + SMARTS regulatory
  - Source badge in first column (🟢 eSMR / 🔵 SMARTS)
  - Filtering by source type
  - Export to CSV functionality

- [ ] Modify `/api/violations` endpoint
  - Add `source` query parameter (all/esmr/smarts)
  - Merge eSMR ViolationEvent + SMARTS SMARTSViolation
  - Unified UnifiedViolation interface
  - Sort by occurrence date descending

**Week 3: Page Updates**
- [ ] Create `/violations` page (if not exists) or enhance existing
  - Unified violations list with source filters
  - Summary cards (eSMR count, SMARTS count, serious, enforced)
  - Tooltip explaining two violation types

- [ ] Create `/enforcement` page (NEW)
  - Enforcement actions table
  - Filters: type, status, county, date range
  - Financial summary (total assessed, collected)
  - Distribution chart (NNC, NOV, CAO percentages)

- [ ] Update dashboard (minor enhancements)
  - Add SMARTS violation count to KPI cards
  - Add enforcement action count
  - Recent activity timeline (include enforcement events)

#### Deliverables

- ✅ **Database:** 31K violations, 29K enforcement actions imported
- ✅ **APIs:** 2 new endpoints deployed and documented
- ✅ **Facility Linking:** >70% facilities auto-matched
- ✅ **Frontend:** Violations and Enforcement pages live
- ✅ **Documentation:** API docs updated, user guide created

#### Time Estimate

- **Backend:** 40-50 hours
- **Frontend:** 20-30 hours
- **Testing:** 10-15 hours
- **Total:** 70-95 hours (optimistic: 60h, realistic: 80h, pessimistic: 95h)

#### Dependencies

- **None** (greenfield, no blocking dependencies)

#### Risk Level

**Medium**
- Risk: Data quality issues (missing dates, null fields)
- Mitigation: Validation rules, graceful null handling
- Risk: Facility matching errors
- Mitigation: Confidence scoring, manual review queue

---

### Phase 2: Inspections + Enhanced Facilities (Weeks 4-5)

**Goal:** Add facility master data and inspection records

#### Backend Tasks

**Week 4: Facility Data Import**
- [ ] **Day 1-2:** Import industrial facilities
  - Download industrial CSV (22.0 MB, ~15K facilities)
  - Parse facility info (SIC codes, operator, permit status)
  - Create SMARTSFacility records with permitType='Industrial'
  - Extract unique monitoring locations (MONITORING_LOCATION_NAME)

- [ ] **Day 3-4:** Import construction facilities
  - Download construction CSV (87.0 MB, ~78K facilities)
  - Parse construction-specific fields (disturbed acreage, project type)
  - Create SMARTSFacility records with permitType='Construction'
  - Handle high termination rate (~80% terminated)
  - Track project lifecycle (NOI, NOT dates)

- [ ] **Day 5:** Enhanced facility linking
  - Re-run Tier 1 and Tier 2 matching with full facility data
  - Improve matching accuracy with facility name + county + location
  - Manual verification for top 100 high-value facilities
  - Update FacilityLink confidence scores

**Week 5: Inspections Import & API Development**
- [ ] **Day 1-2:** Import inspection records
  - Download inspections CSV (49.0 MB, ~45K records)
  - Parse inspection data (date, inspector, purpose, findings)
  - Create SMARTSInspection records
  - Link to violations via VIOLATION_SOURCE_ID

- [ ] **Day 3:** Create M:N inspection-violation links
  - Identify inspections with COUNT_OF_VIOLATIONS > 0
  - Find matching violations (VIOLATION_SOURCE='Inspection')
  - Create SMARTSInspectionViolationLink records
  - Handle heuristic linking (date proximity) for unlinked cases

- [ ] **Day 4-5:** API endpoints for new data
  - `/api/smarts/inspections` - Query inspections
  - `/api/smarts/facilities` - Query SMARTS facilities
  - `/api/facilities/[id]/complete` - Enhanced facility detail
    - Include eSMR data (if linked)
    - Include SMARTS data (if linked)
    - Aggregate violations, enforcement, inspections
    - Monitoring data summary

#### Frontend Tasks

**Week 4: Facility Detail Enhancement**
- [ ] Add tabbed interface to `/facilities/[id]`
  - **Overview tab:** Key metrics, facility info, quick links
  - **eSMR Monitoring tab:** Sample charts, recent samples table
  - **SMARTS Regulatory tab:** Violations, permit info
  - **Enforcement tab:** Timeline, action details
  - **Compliance Score tab:** (Phase 3 or future)

- [ ] Create `<EnforcementTimeline>` component
  - Horizontal timeline with date markers
  - Action type icons (NNC, NOV, CAO)
  - Penalty amounts, status indicators
  - Click to expand details

**Week 5: Inspections Page**
- [ ] Create `/inspections` page (NEW)
  - Inspection calendar view (monthly grid)
  - Inspections list with filters
  - `<InspectionCard>` component (summary)
  - `<InspectionDetail>` modal (full report)
  - Link to related violations

- [ ] Update facility list page
  - Add data source badges (eSMR/SMARTS indicators)
  - Add violation/enforcement counts
  - Add last inspection date column
  - Improve filtering (permit type, status)

#### Deliverables

- ✅ **Database:** 93K facilities, 45K inspections imported
- ✅ **APIs:** 3 new endpoints (inspections, facilities, facility/complete)
- ✅ **Frontend:** Tabbed facility detail, inspections page
- ✅ **Linking:** Improved facility matching, manual mappings

#### Time Estimate

- **Backend:** 25-30 hours
- **Frontend:** 15-20 hours
- **Testing:** 8-12 hours
- **Total:** 48-62 hours (optimistic: 40h, realistic: 50h, pessimistic: 62h)

#### Dependencies

- **Phase 1 complete:** Facility linking service operational

#### Risk Level

**Low-Medium**
- Risk: Inspection-violation linking complexity
- Mitigation: Heuristic matching with confidence scores
- Risk: Facility data quality (60% missing coords in construction)
- Mitigation: Geocoding batch job (future), accept nulls for now

---

### Phase 3: Monitoring Data (Weeks 6-8)

**Goal:** Import 8.3M monitoring samples (largest dataset)

#### Backend Tasks

**Week 6: Monitoring Infrastructure**
- [ ] **Day 1-2:** Design streaming CSV parser
  - Create `/lib/services/smarts/streaming-parser.ts`
  - Use Node.js streams + `csv-parse` library
  - Process 644 MB industrial file line-by-line
  - Batch database writes (1000 records/batch)
  - Memory footprint <512 MB

- [ ] **Day 3-4:** Create monitoring tables migration
  - Add SMARTSMonitoringReport table (storm events)
  - Add SMARTSMonitoringSample table (parameter measurements)
  - Composite unique constraint: [wdid, appId, sampleId, parameter, sampleDate]
  - Indexes: [reportId], [sampleDate], [parameter]

- [ ] **Day 5:** Test streaming import on sample data
  - Download first 10K rows of industrial monitoring CSV
  - Run streaming parser
  - Verify database writes
  - Measure throughput (records/second)
  - Estimate full import duration

**Week 7: Historical Monitoring Import (Run Locally)**
- [ ] **Day 1-2:** Industrial monitoring import
  - Download full industrial CSV (616 MB, ~5.5M records)
  - Create SMARTSMonitoringReport records (group by REPORT_ID)
  - Create SMARTSMonitoringSample records (one per parameter)
  - Transform data types (NaN → null, Y/N → boolean)
  - Track progress (log every 100K records)
  - **Estimated duration:** 2-4 hours local execution

- [ ] **Day 3-4:** Construction monitoring import
  - Download full construction CSV (310 MB, ~2.8M records)
  - Same process as industrial
  - Additional fields: RAINFALL_AMOUNT, QSP
  - **Estimated duration:** 1-2 hours local execution

- [ ] **Day 5:** Data validation and cleanup
  - Verify record counts (5.5M + 2.8M = 8.3M)
  - Check foreign key integrity (all samples linked to reports)
  - Identify data quality issues (track in DataQualityIssue table)
  - Run query performance tests

**Week 8: Monitoring APIs & Optimization**
- [ ] **Day 1-2:** Create monitoring API endpoints
  - `/api/smarts/monitoring/reports` - Query storm event reports
  - `/api/smarts/monitoring/samples` - Query parameter samples
  - Pagination (cursor-based, critical for 8.3M records)
  - Filtering (wdid, parameter, date range)
  - Aggregations (avg, max, exceedance count)

- [ ] **Day 3-4:** Query optimization
  - Add missing indexes (EXPLAIN ANALYZE queries)
  - Consider partitioning if queries >2s (unlikely initially)
  - Implement caching (Redis, 1-hour TTL for aggregations)
  - Test with realistic query patterns

- [ ] **Day 5:** Weekly sync job (incremental updates)
  - Modify `/api/cron/smarts-sync` to include monitoring
  - Download only latest reports (filter by date)
  - Upsert logic (update existing, create new)
  - Estimated weekly sync: <5 minutes

#### Frontend Tasks

**Week 6-7: Monitoring Visualizations**
- [ ] Add monitoring section to facility detail page
  - Sample count and date range
  - Link to detailed monitoring view
  - Top parameters with recent values

- [ ] Create monitoring data visualization components
  - `<SampleChart>` - Time series with benchmark lines
  - `<ParameterTable>` - Recent samples table
  - Lazy loading (don't render all 8M samples)

**Week 8: Performance & Polish**
- [ ] Implement virtual scrolling for large datasets
  - Use `@tanstack/react-virtual` or `react-window`
  - Render only visible rows (performance critical)

- [ ] Add export functionality
  - Export filtered samples to CSV
  - Limit: 10K records per export
  - Background job for larger exports (future)

#### Deliverables

- ✅ **Database:** 8.3M monitoring samples imported
- ✅ **APIs:** 2 monitoring endpoints with pagination
- ✅ **Frontend:** Monitoring data visualizations
- ✅ **Sync:** Weekly incremental monitoring updates

#### Time Estimate

- **Backend:** 40-50 hours
- **Frontend:** 15-20 hours
- **Testing & Optimization:** 15-20 hours
- **Total:** 70-90 hours (optimistic: 60h, realistic: 80h, pessimistic: 95h)

#### Dependencies

- **Phase 2 complete:** Facility and report linkages established

#### Risk Level

**High** (Performance Critical)
- Risk: Vercel timeout during initial import
- Mitigation: Run import locally, not on Vercel
- Risk: Query performance degradation with 8M+ records
- Mitigation: Comprehensive indexing, caching, query optimization
- Risk: Memory issues with large CSV files
- Mitigation: Streaming parser, batch processing

---

## Database Migration Plan

### Pre-Migration Checklist

#### Staging Environment Setup
- [ ] Create staging database (Supabase duplicate or local PostgreSQL)
- [ ] Load production data snapshot into staging
- [ ] Verify staging data integrity
- [ ] Configure staging API endpoints

#### Backup Procedures
- [ ] **Full database backup:**
  ```bash
  # Supabase: Download backup via dashboard
  # Or manual pg_dump
  pg_dump -Fc $DATABASE_URL > backup-pre-smarts-migration.dump
  ```
- [ ] Store backup in secure location (S3, Google Drive, external)
- [ ] Document restore procedure
- [ ] Test restore on separate database

#### Migration Scripts Preparation
- [ ] Generate Prisma migration SQL
  ```bash
  npx prisma migrate dev --name add_smarts_schema --create-only
  ```
- [ ] Review generated SQL (verify additive only)
- [ ] Create manual rollback script (DROP TABLE statements)
- [ ] Test migration on staging database

### Migration Execution Steps

#### Step 1: Schema Migration (Friday Evening, Low Traffic)

**Timeline:** 30-60 minutes

```bash
# 1. Verify no pending migrations
npx prisma migrate status

# 2. Generate migration if not already created
npx prisma migrate dev --name add_smarts_schema

# 3. Apply migration to production
npx prisma migrate deploy

# 4. Verify migration success
npx prisma migrate status

# 5. Regenerate Prisma client
npx prisma generate
```

**Verification:**
- [ ] Check table count: `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';`
  - Expected: 24 tables (10 existing + 14 new)
- [ ] Verify existing tables unmodified
- [ ] Run quick query on new tables (should be empty)
- [ ] Test existing API endpoints (should work unchanged)

**Rollback Procedure (if needed):**
```sql
-- Drop new tables in reverse dependency order
DROP TABLE IF EXISTS "smarts_monitoring_samples" CASCADE;
DROP TABLE IF EXISTS "smarts_monitoring_reports" CASCADE;
DROP TABLE IF EXISTS "smarts_inspection_violation_links" CASCADE;
DROP TABLE IF EXISTS "smarts_inspections" CASCADE;
DROP TABLE IF EXISTS "smarts_enforcement_actions" CASCADE;
DROP TABLE IF EXISTS "smarts_violations" CASCADE;
DROP TABLE IF EXISTS "smarts_facilities" CASCADE;
DROP TABLE IF EXISTS "smarts_import_logs" CASCADE;
DROP TABLE IF EXISTS "facility_links" CASCADE;
DROP TABLE IF EXISTS "data_quality_issues" CASCADE;
DROP TABLE IF EXISTS "geocode_cache" CASCADE;

-- Revert Facility table changes
ALTER TABLE "Facility" DROP COLUMN IF EXISTS "smartsWdid";
ALTER TABLE "Facility" DROP COLUMN IF EXISTS "smartsAppId";
```

#### Step 2: Initial Data Load (Run Locally, Not on Vercel)

**Timeline:** 4-8 hours total

**Phase 1 Data (Week 1):**
```bash
# Download SMARTS datasets
curl -o violations.csv "https://data.ca.gov/.../violations_2025-12-02.csv"
curl -o enforcement.csv "https://data.ca.gov/.../enforcement_actions_2025-12-02.csv"

# Run import scripts
npm run import:smarts:violations
npm run import:smarts:enforcement

# Verify import
psql $DATABASE_URL -c "SELECT COUNT(*) FROM smarts_violations;"
# Expected: ~31,000

psql $DATABASE_URL -c "SELECT COUNT(*) FROM smarts_enforcement_actions;"
# Expected: ~29,000
```

**Phase 2 Data (Week 4):**
```bash
# Download facility datasets
curl -o industrial.csv "https://data.ca.gov/.../industrial_facilities.csv"
curl -o construction.csv "https://data.ca.gov/.../construction_facilities.csv"
curl -o inspections.csv "https://data.ca.gov/.../inspections.csv"

# Run import scripts
npm run import:smarts:facilities
npm run import:smarts:inspections

# Verify counts
psql $DATABASE_URL -c "SELECT COUNT(*), permit_type FROM smarts_facilities GROUP BY permit_type;"
# Expected: Industrial ~15K, Construction ~78K
```

**Phase 3 Data (Week 7):**
```bash
# Download monitoring datasets (WARNING: Large files)
curl -o industrial_monitoring.csv "https://data.ca.gov/.../industrial_monitoring.csv"  # 616 MB
curl -o construction_monitoring.csv "https://data.ca.gov/.../construction_monitoring.csv"  # 310 MB

# Run streaming import (use local powerful machine, not Vercel)
npm run import:smarts:monitoring:industrial
npm run import:smarts:monitoring:construction

# Verify counts (may take 1-2 minutes)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM smarts_monitoring_samples;"
# Expected: ~8,300,000
```

#### Step 3: Facility Matching (Run After Each Phase)

**Timeline:** 2-4 hours

```bash
# Run facility matching script
npm run link:facilities

# Review match report
cat facility-matching-report.json

# Example output:
# {
#   "directMatches": 1250,
#   "fuzzyMatches": 3480,
#   "unmatched": 10270,
#   "totalProcessed": 15000
# }

# Manual review high-value facilities (top 100 by violation count)
npm run link:facilities:manual-review
```

#### Step 4: Data Validation & Integrity Checks

**Timeline:** 1-2 hours

```bash
# Run validation script
npm run validate:smarts-data

# Checks performed:
# 1. Foreign key integrity (all violations linked to facilities)
# 2. Null value percentages (< 10% for critical fields)
# 3. Date validity (no future dates)
# 4. Duplicate detection (unique constraints working)
# 5. Cross-dataset consistency (violations ↔ enforcement links)
```

**Validation Queries:**
```sql
-- Check foreign key integrity
SELECT COUNT(*) FROM smarts_violations v
LEFT JOIN smarts_facilities f ON v.wdid = f.wdid AND v.app_id = f.app_id
WHERE f.wdid IS NULL;
-- Expected: 0 (all violations have facilities, or placeholder created)

-- Check null percentages
SELECT
  COUNT(*) FILTER (WHERE occurrence_date IS NULL) * 100.0 / COUNT(*) as occurrence_date_null_pct,
  COUNT(*) FILTER (WHERE violation_type IS NULL) * 100.0 / COUNT(*) as violation_type_null_pct
FROM smarts_violations;
-- Expected: <5% for occurrence_date, <1% for violation_type

-- Check enforcement linkages
SELECT
  COUNT(*) as total_violations,
  COUNT(*) FILTER (WHERE linked_enforcement = true) as with_enforcement,
  COUNT(*) FILTER (WHERE linked_enforcement = true) * 100.0 / COUNT(*) as enforcement_pct
FROM smarts_violations;
-- Expected: ~40-50% violations have enforcement
```

#### Step 5: Enable Weekly Sync Cron Job

**Timeline:** 30 minutes

```bash
# Update vercel.json to add SMARTS sync
# (Already configured to use orchestrator pattern)

# Deploy updated cron configuration
vercel --prod

# Manually trigger first sync to test
curl -X GET https://stormwater-watch.vercel.app/api/cron/smarts-sync \
  -H "Authorization: Bearer $CRON_SECRET"

# Verify sync success
psql $DATABASE_URL -c "SELECT * FROM smarts_import_logs ORDER BY started_at DESC LIMIT 5;"
```

### Migration Downtime Estimation

| Phase | Operation | Downtime | User Impact |
|-------|-----------|----------|-------------|
| **Schema Migration** | Add 14 new tables | 2-5 minutes | None (additive only) |
| **Data Import** | Insert historical records | 0 minutes | None (runs locally) |
| **Facility Matching** | Link facilities | 0 minutes | None (background job) |
| **Validation** | Check data integrity | 0 minutes | None (read-only queries) |
| **Cron Setup** | Enable weekly sync | 0 minutes | None |
| **TOTAL** | | **2-5 minutes** | **Minimal** |

**Zero-Downtime Strategy:**
- Schema migration is additive (no existing table modifications)
- Data import runs locally, not on production server
- Existing eSMR APIs continue working during entire migration
- New SMARTS APIs deployed separately (no conflict)
- Users can continue using platform throughout migration

### Rollback Plan

#### Scenario 1: Schema Migration Fails

**Symptoms:** Migration script errors, tables not created

**Rollback Steps:**
1. Do NOT commit migration
2. Run rollback script (DROP new tables)
3. Restore from pre-migration backup (if partial tables created)
4. Investigate error, fix migration script, retry

**Recovery Time:** 15-30 minutes

#### Scenario 2: Data Import Corruption

**Symptoms:** Invalid data in new tables, foreign key violations

**Rollback Steps:**
1. Stop any running import scripts
2. Truncate corrupted tables:
   ```sql
   TRUNCATE TABLE smarts_violations, smarts_enforcement_actions, smarts_facilities CASCADE;
   ```
3. Re-run import with corrected data
4. Verify data integrity

**Recovery Time:** 1-2 hours (depends on data volume)

#### Scenario 3: Performance Degradation Post-Import

**Symptoms:** Slow queries, API timeouts, database CPU spike

**Rollback Steps:**
1. Identify slow queries (Supabase query analyzer)
2. Add missing indexes immediately:
   ```sql
   CREATE INDEX CONCURRENTLY idx_missing ON table_name (column);
   ```
3. If severe, temporarily disable SMARTS endpoints (feature flag)
4. Optimize queries, add caching, re-enable

**Recovery Time:** 2-4 hours

---

## Testing Strategy

### Unit Testing (Per Component)

#### Data Transformation Tests

**File:** `/lib/services/smarts/transformers.test.ts`

```typescript
describe('SMARTS Transformers', () => {
  describe('parseSMARTSBoolean', () => {
    it('converts Y to true', () => {
      expect(parseSMARTSBoolean('Y')).toBe(true)
    })
    it('converts N to false', () => {
      expect(parseSMARTSBoolean('N')).toBe(false)
    })
    it('converts NA to null', () => {
      expect(parseSMARTSBoolean('NA')).toBe(null)
    })
  })

  describe('parseSMARTSDate', () => {
    it('parses valid date', () => {
      expect(parseSMARTSDate('2024-12-06')).toEqual(new Date('2024-12-06'))
    })
    it('returns null for invalid date', () => {
      expect(parseSMARTSDate('invalid')).toBeNull()
    })
    it('returns null for empty string', () => {
      expect(parseSMARTSDate('')).toBeNull()
    })
  })
})
```

**Coverage Target:** 100% for transformation utilities

#### Facility Matching Tests

**File:** `/lib/services/facility-matching/index.test.ts`

```typescript
describe('FacilityMatchingService', () => {
  const service = new FacilityMatchingService()

  describe('Tier 1: Direct WDID Matching', () => {
    it('extracts facility ID from WDID', () => {
      expect(service.extractFacilityIdFromWdid('1 08I004046')).toBe(4046)
    })
    it('matches facility by parsed ID', async () => {
      const result = await service.matchDirect('1 08I004046')
      expect(result.linkMethod).toBe('DIRECT')
      expect(result.confidence).toBeGreaterThan(0.9)
    })
  })

  describe('Tier 2: Fuzzy Matching', () => {
    it('matches by name similarity and location', async () => {
      const smartsFacility = {
        wdid: '1 08I999999',
        appId: '178203',
        facilityName: 'Acme Industrial Manufacturing',
        facilityLatitude: 32.7157,
        facilityLongitude: -117.1611
      }
      const result = await service.matchFuzzy(smartsFacility)
      expect(result.linkMethod).toBe('FUZZY')
      expect(result.confidence).toBeGreaterThan(0.7)
    })
  })
})
```

### Integration Testing (API Endpoints)

#### Violations API Tests

**File:** `/app/api/smarts/violations/route.test.ts`

```typescript
import { GET } from './route'
import { NextRequest } from 'next/server'

describe('GET /api/smarts/violations', () => {
  it('returns violations for valid WDID', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/smarts/violations?wdid=1 08I004046'
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.violations).toBeInstanceOf(Array)
    expect(data.total).toBeGreaterThan(0)
  })

  it('filters by serious violations only', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/smarts/violations?seriousOnly=true'
    )
    const response = await GET(request)
    const data = await response.json()

    expect(data.violations.every(v => v.seriousViolation === true)).toBe(true)
  })

  it('handles pagination correctly', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/smarts/violations?limit=10&offset=0'
    )
    const response = await GET(request)
    const data = await response.json()

    expect(data.violations.length).toBeLessThanOrEqual(10)
    expect(data.pagination).toHaveProperty('hasMore')
  })
})
```

### End-to-End Testing (User Journeys)

#### Attorney Journey: Build Violation Case

**Test Scenario:**
1. Navigate to `/facilities`
2. Filter by county (San Diego) + Has Violations
3. Click facility "Acme Industrial"
4. View SMARTS Regulatory tab
5. Verify violations displayed
6. View Enforcement tab
7. Verify enforcement timeline
8. Download case packet PDF

**Expected Results:**
- All pages load in <3 seconds
- Violations show source badge (🔵 SMARTS)
- Enforcement timeline displays chronologically
- PDF includes all relevant data

**Test Script (Playwright):**
```typescript
test('Attorney can build violation case', async ({ page }) => {
  await page.goto('/facilities')
  await page.selectOption('#county-filter', 'San Diego')
  await page.check('#has-violations-filter')
  await page.waitForSelector('[data-testid="facility-row"]')

  const facilityCount = await page.locator('[data-testid="facility-row"]').count()
  expect(facilityCount).toBeGreaterThan(0)

  await page.click('text=Acme Industrial')
  await page.waitForURL(/\/facilities\/.*/)

  await page.click('[data-tab="smarts-regulatory"]')
  const violations = await page.locator('[data-testid="violation-row"]').count()
  expect(violations).toBeGreaterThan(0)

  await page.click('[data-tab="enforcement"]')
  await page.waitForSelector('[data-testid="enforcement-timeline"]')

  const downloadPromise = page.waitForEvent('download')
  await page.click('text=Download Case Packet')
  const download = await downloadPromise
  expect(download.suggestedFilename()).toContain('case-packet')
})
```

### Performance Testing

#### Load Testing Scenarios

**Scenario 1: Dashboard Load (10 Concurrent Users)**
```bash
# Using Artillery
artillery quick \
  --count 10 \
  --num 100 \
  https://stormwater-watch.vercel.app/

# Performance Targets:
# - p50: <1s
# - p95: <2s
# - p99: <3s
```

**Scenario 2: Violations API (100 Concurrent Users)**
```bash
artillery quick \
  --count 100 \
  --num 1000 \
  https://stormwater-watch.vercel.app/api/violations?limit=50

# Targets:
# - p50: <500ms (with caching)
# - p95: <1s
# - p99: <2s
```

**Scenario 3: Facility Complete Query (Heavy Query)**
```bash
artillery quick \
  --count 5 \
  --num 50 \
  https://stormwater-watch.vercel.app/api/facilities/abc123/complete

# Targets:
# - p50: <800ms (with caching)
# - p95: <1.5s
# - p99: <2s
```

#### Query Performance Benchmarks

**Benchmark Queries:**
```sql
-- Query 1: Facility violations (should use index)
EXPLAIN ANALYZE
SELECT * FROM smarts_violations
WHERE wdid = '1 08I004046' AND app_id = '178203'
ORDER BY occurrence_date DESC
LIMIT 50;
-- Target: <50ms

-- Query 2: Regional violation summary (aggregation)
EXPLAIN ANALYZE
SELECT regional_board, violation_type, COUNT(*)
FROM smarts_violations
WHERE occurrence_date >= NOW() - INTERVAL '12 months'
GROUP BY regional_board, violation_type;
-- Target: <500ms

-- Query 3: Monitoring exceedances (large table)
EXPLAIN ANALYZE
SELECT wdid, sample_date, result
FROM smarts_monitoring_samples
WHERE parameter = 'Lead, Total'
  AND result > 0.015
  AND sample_date >= '2024-01-01'
LIMIT 100;
-- Target: <1s
```

### Data Quality Validation

#### Critical Data Checks

**Violations Data Quality:**
```sql
-- Check 1: Null percentages
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE occurrence_date IS NULL) * 100.0 / COUNT(*) as occurrence_date_null_pct,
  COUNT(*) FILTER (WHERE violation_type IS NULL) * 100.0 / COUNT(*) as violation_type_null_pct,
  COUNT(*) FILTER (WHERE description IS NULL) * 100.0 / COUNT(*) as description_null_pct
FROM smarts_violations;
-- Target: <10% for occurrence_date, <5% for violation_type

-- Check 2: Date validity
SELECT COUNT(*) FROM smarts_violations
WHERE occurrence_date > NOW();
-- Expected: 0 (no future dates)

-- Check 3: Linked enforcement
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE linked_enforcement = true) as with_enforcement,
  COUNT(*) FILTER (WHERE linked_enforcement = true) * 100.0 / COUNT(*) as pct
FROM smarts_violations;
-- Expected: 40-50% (based on research data)
```

**Facility Linking Quality:**
```sql
-- Check 1: Match rate
SELECT
  COUNT(*) as total_smarts_facilities,
  COUNT(*) FILTER (WHERE facility_id IS NOT NULL) as linked_facilities,
  COUNT(*) FILTER (WHERE facility_id IS NOT NULL) * 100.0 / COUNT(*) as link_rate
FROM smarts_facilities;
-- Target: >70% link rate

-- Check 2: Confidence distribution
SELECT
  link_method,
  COUNT(*),
  AVG(confidence),
  MIN(confidence),
  MAX(confidence)
FROM facility_links
GROUP BY link_method;
-- Expected: DIRECT avg 0.95, FUZZY avg 0.75-0.85
```

---

## Risk Assessment & Mitigation

### Technical Risks

#### Risk 1: Database Performance Degradation

**Probability:** High
**Impact:** High
**Severity:** 🔴 Critical

**Description:** Adding 8.5M records may slow query performance, especially on monitoring tables.

**Early Warning Indicators:**
- API response times >2s (p95)
- Dashboard load time >5s
- Database CPU usage >80%
- Query queue buildup

**Mitigation Strategies:**

**Before Migration:**
- [ ] Add comprehensive indexes (87 indexes in proposed schema)
- [ ] Test queries on staging with full dataset
- [ ] Set up performance monitoring (Supabase metrics)
- [ ] Create materialized views for common aggregations

**During Migration:**
- [ ] Monitor database performance dashboard
- [ ] Run EXPLAIN ANALYZE on critical queries
- [ ] Add indexes concurrently (no table locking)

**After Migration:**
- [ ] Implement Redis caching (5-min to 1-hour TTL)
- [ ] Use cursor-based pagination (not offset)
- [ ] Consider partitioning if queries >5s (unlikely initially)

**Contingency Plan:**
- If performance critical: Temporarily disable SMARTS endpoints (feature flag)
- Emergency index creation: `CREATE INDEX CONCURRENTLY`
- Scale up database tier (Supabase: $25/month for better performance)

#### Risk 2: Facility Matching Errors

**Probability:** Medium
**Impact:** Medium
**Severity:** 🟠 Moderate

**Description:** Automated facility matching may create false positives (linking wrong facilities) or miss valid matches.

**Early Warning Indicators:**
- Match confidence scores <0.7
- User reports of incorrect facility data
- Violation counts not matching expectations

**Mitigation Strategies:**

**Before Matching:**
- [ ] Implement confidence scoring (0.0-1.0)
- [ ] Set thresholds: Auto-link only if confidence >0.85
- [ ] Create manual review queue for 0.7-0.85 confidence

**During Matching:**
- [ ] Log all matching decisions (FacilityLink table)
- [ ] Track match method (DIRECT, FUZZY, MANUAL)
- [ ] Generate match report for review

**After Matching:**
- [ ] Manual verification of top 100 high-value facilities
- [ ] Allow users to report incorrect links
- [ ] Periodic review of low-confidence matches

**Contingency Plan:**
- Unlink incorrect matches via admin UI
- Re-run matching with adjusted parameters
- Maintain unlinked SMARTS facilities (still queryable by WDID)

#### Risk 3: Data Quality Issues

**Probability:** High
**Impact:** Medium
**Severity:** 🟠 Moderate

**Description:** Source SMARTS data has known quality issues (40% missing discovery dates, 60% missing construction coords, 90%+ null financial data).

**Early Warning Indicators:**
- Null value percentages >20% for critical fields
- Invalid dates (future dates, or before 2000)
- Orphaned records (violations without facilities)

**Mitigation Strategies:**

**During Import:**
- [ ] Validate data types before insert
- [ ] Gracefully handle nulls (don't fail import)
- [ ] Track data quality issues (DataQualityIssue table)
- [ ] Log parsing errors (ESMRImportError pattern)

**Data Quality Rules:**
```typescript
// Validation rules
const validationRules = {
  wdid: /^\d+\s+\d+[ICX]\d+$/,  // Format check
  occurrenceDate: (date) => date <= new Date(),  // No future dates
  seriousViolation: (val) => ['Y', 'N', null].includes(val),
  // ... more rules
}
```

**UI Handling:**
- Display "Not reported" for null financial data
- Use county centroid if facility coords missing
- Show data quality warnings where appropriate

**Contingency Plan:**
- Accept high null percentages for non-critical fields
- Document known data limitations in user guide
- Future enhancement: Geocoding API for missing coords

#### Risk 4: Vercel Timeout on Large Imports

**Probability:** High
**Impact:** High
**Severity:** 🔴 Critical

**Description:** Vercel serverless functions timeout after 10 minutes (free tier) or 5 minutes (hobby tier). Importing 8.3M monitoring samples may exceed this.

**Early Warning Indicators:**
- Import script timeouts during testing
- Vercel function logs showing 504 errors
- Partial data imports (some records missing)

**Mitigation Strategies:**

**Primary Mitigation:**
- **Run initial import locally** (NOT on Vercel)
- Use local machine or cloud VM with direct database access
- No timeout limits, can run for hours if needed

**Weekly Sync (Incremental):**
- Only fetch new/updated records (much smaller dataset)
- Estimated weekly sync: <5 minutes (well within limits)
- Use streaming parser for efficiency

**Alternative Solutions (if needed):**
- **GitHub Actions:** 6-hour timeout, free for public repos
- **Cloudflare Workers:** 15-minute cron limit on paid tier
- **Queue-based approach:** Vercel triggers job, Upstash queue processes

**Contingency Plan:**
- If weekly sync times out: Split into multiple cron jobs (violations Monday, enforcement Tuesday, etc.)
- If critical: Move to GitHub Actions cron (more reliable for heavy jobs)

### Operational Risks

#### Risk 5: Database Storage Limits

**Probability:** Medium
**Impact:** Medium
**Severity:** 🟠 Moderate

**Description:** Supabase free tier has 500 MB storage limit. Integrated database will exceed this (~8.6 GB year 1).

**Current Status:**
- Existing database: ~2 GB (eSMR data)
- After SMARTS: ~8.6 GB (year 1 estimate)
- Supabase free tier: 500 MB ❌

**Mitigation:**
- **Already on Supabase Pro plan** ($25/month, 8 GB included)
- Monitor storage growth monthly
- Year 3: Consider archival strategy (move >3 years old data)

**Contingency Plan:**
- Upgrade to higher Supabase tier if needed
- Implement data archival (cold storage for old records)
- Compress historical data (PostgreSQL compression)

#### Risk 6: Weekly Sync Failures

**Probability:** Low
**Impact:** Medium
**Severity:** 🟡 Low

**Description:** Weekly cron job may fail due to API downtime, network issues, or data format changes.

**Early Warning Indicators:**
- SMARTSImportLog shows status='failed'
- Error rate in Vercel logs
- Data freshness alerts (last sync >10 days ago)

**Mitigation Strategies:**

**Monitoring:**
- [ ] Set up Sentry error tracking
- [ ] Email alerts on sync failure
- [ ] Weekly sync success dashboard

**Retry Logic:**
```typescript
async function syncWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await syncSMARTS()
      return { success: true }
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await sleep(60000 * (i + 1))  // Exponential backoff
    }
  }
}
```

**Contingency Plan:**
- Manual sync trigger (admin UI button)
- Investigate failure, fix, re-run
- Fallback to manual CSV download + import if API unavailable

### UX Risks

#### Risk 7: User Confusion with Two Violation Types

**Probability:** High
**Impact:** Low
**Severity:** 🟡 Low

**Description:** Users may not understand difference between eSMR computed violations and SMARTS regulatory violations.

**Mitigation Strategies:**

**Education:**
- [ ] Add tooltip explaining two types (see UI_UX_REDESIGN.md)
- [ ] Color-code badges (🟢 eSMR / 🔵 SMARTS)
- [ ] Help page with detailed explanation
- [ ] Onboarding tour for new users

**UI Clarity:**
```tsx
<Tooltip content={
  <div>
    <strong>🟢 eSMR Computed:</strong> Detected from monitoring data, early warning
    <br />
    <strong>🔵 SMARTS Regulatory:</strong> Official violations on record, legal enforcement
  </div>
}>
  <Badge>eSMR Computed</Badge>
</Tooltip>
```

**Contingency Plan:**
- User feedback collection
- Iterate on UI based on confusion points
- Video tutorial (2-minute explainer)

#### Risk 8: Navigation Complexity

**Probability:** Medium
**Impact:** Low
**Severity:** 🟡 Low

**Description:** Adding 5 new pages (violations, enforcement, inspections, analytics, tabbed facility detail) may overwhelm users.

**Mitigation:**
- Progressive disclosure (hide advanced features initially)
- Guided tours for new users (react-joyride)
- Breadcrumb navigation
- Search functionality

**Contingency Plan:**
- Simplify navigation based on user feedback
- Remove underused pages
- Consolidate related features

---

## Resource Requirements

### Development Time Breakdown

#### Phase 1: Violations + Enforcement (Weeks 1-3)

| Task Category | Optimistic | Realistic | Pessimistic |
|---------------|-----------|-----------|-------------|
| **Backend** |
| Schema migration | 4h | 6h | 8h |
| Import scripts | 12h | 16h | 20h |
| API endpoints | 8h | 12h | 16h |
| Facility matching | 8h | 12h | 16h |
| Testing | 6h | 10h | 14h |
| **Subtotal Backend** | **38h** | **56h** | **74h** |
| **Frontend** |
| Component development | 8h | 12h | 16h |
| Page updates | 6h | 10h | 14h |
| Integration | 4h | 6h | 8h |
| Testing | 4h | 6h | 8h |
| **Subtotal Frontend** | **22h** | **34h** | **46h** |
| **TOTAL PHASE 1** | **60h** | **90h** | **120h** |

#### Phase 2: Inspections + Enhanced Facilities (Weeks 4-5)

| Task Category | Optimistic | Realistic | Pessimistic |
|---------------|-----------|-----------|-------------|
| **Backend** |
| Facility import | 8h | 12h | 16h |
| Inspections import | 6h | 10h | 14h |
| Enhanced linking | 6h | 8h | 10h |
| API endpoints | 4h | 6h | 8h |
| Testing | 4h | 6h | 8h |
| **Subtotal Backend** | **28h** | **42h** | **56h** |
| **Frontend** |
| Tabbed interface | 6h | 10h | 14h |
| Inspections page | 6h | 8h | 12h |
| Component polish | 4h | 6h | 8h |
| Testing | 2h | 4h | 6h |
| **Subtotal Frontend** | **18h** | **28h** | **40h** |
| **TOTAL PHASE 2** | **46h** | **70h** | **96h** |

#### Phase 3: Monitoring Data (Weeks 6-8)

| Task Category | Optimistic | Realistic | Pessimistic |
|---------------|-----------|-----------|-------------|
| **Backend** |
| Streaming parser | 8h | 12h | 16h |
| Monitoring import | 12h | 16h | 24h |
| API endpoints | 8h | 12h | 16h |
| Query optimization | 8h | 12h | 20h |
| Testing | 6h | 10h | 14h |
| **Subtotal Backend** | **42h** | **62h** | **90h** |
| **Frontend** |
| Visualization components | 8h | 12h | 16h |
| Virtual scrolling | 4h | 6h | 10h |
| Performance tuning | 4h | 6h | 10h |
| Testing | 2h | 4h | 6h |
| **Subtotal Frontend** | **18h** | **28h** | **42h** |
| **TOTAL PHASE 3** | **60h** | **90h** | **132h** |

#### Total Project Time

| Scenario | Phase 1 | Phase 2 | Phase 3 | Testing & Polish | **TOTAL** |
|----------|---------|---------|---------|------------------|-----------|
| **Optimistic** | 60h | 46h | 60h | 24h | **190h** |
| **Realistic** | 90h | 70h | 90h | 36h | **286h** |
| **Pessimistic** | 120h | 96h | 132h | 52h | **400h** |

**Translation to Weeks:**
- Optimistic: 4.75 weeks (40h/week) → **5 weeks**
- Realistic: 7.15 weeks (40h/week) → **7-8 weeks**
- Pessimistic: 10 weeks (40h/week) → **10-12 weeks**

### Infrastructure Costs

#### Database (Supabase)

**Current Plan:** Pro ($25/month)
- 8 GB database storage
- 100 GB bandwidth
- 2 CPU cores, 4 GB RAM

**After SMARTS Integration:**
- Database size: ~6.5 GB (initial) → ~8.6 GB (year 1)
- Still within 8 GB limit ✅
- May need upgrade year 3 (>8 GB)

**Estimated Cost:**
- Year 1: $25/month = **$300/year**
- Year 3: $25-50/month (if upgrade needed)

#### Hosting (Vercel)

**Current Plan:** Free Tier
- 100 GB bandwidth/month
- Serverless functions
- 2 cron jobs

**After SMARTS Integration:**
- Bandwidth: Minimal increase (API responses cached)
- Cron jobs: 2 (consolidated orchestrator)
- Stays within free tier ✅

**Estimated Cost:** **$0/month**

#### Caching (Upstash Redis)

**Current Plan:** Free Tier
- 10K commands/day
- 256 MB storage

**After SMARTS Integration:**
- Cache usage: ~50-100K commands/day (estimated)
- Need paid tier: $0.20/100K commands

**Estimated Cost:**
- 1M commands/month = ~33K/day
- $6/month = **$72/year**

#### Total Infrastructure Costs

| Service | Current | Year 1 | Year 3 | Notes |
|---------|---------|--------|--------|-------|
| Supabase (Database) | $300/year | $300/year | $300-600/year | May upgrade tier |
| Vercel (Hosting) | $0 | $0 | $0 | Free tier sufficient |
| Upstash (Redis) | $0 | $72/year | $72/year | Caching |
| **TOTAL** | **$300/year** | **$372/year** | **$372-672/year** | $31-56/month |

**Budget Recommendation:** $50/month ($600/year) to cover contingencies

### Team Allocation

**Recommended Team Structure:**

| Role | Phase 1 | Phase 2 | Phase 3 | Total Hours |
|------|---------|---------|---------|-------------|
| **Backend Developer** | 60h | 45h | 65h | 170h |
| **Frontend Developer** | 35h | 30h | 30h | 95h |
| **Full-Stack (Both)** | 0h | 0h | 0h | 0h |
| **QA/Testing** | 15h | 10h | 15h | 40h |
| **DevOps** | 10h | 5h | 10h | 25h |
| **Product/PM** | 10h | 10h | 10h | 30h |

**Total Team Hours:** ~360 hours (realistic scenario)

**Timeline Options:**

**Option A: Single Full-Stack Developer (40h/week)**
- Duration: 9 weeks
- Pros: Low overhead, consistent decisions
- Cons: Slower, no parallelization

**Option B: Backend + Frontend Developers (60h/week combined)**
- Duration: 6 weeks
- Pros: Faster, parallel work streams
- Cons: Coordination overhead

**Option C: Full Team (100h/week)**
- Duration: 4 weeks
- Pros: Fastest delivery
- Cons: High overhead, diminishing returns

**RECOMMENDATION:** Option A or B (single dev or two devs)

---

## Success Metrics

### Data Quality Metrics

| Metric | Target | Measurement Method | Frequency |
|--------|--------|-------------------|-----------|
| **Facility Match Rate** | >70% automated | `COUNT(facility_id IS NOT NULL) / COUNT(*)` | Weekly |
| **Data Sync Success Rate** | >95% | `COUNT(status='completed') / COUNT(*)` in import_logs | Weekly |
| **Null Value % (Critical Fields)** | <10% | Per-column null analysis | Post-import |
| **Duplicate Records** | 0 | Unique constraint violations | Daily |
| **Foreign Key Integrity** | 100% | Orphaned record checks | Post-import |

**Validation Queries:**
```sql
-- Metric 1: Facility Match Rate
SELECT
  COUNT(*) FILTER (WHERE facility_id IS NOT NULL) * 100.0 / COUNT(*) as match_rate
FROM smarts_facilities;
-- Target: >70%

-- Metric 2: Data Sync Success
SELECT
  COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*) as success_rate
FROM smarts_import_logs
WHERE started_at >= NOW() - INTERVAL '30 days';
-- Target: >95%

-- Metric 3: Null Percentages
SELECT
  'occurrence_date' as field,
  COUNT(*) FILTER (WHERE occurrence_date IS NULL) * 100.0 / COUNT(*) as null_pct
FROM smarts_violations
UNION ALL
SELECT
  'violation_type',
  COUNT(*) FILTER (WHERE violation_type IS NULL) * 100.0 / COUNT(*)
FROM smarts_violations;
-- Target: <10% for critical fields
```

### Performance Metrics

| Metric | Target | Measurement Method | Frequency |
|--------|--------|-------------------|-----------|
| **API Response Time (p95)** | <2s | Server logs, APM tools | Daily |
| **Dashboard Load Time** | <3s | Lighthouse CI, RUM | Daily |
| **Facility Detail Page** | <2s | Page load metrics | Daily |
| **Database Query Time** | <1s | EXPLAIN ANALYZE | On-demand |
| **Weekly Sync Duration** | <10 min | Import log timestamps | Weekly |

**Monitoring Setup:**
```typescript
// Example: Track API response time
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const result = await queryViolations(params)
    const duration = Date.now() - startTime

    // Log to monitoring service
    await trackMetric('api.violations.duration', duration)

    return NextResponse.json(result)
  } catch (error) {
    // Track errors
    await trackError('api.violations.error', error)
    throw error
  }
}
```

### User Adoption Metrics

| Metric | Baseline | 3-Month Target | Measurement |
|--------|----------|----------------|-------------|
| **Active Users** | 100 | 150 (+50%) | Google Analytics |
| **Avg Session Duration** | 3 min | 4 min (+30%) | GA |
| **Violations Page Views** | 0 | 500/month | GA |
| **Enforcement Page Views** | 0 | 300/month | GA |
| **Case Packet Downloads** | 0 | 50/month | Event tracking |

### Business Impact Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Facilities with Compliance Data** | >90K | Database count |
| **Violations Tracked** | ~1.7K (eSMR + SMARTS) | Database count |
| **Enforcement Actions Visible** | ~29K | Database count |
| **Case Packets Generated** | >50/month | Download events |
| **User Satisfaction** | >4.0/5 | User surveys |

---

## Rollout Strategy

### Feature Flags

Implement feature flags for gradual rollout and emergency rollback:

```typescript
// lib/feature-flags.ts
export const featureFlags = {
  ENABLE_SMARTS_VIOLATIONS: process.env.NEXT_PUBLIC_SMARTS_VIOLATIONS === 'true',
  ENABLE_ENFORCEMENT_TRACKING: process.env.NEXT_PUBLIC_ENFORCEMENT === 'true',
  ENABLE_INSPECTIONS: process.env.NEXT_PUBLIC_INSPECTIONS === 'true',
  ENABLE_FACILITY_MATCHING: process.env.NEXT_PUBLIC_FACILITY_MATCHING === 'true',
  ENABLE_MONITORING_DATA: process.env.NEXT_PUBLIC_MONITORING === 'true',
}

// Usage in components
if (featureFlags.ENABLE_SMARTS_VIOLATIONS) {
  return <UnifiedViolationsTable />
} else {
  return <ESMRViolationsTable />
}
```

**Environment Variables (`.env.local`):**
```bash
# Phase 1 (Weeks 1-3)
NEXT_PUBLIC_SMARTS_VIOLATIONS=true
NEXT_PUBLIC_ENFORCEMENT=true
NEXT_PUBLIC_FACILITY_MATCHING=true

# Phase 2 (Weeks 4-5)
NEXT_PUBLIC_INSPECTIONS=true

# Phase 3 (Weeks 6-8)
NEXT_PUBLIC_MONITORING=true
```

### Gradual Rollout Schedule

#### Week 1-3: Internal Testing (Phase 1 Complete)

**Audience:** Development team only
**Scope:** Violations + Enforcement
**Environment:** Staging only

**Activities:**
- [ ] Deploy to staging environment
- [ ] Internal QA testing (checklist below)
- [ ] Performance benchmarking
- [ ] Bug fixes and refinements

**QA Checklist:**
- [ ] Can query violations by WDID
- [ ] Filters work correctly (type, date, status)
- [ ] Enforcement timeline displays
- [ ] Facility matching >70% success
- [ ] No errors in server logs

#### Week 4-5: Beta Testing (Phase 2 Complete)

**Audience:** 10-20 trusted users (attorneys, compliance officers)
**Scope:** Violations + Enforcement + Inspections + Enhanced Facilities
**Environment:** Production (feature flags enabled for beta users only)

**Activities:**
- [ ] Invite beta users via email
- [ ] Provide user guide and tutorial
- [ ] Collect feedback (Google Form)
- [ ] Monitor error rates and performance
- [ ] Iterate based on feedback

**Beta User Selection:**
- San Francisco Baykeeper (existing user)
- Environmental Law Foundation
- Regional Water Board staff (if interested)
- 5-10 other active users

#### Week 6-7: Partial Rollout (Phase 3 In Progress)

**Audience:** 50% of users (randomly selected)
**Scope:** All features except monitoring data
**Environment:** Production

**Activities:**
- [ ] Enable feature flags for 50% of users (A/B test)
- [ ] Compare metrics (engagement, session duration)
- [ ] Monitor error rates
- [ ] Prepare for full rollout

**Rollback Criteria:**
- Error rate >5%
- API response time >5s (p95)
- User complaints >10% of beta users

#### Week 8-9: Full Release (Phase 3 Complete)

**Audience:** All users
**Scope:** Complete integrated platform
**Environment:** Production

**Activities:**
- [ ] Enable all feature flags for all users
- [ ] Publish announcement (blog post, email newsletter)
- [ ] Update documentation
- [ ] Monitor for 72 hours (critical period)
- [ ] Celebrate launch! 🎉

### Monitoring & Alerts

**Critical Alerts (Immediate Response):**
- Error rate >10% (last 15 minutes)
- API response time >10s (p95, last 15 minutes)
- Database CPU >90% (last 5 minutes)
- Weekly sync failure
- Database storage >90% capacity

**Warning Alerts (Review Within 24 Hours):**
- Error rate >5% (last hour)
- API response time >5s (p95, last hour)
- Database CPU >80% (last 15 minutes)
- Facility match rate <60%
- User feedback with negative sentiment

**Monitoring Dashboard:**
- Sentry (error tracking)
- Vercel Analytics (performance)
- Supabase Dashboard (database metrics)
- Google Analytics (user metrics)
- Custom dashboard (Grafana or similar)

### User Communication Plan

#### Pre-Launch (2 Weeks Before)

- [ ] Announce upcoming features via email
- [ ] Publish blog post explaining SMARTS integration
- [ ] Create video tutorial (2-3 minutes)
- [ ] Update documentation and help pages

**Email Template:**
```
Subject: Exciting New Features Coming to Stormwater Watch

Dear [User Name],

We're thrilled to announce major enhancements coming to Stormwater Watch in [Month]:

🔵 SMARTS Regulatory Violations: Official violations tracked by regional boards
⚖️ Enforcement Actions: Track notices, orders, and penalties
🔍 Inspections: View facility inspection records and findings
📊 Enhanced Facility Profiles: Comprehensive compliance history

These features will expand our platform from 5,000 to 93,000+ facilities across California.

Learn more: [Blog Post Link]
Watch tutorial: [Video Link]

Questions? Reply to this email.

Best,
The Stormwater Watch Team
```

#### Launch Day

- [ ] Send launch announcement email
- [ ] Post on social media (if applicable)
- [ ] Update homepage with banner
- [ ] Monitor user feedback channels

#### Post-Launch (1 Week After)

- [ ] Send follow-up email with usage tips
- [ ] Collect user feedback survey
- [ ] Analyze user adoption metrics
- [ ] Plan next iteration

---

## Decision Points

### Key Decisions Needed Before Implementation

#### Decision 1: Laboratory Design System Priority

**Question:** Should we implement Laboratory design system before, during, or after schema migration?

**Options:**

**A. Before Migration (Weeks 1-2 design, then migration)**
- **Pros:** Clean slate, no UI refactoring
- **Cons:** Delays data integration, two parallel workstreams

**B. During Migration (Parallel work)**
- **Pros:** Faster overall delivery
- **Cons:** Complex coordination, potential conflicts

**C. After Migration (Migration first, then redesign)** ⭐ **RECOMMENDED**
- **Pros:** Functional first, iterative improvement, less risky
- **Cons:** Users see old UI initially, double work

**Recommendation:** **Option C** - See UI_UX_REDESIGN.md Appendix (Section 8.2) for detailed rationale

**Stakeholder Input Required:** Product team approval

#### Decision 2: MVP Feature Set for Phase 1 Public Release

**Question:** What features should be publicly available after Phase 1?

**Options:**

**A. Violations + Enforcement Only** ⭐ **RECOMMENDED**
- Focused, high-value features
- Lower risk, faster time to market
- Missing: Inspections, monitoring data

**B. All Phases 1-2 (Add Inspections)**
- More complete picture
- Better user value
- Longer development time (5 weeks vs 3 weeks)

**C. Wait for All Phases (Complete Platform)**
- Comprehensive launch
- Maximum user value
- Significant delay (8-12 weeks)

**Recommendation:** **Option A** - Launch Phase 1 publicly, Phases 2-3 as enhancements

**Stakeholder Input Required:** Product strategy decision

#### Decision 3: Cron Strategy

**Question:** How should we orchestrate multiple SMARTS dataset syncs?

**Options:**

**A. Single Vercel Orchestrator** ⭐ **RECOMMENDED**
- Consolidate all syncs into one cron job
- Sequential execution with progress tracking
- Stays within Vercel 2-cron limit
- **Cost:** $0

**B. GitHub Actions Cron**
- Offload heavy processing to GitHub Actions
- Trigger Vercel API or write directly to database
- More reliable for large datasets
- **Cost:** $0 (free tier: 2000 min/month)

**C. Cloudflare Workers**
- Run cron on Cloudflare Workers
- Longer timeout limits (15 min paid tier)
- Connect directly to Supabase
- **Cost:** $5/month for cron triggers

**Recommendation:** **Option A** initially, fallback to **Option B** if timeouts

**Stakeholder Input Required:** Infrastructure decision (DevOps/Backend lead)

#### Decision 4: Facility Matching Threshold

**Question:** What confidence threshold for automated facility linking?

**Options:**

**A. 70% Threshold (Conservative)** ⭐ **RECOMMENDED**
- Auto-link only if confidence ≥0.70
- Manual review for 0.50-0.70
- Lower false positive rate
- More manual work required

**B. 80% Threshold (Moderate)**
- Auto-link only if confidence ≥0.80
- Manual review for 0.60-0.80
- Very low false positive rate
- Significant manual work

**C. 90% Threshold (Strict)**
- Auto-link only if confidence ≥0.90
- Manual review for <0.90
- Minimal false positives
- Most manual work

**Recommendation:** **Option A (70%)** based on research findings (Section 4.1 in data-schema-integration-analysis.md)

**Stakeholder Input Required:** Data quality vs efficiency tradeoff

#### Decision 5: Performance - When to Implement Partitioning?

**Question:** At what point should we implement table partitioning for monitoring data?

**Options:**

**A. Immediately (Week 6 with monitoring import)**
- Proactive optimization
- Future-proof
- More complex migration, higher risk

**B. If Queries >5 Seconds** ⭐ **RECOMMENDED**
- Reactive optimization
- Simpler initial implementation
- Add partitioning only if needed

**C. Never (Use Indexes Only)**
- Simplest approach
- May not scale to 10M+ records
- Risk: Performance degradation year 3+

**Recommendation:** **Option B** - Monitor performance, partition if needed

**Stakeholder Input Required:** Technical decision (Backend lead)

#### Decision 6: User Acceptance Criteria

**Question:** What defines "successful launch"?

**Suggested Criteria:**

**Must-Have (Launch Blockers):**
- [ ] Zero data loss during migration
- [ ] No downtime >5 minutes
- [ ] Existing eSMR features work unchanged
- [ ] Facility match rate >60%
- [ ] API response time <3s (p95)
- [ ] No critical bugs in beta testing

**Should-Have (Post-Launch Improvements):**
- [ ] Facility match rate >70%
- [ ] API response time <2s (p95)
- [ ] User satisfaction >4.0/5
- [ ] Case packet downloads >20/month

**Nice-to-Have (Future Enhancements):**
- [ ] Facility match rate >80%
- [ ] Laboratory design system implemented
- [ ] Predictive risk modeling

**Stakeholder Input Required:** Product team definition of success

---

## Timeline Scenarios

### Optimistic Scenario (7 Weeks)

**Assumptions:**
- No major blockers
- Smooth data imports
- Minimal bugs
- Single developer, 40h/week effective

| Week | Phase | Tasks | Hours |
|------|-------|-------|-------|
| **1** | Phase 1 | Schema migration, import infrastructure | 40 |
| **2** | Phase 1 | Data import, API development | 40 |
| **3** | Phase 1 | Facility matching, frontend, testing | 40 |
| **4** | Phase 2 | Facility import, inspections import | 40 |
| **5** | Phase 2 | API development, frontend enhancements | 40 |
| **6** | Phase 3 | Monitoring import, streaming parser | 40 |
| **7** | Phase 3 | Monitoring APIs, optimization, testing | 40 |

**Total:** 280 hours, 7 weeks

**Delivery:** End of Week 7, all phases complete

### Realistic Scenario (9 Weeks)

**Assumptions:**
- Expected complexity
- Some debugging required
- Moderate performance tuning
- Single developer, 35h/week effective

| Week | Phase | Tasks | Hours | Notes |
|------|-------|-------|-------|-------|
| **1** | Phase 1 | Schema migration, import setup | 35 | Extra time for staging tests |
| **2** | Phase 1 | Data import, validation | 35 | Data quality issues discovered |
| **3** | Phase 1 | API development, facility matching | 35 | |
| **4** | Phase 1 | Frontend, testing, bug fixes | 35 | Extra week for polish |
| **5** | Phase 2 | Facility import, enhanced linking | 35 | |
| **6** | Phase 2 | Inspections, API development, frontend | 35 | |
| **7** | Phase 3 | Monitoring infrastructure | 35 | Streaming parser complexity |
| **8** | Phase 3 | Monitoring import, optimization | 35 | Performance tuning required |
| **9** | Phase 3 | Final testing, documentation, launch | 35 | Buffer for unexpected issues |

**Total:** 315 hours, 9 weeks

**Delivery:** End of Week 9, all phases complete + polish

### Pessimistic Scenario (12 Weeks)

**Assumptions:**
- Significant blockers
- Data quality issues require rework
- Performance problems
- Learning curve
- Single developer, 30h/week effective

| Week | Phase | Tasks | Hours | Blockers |
|------|-------|-------|-------|----------|
| **1** | Phase 1 | Schema migration | 30 | Staging database setup delays |
| **2** | Phase 1 | Import infrastructure | 30 | Data transformation complexity |
| **3** | Phase 1 | Data import debugging | 30 | Validation errors, null handling |
| **4** | Phase 1 | API development | 30 | Query optimization required |
| **5** | Phase 1 | Facility matching, frontend | 30 | Matching accuracy issues |
| **6** | Phase 1 | Testing, bug fixes, rework | 30 | User feedback requires changes |
| **7** | Phase 2 | Facility import | 30 | |
| **8** | Phase 2 | Inspections, enhanced linking | 30 | M:N relationship complexity |
| **9** | Phase 2 | API development, frontend, testing | 30 | |
| **10** | Phase 3 | Monitoring infrastructure | 30 | Streaming parser challenges |
| **11** | Phase 3 | Monitoring import, debugging | 30 | Memory issues, timeout handling |
| **12** | Phase 3 | Optimization, final testing, launch | 30 | Performance tuning required |

**Total:** 360 hours, 12 weeks

**Delivery:** End of Week 12, all phases complete + extensive debugging

### Timeline Comparison

| Scenario | Duration | Total Hours | Weeks/40h | Probability | Risk Level |
|----------|----------|-------------|-----------|-------------|------------|
| **Optimistic** | 7 weeks | 280h | 7 weeks | 20% | Low |
| **Realistic** | 9 weeks | 315h | 7.9 weeks | 60% | Medium |
| **Pessimistic** | 12 weeks | 360h | 9 weeks | 20% | High |

**RECOMMENDED PLANNING:** Budget for **9-10 weeks** (realistic scenario + 1 week buffer)

---

## Appendices

### Appendix A: Migration SQL Scripts

#### Schema Migration (Additive Only)

```sql
-- Migration: Add SMARTS tables
-- Date: 2025-12-06
-- No destructive changes, all additive

BEGIN;

-- 1. Extend Facility table with SMARTS links
ALTER TABLE "Facility"
  ADD COLUMN IF NOT EXISTS "smartsWdid" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "smartsAppId" VARCHAR(50);

CREATE INDEX IF NOT EXISTS "Facility_smartsWdid_smartsAppId_idx"
  ON "Facility" ("smartsWdid", "smartsAppId");

-- 2. Create SMARTS Facility table
CREATE TABLE IF NOT EXISTS "smarts_facilities" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  wdid VARCHAR(50) NOT NULL,
  app_id VARCHAR(50) NOT NULL,
  permit_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  facility_name VARCHAR(200),
  facility_latitude DECIMAL(9,6),
  facility_longitude DECIMAL(9,6),
  county VARCHAR(100),
  regional_board VARCHAR(10),
  operator_name VARCHAR(200),
  primary_sic VARCHAR(100),
  secondary_sic VARCHAR(100),
  noi_processed_date DATE,
  not_effective_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT smarts_facility_unique UNIQUE (wdid, app_id)
);

CREATE INDEX idx_smarts_facilities_wdid_appid ON smarts_facilities (wdid, app_id);
CREATE INDEX idx_smarts_facilities_permit_type ON smarts_facilities (permit_type);
CREATE INDEX idx_smarts_facilities_status ON smarts_facilities (status);
CREATE INDEX idx_smarts_facilities_county ON smarts_facilities (county);

-- 3. Create SMARTS Violations table
CREATE TABLE IF NOT EXISTS "smarts_violations" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  wdid VARCHAR(50) NOT NULL,
  app_id VARCHAR(50) NOT NULL,
  violation_id VARCHAR(50) NOT NULL,
  violation_source VARCHAR(100),
  violation_source_id VARCHAR(50),
  violation_type VARCHAR(200),
  serious_violation BOOLEAN,
  violation_priority VARCHAR(20),
  occurrence_date DATE,
  discovery_date DATE,
  determined_by VARCHAR(100),
  exempt_from_mmp BOOLEAN,
  memo TEXT,
  description TEXT,
  violation_status VARCHAR(50),
  linked_enforcement BOOLEAN,
  permit_type VARCHAR(50),
  regional_board VARCHAR(10),
  place_name VARCHAR(200),
  place_latitude DECIMAL(9,6),
  place_longitude DECIMAL(9,6),
  place_county VARCHAR(100),
  receiving_water_name VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT smarts_violation_unique UNIQUE (wdid, app_id, violation_id)
);

CREATE INDEX idx_smarts_violations_wdid_appid ON smarts_violations (wdid, app_id);
CREATE INDEX idx_smarts_violations_occurrence_date ON smarts_violations (occurrence_date DESC);
CREATE INDEX idx_smarts_violations_type ON smarts_violations (violation_type);
CREATE INDEX idx_smarts_violations_status ON smarts_violations (violation_status);
CREATE INDEX idx_smarts_violations_serious ON smarts_violations (serious_violation) WHERE serious_violation = true;
CREATE INDEX idx_smarts_violations_wdid_date_type ON smarts_violations (wdid, app_id, occurrence_date, violation_type);

-- 4. Create SMARTS Enforcement Actions table
CREATE TABLE IF NOT EXISTS "smarts_enforcement_actions" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  wdid VARCHAR(50) NOT NULL,
  app_id VARCHAR(50) NOT NULL,
  enforcement_id VARCHAR(50) NOT NULL,
  violation_wdid VARCHAR(50),
  violation_app_id VARCHAR(50),
  violation_id VARCHAR(50),
  enforcement_type VARCHAR(100),
  enforcement_status VARCHAR(50),
  issuance_date DATE,
  due_date DATE,
  description TEXT,
  corrective_action TEXT,
  order_number VARCHAR(100),
  economic_benefits DECIMAL(12,2),
  total_max_liability DECIMAL(12,2),
  staff_costs DECIMAL(12,2),
  initial_assessment DECIMAL(12,2),
  total_assessment DECIMAL(12,2),
  received_amount DECIMAL(12,2),
  spent_amount DECIMAL(12,2),
  balance_due DECIMAL(12,2),
  count_of_violations INTEGER,
  permit_type VARCHAR(50),
  regional_board VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT smarts_enforcement_unique UNIQUE (wdid, app_id, enforcement_id)
);

CREATE INDEX idx_smarts_enforcement_wdid_appid ON smarts_enforcement_actions (wdid, app_id);
CREATE INDEX idx_smarts_enforcement_issuance_date ON smarts_enforcement_actions (issuance_date DESC);
CREATE INDEX idx_smarts_enforcement_type ON smarts_enforcement_actions (enforcement_type);
CREATE INDEX idx_smarts_enforcement_status ON smarts_enforcement_actions (enforcement_status);
CREATE INDEX idx_smarts_enforcement_violation ON smarts_enforcement_actions (violation_wdid, violation_app_id, violation_id);

-- 5. Create SMARTS Inspections table
CREATE TABLE IF NOT EXISTS "smarts_inspections" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  wdid VARCHAR(50) NOT NULL,
  app_id VARCHAR(50) NOT NULL,
  inspection_id VARCHAR(50) NOT NULL,
  inspection_classification VARCHAR(100),
  inspection_start_time TIME,
  inspection_end_time TIME,
  inspection_status VARCHAR(50),
  inspection_purpose VARCHAR(200),
  inspection_date DATE,
  inspection_contact VARCHAR(200),
  inspector_type VARCHAR(50),
  inspector_name VARCHAR(200),
  agency_name VARCHAR(200),
  follow_up_action VARCHAR(200),
  general_notes TEXT,
  virtual_inspection BOOLEAN,
  count_of_violations INTEGER,
  final_report_upload_date DATE,
  permit_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT smarts_inspection_unique UNIQUE (wdid, app_id, inspection_id)
);

CREATE INDEX idx_smarts_inspections_wdid_appid ON smarts_inspections (wdid, app_id);
CREATE INDEX idx_smarts_inspections_date ON smarts_inspections (inspection_date DESC);
CREATE INDEX idx_smarts_inspections_purpose ON smarts_inspections (inspection_purpose);
CREATE INDEX idx_smarts_inspections_with_violations ON smarts_inspections (count_of_violations) WHERE count_of_violations > 0;

-- 6. Create M:N linking table for Inspections ↔ Violations
CREATE TABLE IF NOT EXISTS "smarts_inspection_violation_links" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  inspection_wdid VARCHAR(50) NOT NULL,
  inspection_app_id VARCHAR(50) NOT NULL,
  inspection_id VARCHAR(50) NOT NULL,
  violation_wdid VARCHAR(50) NOT NULL,
  violation_app_id VARCHAR(50) NOT NULL,
  violation_id VARCHAR(50) NOT NULL,
  link_method VARCHAR(50) NOT NULL, -- 'EXPLICIT' or 'HEURISTIC'
  confidence DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT inspection_violation_link_unique UNIQUE (
    inspection_wdid, inspection_app_id, inspection_id,
    violation_wdid, violation_app_id, violation_id
  )
);

CREATE INDEX idx_insp_viol_links_inspection ON smarts_inspection_violation_links
  (inspection_wdid, inspection_app_id, inspection_id);
CREATE INDEX idx_insp_viol_links_violation ON smarts_inspection_violation_links
  (violation_wdid, violation_app_id, violation_id);

-- 7. Create SMARTS Monitoring Reports table
CREATE TABLE IF NOT EXISTS "smarts_monitoring_reports" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  wdid VARCHAR(50) NOT NULL,
  app_id VARCHAR(50) NOT NULL,
  report_id VARCHAR(50) NOT NULL,
  report_year INTEGER NOT NULL,
  event_type VARCHAR(100),
  monitoring_location_name VARCHAR(200),
  monitoring_location_type VARCHAR(100),
  monitoring_latitude DECIMAL(9,6),
  monitoring_longitude DECIMAL(9,6),
  discharge_start_date DATE,
  discharge_start_time TIME,
  discharge_end_date DATE,
  discharge_end_time TIME,
  certifier_name VARCHAR(200),
  certified_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT smarts_monitoring_report_unique UNIQUE (wdid, app_id, report_id)
);

CREATE INDEX idx_smarts_monitoring_reports_wdid_appid ON smarts_monitoring_reports (wdid, app_id);
CREATE INDEX idx_smarts_monitoring_reports_report_id ON smarts_monitoring_reports (report_id);
CREATE INDEX idx_smarts_monitoring_reports_year ON smarts_monitoring_reports (report_year);

-- 8. Create SMARTS Monitoring Samples table (LARGE - 8.3M records)
CREATE TABLE IF NOT EXISTS "smarts_monitoring_samples" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  report_wdid VARCHAR(50) NOT NULL,
  report_app_id VARCHAR(50) NOT NULL,
  report_id VARCHAR(50) NOT NULL,
  sample_id VARCHAR(50) NOT NULL,
  sample_date DATE NOT NULL,
  sample_time TIME,
  parameter VARCHAR(200) NOT NULL,
  result_qualifier VARCHAR(10),
  result DECIMAL(18,6),
  units VARCHAR(50),
  analytical_method VARCHAR(100),
  mdl DECIMAL(18,6),
  rl DECIMAL(18,6),
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT smarts_monitoring_sample_unique UNIQUE (
    report_wdid, report_app_id, report_id, sample_id, parameter, sample_date
  )
);

CREATE INDEX idx_smarts_monitoring_samples_report ON smarts_monitoring_samples
  (report_wdid, report_app_id, report_id);
CREATE INDEX idx_smarts_monitoring_samples_date ON smarts_monitoring_samples (sample_date DESC);
CREATE INDEX idx_smarts_monitoring_samples_parameter ON smarts_monitoring_samples (parameter);
CREATE INDEX idx_smarts_monitoring_samples_wdid_date_param ON smarts_monitoring_samples
  (report_wdid, sample_date, parameter);

-- 9. Create Import Log table
CREATE TABLE IF NOT EXISTS "smarts_import_logs" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  data_type VARCHAR(50) NOT NULL, -- 'violations', 'enforcement', etc.
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(20) NOT NULL, -- 'running', 'completed', 'failed'
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  errors JSONB,
  notes TEXT
);

CREATE INDEX idx_smarts_import_logs_data_type ON smarts_import_logs (data_type, started_at DESC);
CREATE INDEX idx_smarts_import_logs_status ON smarts_import_logs (status);

-- 10. Create Facility Link table (manual/automated matching)
CREATE TABLE IF NOT EXISTS "facility_links" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  facility_id TEXT NOT NULL,
  esmr_facility_id INTEGER,
  smarts_wdid VARCHAR(50),
  smarts_app_id VARCHAR(50),
  link_method VARCHAR(20) NOT NULL, -- 'DIRECT', 'FUZZY', 'MANUAL'
  confidence DECIMAL(3,2) NOT NULL,
  notes TEXT,
  verified_by VARCHAR(200),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT facility_link_unique UNIQUE (facility_id)
);

CREATE INDEX idx_facility_links_esmr ON facility_links (esmr_facility_id);
CREATE INDEX idx_facility_links_smarts ON facility_links (smarts_wdid, smarts_app_id);
CREATE INDEX idx_facility_links_method_confidence ON facility_links (link_method, confidence);

-- 11. Create Data Quality Issue tracker
CREATE TABLE IF NOT EXISTS "data_quality_issues" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  table_name VARCHAR(100) NOT NULL,
  record_id TEXT,
  issue_type VARCHAR(100) NOT NULL, -- 'MISSING_REQUIRED', 'INVALID_FORMAT', 'ORPHANED', etc.
  issue_description TEXT,
  severity VARCHAR(20), -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_data_quality_issues_table ON data_quality_issues (table_name, resolved);
CREATE INDEX idx_data_quality_issues_severity ON data_quality_issues (severity) WHERE NOT resolved;

-- 12. Create Geocode Cache (for future geocoding of missing coords)
CREATE TABLE IF NOT EXISTS "geocode_cache" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  address TEXT NOT NULL UNIQUE,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  geocoded_at TIMESTAMP DEFAULT NOW(),
  geocode_source VARCHAR(50) -- 'Google', 'Mapbox', etc.
);

CREATE INDEX idx_geocode_cache_coords ON geocode_cache (latitude, longitude);

COMMIT;
```

#### Rollback Script

```sql
-- Rollback: Drop SMARTS tables
-- USE WITH CAUTION - This deletes all SMARTS data

BEGIN;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS "smarts_monitoring_samples" CASCADE;
DROP TABLE IF EXISTS "smarts_monitoring_reports" CASCADE;
DROP TABLE IF EXISTS "smarts_inspection_violation_links" CASCADE;
DROP TABLE IF EXISTS "smarts_inspections" CASCADE;
DROP TABLE IF EXISTS "smarts_enforcement_actions" CASCADE;
DROP TABLE IF EXISTS "smarts_violations" CASCADE;
DROP TABLE IF EXISTS "smarts_facilities" CASCADE;
DROP TABLE IF EXISTS "smarts_import_logs" CASCADE;
DROP TABLE IF EXISTS "facility_links" CASCADE;
DROP TABLE IF EXISTS "data_quality_issues" CASCADE;
DROP TABLE IF EXISTS "geocode_cache" CASCADE;

-- Revert Facility table changes
ALTER TABLE "Facility" DROP COLUMN IF EXISTS "smartsWdid";
ALTER TABLE "Facility" DROP COLUMN IF EXISTS "smartsAppId";

COMMIT;
```

### Appendix B: Import Script Templates

See `/scripts/` directory for complete import scripts:
- `import-smarts-violations.ts`
- `import-smarts-enforcement.ts`
- `import-smarts-facilities.ts`
- `import-smarts-inspections.ts`
- `import-smarts-monitoring.ts` (with streaming)

### Appendix C: API Endpoint Specifications

See `/docs/architecture/BACKEND_REDESIGN.md` Section 2 for complete API specs.

### Appendix D: Component Library

See `/docs/UI_UX_REDESIGN.md` Section 3 for complete component specifications.

---

**Document Status:** ✅ Complete
**Next Action:** Review with stakeholders, obtain approvals, begin Phase 1 implementation

**Questions or Feedback:** Contact project lead or leave comments in GitHub issue.

---

*Generated by: Claude Sonnet 4.5*
*Date: December 6, 2025*
*Version: 1.0*
