<objective>
Create a detailed implementation roadmap and database migration plan for integrating SMARTS data into Stormwater Watch. Build on the research 3-phase plan with specific tasks, timelines, resource estimates, risk assessments, and success metrics.
</objective>

<context>
**Research Foundation:**
@research/data-schema-integration-analysis.md - 3-phase plan (7-11 weeks)
@research/SCHEMA_INTEGRATION_SUMMARY.md - Implementation checklist
@prompts/003-smarts-ciwqs-automation-strategy.md - Automation approach

**Schema Migration:**
@prisma/schema.prisma - Current (10 tables)
@prisma/schema-integrated-proposed.prisma - Target (24 tables)

**Infrastructure:**
@vercel.json - Deployment config
@research/cron-consolidation-and-alternatives.md - Cron strategy

**Challenge:**
Migrate from 10-table eSMR schema to 24-table integrated schema with minimal downtime while adding 8.5M records.
</context>

<scope>
Create comprehensive implementation plan:

## 1. Phased Implementation Breakdown

### Phase 1: Violations + Enforcement (Weeks 1-3)
**Backend Tasks:**
- [ ] Prisma schema migration (violations, enforcement tables)
- [ ] Data sync cron for violations CSV
- [ ] Data sync cron for enforcement CSV
- [ ] Facility matching service (first iteration)
- [ ] API endpoints: /api/violations, /api/enforcement
- [ ] Violation linkage logic

**Frontend Tasks:**
- [ ] /violations page with table
- [ ] /enforcement page with table
- [ ] Filter components
- [ ] Violation badges/indicators

**Time Estimate:** 60-80 hours
**Dependencies:** None (greenfield)
**Risk Level:** Medium

### Phase 2: Inspections + Enhanced Facilities (Weeks 4-5)
**Backend Tasks:**
- [ ] Inspection tables migration
- [ ] Facility info tables (industrial, construction)
- [ ] Inspection sync cron
- [ ] Facility sync crons (2 datasets)
- [ ] Enhanced facility aggregation API
- [ ] Inspection-violation linkage

**Frontend Tasks:**
- [ ] /inspections page
- [ ] Enhanced /facilities/[id] with tabs
- [ ] Facility type indicators
- [ ] Compliance timeline component

**Time Estimate:** 30-40 hours
**Dependencies:** Phase 1 facility matching
**Risk Level:** Low-Medium

### Phase 3: Monitoring Data (Weeks 6-8)
**Backend Tasks:**
- [ ] Monitoring sample tables (8.3M records)
- [ ] Streaming CSV parser (handles 644MB files)
- [ ] Monitoring data sync cron
- [ ] Query optimization for large tables
- [ ] Database partitioning if needed

**Frontend Tasks:**
- [ ] Monitoring data visualization
- [ ] Sample detail views
- [ ] Performance optimization (pagination, virtualization)

**Time Estimate:** 60-80 hours
**Dependencies:** Phases 1-2 complete
**Risk Level:** High (performance critical)

## 2. Database Migration Strategy

**Pre-Migration:**
1. Backup current database
2. Test migration on staging
3. Validate data integrity
4. Create rollback scripts

**Migration Steps:**
1. Run Prisma migration (add new tables)
2. Preserve existing eSMR data
3. Initial SMARTS data load (run locally)
4. Facility matching batch job
5. Verify data relationships
6. Enable weekly sync crons

**Downtime Estimate:** 2-4 hours
**Rollback Plan:** Restore from backup, revert migration

## 3. Testing Strategy

**Per Phase:**
- Unit tests for new services
- Integration tests for API endpoints
- E2E tests for critical user journeys
- Performance tests for large tables
- Data quality validation

**Critical Test Scenarios:**
- Facility matching accuracy (spot check 100 facilities)
- Query performance (<2s for typical queries)
- Data sync reliability (error handling)
- Cross-dataset consistency

## 4. Risk Assessment

**Technical Risks:**
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Performance degradation | High | High | Query optimization, caching, indexes |
| Facility matching errors | Medium | Medium | Manual review queue, confidence scoring |
| Data quality issues | High | Medium | Validation rules, sanitization |
| Migration failures | Low | High | Staging tests, rollback plan |
| Vercel timeout (monitoring data) | High | High | Queue-based processing or GitHub Actions |

**UX Risks:**
- User confusion with two violation types
- Navigation complexity
- Information overload

**Mitigation:** Progressive disclosure, tooltips, guided tours

## 5. Resource Requirements

**Development Time:**
- Phase 1: 60-80 hours
- Phase 2: 30-40 hours
- Phase 3: 60-80 hours
- Testing: 40-60 hours
- **Total: 190-260 hours (5-7 weeks)**

**Infrastructure Costs:**
- Database: +6.5 GB initial, +700 MB/year
- Supabase: Likely stays within free tier
- Vercel: Free tier (with cron consolidation)
- **Estimated: $0-5/month**

**Timeline Projection:**
- Optimistic: 7 weeks
- Realistic: 9 weeks
- Pessimistic: 12 weeks

## 6. Success Metrics

**Data Quality:**
- Facility match rate >70% automated
- Data sync success rate >95%
- Null value % <10% for critical fields

**Performance:**
- API response time <2s (p95)
- Dashboard load time <3s
- Facility detail page <2s

**User Adoption:**
- Active users +50% within 3 months
- Avg session duration +30%
- Feature usage (violations, enforcement)

## 7. Decision Points

**Key Decisions Needed:**
1. **Laboratory + Schema Priority:** Which first?
2. **MVP Features:** What's in Phase 1 public release?
3. **Cron Strategy:** Vercel orchestrator or GitHub Actions?
4. **Facility Matching:** Automated threshold? (70%, 80%, 90%?)
5. **Performance:** When to implement partitioning?

**Stakeholder Input Required:**
- Feature prioritization
- Timeline constraints
- Budget approval
- User acceptance criteria

## 8. Rollout Strategy

**Feature Flags:**
- `ENABLE_SMARTS_VIOLATIONS`
- `ENABLE_ENFORCEMENT_TRACKING`
- `ENABLE_INSPECTIONS`
- `ENABLE_FACILITY_MATCHING`

**Gradual Rollout:**
1. Internal testing (1 week)
2. Beta users (2 weeks)
3. Partial rollout (50% users)
4. Full release

**Monitoring:**
- Error rates per endpoint
- Query performance metrics
- User feedback collection
- Data sync job logs
</scope>

<deliverables>
Create implementation documents:

## Implementation Roadmap
**Save to:** `./docs/IMPLEMENTATION_ROADMAP.md`

### 1. Phase Breakdown
- Detailed task lists per phase
- Time estimates with ranges
- Dependencies explicitly stated
- Success criteria per phase

### 2. Migration Plan
- Step-by-step migration procedure
- Pre-migration checklist
- Rollback procedures
- Downtime estimation

### 3. Testing Strategy
- Test plan per phase
- Critical test scenarios
- Performance benchmarks
- Data validation procedures

### 4. Risk Register
- Complete risk assessment
- Mitigation strategies
- Contingency plans
- Early warning indicators

### 5. Resource Plan
- Development hours breakdown
- Infrastructure cost projections
- Timeline scenarios (optimistic/realistic/pessimistic)
- Team allocation

### 6. Success Metrics
- KPIs per category
- Measurement methodology
- Target values
- Monitoring dashboard design

### 7. Rollout Plan
- Feature flag strategy
- Gradual rollout schedule
- Monitoring and alerts
- User communication plan
</deliverables>

<success_criteria>
- [ ] 3 phases detailed with task breakdowns
- [ ] Migration procedure step-by-step
- [ ] Risk assessment with mitigations
- [ ] Resource estimates (time, cost)
- [ ] Success metrics defined
- [ ] Rollout strategy documented
- [ ] Decision points identified
</success_criteria>
