<objective>
Thoroughly analyze how the comprehensive schema research findings should reshape the entire Stormwater Watch application - from architecture and data flows to UI/UX and features. Create a complete system redesign plan that aligns the application with the newly integrated eSMR + SMARTS data model.

This analysis will produce a detailed implementation roadmap that guides the evolution of Stormwater Watch from its current eSMR-only state to a comprehensive environmental compliance platform integrating all 8 datasets.
</objective>

<context>
**Schema Research Findings:**
The data schema integration research (prompt 008) revealed:
- 24 total database tables (10 eSMR + 14 SMARTS)
- 8.5M records across 8 datasets
- Complex M:N relationships (violations ↔ enforcement, inspections ↔ violations)
- Facility matching challenges (eSMR numeric IDs vs SMARTS WDID strings)
- 3-phase implementation plan (7-11 weeks)

**Research Artifacts to Review:**
@research/data-schema-integration-analysis.md - Complete schema analysis
@prisma/schema-integrated-proposed.prisma - Production-ready schema
@research/SCHEMA_INTEGRATION_SUMMARY.md - Executive summary
@prompts/003-smarts-ciwqs-automation-strategy.md - SMARTS automation approach

**Current Application State:**
@app/page.tsx - Main dashboard
@app/facilities/[id]/page.tsx - Facility detail pages
@prisma/schema.prisma - Current eSMR-only schema
@components/dashboard/*.tsx - Dashboard components
@app/api/**/*.ts - API routes

**New Todo Context:**
@TO-DOS.md - Laboratory design system refactor planned

**Goal:**
Transform Stormwater Watch into a comprehensive platform that leverages all integrated datasets while maintaining performance, usability, and the nonprofit mission.
</context>

<scope>
Perform a comprehensive system redesign analysis covering:

## Part 1: Architecture Impact Analysis

**Data Layer Changes:**
- How does the new schema (24 tables vs 10) affect data fetching patterns?
- New API endpoints needed for SMARTS entities
- Caching strategy for 8.5M records
- Real-time vs batch data access patterns

**Backend Services:**
- Facility matching service (3-tier: direct → fuzzy → manual)
- Violation computation engine (eSMR computed + SMARTS regulatory)
- Enforcement action tracking
- Inspection correlation service

**Integration Points:**
- How do eSMR violations and SMARTS violations coexist?
- Linking facilities across systems
- Cross-dataset queries (e.g., "show all data for facility X")
- Data consistency and conflict resolution

## Part 2: Feature Set Evolution

**New Features Enabled by SMARTS Data:**

1. **Regulatory Violations Dashboard**
   - SMARTS violations (32K records)
   - Different from eSMR computed violations
   - Enforcement action tracking (29K actions)
   - Violation → Enforcement timeline view

2. **Comprehensive Facility Profiles**
   - eSMR monitoring data + SMARTS regulatory data
   - Construction vs Industrial facility types
   - Inspection history (45K inspections)
   - Permit status and compliance tracking

3. **Enforcement Intelligence**
   - Enforcement action database (29K actions)
   - Penalty tracking and trends
   - Repeat offender identification (across both systems)
   - Regional enforcement patterns

4. **Inspection Management**
   - Inspection records (45K)
   - Inspection → Violation linkage
   - Inspector assignment and tracking
   - Inspection finding categorization

5. **Advanced Analytics**
   - Cross-system trend analysis
   - Predictive violation risk modeling
   - Regional compliance scorecards
   - Multi-dataset reporting

**Features That Need Redesign:**

1. **Facility Search & Filtering**
   - Now includes 93K facilities (vs current smaller set)
   - Filter by facility type (Industrial, Construction)
   - Filter by permit status, region, violation history

2. **Dashboard Views**
   - Separate views for eSMR monitoring vs SMARTS regulatory
   - Unified facility view combining both
   - Alert system (needs to handle both violation types)

3. **Map Visualization**
   - 60% of construction facilities missing coordinates
   - Need fallback display strategies
   - Layer controls for different data types

## Part 3: UI/UX Redesign Requirements

**Navigation Structure:**
- Current: Simple facility list + detail pages
- Needed: Multi-level navigation for different data types
- How does Laboratory design system (from todos) fit?

**New Page/View Requirements:**

1. **Violations Page** (`/violations`)
   - List all SMARTS violations (32K)
   - Filter by type, severity, status, facility
   - Link to enforcement actions

2. **Enforcement Page** (`/enforcement`)
   - Enforcement action database
   - Penalty tracking and statistics
   - Link to originating violations

3. **Inspections Page** (`/inspections`)
   - Inspection records and findings
   - Inspector tracking
   - Facility compliance history

4. **Enhanced Facility Page** (`/facilities/[id]`)
   - Tabbed interface:
     - Overview (current data)
     - eSMR Monitoring (samples, violations)
     - SMARTS Regulatory (permits, inspections)
     - Enforcement History
     - Compliance Timeline

5. **Analytics Dashboard** (`/analytics`)
   - Cross-system insights
   - Regional trends
   - Predictive analytics

**Component Architecture:**
- Reusable data table components (87K-8.5M records)
- Pagination/virtualization strategy
- Filter component patterns
- Timeline/history visualizations
- Violation severity indicators
- Enforcement status badges

## Part 4: Data Migration & Deployment Strategy

**Database Migration:**
- From current schema → integrated schema
- Data preservation strategy
- Rollback plan
- Downtime estimation

**Phased Deployment:**
- Phase 1: Violations + Enforcement (backend + UI)
- Phase 2: Inspections + Facilities (enhanced profiles)
- Phase 3: Monitoring Data (8.3M samples)
- Feature flags for gradual rollout

**Performance Considerations:**
- How to handle 87 indexes in production?
- Query optimization for large tables
- Database partitioning needs
- CDN/caching strategy

## Part 5: Technical Debt & Refactoring

**Identify Required Refactors:**
- Current components that assume single data source
- API routes that need multi-source aggregation
- Type definitions (Prisma regeneration impacts)
- Testing strategy for new complexity

**Code Organization:**
- Service layer for facility matching
- Data aggregation utilities
- Cross-dataset query builders
- Validation/sanitization for SMARTS data (quality issues)

## Part 6: Laboratory Design System Integration

**Alignment Analysis:**
The Laboratory design system (from todos) should:
- Support tabbed interfaces for multi-source data
- Clinical aesthetic for regulatory compliance data
- Data table designs for large datasets
- Dashboard layouts for analytics

**Questions to Answer:**
- Should Laboratory redesign happen before/during/after schema migration?
- Which redesign effort takes priority?
- Can they be combined or must they be sequential?

## Part 7: User Experience Flow Redesign

**Primary User Journeys:**

1. **Environmental Attorney**
   - Find facilities with violations → Gather enforcement history → Export case packet
   - Current: Limited to eSMR violations
   - Future: Comprehensive regulatory + monitoring violations

2. **Compliance Officer**
   - Monitor region for new violations → Review inspection findings → Track enforcement
   - Current: Dashboard with alerts
   - Future: Multi-source dashboard with predictive insights

3. **Researcher**
   - Analyze regional trends → Compare facility performance → Generate reports
   - Current: Basic analytics
   - Future: Advanced cross-system analytics

**Information Architecture:**
- How should users navigate between eSMR and SMARTS data?
- Unified vs separate interfaces?
- Progressive disclosure strategy for complex data
</scope>

<deliverables>
Create a comprehensive system redesign document with:

## 1. Executive Summary
- Impact assessment of schema changes
- Top 5 architectural changes required
- Top 5 new features enabled
- Implementation complexity score (1-10)

## 2. Architecture Redesign
- Updated system architecture diagram (ASCII)
- Data flow diagrams for new features
- API endpoint inventory (new + modified)
- Service layer design
- Caching strategy

## 3. Feature Roadmap
- Prioritized list of new features
- Feature complexity estimates
- Dependencies between features
- MVP feature set vs future enhancements

## 4. UI/UX Redesign Plan
- New page requirements with wireframe descriptions
- Component inventory (new + modified)
- Navigation structure redesign
- Integration with Laboratory design system

## 5. Database Migration Plan
- Step-by-step migration procedure
- Data validation checkpoints
- Rollback procedures
- Estimated downtime

## 6. Implementation Phases
- Detailed phase breakdown (expand on 3-phase from research)
- Tasks per phase with time estimates
- Dependencies and critical path
- Testing strategy per phase

## 7. Risk Assessment
- Technical risks and mitigations
- User experience risks
- Performance risks
- Data quality risks

## 8. Resource Requirements
- Development time estimates (total hours)
- Infrastructure needs (database size, compute)
- Third-party service costs
- Timeline projection

## 9. Success Metrics
- How to measure successful integration
- Performance benchmarks
- User adoption metrics
- Data quality KPIs

## 10. Decision Points
- Key decisions that need stakeholder input
- Architecture trade-offs to evaluate
- Priority conflicts to resolve

Save comprehensive analysis to: `./docs/SYSTEM_REDESIGN_PLAN.md`
Save implementation roadmap to: `./docs/IMPLEMENTATION_ROADMAP.md`
Save architecture diagrams to: `./docs/architecture/`
</deliverables>

<analysis_methodology>

**Step 1: Schema Impact Assessment**
1. Read @prisma/schema-integrated-proposed.prisma
2. Compare to @prisma/schema.prisma (current)
3. Identify breaking changes and new entities
4. Map entities to UI components

**Step 2: Current Code Inventory**
1. Examine current pages and components
2. Identify which components are eSMR-specific
3. Find hardcoded assumptions about data sources
4. Assess reusability for SMARTS data

**Step 3: Feature Gap Analysis**
1. List features possible with current eSMR-only schema
2. List features enabled by integrated schema
3. Identify feature overlaps and conflicts
4. Prioritize based on user value

**Step 4: Technical Feasibility**
1. Assess complexity of facility matching (3-tier strategy)
2. Evaluate query performance for large tables
3. Consider caching needs for 8.5M records
4. Estimate migration effort

**Step 5: UX Flow Mapping**
1. Map current user journeys
2. Design new user journeys with integrated data
3. Identify navigation changes needed
4. Design information hierarchy

**Step 6: Implementation Planning**
1. Break work into phases (build on research 3-phase plan)
2. Estimate effort per phase
3. Identify dependencies
4. Create critical path timeline

**Step 7: Risk Analysis**
1. Technical risks (performance, migration)
2. UX risks (complexity, confusion)
3. Business risks (timeline, scope creep)
4. Mitigation strategies
</analysis_methodology>

<success_criteria>
- [ ] Complete architecture redesign documented
- [ ] All new features identified and prioritized
- [ ] UI/UX redesign plan created with wireframes
- [ ] Database migration plan step-by-step
- [ ] Implementation phases detailed with time estimates
- [ ] Risk assessment with mitigations
- [ ] Laboratory design system integration analyzed
- [ ] Decision points clearly documented
- [ ] Resource requirements estimated
- [ ] Success metrics defined
- [ ] Documents saved to ./docs/ directory
</success_criteria>

<verification>
Before completing, verify:

**Completeness:**
- All 7 SMARTS datasets considered in redesign
- Both eSMR and SMARTS data flows addressed
- All user personas (attorney, officer, researcher) considered
- Every new database table has corresponding UI plan

**Feasibility:**
- Technical approach is realistic
- Timeline estimates are achievable
- Resource requirements are reasonable
- Performance targets are concrete

**Alignment:**
- Redesign aligns with nonprofit mission
- Maintains focus on violations and enforcement
- Supports alert subscription feature
- Integrates with planned Laboratory design system

**Actionability:**
- Implementation phases have clear deliverables
- Dependencies are explicitly stated
- Each phase can be independently verified
- Rollback plans exist for each phase

**Documentation Quality:**
- Architecture diagrams are clear
- Feature descriptions are detailed
- Migration steps are unambiguous
- Risk mitigations are specific
</verification>

<key_questions_to_answer>
This analysis must definitively answer:

1. **Integration Strategy**: Should eSMR and SMARTS data be presented separately or unified? Where?
2. **Navigation Design**: How do users navigate between monitoring data, violations, inspections, enforcement?
3. **Facility Profiles**: How to display eSMR + SMARTS data together without overwhelming users?
4. **Two Violation Types**: How to help users understand eSMR computed violations vs SMARTS regulatory violations?
5. **Performance**: Can the app handle 8.5M records with acceptable performance? What optimizations needed?
6. **Migration Path**: Can we migrate incrementally or need big-bang deployment?
7. **Laboratory + Schema**: Should Laboratory design system be implemented before, during, or after schema migration?
8. **MVP Definition**: What's the minimum viable product for first public release with integrated data?
9. **Alert System**: How do alerts work with both eSMR and SMARTS violations?
10. **Search & Discovery**: How do users find specific facilities/violations/enforcement actions in 93K+ facilities?

Every answer must be backed by analysis and have clear rationale.
</key_questions_to_answer>

<additional_context>
**Why This Matters:**
The schema research represents a 3x increase in database complexity (10 → 24 tables) and 100x+ increase in data volume. The application must evolve to handle this complexity while remaining accessible to nonprofit environmental organizations.

**Current Limitations:**
- UI designed for single data source (eSMR only)
- Simple facility list with detail pages
- Basic dashboard and map
- Single violation type (computed from samples)

**Opportunity:**
Integrated data enables comprehensive compliance tracking:
- Regulatory violations + enforcement history + inspection records
- Cross-system correlation and insights
- Predictive analytics for violation risk
- Complete facility profiles

**Constraint:**
Must maintain nonprofit-friendly:
- Low infrastructure costs (free tiers preferred)
- Simple user experience (not overwhelming)
- Fast performance (can't wait 30s for queries)
- Reliable data sync (weekly automation)

**Success Looks Like:**
- Environmental attorneys can build violation cases efficiently
- Compliance officers can monitor regions comprehensively
- Researchers can analyze trends across systems
- Platform loads quickly and feels responsive
- Data is current and reliable
</additional_context>
