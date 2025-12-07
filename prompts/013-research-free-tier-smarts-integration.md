<research_objective>
Conduct comprehensive research to identify free-tier solutions and cost-optimization strategies for implementing SMARTS/CIWQS data integration into Stormwater Watch. The goal is to determine if the entire integration can be accomplished at $0/month or minimal cost while handling 8.5M records and 8 GB of database storage.

This research will inform a critical decision: whether to proceed with SMARTS integration or defer until budget is available.
</research_objective>

<project_mission>
**What is Stormwater Watch?**
A **nonprofit platform** that empowers environmental organizations and attorneys to identify, track, and take legal action on California stormwater permit violations affecting watersheds and communities.

**Key Users & Use Cases:**
1. **Environmental Attorneys**: Need reliable, attorney-ready data to build legal cases against repeat offenders
2. **Nonprofit Organizations**: Monitor violations in their watersheds, set up alerts, track trends
3. **Community Advocates**: Identify environmental justice issues (violations in disadvantaged communities)

**Core Value Proposition:**
- Transform opaque government data (CIWQS/SMARTS) into actionable intelligence
- Focus on repeat offenders and impaired waters (highest environmental impact)
- Generate attorney-ready case packets with violation history, spatial context, enforcement records

**Mission-Critical Requirements:**
- **Data accuracy**: Violation detection must be 100% correct (legal consequences)
- **Data provenance**: All data must be from public sources, properly attributed
- **Reliability**: Downtime means violations go undetected, enforcement delayed
- **Performance**: Attorneys need fast queries across millions of records
- **Long-term sustainability**: Nonprofit cannot afford unpredictable costs or vendor lock-in
</project_mission>

<context>
**Current Situation:**
- Stormwater Watch on Supabase Free Tier (500 MB limit, currently not experiencing issues)
- SMARTS integration requires 8 GB database storage (10 → 24 tables, +8.5M records)
- Initial cost estimate: $25-31/month ($300-372/year) for Supabase Pro + optional Redis
- User specifically asked: "can you do even deeper research for how I can do this for free?"

**Previous Research:**
@prompts/012-implementation-migration-plan.md - Infrastructure cost estimate: $300-372/year
@research/cron-consolidation-and-alternatives.md - Cron job platform comparison
@docs/IMPLEMENTATION_ROADMAP.md - Full implementation plan with resource requirements

**Key Constraints:**
- 8 GB database storage needed (16x free tier limit)
- 8.5M monitoring sample records (industrial + construction stormwater monitoring)
- Weekly data sync jobs (8 CSV files, 1.2 GB total from data.ca.gov)
- Query performance requirements (<2s for attorney searches)
- Zero breaking changes to existing eSMR functionality
- **Data integrity paramount**: Cannot lose violation records or introduce false positives

**What SMARTS Data Provides (Why This Matters):**
- **Violations**: Official regulatory violations (vs. eSMR computed violations)
- **Enforcement**: NOVs, penalties, compliance orders (legal action evidence)
- **Inspections**: Inspection history, findings, follow-ups
- **Monitoring Data**: 8.3M water quality samples (evidence for case building)
- **Facility Details**: Permit info, site contact, industrial categories
</context>

<scope>
Thoroughly explore and compare ALL available options across these categories:

## 1. Free-Tier Database Alternatives

Research databases with generous free tiers that can handle 8 GB + 8.5M records:

- **Supabase workarounds**: Multiple free projects, database partitioning tricks, compression
- **PlanetScale**: Free tier limits, branching capabilities, serverless pricing
- **Neon**: Free tier storage/compute, autoscaling, branching
- **Railway**: New free tier (2024), PostgreSQL hosting, limits
- **Render**: PostgreSQL free tier, limitations, upgrade costs
- **CockroachDB**: Serverless free tier, distributed SQL
- **MongoDB Atlas**: Free tier M0 (512 MB), aggregation performance
- **Turso/libSQL**: Edge SQLite, generous free tier, limitations
- **EdgeDB**: Free tier, PostgreSQL-based, query capabilities
- **Xata**: PostgreSQL + search, free tier limits
- **Self-hosted on free compute**: Oracle Cloud Always Free (2 VMs), AWS Free Tier year 1

For each, document:
- Free tier storage/compute limits
- Performance characteristics (query speed, indexing)
- PostgreSQL compatibility (can Prisma work with it?)
- Migration difficulty from Supabase
- Hidden costs or gotchas
- Long-term viability

## 2. Data Storage Optimization Strategies

Investigate techniques to reduce 8 GB to <500 MB:

- **Aggressive data sampling**: Store 10% of monitoring data, full violations/enforcement
- **External cold storage**: Archive old monitoring data to free blob storage (Cloudflare R2, Backblaze B2)
- **Materialized views**: Pre-aggregate monitoring data, store summaries only
- **Columnar compression**: PostgreSQL extensions (pg_cron + compression)
- **Separate read replicas**: Use free-tier read-only database for analytics
- **Time-based partitioning**: Keep recent data in DB, archive rest
- **Denormalization trade-offs**: Reduce table count, accept redundancy

For each strategy:
- Storage reduction estimate
- Query performance impact
- Implementation complexity
- Data fidelity trade-offs

## 3. Hybrid Architecture Patterns

Explore splitting the system across free tiers:

- **Primary DB (Supabase Free)**: eSMR data + SMARTS violations/enforcement only (high-value, <500 MB)
- **Secondary DB (different free tier)**: Monitoring samples only (8.3M records, ~7 GB)
- **Client-side querying**: Download aggregated data, query in browser (DuckDB WASM)
- **Static data generation**: Pre-generate common queries, serve as JSON from Vercel
- **Edge databases**: Cloudflare D1 (SQLite, 5 GB free), Deno Deploy KV
- **Multi-region strategy**: Shard data by region across multiple free accounts

For each pattern:
- Architecture diagram (describe components)
- API complexity (unified vs. federated queries)
- Latency/performance implications
- Legal/ToS compliance (are multi-account setups allowed?)

## 4. Compute & Cron Alternatives

Re-examine data sync job hosting to minimize costs:

- **GitHub Actions**: 2,000 minutes/month free, 6-hour timeout, cron scheduling
- **Cloudflare Workers**: 100,000 requests/day free, cron triggers, 10 CPU-ms limit
- **Deno Deploy**: Free tier limits, cron support, edge functions
- **Vercel serverless**: Already using, optimize for 10-min limit
- **Self-hosted**: Oracle Cloud Always Free, run cron locally
- **Zapier/n8n/Pipedream**: Workflow automation free tiers
- **Supabase Edge Functions**: Free tier limits, direct DB access

For data sync specifically:
- Can weekly 1.2 GB CSV processing fit in free tiers?
- Incremental sync strategies (reduce data transfer)
- Streaming vs. batch processing trade-offs

## 5. Nonprofit-Specific Funding & Free Programs

Research programs specifically for nonprofits and public interest technology:

**Tech Platform Nonprofit Programs:**
- **GitHub for Nonprofits**: Free credits, advanced features for registered 501(c)(3)s
- **AWS Activate for Nonprofits**: Up to $5,000 in credits for qualifying organizations
- **Google Cloud for Nonprofits**: $2,000/month in credits for eligible organizations
- **Microsoft Azure for Nonprofits**: Free and discounted services
- **Stripe for Nonprofits**: Discounted transaction fees (if donations enabled)
- **Vercel for OSS/Nonprofits**: Enterprise features for open-source projects
- **PlanetScale for OSS**: Free database hosting for open-source projects
- **Supabase for Climate Tech**: Special programs for environmental projects

**Grant Opportunities:**
- **Environmental grants**: California environmental data/tech grants
- **Civic tech funding**: Code for America, Knight Foundation, Schmidt Futures
- **Data journalism grants**: For public data transparency projects
- **Climate tech accelerators**: Programs offering free infrastructure credits
- **University partnerships**: Research collaborations with free compute/storage

**Open-Source Sponsorship:**
- **GitHub Sponsors**: Open-source the project, seek sponsorship
- **Open Collective**: Fiscal sponsorship for open-source environmental tools
- **Corporate sponsors**: Environmental tech companies (Watershed, Patch, etc.)

**Volunteer/Community Resources:**
- **Pro bono engineering**: Partner with Code for America brigades
- **University capstone projects**: Students implement features for free
- **Hackathons**: Environmental hackathons for feature development

For each opportunity:
- Eligibility requirements (501(c)(3) status needed?)
- Application process and timeline
- Credit amounts and restrictions
- Long-term sustainability (one-time vs. ongoing)

## 6. Creative Cost-Reduction Strategies

Think outside the box:

- **Serverless PostgreSQL**: Neon autoscaling (pay only for active compute)
- **Read-only replica pattern**: Primary on paid, replicas on free tiers
- **Data deduplication**: Eliminate redundant records (facility name variations)
- **Lazy loading**: Only import data when user requests specific facility
- **User-contributed compute**: Volunteer compute for data processing
- **Partial dataset strategy**: Start with high-value data (violations/enforcement only), add monitoring later
- **Regional focus**: Start with one water board region, expand as funding allows
- **Data partnerships**: Partner with universities/researchers who have data infrastructure

## 7. Mission-Aligned Trade-Off Analysis

For each viable option, assess against nonprofit mission requirements:

**Technical Viability:**
- **Setup complexity**: Hours to implement (opportunity cost vs. feature development)
- **Maintenance burden**: Ongoing time investment (nonprofit has limited engineering capacity)
- **Performance degradation**: Impact on attorney workflows (slow queries = frustrated users)
- **Feature limitations**: What SMARTS features can't be supported? (violations? enforcement? monitoring?)

**Mission-Critical Risks:**
- **Data integrity**: Risk of losing violation records or introducing errors
- **Reliability**: Uptime guarantees, SLA, recovery processes
- **Data provenance**: Can all data sources remain properly attributed?
- **Audit trail**: Can violations be traced back to original government data?

**Nonprofit Sustainability:**
- **Long-term viability**: What happens if free tier is discontinued? Vendor lock-in?
- **Predictability**: Hidden costs, usage spikes, surprise bills
- **Scalability**: What happens when data grows (more regions, more years)?
- **Community support**: Active community, documentation, examples

**User Impact:**
- **Attorney workflows**: Does complexity affect case-building efficiency?
- **Alert reliability**: Will monitoring/alerts still work with hybrid architecture?
- **Query performance**: Can attorneys still get instant search results?

Compare each option against baseline: **"Pay $25/month for Supabase Pro"**
- Is the time investment worth $300/year in savings?
- Does the complexity justify the cost reduction?
- Are mission-critical features compromised?
</scope>

## 8. Phased MVP Strategies (Preserve Mission, Reduce Scope)

Explore delivering core value on free tier by scoping strategically:

**High-Value Data First (Violations + Enforcement Only):**
- Skip 8.3M monitoring samples initially (~7 GB saved → fits in free tier!)
- Keep violations, enforcement, inspections, facility info (~1 GB total)
- **Rationale**: Attorneys primarily need violations/enforcement for legal cases
- **Trade-off**: No detailed water quality evidence, but violation history intact
- **Estimated storage**: <500 MB (fits Supabase free tier)

**Regional Phasing:**
- Start with Region 2 (San Francisco Bay) - highest violation density
- Add regions as funding allows or user demand justifies
- **Rationale**: Test viability, prove value before full scale
- **Trade-off**: Limited geographic coverage initially

**Time-Window Strategy:**
- Import last 3 years of violations/enforcement (not full 10-year history)
- Archive older data to cold storage (Cloudflare R2 free tier: 10 GB)
- **Rationale**: Recent violations most relevant for active cases
- **Trade-off**: Historical trend analysis limited

**On-Demand Data Loading:**
- Don't pre-import all monitoring data
- Fetch monitoring samples when user views specific facility (API call to data.ca.gov)
- Cache frequently accessed facilities in Redis
- **Rationale**: Most facilities never viewed, don't store unused data
- **Trade-off**: Slower initial load for facility details, requires live API

For each MVP strategy:
- Storage savings: X GB → Y GB
- Mission impact: What attorney workflows are affected?
- User experience: What features are degraded?
- Future expansion path: How to add full dataset later?

## 9. Fundraising as Infrastructure Strategy

Consider whether $300/year justifies complexity vs. seeking funding:

**Micro-Grant Opportunities:**
- **Fast Forward**: Tech nonprofit accelerator with infrastructure credits
- **Echoing Green**: Climate fellowship with project funding
- **1% for the Planet**: Corporate environmental giving
- **Local foundations**: California environmental foundations

**Crowdfunding for Infrastructure:**
- **Open Collective**: Transparent budget, recurring donations
- **GitHub Sponsors**: Individual/corporate sponsors for OSS environmental tools
- **Patreon**: Monthly supporters model

**Analysis:**
- Time to raise $300/year: How many hours vs. engineering complexity?
- Donor messaging: "Your $25/month powers environmental enforcement"
- Sustainability: Is ongoing fundraising easier than managing free-tier architecture?


<research_methods>
**Priority Order for Research:**

1. **Start with nonprofit-specific programs** (Section 5) - These could provide full funding at zero complexity
   - Search for "nonprofit database hosting free", "AWS Activate nonprofit", "climate tech grants 2025"
   - Check current 2024-2025 eligibility and credit amounts
   - Verify application requirements (501(c)(3) status, documentation needed)

2. **Evaluate MVP strategies** (Section 8) - Highest value-to-effort ratio
   - Calculate actual storage for violations + enforcement only (exclude monitoring)
   - Research data.ca.gov API reliability for on-demand fetching
   - Assess mission impact: talk to attorneys, what do they actually need?

3. **Compare free-tier databases** (Section 1) - Technical alternatives
   - Web search for recent pricing updates (2024-2025)
   - Read official documentation for free tier limits
   - Search for case studies of similar data scale on free tiers

4. **Assess hybrid architectures** (Section 3) - Complex but potentially viable
   - Check GitHub discussions, Reddit, HN for real user experiences
   - Verify ToS compliance for multi-account strategies
   - Calculate actual storage requirements with compression estimates

**Research Quality Standards:**
- All web searches must include source URLs and publication dates
- Verify pricing information is current (2024-2025)
- For nonprofit programs, confirm eligibility criteria with official sources
- For technical solutions, look for production usage examples (not just theory)
- Consider long-term sustainability (5-year outlook)

**Mission-First Filter:**
For every option researched, ask:
- Does this preserve data integrity for legal cases?
- Will attorneys trust this system?
- Can we maintain this long-term with limited resources?
- Is the complexity worth the cost savings?
</research_methods>

<deliverables>
Create a comprehensive research document at `./research/free-tier-smarts-feasibility.md` with:

### 1. Executive Summary
- Can this be done for free? Yes/No with confidence level
- Recommended approach if yes
- Trade-offs summary

### 2. Database Comparison Matrix
Table format comparing all options:
| Platform | Free Storage | Free Compute | PostgreSQL Compatible | Migration Effort | Performance | Recommendation |
|----------|--------------|--------------|----------------------|------------------|-------------|----------------|

### 3. Optimization Strategies Ranked
Each strategy with:
- Storage reduction: X GB → Y GB
- Implementation effort: Low/Medium/High
- Performance impact: Minimal/Moderate/Severe
- Recommended: Yes/No

### 4. Hybrid Architecture Proposals
Top 3 architectures with:
- Component diagram (text-based)
- Cost: $0/month
- Complexity score: 1-10
- Performance score: 1-10
- Pros/cons list

### 5. Nonprofit Program Opportunities
Table of available programs:
| Program | Type | Value | Eligibility | Application Effort | Timeline | Sustainability |
|---------|------|-------|-------------|-------------------|----------|----------------|
| AWS Activate | Credits | $5K | 501(c)(3) | Medium | 2-4 weeks | One-time |

With analysis: Are credits worth the application effort?

### 6. Recommended Path Forward
Clear decision framework with **mission-first** criteria:

**Option A: Pay for Supabase Pro ($25/month)**
- Cost: $300/year
- Effort: 0 hours (just upgrade)
- Mission impact: Zero compromise, full SMARTS integration
- Risk: Ongoing cost commitment
- **When to choose**: If $300/year is acceptable for nonprofit budget, or fundraising is feasible

**Option B: MVP on Free Tier (Violations + Enforcement Only)**
- Cost: $0/month
- Effort: 40-60 hours (modified schema, selective import)
- Mission impact: Core legal use case intact, monitoring data deferred
- Storage: ~1 GB (fits free tier)
- **When to choose**: If monitoring data is nice-to-have but not mission-critical for v1

**Option C: Hybrid Architecture (Primary + Secondary DB)**
- Cost: $0-15/month
- Effort: 120-180 hours (complex federation layer)
- Mission impact: Full features but increased complexity
- Risk: Reliability concerns, maintenance burden
- **When to choose**: If engineering capacity exists and $0/month is hard requirement

**Option D: Seek Nonprofit Credits/Grants**
- Cost: $0/month (via credits)
- Effort: 20-40 hours (applications, reporting)
- Mission impact: Zero compromise if approved
- Timeline: 2-6 months for approval
- **When to choose**: If timeline allows and nonprofit status qualifies

### 7. Decision Matrix
Score each option (1-10):

|  | Cost | Setup Effort | Ongoing Burden | Mission Impact | Reliability | Sustainability | **TOTAL** |
|---|------|--------------|----------------|----------------|-------------|----------------|-----------|
| Pay $25/mo | 6 | 10 | 10 | 10 | 10 | 8 | XX |
| MVP Free | 10 | 7 | 8 | 7 | 9 | 9 | XX |
| Hybrid | 9 | 3 | 4 | 9 | 6 | 5 | XX |
| Grants | 10 | 6 | 5 | 10 | 9 | 6 | XX |

**Recommendation**: [Specific option] because [mission-aligned reasoning]

### 8. Implementation Roadmap (for recommended option)
Step-by-step plan:
- Phase 1: [Specific tasks] (estimated hours)
- Phase 2: [Specific tasks] (estimated hours)
- Phase 3: [Specific tasks] (estimated hours)
Total effort estimate: XXX hours

**Opportunity cost**: XXX hours = Y weeks of feature development foregone

### 9. Risk Assessment
For each option, assess:

**Technical Risks:**
- Data integrity: Can violations be lost or corrupted?
- Performance: Will attorney queries be unacceptably slow?
- Reliability: What's the downtime risk?

**Mission Risks:**
- User trust: Will attorneys trust a complex/fragile system?
- Legal liability: Could data errors affect legal cases?
- Reputation: Could downtime harm nonprofit credibility?

**Sustainability Risks:**
- Vendor changes: What if free tier is discontinued?
- Maintenance: Who maintains complex architecture long-term?
- Scalability: What happens when data outgrows solution?

### 10. Final Recommendation with Confidence Level

**Primary Recommendation**: [Specific approach]
**Confidence**: High/Medium/Low
**Reasoning**: [Mission-aligned justification considering attorney needs, nonprofit constraints, sustainability]

**Alternative if primary fails**: [Fallback option]
</deliverables>

<verification>
Before completing, verify:
- [ ] At least 10 database platforms researched with current 2024-2025 pricing
- [ ] Storage optimization strategies have realistic reduction estimates
- [ ] Hybrid architectures are technically feasible (not just theoretical)
- [ ] ToS compliance verified for multi-account strategies
- [ ] Performance impact quantified for each trade-off
- [ ] Clear recommendation made with confidence level
- [ ] Implementation effort estimated in hours for recommended approach
- [ ] All web searches include sources with URLs
</verification>

<success_criteria>
Research is complete when:
1. User can make informed decision: free vs. paid approach
2. If free option exists, user has actionable implementation plan
3. All trade-offs are explicit and quantified
4. Performance/reliability risks are clearly stated
5. Total time investment is estimated for each option
6. Recommended path forward is justified with reasoning
</success_criteria>
