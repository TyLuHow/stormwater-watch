<objective>
Analyze how the integrated eSMR + SMARTS schema (24 tables, 8.5M records) should reshape the backend architecture, data flows, API design, and service layer of Stormwater Watch. Focus on technical architecture changes needed to support the new data model.
</objective>

<context>
**Schema Research:**
@research/data-schema-integration-analysis.md - Complete analysis
@prisma/schema-integrated-proposed.prisma - Production schema (24 tables)
@prisma/schema.prisma - Current schema (10 tables)

**Current Backend:**
@app/api/**/*.ts - Existing API routes
@lib/**/*.ts - Utility functions and services
@app/api/cron/esmr-sync/route.ts - Data sync pattern

**Challenge:**
Transform from eSMR-only backend to integrated system supporting 8 datasets with complex relationships.
</context>

<scope>
Analyze and design:

## 1. Schema Impact Assessment
- Breaking changes from schema migration
- New entity types (violations, enforcement, inspections)
- Relationship complexity (M:N patterns)
- Data type changes and migrations

## 2. API Redesign
**New Endpoints Needed:**
- `/api/violations` - SMARTS violations (32K records)
- `/api/enforcement` - Enforcement actions (29K)
- `/api/inspections` - Inspection records (45K)
- `/api/facilities/[id]/complete` - Unified facility data

**Modified Endpoints:**
- `/api/facilities` - Now handles 93K facilities
- `/api/violations` (currently eSMR computed) - How to integrate both types?
- Dashboard APIs - Multi-source aggregation

**Query Patterns:**
- Cross-dataset queries (facility → all related data)
- Aggregations for analytics
- Real-time vs cached data decisions

## 3. Service Layer Design
**Facility Matching Service:**
- 3-tier matching (direct → fuzzy → manual)
- API: `matchFacility(esmrId, smartsWdid)`
- Confidence scoring
- Manual review queue

**Violation Engine:**
- eSMR computed violations (from samples)
- SMARTS regulatory violations (from dataset)
- Unified violation interface
- Deduplication strategy

**Data Sync Orchestrator:**
- eSMR weekly sync (existing)
- SMARTS 7-dataset sync (new)
- Facility matching automation
- Error handling and retry

## 4. Data Flow Diagrams
Create ASCII diagrams for:
- Facility data aggregation flow
- Violation detection and tracking
- Enforcement action linkage
- Cross-system query patterns

## 5. Caching Strategy
- What to cache (8.5M records can't all be in memory)
- Cache invalidation strategy
- Redis vs in-memory vs CDN
- Query result caching

## 6. Performance Optimization
- 87 database indexes - which are critical?
- Query optimization patterns
- Pagination strategy for large tables
- Database connection pooling
</scope>

<deliverables>
Create architecture document:

## Architecture Redesign Document
**Save to:** `./docs/architecture/BACKEND_REDESIGN.md`

### 1. Schema Migration Impact
- Breaking changes list
- Entity relationship diagram (ASCII)
- Data type mappings

### 2. API Endpoint Specification
- Complete API inventory (new + modified)
- Request/response schemas
- Query parameter options
- Pagination patterns

### 3. Service Layer Design
- Service class diagrams
- Facility matching algorithm
- Violation engine architecture
- Data sync orchestration

### 4. Data Flow Diagrams
- Facility aggregation flow
- Violation tracking flow
- Cross-system queries

### 5. Performance Strategy
- Caching architecture
- Index recommendations
- Query optimization guidelines
- Load testing scenarios

### 6. Code Structure
- Recommended file organization
- Service layer patterns
- API route patterns
- Type definitions strategy
</deliverables>

<success_criteria>
- [ ] All 14 new SMARTS tables mapped to services
- [ ] API endpoint specifications complete
- [ ] Facility matching algorithm designed
- [ ] Caching strategy defined
- [ ] Performance optimization plan created
- [ ] Data flow diagrams clear and complete
</success_criteria>
