# Scalable Violation Computation Research

**Version:** 1.0.0
**Date:** December 1, 2025
**Status:** Research Complete
**Author:** Claude Code Agent

---

## Executive Summary

This research evaluates scalable approaches for computing water quality violations from 1,010,436+ eSMR samples against 53 regulatory benchmarks, addressing Supabase connection pooling constraints that cause timeouts after ~70,000 records.

**Key Finding:** The current monolithic batch processing approach fails due to Supabase pooler timeout limits (P1017 error) combined with Vercel's 10-second serverless function limit on the Hobby tier.

**Recommended Solution:** Incremental cursor-based processing with state tracking, using Supabase's DIRECT_URL connection for long-running operations, combined with chunked Vercel cron jobs that process date-bounded segments.

**Quick Win:** Process violations for recent samples only (last 90 days) to immediately populate the dashboard while implementing the full solution.

---

## Table of Contents

1. [Problem Analysis](#problem-analysis)
2. [Infrastructure Constraints](#infrastructure-constraints)
3. [Options Analysis](#options-analysis)
4. [Recommended Approach](#recommended-approach)
5. [Quick Win Solution](#quick-win-solution)
6. [Implementation Plan](#implementation-plan)
7. [Cost Analysis](#cost-analysis)
8. [References](#references)

---

## Problem Analysis

### Current Implementation

**File:** `/scripts/compute-violations.ts` (408 lines)

**Approach:**
- Loads all 53 benchmarks into memory
- Processes 1,010,436 samples in batches of 10,000 using offset pagination
- Creates dual-model violations: `ViolationEvent` (aggregated) + `ViolationSample` (individual)
- Uses Supabase pooled connection (`DATABASE_URL`)

**Failure Point:**
```
Error: P1017 - Server has closed the connection
Location: After ~70,000 records (batch 7 of 101)
Cause: Supabase connection pooler timeout
```

### Root Causes

1. **Connection Pooler Timeout**: Supabase's transaction pooler (port 6543) has strict timeout limits designed for short-lived queries
2. **Offset Pagination Performance**: Each batch requires scanning and discarding previous rows (`OFFSET 70000` scans 70,000 rows)
3. **Single Long Transaction**: Processing 1M+ records in one script exceeds pooler's patience
4. **Memory Accumulation**: Building large violation arrays in memory before batch insertion

### Data Scale

```
Total Samples:        1,010,436
Benchmarks:           53
Mapped Parameters:    471
Expected Violations:  ~50,000-100,000 (5-10% hit rate)
Processing Time:      ~15-20 minutes (if completed)
```

---

## Infrastructure Constraints

### Supabase Connection Pooling

**Transaction Pooler (Port 6543):**
- **Purpose:** High-concurrency short queries
- **Mode:** Transaction-level pooling
- **Timeout:** Aggressive (kills idle connections quickly)
- **Use Case:** API routes, Next.js server components
- **Limitation:** Not suitable for long-running batch operations

**Session Pooler (Port 5432):**
- **Purpose:** Long-running queries and migrations
- **Mode:** Session-level pooling
- **Timeout:** More lenient (up to 1 minute queue time)
- **Use Case:** Background jobs, data migrations
- **Access:** Via `DIRECT_URL` environment variable

**References:**
- [Supabase: Avoiding timeouts in long running queries](https://supabase.com/docs/guides/troubleshooting/avoiding-timeouts-in-long-running-queries-6nmbdN)
- [Supabase: Connection management](https://supabase.com/docs/guides/database/connection-management)

### Vercel Function Limits

**Hobby Tier:**
- **Function Timeout:** 10 seconds (hard limit)
- **Memory:** 1024 MB
- **Cron Jobs:** Unlimited schedule, subject to function limits
- **Cost:** Free

**Pro Tier ($20/month):**
- **Function Timeout:** 60 seconds (can configure `maxDuration`)
- **Memory:** Up to 3008 MB
- **Cron Jobs:** Same as Hobby
- **Cost:** $20/month base + usage

**References:**
- [Vercel: Function Limitations](https://vercel.com/docs/functions/limitations)
- [Vercel: Limits](https://vercel.com/docs/limits)

### Prisma Performance

**Batch Processing:**
- **Offset Pagination:** O(n) performance degradation; scans discarded rows
- **Cursor Pagination:** O(1) seeking via indexed columns; consistent performance
- **Limitation:** Prisma's cursor implementation still generates `OFFSET` in some cases

**Best Practices:**
- Batch size: 1,000-5,000 for `createMany`
- Use `skipDuplicates: true` for idempotency
- Prefer raw SQL for bulk operations requiring `RETURNING`

**References:**
- [Prisma: Transactions and batch queries](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
- [Medium: Mastering Bulk Inserts in Prisma](https://medium.com/@ivanspoljaric22/mastering-bulk-inserts-in-prisma-best-practices-for-performance-integrity-2ba531f86f74)

---

## Options Analysis

### Option 1: Incremental Date-Based Processing

**How It Works:**
- Divide 1M+ samples into date ranges (e.g., by month or quarter)
- Process one date range per cron invocation
- Track last processed date in a metadata table
- Resume from checkpoint on next run

**Implementation:**

```typescript
// New table: ViolationComputationState
model ViolationComputationState {
  id               String   @id @default(cuid())
  lastProcessedDate DateTime?
  status           String   // 'idle', 'processing', 'complete'
  processedSamples Int      @default(0)
  createdViolations Int     @default(0)
  updatedAt        DateTime @updatedAt
}

// Cron job: Process one month at a time
async function computeViolationsIncremental() {
  const state = await getOrCreateState();

  const startDate = state.lastProcessedDate || new Date('2020-01-01');
  const endDate = addMonths(startDate, 1);

  // Process samples in this date range
  const samples = await prisma.eSMRSample.findMany({
    where: {
      samplingDate: { gte: startDate, lt: endDate },
      result: { not: null },
    },
    include: { parameter: true, location: { include: { facility: true } } },
  });

  // ... compute violations ...

  // Update checkpoint
  await prisma.violationComputationState.update({
    where: { id: state.id },
    data: {
      lastProcessedDate: endDate,
      processedSamples: state.processedSamples + samples.length,
    },
  });
}
```

**Pros:**
- ✅ Fits within Vercel 10-second limit (process ~50K samples/month)
- ✅ Resumable if interrupted
- ✅ Progress tracking built-in
- ✅ Can run on Hobby tier (no cost)
- ✅ Simple to implement

**Cons:**
- ❌ Slow initial backfill (months of data = months to process)
- ❌ Duplication of logic (same computation loop as full script)
- ❌ Still uses offset pagination within date range

**Effort:** 4-6 hours

**Cost:** $0 (Hobby tier compatible)

---

### Option 2: Cursor-Based Pagination with DIRECT_URL

**How It Works:**
- Use Supabase `DIRECT_URL` (session pooler, port 5432)
- Replace offset pagination with cursor-based iteration
- Process in smaller batches (1,000-2,000 samples)
- No time limit (runs as local script or GitHub Action)

**Implementation:**

```typescript
// Use DIRECT_URL connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

// Cursor-based pagination
async function computeViolationsWithCursor() {
  let cursor: string | undefined = undefined;
  const batchSize = 2000;
  let totalProcessed = 0;

  while (true) {
    const samples = await prisma.eSMRSample.findMany({
      where: { result: { not: null } },
      take: batchSize,
      skip: cursor ? 1 : 0, // Skip cursor itself
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
      include: { parameter: true, location: { include: { facility: true } } },
    });

    if (samples.length === 0) break;

    // Process batch
    const violations = await processBatch(samples);
    await createViolationRecords(violations);

    cursor = samples[samples.length - 1].id;
    totalProcessed += samples.length;

    console.log(`Processed ${totalProcessed.toLocaleString()} samples...`);
  }
}
```

**Pros:**
- ✅ Consistent O(1) performance per batch
- ✅ Uses session pooler (better timeout handling)
- ✅ Complete backfill in single run (~20 minutes)
- ✅ No intermediate state tracking needed
- ✅ Battle-tested pattern (used in esmr import service)

**Cons:**
- ❌ Can't run as Vercel cron (exceeds 10s limit)
- ❌ Requires alternative execution (GitHub Actions, local)
- ❌ DIRECT_URL must be configured

**Effort:** 2-3 hours

**Cost:** $0 (can run locally or GitHub Actions free tier)

---

### Option 3: Hybrid - Incremental Cursor Processing

**How It Works:**
- Combine cursor-based pagination with date-bounded chunks
- Each Vercel cron processes one date range using cursors
- Track progress in database
- Best of both worlds

**Implementation:**

```typescript
// Vercel cron: /api/cron/compute-violations
export const maxDuration = 60; // Pro tier only
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await getOrCreateState();

  // Determine next date range to process
  const startDate = state.lastProcessedDate || new Date('2020-01-01');
  const endDate = addDays(startDate, 30); // Process 1 month

  // Use cursor within this date range
  let cursor: string | undefined = undefined;
  const batchSize = 2000;
  let processed = 0;

  while (true) {
    const samples = await prisma.eSMRSample.findMany({
      where: {
        samplingDate: { gte: startDate, lt: endDate },
        result: { not: null },
      },
      take: batchSize,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
      include: { parameter: true, location: { include: { facility: true } } },
    });

    if (samples.length === 0) break;

    // Process and create violations
    const violations = await processBatch(samples);
    await createViolationRecords(violations);

    cursor = samples[samples.length - 1].id;
    processed += samples.length;
  }

  // Update state
  await updateState(state.id, endDate, processed);

  return NextResponse.json({
    success: true,
    processed,
    nextDate: endDate,
  });
}
```

**Pros:**
- ✅ Runs as automated Vercel cron
- ✅ Cursor-based efficiency within date ranges
- ✅ Resumable and trackable
- ✅ Can use DIRECT_URL for better timeouts
- ✅ Gradual backfill (non-blocking)

**Cons:**
- ⚠️ Requires Pro tier for 60s `maxDuration` ($20/month)
- ❌ More complex state management
- ❌ Still slower than one-shot cursor approach

**Effort:** 6-8 hours

**Cost:** $20/month (Pro tier)

---

### Option 4: Queue-Based Processing (Vercel Queues)

**How It Works:**
- Use Vercel Queues (Limited Beta) to enqueue violation computation jobs
- Cron job chunks samples into queue messages
- Queue workers process each chunk independently
- Scales horizontally across multiple function invocations

**Implementation:**

```typescript
// Queue definition
import { Queue } from '@vercel/queue';

const violationQueue = new Queue('violation-computation', {
  regions: ['us-east-1'],
});

// Cron: Enqueue jobs for each month
export async function GET() {
  const dateRanges = getMonthlyRanges(2020, 2025);

  for (const range of dateRanges) {
    await violationQueue.enqueue({
      startDate: range.start,
      endDate: range.end,
    });
  }

  return NextResponse.json({ queued: dateRanges.length });
}

// Queue worker: Process one date range
export async function POST(request: Request) {
  const { startDate, endDate } = await request.json();

  const samples = await prisma.eSMRSample.findMany({
    where: {
      samplingDate: { gte: new Date(startDate), lt: new Date(endDate) },
    },
  });

  const violations = await processBatch(samples);
  await createViolationRecords(violations);

  return NextResponse.json({ processed: samples.length });
}
```

**Pros:**
- ✅ True horizontal scaling
- ✅ Built-in retry and failure handling
- ✅ Parallel processing (faster backfill)
- ✅ Managed infrastructure

**Cons:**
- ❌ Limited Beta (requires application)
- ❌ Potentially expensive at scale
- ❌ Most complex implementation
- ❌ Overkill for this use case

**Effort:** 10-12 hours (including queue setup)

**Cost:** Unknown (beta pricing TBD)

**References:**
- [Vercel: Queues Limited Beta](https://vercel.com/changelog/vercel-queues-is-now-in-limited-beta)

---

### Option 5: GitHub Actions Scheduled Workflow

**How It Works:**
- Run violation computation as GitHub Action on schedule
- Uses DIRECT_URL for database access
- No Vercel function time limits
- Free for public repos, generous limits for private

**Implementation:**

```yaml
# .github/workflows/compute-violations.yml
name: Compute Violations

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:      # Manual trigger

jobs:
  compute:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - run: npm ci

      - name: Compute Violations
        env:
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm run compute:violations
```

**Modified Script:**
```typescript
// Use DIRECT_URL, cursor-based pagination
// Process all samples in one run (~20 min)
// No time limit constraints
```

**Pros:**
- ✅ No serverless timeout limits
- ✅ Free for reasonable usage (2,000 min/month free tier)
- ✅ Simple implementation (reuse existing script)
- ✅ Scheduled automation
- ✅ Manual trigger option

**Cons:**
- ❌ Not within Vercel ecosystem
- ❌ Requires exposing DIRECT_URL to GitHub Secrets
- ❌ Slower cold starts than Vercel
- ❌ Separate monitoring/logging

**Effort:** 2-3 hours

**Cost:** $0 (free tier sufficient)

**References:**
- [GitHub: Actions pricing](https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions)

---

## Recommended Approach

### Option 2 Enhanced: Cursor-Based Processing with Incremental Updates

**Why This Approach:**

1. **Optimal Performance:** Cursor-based pagination provides consistent O(1) performance
2. **Reliable:** Uses DIRECT_URL (session pooler) to avoid connection timeouts
3. **Flexible Execution:** Can run locally, GitHub Actions, or manual Vercel deployment
4. **Incremental Updates:** After initial backfill, processes only new/updated samples
5. **Cost-Effective:** $0 on free tiers
6. **Battle-Tested:** Same pattern as eSMR import service (proven at scale)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Initial Backfill (One-Time)                        │
│                                                              │
│  Local Script / GitHub Action                               │
│  ├─ Use DIRECT_URL (session pooler)                         │
│  ├─ Cursor-based pagination (2K batch)                      │
│  ├─ Process all 1M+ samples                                 │
│  └─ Duration: ~20 minutes                                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Incremental Updates (Ongoing)                      │
│                                                              │
│  Vercel Cron: /api/cron/compute-violations                  │
│  ├─ Runs daily at 3 AM                                      │
│  ├─ Processes samples since last run                        │
│  ├─ Uses cursor for efficiency                              │
│  └─ Duration: <10 seconds (fits Hobby tier)                 │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Details

#### 1. Enhanced Script with Cursor Pagination

**File:** `scripts/compute-violations-cursor.ts`

```typescript
#!/usr/bin/env tsx

import { config } from 'dotenv';
config();

import { PrismaClient, BenchmarkType, ViolationSeverity } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Use DIRECT_URL for long-running operations
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

interface ProcessingStats {
  samplesProcessed: number;
  samplesWithBenchmark: number;
  violationsCreated: number;
  violationEventsCreated: number;
  startTime: number;
}

async function computeViolationsCursor(sinceDate?: Date) {
  console.log('🔍 Computing violations with cursor-based pagination...\n');

  const stats: ProcessingStats = {
    samplesProcessed: 0,
    samplesWithBenchmark: 0,
    violationsCreated: 0,
    violationEventsCreated: 0,
    startTime: Date.now(),
  };

  // Load all benchmarks once (small dataset ~53 records)
  const benchmarks = await prisma.pollutantBenchmark.findMany({
    include: { pollutant: true },
  });
  console.log(`Found ${benchmarks.length} benchmarks to check\n`);

  // Get total count for progress reporting
  const totalCount = await prisma.eSMRSample.count({
    where: {
      result: { not: null },
      ...(sinceDate && { samplingDate: { gte: sinceDate } }),
    },
  });
  console.log(`Processing ${totalCount.toLocaleString()} samples\n`);

  // Cursor-based pagination
  let cursor: string | undefined = undefined;
  const batchSize = 2000;
  let batchNum = 0;

  while (true) {
    const samples = await prisma.eSMRSample.findMany({
      where: {
        result: { not: null },
        ...(sinceDate && { samplingDate: { gte: sinceDate } }),
      },
      take: batchSize,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
      include: {
        parameter: true,
        location: {
          include: { facility: true },
        },
      },
    });

    if (samples.length === 0) break;

    batchNum++;
    console.log(
      `Batch ${batchNum}: Processing ${samples.length} samples (${stats.samplesProcessed.toLocaleString()} / ${totalCount.toLocaleString()})...`
    );

    // Process batch (reuse existing logic from compute-violations.ts)
    const violations = await processSampleBatch(samples, benchmarks);

    // Create violation records
    const created = await createViolationRecords(violations);

    stats.samplesProcessed += samples.length;
    stats.samplesWithBenchmark += violations.samplesWithBenchmark;
    stats.violationsCreated += created.samplesCreated;
    stats.violationEventsCreated += created.eventsCreated;

    // Update cursor to last sample ID
    cursor = samples[samples.length - 1].id;

    // Progress update every 10 batches
    if (batchNum % 10 === 0) {
      const elapsed = (Date.now() - stats.startTime) / 1000;
      const rate = stats.samplesProcessed / elapsed;
      console.log(`  Progress: ${(stats.samplesProcessed / totalCount * 100).toFixed(1)}% | Rate: ${rate.toFixed(0)} samples/sec`);
    }
  }

  const duration = (Date.now() - stats.startTime) / 1000;
  console.log(`\n✅ Violation computation complete in ${duration.toFixed(1)}s`);
  console.log(`   Samples processed: ${stats.samplesProcessed.toLocaleString()}`);
  console.log(`   Samples with benchmarks: ${stats.samplesWithBenchmark.toLocaleString()}`);
  console.log(`   Violation events: ${stats.violationEventsCreated.toLocaleString()}`);
  console.log(`   Violation samples: ${stats.violationsCreated.toLocaleString()}\n`);
}

// ... processSampleBatch() and createViolationRecords() functions ...
// (Extracted from existing compute-violations.ts)

async function main() {
  try {
    // Optional: Only process samples since last computation
    // const lastRun = await getLastComputationDate();
    // await computeViolationsCursor(lastRun);

    await computeViolationsCursor(); // Full backfill
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

**Package.json:**
```json
{
  "scripts": {
    "compute:violations": "tsx scripts/compute-violations-cursor.ts"
  }
}
```

#### 2. Incremental Update Cron Job

**File:** `app/api/cron/compute-violations/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Runs daily to process new samples
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Get last computation timestamp
    const lastRun = await prisma.violationComputationState.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    const sinceDate = lastRun?.lastProcessedDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    console.log(`Computing violations since ${sinceDate.toISOString()}`);

    // Process only new samples (usually <10K/day, fits in 10s limit)
    const result = await computeViolationsIncremental(sinceDate);

    // Update state
    await prisma.violationComputationState.upsert({
      where: { id: lastRun?.id || 'singleton' },
      create: {
        id: 'singleton',
        lastProcessedDate: new Date(),
        status: 'complete',
        processedSamples: result.samplesProcessed,
        createdViolations: result.violationsCreated,
      },
      update: {
        lastProcessedDate: new Date(),
        status: 'complete',
        processedSamples: { increment: result.samplesProcessed },
        createdViolations: { increment: result.violationsCreated },
      },
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    return NextResponse.json({
      success: true,
      duration: `${duration}s`,
      ...result,
    });
  } catch (error) {
    console.error('Error computing violations:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

async function computeViolationsIncremental(sinceDate: Date) {
  // Simplified version for incremental updates
  // Uses same logic as cursor script but for date range
  // Should complete in <10 seconds for daily samples

  const samples = await prisma.eSMRSample.findMany({
    where: {
      samplingDate: { gte: sinceDate },
      result: { not: null },
    },
    include: {
      parameter: true,
      location: { include: { facility: true } },
    },
  });

  // ... process violations ...

  return {
    samplesProcessed: samples.length,
    violationsCreated: 0, // Count from processing
  };
}
```

**Vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron/esmr-sync",
      "schedule": "0 3 * * 0"
    },
    {
      "path": "/api/cron/compute-violations",
      "schedule": "0 4 * * *"
    }
  ]
}
```

#### 3. State Tracking Schema

**Add to schema.prisma:**

```prisma
model ViolationComputationState {
  id                String   @id @default("singleton")
  lastProcessedDate DateTime?
  status            String   @default("idle")
  processedSamples  Int      @default(0)
  createdViolations Int      @default(0)
  errors            String?  @db.Text
  updatedAt         DateTime @updatedAt

  @@map("violation_computation_state")
}
```

### Step-by-Step Implementation Plan

#### Phase 1: Initial Backfill (Week 1)

**Day 1: Setup (2 hours)**
1. Add `ViolationComputationState` model to schema
2. Run `prisma db push` to create table
3. Add DIRECT_URL to `.env` (copy from Supabase dashboard)
4. Create `scripts/compute-violations-cursor.ts`

**Day 2-3: Implementation (6 hours)**
5. Extract `processSampleBatch()` logic into reusable function
6. Implement cursor-based pagination loop
7. Add progress logging and error handling
8. Test with small date range (100K samples)

**Day 4: Full Backfill (1 hour + 20 min runtime)**
9. Run full backfill: `npm run compute:violations`
10. Monitor progress and verify results
11. Check violation counts match expectations

#### Phase 2: Incremental Updates (Week 2)

**Day 1: Cron Job (4 hours)**
12. Create `/api/cron/compute-violations/route.ts`
13. Implement incremental processing logic
14. Add state tracking updates
15. Test locally with recent date range

**Day 2: Deployment (2 hours)**
16. Add cron schedule to `vercel.json`
17. Deploy to Vercel
18. Test cron endpoint manually
19. Verify first scheduled run

**Day 3: Monitoring (2 hours)**
20. Add logging to track daily runs
21. Create dashboard query to show recent violations
22. Set up alerts for cron failures

### Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| DIRECT_URL timeout during backfill | High | Low | Use smaller batches (1K), add retry logic |
| Duplicate violations created | Medium | Medium | Use `upsert` with unique constraints on `esmrSampleId + benchmarkId` |
| Cron job exceeds 10s for daily updates | Medium | Low | Process in chunks if >10K new samples/day; upgrade to Pro if needed |
| Benchmark changes invalidate old violations | Low | Low | Store `benchmarkId` reference, recompute if benchmarks updated |
| Memory issues with large batches | Medium | Low | Reduce batch size to 1K, stream results |

### Success Metrics

**Initial Backfill:**
- ✅ Processes all 1M+ samples without timeout
- ✅ Creates accurate violation records (spot check 100 samples)
- ✅ Completes in <30 minutes
- ✅ No duplicate violations

**Incremental Updates:**
- ✅ Daily cron runs complete in <10 seconds
- ✅ New violations appear on dashboard within 24 hours
- ✅ Zero missed samples (state tracking accurate)
- ✅ No cron failures in 30-day period

---

## Quick Win Solution

### Objective
Get violations showing on dashboard immediately while implementing full solution.

### Approach
Process only recent samples (last 90 days) to populate dashboard with relevant data.

### Implementation (30 minutes)

**1. Create Quick Script:**

```bash
# scripts/compute-violations-recent.ts
npm run compute:violations -- --since=90d
```

**2. Modify Existing Script:**

```typescript
// Add CLI argument parsing
const args = process.argv.slice(2);
const sinceArg = args.find(arg => arg.startsWith('--since='));
let sinceDate: Date | undefined;

if (sinceArg) {
  const days = parseInt(sinceArg.split('=')[1]);
  sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  console.log(`Processing samples since ${sinceDate.toISOString()}`);
}

// Modify query to include date filter
const samples = await prisma.eSMRSample.findMany({
  where: {
    result: { not: null },
    ...(sinceDate && { samplingDate: { gte: sinceDate } }),
  },
  // ... rest of query
});
```

**3. Run Quick Backfill:**

```bash
npm run compute:violations -- --since=90d
```

**Expected Results:**
- Samples to process: ~200,000 (20% of total)
- Processing time: ~4 minutes
- Violations created: ~10,000-20,000
- Dashboard immediately shows recent violations

**Benefits:**
- ✅ Immediate user value
- ✅ Tests violation logic on real data
- ✅ Identifies any issues before full backfill
- ✅ Provides baseline for comparison

---

## Cost Analysis

### Option Comparison

| Option | Implementation | Monthly Cost | One-Time Cost |
|--------|---------------|--------------|---------------|
| **Incremental Date-Based** | 4-6 hours | $0 | $0 |
| **Cursor + DIRECT_URL** (Recommended) | 2-3 hours | $0 | $0 |
| **Hybrid Incremental Cursor** | 6-8 hours | $20 (Pro tier) | $0 |
| **Vercel Queues** | 10-12 hours | TBD (Beta) | $0 |
| **GitHub Actions** | 2-3 hours | $0 | $0 |

### Recommended Approach Costs

**Free Tier (Recommended):**
- Vercel Hobby: $0/month
- Supabase Free: $0/month (DIRECT_URL included)
- GitHub Actions: $0/month (generous free tier)
- **Total: $0/month**

**If Needed (Pro Tier):**
- Vercel Pro: $20/month (for 60s maxDuration)
- Supabase Pro: $25/month (not required)
- **Total: $20-45/month**

### Cost Optimization Tips

1. **Stay on Free Tier:** Use GitHub Actions or local script for backfill, Vercel cron for incremental
2. **Optimize Queries:** Add indexes to speed up sample filtering
3. **Batch Efficiently:** 2K batch size balances speed and memory
4. **Cache Benchmarks:** Load once, reuse across batches
5. **Monitor Usage:** Track Supabase connection time, Vercel function invocations

---

## References

### Vercel Documentation
- [Vercel: Function Limitations](https://vercel.com/docs/functions/limitations)
- [Vercel: Limits](https://vercel.com/docs/limits)
- [Vercel: Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Vercel: Queues Limited Beta](https://vercel.com/changelog/vercel-queues-is-now-in-limited-beta)

### Supabase Documentation
- [Supabase: Avoiding timeouts in long running queries](https://supabase.com/docs/guides/troubleshooting/avoiding-timeouts-in-long-running-queries-6nmbdN)
- [Supabase: Connection management](https://supabase.com/docs/guides/database/connection-management)
- [Supabase: Prisma troubleshooting](https://supabase.com/docs/guides/database/prisma/prisma-troubleshooting)

### Prisma Documentation
- [Prisma: Transactions and batch queries](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
- [Prisma: Query optimization](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance)

### Performance Research
- [Milan Jovanovic: Understanding Cursor Pagination](https://www.milanjovanovic.tech/blog/understanding-cursor-pagination-and-why-its-so-fast-deep-dive)
- [Citus Data: Five ways to paginate in Postgres](https://www.citusdata.com/blog/2016/03/30/five-ways-to-paginate/)
- [Medium: Mastering Bulk Inserts in Prisma](https://medium.com/@ivanspoljaric22/mastering-bulk-inserts-in-prisma-best-practices-for-performance-integrity-2ba531f86f74)
- [Mark Skelton: Efficient Prisma Pagination](https://mskelton.dev/blog/efficient-prisma-pagination)

### Background Jobs on Vercel
- [Inngest: Long-running background functions on Vercel](https://www.inngest.com/blog/vercel-long-running-background-functions)
- [GitHub: Running background jobs on Vercel](https://github.com/vercel/next.js/discussions/33989)

---

## Appendix: Code Samples

### A. Helper Functions

```typescript
// lib/violations/processor.ts

import { PrismaClient, BenchmarkType, ViolationSeverity } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface ViolationResult {
  sampleId: string;
  facilityPlaceId: number;
  pollutantKey: string;
  benchmarkId: string;
  benchmarkValue: number;
  benchmarkUnit: string;
  sampleValue: number;
  sampleUnit: string;
  exceedanceRatio: number;
  benchmarkType: BenchmarkType;
  detectedAt: Date;
}

export async function processSampleBatch(
  samples: any[],
  benchmarks: any[]
): Promise<ViolationResult[]> {
  const violations: ViolationResult[] = [];

  for (const sample of samples) {
    const sampleValue = parseFloat(sample.result?.toString() || '0');
    if (isNaN(sampleValue) || sampleValue < 0) continue;

    const normalizedParam = normalizeParameterName(sample.parameter.parameterName);

    const matchedBenchmark = findMatchingBenchmark(normalizedParam, benchmarks);
    if (!matchedBenchmark) continue;

    const violation = checkViolation(sample, sampleValue, matchedBenchmark);
    if (violation) {
      violations.push(violation);
    }
  }

  return violations;
}

export async function createViolationRecords(
  violations: ViolationResult[],
  prisma: PrismaClient
): Promise<{ eventsCreated: number; samplesCreated: number }> {
  // Ensure facilities exist
  const facilityMap = await ensureFacilities(violations, prisma);

  // Group by facility + pollutant + year
  const groups = groupViolations(violations, facilityMap);

  // Create ViolationEvents and ViolationSamples
  let eventsCreated = 0;
  let samplesCreated = 0;

  for (const [key, group] of groups.entries()) {
    const event = await upsertViolationEvent(group, prisma);
    eventsCreated++;

    for (const violation of group.violations) {
      await createViolationSample(violation, event.id, group.facilityId, prisma);
      samplesCreated++;
    }
  }

  return { eventsCreated, samplesCreated };
}

// ... additional helper functions
```

### B. Database Indexes

```sql
-- Add indexes to improve violation computation performance

-- Speed up sample filtering by date
CREATE INDEX IF NOT EXISTS idx_esmr_sample_date_result
ON "esmr_samples" (sampling_date, result)
WHERE result IS NOT NULL;

-- Speed up parameter matching
CREATE INDEX IF NOT EXISTS idx_esmr_parameter_name_lower
ON "esmr_parameters" (LOWER(parameter_name));

-- Speed up benchmark lookups
CREATE INDEX IF NOT EXISTS idx_pollutant_benchmark_lookup
ON "pollutant_benchmarks" (pollutant_key, benchmark_type, water_type);

-- Speed up violation queries
CREATE INDEX IF NOT EXISTS idx_violation_event_facility_date
ON "violation_events" (facility_id, first_date DESC);

CREATE INDEX IF NOT EXISTS idx_violation_sample_event_date
ON "violation_samples" (violation_event_id, detected_at DESC);
```

### C. Progress Tracker Component

```typescript
// lib/violations/progress.ts

export class ProgressTracker {
  private startTime: number;
  private processed: number = 0;
  private total: number;

  constructor(total: number) {
    this.total = total;
    this.startTime = Date.now();
  }

  update(count: number) {
    this.processed += count;
    const percent = ((this.processed / this.total) * 100).toFixed(1);
    const elapsed = (Date.now() - this.startTime) / 1000;
    const rate = this.processed / elapsed;
    const remaining = (this.total - this.processed) / rate;

    console.log(
      `Progress: ${this.processed.toLocaleString()} / ${this.total.toLocaleString()} (${percent}%) | ` +
      `Rate: ${rate.toFixed(0)}/s | ETA: ${this.formatTime(remaining)}`
    );
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  }
}
```

---

**Document Version:** 1.0.0
**Last Updated:** December 1, 2025
**Next Review:** March 1, 2026

For questions or implementation assistance, contact the development team.
