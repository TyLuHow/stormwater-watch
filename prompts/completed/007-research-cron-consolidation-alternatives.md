<research_objective>
Research and evaluate solutions for consolidating multiple data sync cron jobs into a single job due to Vercel cron job limits, and explore alternative platforms with free tiers or trials that could handle scheduled data ingestion workflows.

This research will inform the implementation strategy for automating SMARTS/CIWQS data integration while working within platform constraints and optimizing operational costs.
</research_objective>

<context>
**Current State:**
- Platform: Vercel (Next.js 15 deployment)
- Active cron job: `/api/cron/esmr-sync` (weekly eSMR data sync from data.ca.gov)
- Alert cron jobs: `/api/cron/daily` and `/api/cron/weekly` (subscription alerts, keep separate)
- Problem: Hit Vercel's cron job limit
- Upcoming need: Add SMARTS data sync (violations, enforcement, facilities, monitoring data)

**Files to examine:**
@vercel.json - Current cron configuration
@app/api/cron/esmr-sync/route.ts - Reference implementation for data sync pattern
@prompts/003-smarts-ciwqs-automation-strategy.md - Planned SMARTS integration approach
@package.json - Current tech stack and dependencies

**Goal:**
Enable multiple data sync jobs (eSMR + SMARTS datasets) within platform constraints while maintaining reliability and keeping costs low.
</context>

<scope>
Thoroughly explore and compare the following solutions:

**Part 1: Vercel-Based Consolidation Patterns**
1. **Single Orchestrator Cron Job**
   - Create one cron endpoint that coordinates multiple data sync operations
   - Sequential vs parallel execution of sync jobs
   - Timeout handling (Vercel has 10-minute serverless function timeout)
   - Error isolation (one job failure shouldn't break others)
   - Implementation patterns and code examples

2. **Queue-Based Architecture (Staying on Vercel)**
   - Use Upstash Redis (already in tech stack) for job queue
   - Single cron triggers job dispatcher
   - Separate API routes process queue items
   - Pros: Handle large datasets, better timeout management
   - Cons: Additional complexity, Redis costs

3. **Vercel Background Functions (Beta)**
   - Research if Vercel has background job capabilities
   - Pricing and limits
   - Suitability for data sync workloads

**Part 2: Alternative Platforms with Free Tiers**
Research platforms that could supplement or replace Vercel for scheduled jobs:

1. **GitHub Actions**
   - Free tier limits (2000 minutes/month for free accounts)
   - Cron syntax and scheduling capabilities
   - How to trigger Next.js API routes or direct database writes
   - Secrets management and environment variables
   - Example workflow for data sync jobs

2. **Cloudflare Workers + Cron Triggers**
   - Free tier: 100,000 requests/day, 10ms CPU time per invocation
   - Scheduled cron triggers on free tier?
   - Can it call Vercel-hosted API routes or write to external database?
   - Suitability for large CSV processing

3. **Railway.app**
   - Free tier limits and credits
   - Cron job support
   - Can host separate cron service alongside Vercel frontend
   - Database connectivity

4. **Render.com**
   - Free tier for background workers and cron jobs
   - Integration patterns with Vercel-hosted Next.js app
   - Database access patterns

5. **Supabase Edge Functions**
   - Already using Supabase for database
   - Edge Functions cron triggers
   - Free tier limits
   - Can process data and write to Supabase DB directly

6. **Google Cloud Functions / Cloud Scheduler**
   - Free tier: 2 million invocations/month
   - Cloud Scheduler pricing
   - Suitable for data ETL workloads
   - Trial credits availability

7. **AWS Lambda + EventBridge**
   - Free tier: 1 million requests/month
   - EventBridge (CloudWatch Events) for scheduling
   - Learning curve and complexity vs benefits
   - Free tier duration (12 months vs permanent)

**Part 3: Hybrid Architectures**
Explore hybrid approaches:
- Frontend on Vercel, scheduled jobs on alternative platform
- How alternative platform triggers data sync, writes to Supabase
- Security considerations (API authentication, secrets)
- Operational complexity vs cost savings
</scope>

<analysis_requirements>
For each solution, evaluate and document:

**Technical Feasibility:**
- Can it handle CSV processing for large files (600+ MB)?
- Timeout limits and how they affect data sync jobs
- Memory limits and streaming capabilities
- Database connectivity (can write to Supabase PostgreSQL)

**Cost Analysis:**
- Free tier limits (requests, compute time, storage)
- What happens when you exceed free tier?
- Estimated costs for our workload (weekly 600MB CSV + multiple smaller CSVs)
- Trial availability (credits, duration)

**Developer Experience:**
- Setup complexity (1-5 scale, 1=very simple, 5=very complex)
- Integration with existing stack (Next.js, Vercel, Supabase)
- Debugging and monitoring capabilities
- Maintenance burden

**Reliability:**
- Uptime guarantees on free tier
- Error handling and retry mechanisms
- Logging and observability

**Scalability:**
- Can it grow with us if we add more data sources?
- Migration path to paid tier if needed
- Performance characteristics

**Security:**
- How to secure cron endpoints / scheduled jobs
- Secrets management
- Database connection security

**Recommended Ranking:**
After analyzing all options, rank the top 3 solutions with clear rationale.
</analysis_requirements>

<deliverables>
Create a comprehensive research document with the following structure:

## Executive Summary
- Problem statement recap
- Top 3 recommended solutions with brief rationale
- Quick comparison table

## Part 1: Vercel Consolidation Patterns
For each pattern:
- Architecture diagram (ASCII or description)
- Implementation approach with code skeleton
- Pros and cons
- When to use

## Part 2: Alternative Platforms
For each platform:
- Overview and free tier details
- Setup guide (high-level steps)
- Integration pattern with our stack
- Cost analysis for our workload
- Suitability score (1-10) with reasoning

## Part 3: Hybrid Architectures
- Recommended hybrid patterns
- Security considerations
- Operational complexity assessment

## Part 4: Decision Matrix
Comparison table with all options across key criteria:
- Cost (free tier limits)
- Setup complexity
- Reliability
- Performance
- Scalability
- Developer experience

## Part 5: Recommendation
- Primary recommendation with detailed justification
- Fallback option
- Migration path if we outgrow free tier
- Next steps for implementation

Save findings to: `./research/cron-consolidation-and-alternatives.md`
</deliverables>

<research_methodology>
1. **Use WebSearch** for current pricing and limits (platforms change frequently)
   - Verify free tier limits as of December 2025
   - Check for recent platform updates or new offerings

2. **Examine official documentation** for each platform
   - Use WebFetch to get accurate technical details
   - Focus on cron/scheduled job capabilities

3. **Look for real-world examples**
   - Search for "platform X scheduled jobs Next.js" patterns
   - GitHub repositories with similar architectures

4. **Consider our specific constraints:**
   - Already using: Vercel, Supabase, Upstash Redis, Next.js 15
   - Data volume: 600+ MB CSVs weekly + multiple smaller datasets
   - Processing time: Potentially 5-10 minutes per large dataset
   - Budget: Minimize costs, prefer free tier solutions
</research_methodology>

<success_criteria>
- [ ] All Vercel consolidation patterns analyzed with code examples
- [ ] At least 5 alternative platforms researched with accurate free tier limits
- [ ] Cost analysis completed for our specific workload
- [ ] Decision matrix compares all options across 6+ criteria
- [ ] Clear top recommendation with justification
- [ ] Hybrid architecture options explored
- [ ] Security considerations addressed for each approach
- [ ] Implementation next steps provided for recommended solution
- [ ] Research saved to `./research/cron-consolidation-and-alternatives.md`
</success_criteria>

<verification>
Before completing, verify:
- All free tier limits are current (December 2025) via WebSearch
- Code examples are compatible with Next.js 15 and our stack
- Cost estimates are realistic for weekly 600MB+ data processing
- Recommendations consider both immediate needs and future scaling
- Alternative platforms can actually connect to Supabase PostgreSQL
- Timeout limits won't break large CSV processing (or have workarounds)
</verification>

<additional_context>
**Why this matters:**
We're building a nonprofit platform for environmental compliance tracking. Keeping infrastructure costs low is critical for sustainability. The platform needs to reliably ingest public water quality data weekly to provide value to environmental organizations.

**Current eSMR sync pattern (reference):**
- Runs weekly (Sunday 3 AM)
- Fetches data via CKAN API from data.ca.gov
- Processes ~5000 records incrementally
- Uses Prisma for database operations
- Takes ~2-5 minutes currently

**Upcoming SMARTS sync needs:**
- 7 separate CSV files (32 MB to 644 MB each)
- Phased rollout: Start with 2 files (violations + enforcement)
- Eventually need to process all 7 datasets weekly
- Total data volume: ~1.2 GB across all files
</additional_context>
