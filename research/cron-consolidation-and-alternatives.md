# Cron Job Consolidation and Alternative Platforms Research

**Date:** December 6, 2025
**Project:** Stormwater Watch
**Status:** Research Complete
**Purpose:** Enable multiple data sync jobs (eSMR + SMARTS datasets) within platform constraints while minimizing costs

---

## Executive Summary

### Problem Statement
Stormwater Watch has hit Vercel's free tier cron job limit (2 jobs maximum) with existing eSMR sync and alert jobs. We need to add SMARTS data sync (7 datasets, ~1.2 GB total) while working within platform constraints and keeping infrastructure costs minimal for this nonprofit platform.

### Top 3 Recommended Solutions

**1. Single Orchestrator Cron Job on Vercel (RECOMMENDED)**
- Consolidate eSMR + SMARTS sync into one cron endpoint
- Use sequential execution with progress tracking
- Estimated setup time: 8-12 hours
- Cost: $0 (stays within free tier)
- Best for: Immediate implementation, minimal complexity

**2. GitHub Actions + Vercel API Routes (FALLBACK)**
- Offload data sync jobs to GitHub Actions (free tier: 2000 min/month)
- Trigger Vercel API routes or write directly to Supabase
- Estimated setup time: 12-16 hours
- Cost: $0 on public repo, uses free tier
- Best for: If orchestrator approach hits timeout limits

**3. Cloudflare Workers + Cron Triggers (SCALABLE)**
- Run cron triggers on Cloudflare Workers (free tier: 100k requests/day)
- Connect directly to Supabase PostgreSQL
- Estimated setup time: 16-20 hours
- Cost: $0 (generous free tier)
- Best for: Long-term scalability, multiple data sources

### Quick Comparison Table

| Solution | Cost | Setup Complexity | Timeout Limit | Scalability | Recommended Use |
|----------|------|------------------|---------------|-------------|-----------------|
| **Single Orchestrator (Vercel)** | $0 | Low (1/5) | 5-10 min | Medium | Immediate need |
| **GitHub Actions** | $0 | Medium (2/5) | 6 hours | High | Reliable fallback |
| **Cloudflare Workers** | $0 | Medium (3/5) | 30s-15min | High | Future growth |
| Queue + Upstash Redis | ~$5/mo | High (4/5) | No limit | Very High | Large datasets |
| Supabase Edge Functions | $0 | Low (2/5) | 150s | Medium | Supabase-native |
| AWS Lambda + EventBridge | $0* | High (5/5) | 15 min | Very High | AWS ecosystem |

*AWS free tier is permanent but more complex

---

## Part 1: Vercel Consolidation Patterns

### Pattern 1: Single Orchestrator Cron Job

#### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Vercel Cron Job (Weekly - Sunday 3 AM)                │
│  Path: /api/cron/data-sync                              │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Orchestrator Function                                  │
│  - Checks last run timestamps                           │
│  - Determines which syncs to run                        │
│  - Executes sequentially with error isolation           │
└─────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┬─────────────────┐
        ▼               ▼               ▼                 ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ eSMR Sync    │ │ SMARTS       │ │ SMARTS       │ │ Future       │
│ Module       │ │ Violations   │ │ Enforcement  │ │ Datasets     │
│              │ │ Module       │ │ Module       │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
        │               │               │                 │
        └───────────────┴───────────────┴─────────────────┘
                        ▼
                ┌──────────────┐
                │  Supabase    │
                │  PostgreSQL  │
                └──────────────┘
```

#### Implementation Approach

**File:** `/app/api/cron/data-sync/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { syncESMR } from "@/lib/sync/esmr"
import { syncSMARTSViolations } from "@/lib/sync/smarts-violations"
import { syncSMARTSEnforcement } from "@/lib/sync/smarts-enforcement"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/cron/data-sync
 * Consolidated weekly cron job for all data sync operations
 * Executes syncs sequentially with error isolation
 * Protected with CRON_SECRET
 */

interface SyncJob {
  name: string
  enabled: boolean
  fn: () => Promise<SyncResult>
}

interface SyncResult {
  success: boolean
  recordsProcessed: number
  duration: number
  error?: string
}

export async function GET(request: NextRequest) {
  // 1. Verify cron secret
  const authHeader = request.headers.get("Authorization")
  const expectedSecret = `Bearer ${process.env.CRON_SECRET || "dev-secret"}`

  if (authHeader !== expectedSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()
  console.log("🔄 Starting consolidated data sync job...")

  // 2. Define sync jobs in order of priority
  const syncJobs: SyncJob[] = [
    {
      name: "eSMR",
      enabled: true,
      fn: syncESMR,
    },
    {
      name: "SMARTS Violations",
      enabled: true,
      fn: syncSMARTSViolations,
    },
    {
      name: "SMARTS Enforcement",
      enabled: true,
      fn: syncSMARTSEnforcement,
    },
  ]

  const results = {
    totalDuration: 0,
    jobsRun: 0,
    jobsSucceeded: 0,
    jobsFailed: 0,
    details: [] as Array<{ name: string; success: boolean; duration: number; records?: number; error?: string }>,
  }

  // 3. Execute each sync job sequentially
  for (const job of syncJobs) {
    if (!job.enabled) {
      console.log(`⏭️  Skipping disabled job: ${job.name}`)
      continue
    }

    const jobStart = Date.now()
    console.log(`▶️  Starting sync: ${job.name}`)

    try {
      // Execute sync with timeout protection
      const result = await Promise.race([
        job.fn(),
        new Promise<SyncResult>((_, reject) =>
          setTimeout(() => reject(new Error("Sync timeout after 4 minutes")), 4 * 60 * 1000)
        ),
      ])

      const jobDuration = (Date.now() - jobStart) / 1000

      if (result.success) {
        console.log(`✅ ${job.name} completed: ${result.recordsProcessed} records in ${jobDuration}s`)
        results.jobsSucceeded++
        results.details.push({
          name: job.name,
          success: true,
          duration: jobDuration,
          records: result.recordsProcessed,
        })
      } else {
        throw new Error(result.error || "Sync failed")
      }

      results.jobsRun++
    } catch (error) {
      const jobDuration = (Date.now() - jobStart) / 1000
      const errorMsg = error instanceof Error ? error.message : String(error)

      console.error(`❌ ${job.name} failed after ${jobDuration}s:`, errorMsg)
      results.jobsFailed++
      results.details.push({
        name: job.name,
        success: false,
        duration: jobDuration,
        error: errorMsg,
      })

      // Continue with next job (error isolation)
      continue
    }
  }

  results.totalDuration = (Date.now() - startTime) / 1000

  console.log(`\n📊 Sync job summary:`)
  console.log(`   Total duration: ${results.totalDuration}s`)
  console.log(`   Jobs run: ${results.jobsRun}`)
  console.log(`   Succeeded: ${results.jobsSucceeded}`)
  console.log(`   Failed: ${results.jobsFailed}`)

  // 4. Log completion to database for monitoring
  await prisma.syncLog.create({
    data: {
      jobType: "CONSOLIDATED_SYNC",
      startedAt: new Date(startTime),
      completedAt: new Date(),
      status: results.jobsFailed > 0 ? "PARTIAL_SUCCESS" : "SUCCESS",
      details: results,
    },
  })

  return NextResponse.json({
    success: results.jobsFailed === 0,
    ...results,
  })
}
```

**Individual Sync Module Example:**

```typescript
// lib/sync/esmr.ts
export async function syncESMR(): Promise<SyncResult> {
  const startTime = Date.now()

  try {
    // Existing eSMR sync logic from app/api/cron/esmr-sync/route.ts
    // ... (move implementation here)

    return {
      success: true,
      recordsProcessed: samplesCreated,
      duration: (Date.now() - startTime) / 1000,
    }
  } catch (error) {
    return {
      success: false,
      recordsProcessed: 0,
      duration: (Date.now() - startTime) / 1000,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
```

**vercel.json update:**

```json
{
  "framework": "nextjs",
  "buildCommand": "prisma generate && next build",
  "crons": [
    {
      "path": "/api/cron/data-sync",
      "schedule": "0 3 * * 0"
    },
    {
      "path": "/api/cron/daily",
      "schedule": "0 0 * * *"
    }
  ]
}
```

#### Pros and Cons

**Pros:**
- ✅ Simple to implement (refactor existing code)
- ✅ Zero additional cost
- ✅ Stays within Vercel free tier (2 cron jobs)
- ✅ Error isolation prevents one failure from breaking others
- ✅ Single point of monitoring
- ✅ Easy to add new datasets incrementally
- ✅ Timeout protection per job (4 min each)

**Cons:**
- ❌ Limited to ~8-10 minutes total execution (Vercel timeout)
- ❌ Sequential execution may be slow for multiple large datasets
- ❌ No built-in retry mechanism for failed jobs
- ❌ Memory constraints for very large CSV processing (512 MB - 1 GB)

#### When to Use

- **Perfect for:** 2-4 datasets, each processing < 3 minutes
- **Our current needs:** eSMR (2-5 min) + SMARTS violations (2-3 min) + SMARTS enforcement (1-2 min) = 5-10 min total ✅
- **Future limit:** When total processing time exceeds 8 minutes consistently

---

### Pattern 2: Queue-Based Architecture with Upstash Redis

#### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Vercel Cron Job (Weekly - Sunday 3 AM)                │
│  Path: /api/cron/queue-dispatcher                       │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Queue Dispatcher                                       │
│  - Enqueues sync jobs to Redis queue                   │
│  - Returns immediately (< 1 second)                     │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
                ┌──────────────┐
                │  Upstash     │
                │  Redis Queue │
                └──────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Worker 1     │ │ Worker 2     │ │ Worker 3     │
│ /api/worker  │ │ /api/worker  │ │ /api/worker  │
│ (triggered   │ │ (triggered   │ │ (triggered   │
│  by queue)   │ │  by queue)   │ │  by queue)   │
└──────────────┘ └──────────────┘ └──────────────┘
```

#### Implementation Approach

**1. Queue Dispatcher (Cron Job):**

```typescript
// app/api/cron/queue-dispatcher/route.ts
import { NextRequest, NextResponse } from "next/server"
import { Queue } from "bullmq"
import { redis } from "@/lib/redis"

const syncQueue = new Queue("data-sync", {
  connection: redis,
})

export async function GET(request: NextRequest) {
  // Verify cron secret...

  const jobs = [
    { name: "esmr-sync", priority: 1 },
    { name: "smarts-violations", priority: 2 },
    { name: "smarts-enforcement", priority: 3 },
  ]

  for (const job of jobs) {
    await syncQueue.add(job.name, { timestamp: Date.now() }, {
      priority: job.priority,
      attempts: 3,
      backoff: { type: "exponential", delay: 60000 },
    })
  }

  return NextResponse.json({ success: true, jobsQueued: jobs.length })
}
```

**2. Worker Endpoint:**

```typescript
// app/api/worker/route.ts
import { Worker } from "bullmq"
import { redis } from "@/lib/redis"
import { syncESMR } from "@/lib/sync/esmr"

const worker = new Worker(
  "data-sync",
  async (job) => {
    console.log(`Processing job: ${job.name}`)

    switch (job.name) {
      case "esmr-sync":
        return await syncESMR()
      case "smarts-violations":
        return await syncSMARTSViolations()
      // ... other jobs
    }
  },
  { connection: redis }
)

// This would need to run as a long-lived process
// Not ideal for Vercel serverless
```

**Note:** This pattern is challenging on Vercel serverless. You'd need a separate worker process running continuously, which defeats the purpose of serverless.

#### Pros and Cons

**Pros:**
- ✅ Handles large datasets gracefully
- ✅ Built-in retry and error handling
- ✅ Job progress tracking
- ✅ Can process jobs in parallel
- ✅ No timeout concerns (jobs process independently)

**Cons:**
- ❌ Requires Upstash Redis paid tier (~$5-20/month for our volume)
- ❌ Complex architecture
- ❌ Needs long-running worker (not serverless-friendly)
- ❌ Overkill for current needs
- ❌ Higher maintenance burden

#### When to Use

- **Perfect for:** 10+ datasets, very large files (> 1 GB each), need parallel processing
- **Our current needs:** Overkill ❌
- **Consider when:** Processing time consistently > 15 minutes OR need parallel processing

---

### Pattern 3: Vercel Workflow (Beta)

#### Overview

Vercel Workflow is a new beta feature that allows durable, resumable workflows that can pause and maintain state. However, it's still in beta and has separate pricing.

#### Key Information

- **Status:** Beta (as of December 2025)
- **Availability:** All plans during beta
- **Pricing during beta:**
  - Workflow Steps: Billed based on execution
  - Workflow Storage: Billed for state persistence
  - Functions: Billed at standard compute rates
- **Use case:** Multi-step workflows that need to pause/resume

#### Pros and Cons

**Pros:**
- ✅ Purpose-built for multi-step processes
- ✅ Durable state management
- ✅ Native Vercel integration

**Cons:**
- ❌ Still in beta (may change)
- ❌ Pricing unclear for GA release
- ❌ Adds complexity
- ❌ Learning curve

#### Recommendation

**Wait for GA release** before adopting. Monitor pricing announcements. Could be ideal future solution if pricing remains competitive.

---

## Part 2: Alternative Platforms with Free Tiers

### Platform 1: GitHub Actions

#### Overview and Free Tier Details

GitHub Actions provides CI/CD automation with generous free tier limits and native cron scheduling via the `schedule` trigger.

**Free Tier (2025):**
- **Public repositories:** Unlimited minutes ✅
- **Private repositories:** 2,000 minutes/month (500 MB storage)
- **Workflow timeout:** 6 hours per job (35 days max for workflow)
- **Cron schedule:** Every 5 minutes minimum
- **Auto-disable:** Workflows disabled after 60 days of inactivity (public repos)

#### Setup Guide (High-Level Steps)

**1. Create workflow file in your repository:**

```yaml
# .github/workflows/data-sync.yml
name: Weekly Data Sync

on:
  schedule:
    # Runs every Sunday at 3 AM UTC
    - cron: '0 3 * * 0'
  workflow_dispatch: # Allow manual triggers

jobs:
  sync-data:
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run eSMR sync
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
        run: npm run sync:esmr

      - name: Run SMARTS violations sync
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
        run: npm run sync:smarts-violations

      - name: Run SMARTS enforcement sync
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
        run: npm run sync:smarts-enforcement

      - name: Notify on failure
        if: failure()
        run: |
          echo "Sync failed! Check logs."
          # Add Slack/email notification here
```

**2. Add secrets to GitHub repository:**
- Go to Settings > Secrets and variables > Actions
- Add: `DATABASE_URL`, `DIRECT_URL` (Supabase connection strings)

**3. Create standalone sync scripts:**

```json
// package.json
{
  "scripts": {
    "sync:esmr": "tsx scripts/sync-esmr.ts",
    "sync:smarts-violations": "tsx scripts/sync-smarts-violations.ts",
    "sync:smarts-enforcement": "tsx scripts/sync-smarts-enforcement.ts"
  }
}
```

**4. Extract sync logic to standalone scripts:**

```typescript
// scripts/sync-esmr.ts
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting eSMR sync...")

  // Copy logic from app/api/cron/esmr-sync/route.ts
  // ... sync implementation ...

  console.log("eSMR sync completed")
}

main()
  .catch((error) => {
    console.error("eSMR sync failed:", error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
```

#### Integration Pattern with Our Stack

**Option A: Direct Database Writes (RECOMMENDED)**

```
GitHub Actions → Supabase PostgreSQL
     ↓
  Vercel App (reads updated data)
```

- GitHub Actions runs sync scripts that write directly to Supabase
- No interaction with Vercel needed
- Cleanest separation of concerns

**Option B: Trigger Vercel API Route**

```
GitHub Actions → POST to Vercel API Route → Database
```

- Less ideal (requires exposing API endpoint)
- Need to implement authentication
- More complex error handling

#### Cost Analysis for Our Workload

**Estimated execution time per week:**
- eSMR sync: ~5 minutes
- SMARTS violations: ~3 minutes
- SMARTS enforcement: ~2 minutes
- **Total:** ~10 minutes/week = 40 minutes/month

**Free tier capacity:**
- Private repo: 2,000 minutes/month
- Public repo: Unlimited minutes
- **Our usage:** 40 minutes/month << 2,000 minutes ✅

**Storage:**
- Workflow logs and artifacts: ~50 MB/month
- Free tier: 500 MB
- **Our usage:** Well within limits ✅

**Cost:** $0/month (even on private repo)

#### Suitability Score: 9/10

**Reasoning:**
- ✅ Free and generous limits
- ✅ 6-hour timeout easily handles our workload
- ✅ Direct database access (no API needed)
- ✅ Excellent logging and monitoring
- ✅ Cron syntax familiar
- ✅ Easy to test (workflow_dispatch)
- ✅ Secrets management built-in
- ❌ Slight learning curve for GitHub Actions syntax
- ❌ Tied to GitHub (vendor lock-in)

**Recommendation:** **Excellent fallback option** if Vercel orchestrator hits limits. Consider making repo public to get unlimited minutes.

---

### Platform 2: Cloudflare Workers + Cron Triggers

#### Overview and Free Tier Details

Cloudflare Workers is a serverless edge computing platform with generous free tier and native cron trigger support.

**Free Tier (2025):**
- **Requests:** 100,000 requests/day (not just cron triggers)
- **CPU time:** 10ms per invocation (free tier) / 30s per cron (< 1 hour interval) / 15 min (≥ 1 hour interval)
- **Cron triggers:** 3 triggers per Worker (unlimited Workers)
- **Cost:** $0 for cron triggers (included in request quota)
- **Memory:** 128 MB (free tier)

#### Setup Guide (High-Level Steps)

**1. Install Wrangler CLI:**

```bash
npm install -g wrangler
wrangler login
```

**2. Create Worker project:**

```bash
wrangler init stormwater-sync
cd stormwater-sync
```

**3. Configure cron triggers (wrangler.toml):**

```toml
name = "stormwater-sync"
main = "src/index.ts"
compatibility_date = "2025-12-06"
compatibility_flags = ["nodejs_compat"]

[triggers]
crons = [
  "0 3 * * 0"  # Weekly on Sunday 3 AM
]

[vars]
ENVIRONMENT = "production"

# Secrets (set via: wrangler secret put DATABASE_URL)
# DATABASE_URL
# DIRECT_URL
```

**4. Implement Worker with cron handler:**

```typescript
// src/index.ts
import { connect } from '@planetscale/database'

interface Env {
  DATABASE_URL: string
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log('Cron trigger fired:', event.cron)

    // Connect to Supabase PostgreSQL
    const db = connect({
      url: env.DATABASE_URL,
    })

    try {
      // Run eSMR sync
      await syncESMR(db)

      // Run SMARTS syncs
      await syncSMARTSViolations(db)
      await syncSMARTSEnforcement(db)

      console.log('All syncs completed successfully')
    } catch (error) {
      console.error('Sync failed:', error)
      // Could implement error notifications here
    }
  },
}

async function syncESMR(db: any) {
  // Fetch data from data.ca.gov
  const response = await fetch('https://data.ca.gov/api/3/action/datastore_search_sql?...')
  const data = await response.json()

  // Process and insert to database
  // Note: Process in streaming batches for large datasets
}
```

**5. Deploy:**

```bash
wrangler deploy
```

**6. Set secrets:**

```bash
wrangler secret put DATABASE_URL
wrangler secret put DIRECT_URL
```

#### Integration Pattern with Our Stack

**Direct Database Connection:**

```
Cloudflare Workers → Supabase PostgreSQL
        ↓
   Vercel App (reads data)
```

**Connection Methods:**

1. **HTTP via Supabase REST API (Recommended for simplicity):**
```typescript
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY)
```

2. **Direct PostgreSQL via Hyperdrive (Recommended for performance):**
```typescript
// Hyperdrive provides connection pooling
const db = connect({
  url: env.DATABASE_URL, // Hyperdrive connection string
})
```

**Note:** Cloudflare Workers can connect to Supabase PostgreSQL using either:
- `@supabase/supabase-js` (HTTP via PostgREST - easier)
- `node-postgres` or `postgres.js` with Hyperdrive (faster, direct connection)

#### Cost Analysis for Our Workload

**Request counting:**
- 1 weekly cron trigger = 52 requests/year
- Each cron invocation = 1 request
- Daily quota: 100,000 requests
- **Our usage:** 0.05% of daily quota ✅

**CPU time limits:**
- Weekly cron (< 1 hour interval): 30 seconds CPU time
- **Challenge:** Processing 600 MB CSV in 30 seconds is impossible ❌

**Workarounds:**
1. Use hourly cron (gets 15 min CPU time)
2. Chain multiple Workers (Worker A triggers Worker B)
3. Stream data in chunks, process incrementally

**Storage:**
- No built-in storage (stateless)
- Must write to external database (Supabase) ✅

**Cost:** $0/month (well within free tier)

#### Suitability Score: 7/10

**Reasoning:**
- ✅ Excellent free tier
- ✅ Global edge network (fast)
- ✅ Direct Supabase connectivity
- ✅ Zero cost
- ✅ Good documentation
- ❌ 30-second CPU limit for weekly cron (too short for large CSVs)
- ❌ Need to restructure for hourly cron or chaining
- ❌ Learning curve for Workers platform
- ❌ 128 MB memory limit (free tier)

**Recommendation:** **Good for smaller datasets or hourly/daily crons**. For our 600 MB CSV processing, would need to:
- Change to hourly cron (gets 15 min CPU)
- Implement streaming with checkpointing
- Consider Worker chaining

**Better for:** Future real-time features, smaller/frequent syncs

---

### Platform 3: Railway.app

#### Overview and Free Tier Details

Railway.app is a modern platform-as-a-service with support for cron jobs, databases, and background workers.

**Free Tier (2025):**
- **Cron jobs:** Trial only, NOT available after trial ❌
- **Trial resources:** 5 projects, 5 services per project
- **Trial duration:** Limited time (not specified)
- **Post-trial free tier:** 1 project, 3 services, up to 1 vCPU, 0.5 GB RAM
- **Cron frequency:** Minimum 5 minutes between executions

**Paid Plans:**
- **Developer:** $5/month + usage, includes 50 cron jobs
- **Team:** $20/month + usage, includes 100 cron jobs

#### Cost Analysis for Our Workload

**Trial period:**
- ✅ Can use cron jobs during trial
- ✅ Suitable for testing

**Post-trial:**
- ❌ Must upgrade to Developer plan ($5/month minimum)
- ❌ No free tier for cron jobs

**Verdict:** Not suitable for free/low-cost requirement

#### Suitability Score: 3/10

**Reasoning:**
- ❌ No free cron jobs after trial
- ❌ Requires paid plan ($5/month minimum)
- ✅ Good developer experience
- ✅ Easy setup
- ❌ Not aligned with cost-minimization goal

**Recommendation:** **Skip** - Does not meet free tier requirement

---

### Platform 4: Render.com

#### Overview and Free Tier Details

Render.com is a unified cloud platform for deploying web services, static sites, databases, and cron jobs.

**Free Tier (2025):**
- **Cron jobs:** Starting at $1/month per cron job ❌
- **Web services:** Free tier available (spins down after 15 min inactivity)
- **Background workers:** Paid only (based on resources)
- **Cron timeout:** 12 hours maximum

**Important Limitation:**
- Free tier web services sleep after 15 minutes of inactivity
- In-app cron jobs won't run while service is sleeping
- Must use paid cron jobs ($1/month) to ensure execution

#### Cost Analysis for Our Workload

**Minimum cost for our use case:**
- 3 cron jobs (eSMR, SMARTS violations, SMARTS enforcement) × $1 = $3/month
- **OR** 1 orchestrator cron job × $1 = $1/month

**Verdict:** Low cost but not free

#### Suitability Score: 5/10

**Reasoning:**
- ❌ Not free ($1-3/month)
- ✅ Very affordable
- ✅ 12-hour timeout (plenty for our needs)
- ✅ Good monitoring and logs
- ✅ Easy setup
- ❌ Doesn't meet "free tier" requirement

**Recommendation:** **Consider only if all free options fail**. At $1/month for orchestrator cron, it's affordable but not free.

---

### Platform 5: Supabase Edge Functions + pg_cron

#### Overview and Free Tier Details

Supabase offers two approaches for scheduled jobs:
1. **Edge Functions** (Deno-based serverless functions)
2. **pg_cron** (PostgreSQL extension for database-side cron jobs)

**Free Tier (2025):**
- **Edge Functions:** Included in free tier ✅
- **Edge Function timeout:** 150 seconds (2.5 minutes)
- **pg_cron:** Available on free tier ✅
- **pg_cron frequency:** Every 1-59 seconds possible
- **Concurrent jobs:** Max 8 jobs should run concurrently
- **Cost:** $0/month

#### Setup Guide (High-Level Steps)

**Approach A: pg_cron + Edge Functions**

**1. Create Edge Function for data sync:**

```typescript
// supabase/functions/data-sync/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Run eSMR sync
    await syncESMR(supabaseClient)

    // Run SMARTS syncs
    await syncSMARTSViolations(supabaseClient)
    await syncSMARTSEnforcement(supabaseClient)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

async function syncESMR(supabase: any) {
  // Fetch data from data.ca.gov
  const response = await fetch('https://data.ca.gov/api/3/action/datastore_search_sql?...')
  const data = await response.json()

  // Insert via Supabase client
  await supabase.from('esmr_samples').insert(data.result.records)
}
```

**2. Deploy Edge Function:**

```bash
supabase functions deploy data-sync
```

**3. Schedule with pg_cron:**

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Store Edge Function URL in Vault (secure)
SELECT vault.create_secret('edge-function-url', 'https://[project-ref].supabase.co/functions/v1/data-sync');
SELECT vault.create_secret('edge-function-key', '[your-anon-key]');

-- Schedule weekly cron job (Sunday 3 AM)
SELECT cron.schedule(
  'weekly-data-sync',
  '0 3 * * 0',
  $$
  SELECT net.http_post(
    url := vault.read_secret('edge-function-url'),
    headers := jsonb_build_object('Authorization', 'Bearer ' || vault.read_secret('edge-function-key')),
    body := jsonb_build_object()
  ) AS request_id;
  $$
);
```

**Approach B: pg_cron + Database Functions (Fully Native)**

```sql
-- Create database function for eSMR sync
CREATE OR REPLACE FUNCTION sync_esmr()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  response json;
BEGIN
  -- Fetch data from data.ca.gov API
  SELECT content::json INTO response
  FROM net.http_get('https://data.ca.gov/api/3/action/datastore_search_sql?sql=...');

  -- Process and insert (simplified example)
  INSERT INTO esmr_samples (...)
  SELECT ... FROM json_to_recordset(response->'result'->'records');
END;
$$;

-- Schedule it
SELECT cron.schedule(
  'esmr-sync',
  '0 3 * * 0',
  'SELECT sync_esmr();'
);
```

#### Integration Pattern with Our Stack

**Pattern 1: Database-Native (Recommended)**

```
pg_cron → Database Functions → Supabase Tables
    ↓
Vercel App (reads updated data)
```

- Everything runs inside Supabase
- Zero external dependencies
- Simplest architecture

**Pattern 2: Hybrid (Edge Functions)**

```
pg_cron → pg_net → Edge Functions → Database
    ↓
Vercel App (reads updated data)
```

- More flexibility in Edge Functions
- Can use Deno ecosystem
- Good for complex transformations

#### Cost Analysis for Our Workload

**Free tier capacity:**
- Edge Function invocations: Included in compute hours
- pg_cron jobs: No additional cost
- Database operations: Included in free tier

**Constraints:**
- Edge Function timeout: 150 seconds (2.5 minutes)
- **Challenge:** May not be enough for 600 MB CSV ⚠️

**Workarounds:**
1. Process in batches (multiple cron jobs)
2. Use database functions with pg_net for streaming
3. Hybrid approach: Fetch externally, process in database

**Cost:** $0/month

#### Suitability Score: 8/10

**Reasoning:**
- ✅ Completely free
- ✅ Native to our database (Supabase)
- ✅ Zero latency (runs in database)
- ✅ pg_cron is battle-tested
- ✅ Good for smaller datasets
- ✅ Can schedule multiple jobs (work around timeout)
- ❌ 150-second Edge Function timeout (tight for large CSVs)
- ❌ Less familiar tech (Deno, pl/pgsql)
- ✅ Excellent option for incremental sync

**Recommendation:** **Excellent for smaller datasets or batch processing**. For our use case:
- ✅ Great for eSMR sync (5K records, ~2 min)
- ⚠️ Challenge for SMARTS monitoring data (600 MB)
- ✅ Can split large datasets into daily incremental syncs

**Best use:** Combine with orchestrator pattern - use Edge Functions for coordination, database functions for heavy lifting

---

### Platform 6: Google Cloud Functions + Cloud Scheduler

#### Overview and Free Tier Details

Google Cloud Functions (now Cloud Run functions) provides serverless compute with Cloud Scheduler for cron-style scheduling.

**Free Tier (2025) - Permanent "Always Free":**

**Cloud Functions (Cloud Run):**
- **Invocations:** 2 million requests/month
- **vCPU time:** 180,000 vCPU-seconds (~50 hours)
- **Memory:** 360,000 GiB-seconds
- **Network egress:** 5 GB/month
- **Timeout:** Up to 60 minutes (configurable)

**Cloud Scheduler:**
- **Free jobs:** 3 jobs per billing account (not per project)
- **Paid jobs:** $0.10/month per job beyond 3

#### Setup Guide (High-Level Steps)

**1. Create Cloud Function for data sync:**

```javascript
// index.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.dataSync = async (req, res) => {
  console.log('Starting data sync...')

  try {
    // Run syncs sequentially
    await syncESMR()
    await syncSMARTSViolations()
    await syncSMARTSEnforcement()

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Sync failed:', error)
    res.status(500).json({ success: false, error: error.message })
  } finally {
    await prisma.$disconnect()
  }
}

async function syncESMR() {
  const response = await fetch('https://data.ca.gov/api/3/action/datastore_search_sql?...')
  const data = await response.json()
  // Process and insert to database via Prisma
}
```

**2. Deploy function:**

```bash
gcloud functions deploy dataSync \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --timeout 540s \
  --memory 2048MB \
  --set-env-vars DATABASE_URL=$DATABASE_URL
```

**3. Create Cloud Scheduler job:**

```bash
gcloud scheduler jobs create http weekly-data-sync \
  --schedule="0 3 * * 0" \
  --uri="https://REGION-PROJECT_ID.cloudfunctions.net/dataSync" \
  --http-method=GET \
  --time-zone="America/Los_Angeles"
```

#### Integration Pattern with Our Stack

```
Cloud Scheduler → Cloud Function → Supabase PostgreSQL
                       ↓
                  Vercel App (reads data)
```

**Connection to Supabase:**
- Use standard PostgreSQL connection string
- Consider Cloud SQL Proxy for security (optional)
- Use Prisma Client (already in our stack)

#### Cost Analysis for Our Workload

**Estimated resource usage per sync:**
- Execution time: ~10 minutes
- Memory: 1 GB (configurable)
- CPU: ~600 vCPU-seconds (10 min × 1 vCPU)

**Monthly usage (4 weeks):**
- Invocations: 4 (well under 2M limit)
- vCPU-seconds: 2,400 (well under 180K limit)
- Memory: ~40,000 GiB-seconds (well under 360K limit)

**Cloud Scheduler:**
- Jobs needed: 1 (well under 3 free jobs)

**Cost:** $0/month ✅

**If we needed 5 scheduled jobs:**
- 3 free + 2 paid = 2 × $0.10 = $0.20/month

#### Suitability Score: 6/10

**Reasoning:**
- ✅ Generous free tier (permanent)
- ✅ Long timeout (up to 60 minutes)
- ✅ Plenty of memory/CPU
- ✅ Mature platform
- ✅ Good monitoring (Cloud Logging)
- ❌ High setup complexity (GCP ecosystem)
- ❌ Requires Google account/project setup
- ❌ Learning curve (gcloud CLI, IAM, etc.)
- ❌ Overkill for our simple use case
- ❌ Vendor lock-in to Google Cloud

**Recommendation:** **Good option if already using GCP**, but high setup overhead for our standalone use case. Better suited for teams with existing Google Cloud infrastructure.

---

### Platform 7: AWS Lambda + EventBridge Scheduler

#### Overview and Free Tier Details

AWS Lambda provides serverless compute with EventBridge Scheduler for cron-style scheduling.

**Free Tier (2025) - Permanent "Always Free":**

**AWS Lambda:**
- **Invocations:** 1 million requests/month
- **Compute time:** 400,000 GB-seconds/month
- **Timeout:** Up to 15 minutes (configurable)
- **Memory:** 128 MB to 10 GB (configurable)

**EventBridge Scheduler:**
- **Invocations:** 14 million invocations/month (extremely generous)
- **Beyond free tier:** $1.00 per million invocations

#### Setup Guide (High-Level Steps)

**1. Create Lambda function:**

```javascript
// index.mjs
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const handler = async (event) => {
  console.log('Starting weekly data sync...')

  try {
    // Run syncs sequentially
    await syncESMR()
    await syncSMARTSViolations()
    await syncSMARTSEnforcement()

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    }
  } catch (error) {
    console.error('Sync failed:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    }
  } finally {
    await prisma.$disconnect()
  }
}

async function syncESMR() {
  // Fetch from data.ca.gov
  const response = await fetch('https://data.ca.gov/api/3/action/datastore_search_sql?...')
  const data = await response.json()

  // Process with streaming for large files
  // Use S3 as intermediate storage if needed
}
```

**2. Package and deploy:**

```bash
# Create deployment package
npm install
zip -r function.zip .

# Deploy via AWS CLI
aws lambda create-function \
  --function-name weekly-data-sync \
  --runtime nodejs20.x \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 900 \
  --memory-size 2048 \
  --environment Variables="{DATABASE_URL=$DATABASE_URL}"
```

**3. Create EventBridge Scheduler:**

```bash
aws scheduler create-schedule \
  --name weekly-data-sync \
  --schedule-expression "cron(0 3 ? * SUN *)" \
  --target '{
    "Arn": "arn:aws:lambda:REGION:ACCOUNT_ID:function:weekly-data-sync",
    "RoleArn": "arn:aws:iam::ACCOUNT_ID:role/scheduler-execution-role"
  }' \
  --flexible-time-window '{"Mode": "OFF"}'
```

#### Integration Pattern with Our Stack

```
EventBridge Scheduler → Lambda Function → Supabase PostgreSQL
                             ↓
                        Vercel App (reads data)
```

**For Large CSVs (600 MB):**

```
EventBridge → Lambda → S3 (download CSV) → Lambda (process chunks) → Supabase
```

**Streaming pattern:**
- Download CSV to S3
- Lambda reads S3 stream in chunks
- Process and insert incrementally
- Avoids memory limits

#### Cost Analysis for Our Workload

**Estimated usage per sync:**
- Execution time: ~10 minutes
- Memory: 2048 MB (2 GB)
- Compute: 10 min × 2 GB = 1,200 GB-seconds

**Monthly usage (4 syncs):**
- Invocations: 4 (well under 1M limit)
- Compute: 4,800 GB-seconds (well under 400K limit)

**EventBridge Scheduler:**
- 4 invocations/month (well under 14M limit)

**S3 (if needed for large file staging):**
- Free tier: 5 GB storage, 20,000 GET requests
- Our usage: Temporary 1 GB file, 4 reads/month ✅

**Cost:** $0/month ✅

#### Suitability Score: 7/10

**Reasoning:**
- ✅ Extremely generous free tier
- ✅ Permanent (not trial)
- ✅ 15-minute timeout (plenty for our needs)
- ✅ Scalable (can handle growth)
- ✅ Battle-tested platform
- ✅ Good for large CSV processing (with S3)
- ❌ Very high setup complexity
- ❌ Steep learning curve (IAM, roles, permissions)
- ❌ AWS ecosystem lock-in
- ❌ Requires AWS account management
- ❌ Overkill for simple scheduled jobs

**Recommendation:** **Best free tier for heavy processing**, but complexity is a major drawback. Only consider if:
- You're already familiar with AWS
- You need heavy processing (600 MB+ CSVs regularly)
- You want room to scale significantly

**For our current needs:** Overkill. Setup time (16-24 hours) outweighs benefits.

---

## Part 3: Hybrid Architectures

### Hybrid Pattern 1: GitHub Actions + Vercel (Recommended)

#### Architecture

```
┌─────────────────────────────────────────────────────┐
│  GitHub Actions (Scheduled Workflow)                │
│  - Runs weekly (Sunday 3 AM)                        │
│  - Executes data sync scripts                       │
│  - Writes directly to Supabase                      │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
                ┌──────────────┐
                │  Supabase    │
                │  PostgreSQL  │
                └──────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  Vercel (Next.js App)                               │
│  - Reads data from Supabase                         │
│  - Serves UI to users                               │
│  - Handles authentication                           │
└─────────────────────────────────────────────────────┘
```

#### Implementation Steps

**1. Move sync logic to standalone scripts:**

```
/scripts
  ├── sync-esmr.ts
  ├── sync-smarts-violations.ts
  ├── sync-smarts-enforcement.ts
  └── lib/
      ├── sync-utils.ts
      └── database.ts
```

**2. Create GitHub Actions workflow:**

See [Platform 1: GitHub Actions](#platform-1-github-actions) for full workflow example.

**3. Remove cron jobs from vercel.json:**

```json
{
  "framework": "nextjs",
  "buildCommand": "prisma generate && next build",
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 0 * * *"
    }
    // eSMR sync removed - now handled by GitHub Actions
  ]
}
```

**4. Keep Vercel for:**
- Daily/weekly alert cron jobs
- Frontend application
- API routes for user interactions

#### Security Considerations

**1. GitHub Secrets Management:**
- Store `DATABASE_URL` and `DIRECT_URL` as repository secrets
- Use environment-specific secrets (production vs staging)
- Rotate secrets periodically

**2. Database Connection Security:**
```typescript
// Use direct connection for background jobs (not pooled)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL, // Not DATABASE_URL (pooled)
    },
  },
})
```

**3. Network Security:**
- Supabase allows connections from any IP by default
- Consider restricting to GitHub Actions IP ranges (if available)
- Use SSL/TLS for database connections (enabled by default)

**4. Audit Logging:**
```typescript
// Log all sync operations for auditing
await prisma.syncLog.create({
  data: {
    source: 'github-actions',
    jobType: 'esmr-sync',
    startedAt: new Date(),
    status: 'SUCCESS',
    metadata: {
      githubRunId: process.env.GITHUB_RUN_ID,
      githubActor: process.env.GITHUB_ACTOR,
    },
  },
})
```

#### Operational Complexity Assessment

**Setup Complexity: 2/5** (Medium-Low)
- Moving sync logic to scripts: 4 hours
- Creating GitHub workflow: 2 hours
- Testing and validation: 2 hours
- **Total:** ~8 hours

**Maintenance Complexity: 1/5** (Low)
- Same codebase (monorepo)
- Familiar tech stack (Node.js, TypeScript)
- GitHub UI for monitoring workflow runs
- No new infrastructure to maintain

**Monitoring:**
- GitHub Actions provides built-in logs
- Can add Slack/email notifications on failure
- Database logs track sync results

**Pros:**
- ✅ Cleanest separation of concerns
- ✅ Zero cost
- ✅ Excellent timeout limits (6 hours)
- ✅ Easy to debug (full logs in GitHub)
- ✅ Can trigger manually for testing

**Cons:**
- ❌ Split infrastructure (GitHub + Vercel)
- ❌ Need to maintain sync scripts separately
- ❌ Workflows disabled after 60 days inactivity (public repos only)

---

### Hybrid Pattern 2: Cloudflare Workers + Vercel

#### Architecture

```
┌─────────────────────────────────────────────────────┐
│  Cloudflare Workers (Cron Triggers)                 │
│  - Runs weekly (Sunday 3 AM)                        │
│  - Processes data sync                              │
│  - Writes to Supabase via Hyperdrive                │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
                ┌──────────────┐
                │  Supabase    │
                │  PostgreSQL  │
                └──────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  Vercel (Next.js App)                               │
│  - Reads data from Supabase                         │
│  - Serves UI to users                               │
└─────────────────────────────────────────────────────┘
```

#### When to Use This Pattern

**Best for:**
- Future real-time features (Workers run globally at edge)
- Frequent, smaller syncs (hourly/daily with 15-min timeout)
- When you need ultra-low latency database access (Hyperdrive)

**Not ideal for our current case because:**
- 30-second timeout for weekly cron (too short for 600 MB CSV)
- Would need to restructure to hourly cron (15-min timeout)
- Additional learning curve

**Future consideration:** If we add real-time features or more frequent syncs

---

### Hybrid Pattern 3: Supabase Edge Functions + Vercel

#### Architecture

```
┌─────────────────────────────────────────────────────┐
│  pg_cron (Supabase)                                 │
│  - Schedules weekly trigger                         │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  Supabase Edge Functions                            │
│  - Orchestrates sync process                        │
│  - Calls individual sync functions                  │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
                ┌──────────────┐
                │  Supabase    │
                │  PostgreSQL  │
                └──────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  Vercel (Next.js App)                               │
│  - Reads data from Supabase                         │
└─────────────────────────────────────────────────────┘
```

#### When to Use This Pattern

**Best for:**
- Staying within Supabase ecosystem
- Database-heavy transformations
- Smaller datasets or incremental syncs

**Challenges for our use case:**
- 150-second Edge Function timeout (tight for large CSVs)
- Would need to batch large datasets

**Recommendation:** Good for incremental syncs or as fallback for orchestrator

---

## Part 4: Decision Matrix

### Comprehensive Comparison Table

| Solution | Cost (Monthly) | Setup Time | Timeout | Memory | Scalability | DX Score | Total Score |
|----------|---------------|------------|---------|---------|-------------|----------|-------------|
| **Vercel Single Orchestrator** | $0 | 8h | 10 min | 1 GB | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **9/10** |
| **GitHub Actions** | $0 | 8h | 6 hours | 7 GB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **9/10** |
| **Cloudflare Workers** | $0 | 16h | 30s-15min | 128 MB | ⭐⭐⭐⭐ | ⭐⭐⭐ | **7/10** |
| **Upstash Queue + Vercel** | $5-20 | 20h | No limit | 1 GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | **6/10** |
| **Supabase Edge + pg_cron** | $0 | 12h | 150s | 1 GB | ⭐⭐⭐ | ⭐⭐⭐⭐ | **8/10** |
| **Google Cloud Functions** | $0* | 24h | 60 min | 10 GB | ⭐⭐⭐⭐⭐ | ⭐⭐ | **6/10** |
| **AWS Lambda** | $0* | 24h | 15 min | 10 GB | ⭐⭐⭐⭐⭐ | ⭐⭐ | **7/10** |
| **Railway** | $5+ | 6h | Custom | Custom | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **3/10** |
| **Render** | $1-3 | 6h | 12 hours | Custom | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **5/10** |

*Free tier permanent, but high complexity

### Detailed Criteria Breakdown

#### Cost (Free Tier Limits)

| Platform | Free Tier | Limits | Notes |
|----------|-----------|--------|-------|
| Vercel | ✅ Free | 2 cron jobs, 10 min timeout | Current platform |
| GitHub Actions | ✅ Free | 2000 min/month (private), unlimited (public) | Generous |
| Cloudflare Workers | ✅ Free | 100k req/day, 30s CPU (weekly cron) | CPU time limiting |
| Supabase | ✅ Free | 150s Edge Function timeout | Good for smaller jobs |
| AWS Lambda | ✅ Free (permanent) | 1M requests, 400k GB-sec/month | Complex setup |
| GCP Cloud Functions | ✅ Free (permanent) | 2M requests, 180k vCPU-sec/month | Complex setup |
| Railway | ❌ Trial only | Requires paid plan for cron | Not suitable |
| Render | ❌ $1/month | Per cron job | Affordable but not free |
| Upstash Redis | ❌ ~$5/month | 500k commands free, queue needs more | For heavy usage |

#### Setup Complexity (1=simplest, 5=most complex)

| Platform | Complexity | Reason |
|----------|------------|--------|
| Vercel Orchestrator | ⭐ (1/5) | Refactor existing code, same platform |
| GitHub Actions | ⭐⭐ (2/5) | Extract scripts, write workflow YAML |
| Supabase Edge Functions | ⭐⭐ (2/5) | Learn Deno, create functions, setup pg_cron |
| Cloudflare Workers | ⭐⭐⭐ (3/5) | New platform, Workers setup, Hyperdrive config |
| Upstash Queue | ⭐⭐⭐⭐ (4/5) | BullMQ setup, queue architecture, worker deployment |
| AWS Lambda | ⭐⭐⭐⭐⭐ (5/5) | IAM roles, Lambda deployment, EventBridge config |
| Google Cloud Functions | ⭐⭐⭐⭐⭐ (5/5) | GCP project, IAM, function deploy, Scheduler |

#### Reliability

| Platform | Uptime SLA | Retry Mechanism | Monitoring |
|----------|------------|-----------------|------------|
| Vercel | 99.9% | Manual | Vercel logs |
| GitHub Actions | 99.9% | Workflow retry | Built-in UI |
| AWS Lambda | 99.95% | EventBridge retry | CloudWatch |
| GCP Cloud Functions | 99.95% | Cloud Scheduler retry | Cloud Logging |
| Cloudflare Workers | 99.99% | Manual | Workers analytics |
| Supabase | 99.9% | Manual | Supabase logs |

#### Performance (Timeout Limits)

| Platform | Timeout | Suitable for 600MB CSV? | Notes |
|----------|---------|-------------------------|-------|
| Vercel | 10 min | ⚠️ Tight | Sequential processing only |
| GitHub Actions | 6 hours | ✅ Yes | Plenty of time |
| AWS Lambda | 15 min | ✅ Yes | With streaming |
| GCP Cloud Functions | 60 min | ✅ Yes | Very generous |
| Cloudflare Workers | 30s (weekly) / 15min (hourly) | ❌ / ⚠️ | Need hourly cron or chaining |
| Supabase Edge Functions | 150s | ❌ Too short | Batch processing needed |
| Upstash Queue | No limit | ✅ Yes | Chunk-based processing |

#### Scalability

| Platform | Max Concurrency | Future Growth | Notes |
|----------|----------------|---------------|-------|
| Vercel Orchestrator | Sequential only | Limited | Hard limit at ~10 min total |
| GitHub Actions | 20 concurrent jobs | Excellent | Can parallelize |
| Upstash Queue | High | Excellent | Built for scale |
| AWS Lambda | 1000 default | Excellent | Can request increase |
| Cloudflare Workers | No limit (edge) | Excellent | Global distribution |

#### Developer Experience

| Platform | Familiarity | Debugging | Documentation | Community |
|----------|-------------|-----------|---------------|-----------|
| Vercel | ⭐⭐⭐⭐⭐ | Good | Excellent | Large |
| GitHub Actions | ⭐⭐⭐⭐ | Excellent | Excellent | Very large |
| Supabase | ⭐⭐⭐⭐ | Good | Excellent | Growing |
| Cloudflare Workers | ⭐⭐⭐ | Good | Excellent | Large |
| AWS Lambda | ⭐⭐ | Complex | Comprehensive | Huge |
| GCP Cloud Functions | ⭐⭐ | Complex | Good | Large |

---

## Part 5: Recommendation

### Primary Recommendation: Vercel Single Orchestrator Cron Job

**Rationale:**

1. **Immediate Implementation** (Ready in 1-2 days)
   - Refactor existing eSMR sync code to library functions
   - Create orchestrator endpoint
   - Update vercel.json
   - Deploy and test

2. **Zero Additional Cost**
   - Stays within Vercel free tier
   - No new platform accounts needed
   - No learning curve for new tools

3. **Sufficient for Current Needs**
   - eSMR sync: ~5 minutes
   - SMARTS violations: ~3 minutes (estimated)
   - SMARTS enforcement: ~2 minutes (estimated)
   - **Total: ~10 minutes** (within 10-minute limit)

4. **Low Complexity**
   - Same codebase
   - Familiar Next.js patterns
   - Easy to debug and monitor
   - No infrastructure sprawl

5. **Incremental Scalability**
   - Start with 2-3 datasets (Phase 1)
   - Monitor performance
   - If approaching timeout limits, migrate to fallback

**Implementation Timeline:**
- **Day 1:** Refactor sync logic to library modules (4 hours)
- **Day 1:** Create orchestrator endpoint (2 hours)
- **Day 1:** Update vercel.json, deploy to staging (1 hour)
- **Day 2:** Testing and validation (2 hours)
- **Day 2:** Deploy to production (1 hour)
- **Total:** ~10 hours over 2 days

**Success Metrics:**
- ✅ All syncs complete in < 9 minutes
- ✅ Error isolation works (one failure doesn't break others)
- ✅ Sync logs provide visibility
- ✅ Zero additional cost

---

### Fallback Option: GitHub Actions

**When to switch:**
- Orchestrator consistently exceeds 8-minute runtime
- Need to add 4+ more datasets
- Processing time becomes unpredictable

**Advantages over orchestrator:**
- 6-hour timeout (36x longer)
- Can parallelize sync jobs
- Excellent logging and monitoring
- Still $0 cost

**Migration Path:**
1. Extract sync functions to `/scripts` directory (already modular)
2. Create GitHub Actions workflow (2 hours)
3. Add repository secrets (30 minutes)
4. Test workflow with manual trigger (1 hour)
5. Enable scheduled trigger (15 minutes)
6. Remove sync cron from Vercel (keep alert crons)

**Migration Effort:** ~4 hours

---

### If We Outgrow Free Tier: Hybrid Strategy

**Scenario:** Adding 7+ SMARTS datasets, total processing > 30 minutes

**Recommended Approach:**
1. **Keep Vercel for:**
   - Frontend application
   - User-facing API routes
   - Alert cron jobs (daily/weekly)

2. **Move heavy processing to:**
   - **GitHub Actions** (first choice - still free)
   - **AWS Lambda + EventBridge** (if need enterprise features)
   - **Paid Render cron jobs** ($1/month - simplest paid option)

3. **Cost optimization:**
   - GitHub Actions: $0 (even for private repos with 2000 min/month)
   - If need > 2000 min/month: Make repo public (unlimited) or pay $0.008/min
   - Render: $1/month for orchestrator cron (acceptable nonprofit cost)

---

### Long-Term Scalability Path

**Year 1 (Current):**
- Vercel Single Orchestrator
- eSMR + 2-3 SMARTS datasets
- Cost: $0/month

**Year 2 (Growth):**
- Migrate to GitHub Actions
- All 7 SMARTS datasets
- Add more data sources (CIWQS, etc.)
- Cost: $0/month (public repo) or < $5/month (private)

**Year 3 (Scale):**
- Consider queue-based architecture (Upstash + Vercel)
- Real-time data updates
- Multi-region deployment
- Cost: $10-20/month (still nonprofit-friendly)

**Enterprise (Future):**
- AWS Lambda + EventBridge + S3
- Advanced ETL pipelines
- Data warehouse integration
- Cost: $50-100/month with significant scale

---

## Next Steps for Implementation

### Week 1: Implement Vercel Orchestrator

**Day 1-2:**
- [ ] Refactor `/app/api/cron/esmr-sync/route.ts` into `/lib/sync/esmr.ts`
- [ ] Create `/lib/sync/smarts-violations.ts` (based on planned structure)
- [ ] Create `/lib/sync/smarts-enforcement.ts`
- [ ] Create `/app/api/cron/data-sync/route.ts` (orchestrator)

**Day 3:**
- [ ] Update `vercel.json` to use new orchestrator endpoint
- [ ] Add `SyncLog` model to Prisma schema for tracking
- [ ] Create database migration

**Day 4:**
- [ ] Deploy to staging environment
- [ ] Test manually via API call
- [ ] Monitor execution time and memory usage

**Day 5:**
- [ ] Deploy to production
- [ ] Verify first scheduled run
- [ ] Monitor logs in Vercel dashboard

### Week 2-3: Implement SMARTS Sync (Phase 1)

**Following guidance from:**
- `/prompts/003-smarts-ciwqs-automation-strategy.md`
- Focus on violations + enforcement first

**Track performance:**
- If total time < 8 minutes: ✅ Stay with orchestrator
- If total time > 8 minutes: ⚠️ Prepare GitHub Actions migration

### Week 4: Set Up Fallback (Proactive)

Even if orchestrator works well, set up GitHub Actions as backup:
- [ ] Extract sync logic to standalone scripts
- [ ] Create GitHub workflow (disabled initially)
- [ ] Add repository secrets
- [ ] Test manually
- [ ] Document switching procedure

**Benefit:** Can switch to fallback in < 1 hour if needed

---

## Appendix: Code Examples

### A. Streaming Large CSV Files

For processing 600 MB CSVs without memory issues:

```typescript
// lib/sync/utils/csv-stream.ts
import { createReadStream } from 'fs'
import { parse } from 'csv-parse'

export async function processLargeCSV(
  filePath: string,
  onChunk: (records: any[]) => Promise<void>,
  chunkSize: number = 1000
): Promise<number> {
  return new Promise((resolve, reject) => {
    let recordsProcessed = 0
    let buffer: any[] = []

    const parser = createReadStream(filePath).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
      })
    )

    parser.on('data', async (record) => {
      buffer.push(record)

      if (buffer.length >= chunkSize) {
        parser.pause()

        try {
          await onChunk(buffer)
          recordsProcessed += buffer.length
          buffer = []
        } catch (error) {
          parser.destroy()
          reject(error)
        }

        parser.resume()
      }
    })

    parser.on('end', async () => {
      if (buffer.length > 0) {
        await onChunk(buffer)
        recordsProcessed += buffer.length
      }
      resolve(recordsProcessed)
    })

    parser.on('error', reject)
  })
}

// Usage in sync function
import { downloadFile } from './download'
import { processLargeCSV } from './csv-stream'

export async function syncSMARTSMonitoring() {
  // Download CSV to temp file
  const tempFile = await downloadFile(
    'https://data.ca.gov/dataset/.../monitoring.csv',
    '/tmp/smarts-monitoring.csv'
  )

  // Process in chunks
  const recordsProcessed = await processLargeCSV(
    tempFile,
    async (chunk) => {
      // Insert chunk to database
      await prisma.smartsMonitoringSample.createMany({
        data: chunk.map(transformRecord),
        skipDuplicates: true,
      })
    },
    1000 // Process 1000 records at a time
  )

  return { recordsProcessed }
}
```

### B. Progress Tracking and Resumability

For long-running syncs that might timeout:

```typescript
// lib/sync/utils/checkpoint.ts
import { prisma } from '@/lib/prisma'

export async function withCheckpoint<T>(
  jobName: string,
  fn: (checkpoint: any) => Promise<T>
): Promise<T> {
  // Load last checkpoint
  const lastRun = await prisma.syncCheckpoint.findUnique({
    where: { jobName },
  })

  const checkpoint = lastRun?.checkpoint || { offset: 0 }

  try {
    const result = await fn(checkpoint)

    // Clear checkpoint on success
    await prisma.syncCheckpoint.delete({
      where: { jobName },
    })

    return result
  } catch (error) {
    // Save checkpoint on failure
    await prisma.syncCheckpoint.upsert({
      where: { jobName },
      update: { checkpoint, lastAttempt: new Date() },
      create: { jobName, checkpoint, lastAttempt: new Date() },
    })

    throw error
  }
}

// Usage
export async function syncSMARTSViolations() {
  return withCheckpoint('smarts-violations', async (checkpoint) => {
    const offset = checkpoint.offset || 0

    // Fetch data starting from offset
    const response = await fetch(
      `https://data.ca.gov/api/...?offset=${offset}&limit=5000`
    )

    // Process and update checkpoint
    checkpoint.offset += recordsProcessed

    return { recordsProcessed }
  })
}
```

---

## Sources and References

### Platform Documentation
- [Usage & Pricing for Cron Jobs - Vercel](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Vercel Limits](https://vercel.com/docs/limits)
- [Configuring Maximum Duration for Vercel Functions](https://vercel.com/docs/functions/configuring-functions/duration)
- [GitHub Actions Billing and Usage](https://docs.github.com/en/actions/concepts/billing-and-usage)
- [Cron Triggers - Cloudflare Workers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Cloudflare Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Railway Pricing](https://railway.com/pricing)
- [Cron Jobs - Railway Docs](https://docs.railway.com/reference/cron-jobs)
- [Cron Jobs - Render Docs](https://docs.render.com/cronjobs)
- [Render Pricing](https://render.com/pricing)
- [Scheduling Edge Functions - Supabase](https://supabase.com/docs/guides/functions/schedule-functions)
- [Supabase Cron](https://supabase.com/docs/guides/cron)
- [Google Cloud Functions Free Tier](https://cloud.google.com/free)
- [Cloud Scheduler Pricing](https://cloud.google.com/scheduler/pricing)
- [AWS Lambda Pricing](https://aws.amazon.com/lambda/pricing/)
- [Amazon EventBridge Pricing](https://aws.amazon.com/eventbridge/pricing/)
- [Upstash Redis Pricing](https://upstash.com/pricing/redis)

### Integration Guides
- [Supabase with Cloudflare Workers](https://developers.cloudflare.com/workers/databases/third-party-integrations/supabase/)
- [Integrating Supabase with Cloudflare Workers - LogRocket](https://blog.logrocket.com/integrating-supabase-cloudflare-workers/)
- [How to Deploy to Vercel with GitHub Actions](https://davidmyers.dev/blog/how-to-deploy-to-vercel-with-github-actions)
- [GitHub Actions Webhook Triggers](https://github.com/orgs/community/discussions/138466)

### CSV Processing
- [Parse Large CSV Files via Stream in Node.js](https://medium.com/@ayushpratap2494/parse-large-csv-files-via-stream-in-node-js-91c329ff3620)
- [Processing Large CSV Files with AWS Lambda](https://www.linkedin.com/pulse/processing-large-csv-files-aws-lambda-node-streams-jefferson)
- [Processing Large S3 Files with AWS Lambda](https://medium.com/swlh/processing-large-s3-files-with-aws-lambda-2c5840ae5c91)

### Architecture Patterns
- [Top 6 Queue Management Solutions for Next.js](https://dev.to/ethanleetech/top-6-queue-management-solutions-for-your-nextjs-app-2024-mal)
- [Task Scheduling in Next.js - Top Tools](https://dev.to/ethanleetech/task-scheduling-in-nextjs-top-tools-and-best-practices-2024-3l77)
- [Orchestrating Batch Processing Pipelines with Cron and Make](https://snowplow.io/blog/orchestrating-batch-processing-pipelines-with-cron-and-make)

---

**Document Version:** 1.0
**Last Updated:** December 6, 2025
**Next Review:** After implementing Phase 1 (Vercel Orchestrator)
**Owner:** Development Team
