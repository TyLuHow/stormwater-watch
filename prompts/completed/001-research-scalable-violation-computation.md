<research_objective>
Research and recommend scalable approaches for computing violations from 1M+ eSMR water quality samples against regulatory benchmarks, given Supabase pooled connection constraints that cause timeouts after ~70,000 records processed in a single long-running script.

The current approach processes all samples in batches of 10,000 but fails after 7 batches due to "Server has closed the connection" (error P1017) from Supabase's connection pooling timeout.

This research will determine the optimal architecture to reliably create ViolationEvent (aggregated) and ViolationSample (individual) records for a production Next.js application with regulatory compliance requirements.
</research_objective>

<current_situation>
**Problem**: `scripts/compute-violations.ts` times out processing 1,010,436 eSMR samples
- Processes in batches of 10,000
- Connects via Supabase pooled connection (DATABASE_URL)
- Fails after ~70,000 samples with connection timeout
- Creates dual-model violations: ViolationEvent (aggregates) + ViolationSample (individual records)

**Infrastructure**:
- Database: Supabase PostgreSQL (pooled connections have timeout limits)
- Runtime: Next.js 15 on Vercel
- Data volume: 1M+ samples, 53 benchmarks, 471 mapped parameters
- Requirements: Must run regularly (likely via cron) to keep violations current

**Key files to examine**:
@scripts/compute-violations.ts - Current implementation with batch processing
@prisma/schema.prisma - ViolationEvent and ViolationSample models
@package.json - Check for available npm scripts and dependencies
</current_situation>

<research_requirements>
Thoroughly research and evaluate multiple approaches, considering:

1. **Chunked processing strategies**:
   - Cursor-based pagination vs offset pagination
   - Optimal batch sizes for Supabase pooled connections
   - Connection pooling best practices
   - Progress tracking and resumability if interrupted

2. **Architectural patterns**:
   - Vercel cron jobs (built-in Next.js crons)
   - Serverless function chunking (multiple invocations)
   - Queue-based processing (if available on Vercel/Supabase)
   - Direct database operations (raw SQL vs Prisma)

3. **Supabase-specific optimizations**:
   - Connection pooling vs direct connections
   - Statement timeout configuration
   - Transaction batching strategies
   - Prisma connection lifecycle management

4. **Incremental computation**:
   - Process only new/updated samples since last run
   - Track last processed timestamp or ID
   - Idempotent upserts for violation records

5. **Alternative execution environments**:
   - Vercel Edge Functions vs Serverless Functions
   - GitHub Actions scheduled workflows
   - Supabase Edge Functions
   - Local execution with production DB access

For each approach, analyze:
- Reliability with 1M+ records
- Cost implications (Vercel execution time, DB connections)
- Maintenance complexity
- Time to implement
- Resumability if interrupted
</research_requirements>

<constraints>
- Must work within Vercel's free/hobby tier or be cost-effective for small teams
- Must handle Supabase connection pooling limitations
- Should minimize database load during business hours
- Must create accurate violation records (no data loss)
- Preferably automated (minimal manual intervention)
</constraints>

<deliverables>
Create a comprehensive research document saved to: `./research/scalable-violation-computation.md`

Include:

1. **Summary** (executive summary of recommended approach)

2. **Options Analysis** (3-5 viable approaches with):
   - How it works
   - Pros/cons
   - Implementation effort (hours estimate)
   - Cost implications
   - Example code snippets where helpful

3. **Recommendation** (single best approach with):
   - Why this approach is optimal
   - Step-by-step implementation plan
   - Risks and mitigations
   - Success metrics to track

4. **Quick Win** (immediate tactical solution to get violations showing):
   - Minimal changes to existing script
   - Process subset of data (e.g., recent samples only)
   - Get dashboard populated while implementing full solution

5. **References** (links to relevant documentation):
   - Vercel cron documentation
   - Supabase connection pooling docs
   - Prisma batch processing best practices
   - Any relevant GitHub examples
</deliverables>

<success_criteria>
- At least 3 distinct architectural approaches evaluated
- Clear recommendation with implementation steps
- Quick win solution identified to show violations immediately
- All approaches address the Supabase connection timeout issue
- Cost and complexity trade-offs clearly explained
</success_criteria>

<verification>
Before completing, verify:
- Research addresses both immediate (quick win) and long-term (scalable) needs
- Recommended approach is feasible within Vercel + Supabase constraints
- Implementation plan is actionable with clear next steps
- Code examples or snippets provided for key concepts
</verification>
