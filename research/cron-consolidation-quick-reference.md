# Cron Consolidation - Quick Reference

**TL;DR:** Use Vercel Single Orchestrator now, migrate to GitHub Actions if needed later.

---

## Immediate Action Plan

### Week 1: Implement Vercel Orchestrator

```typescript
// app/api/cron/data-sync/route.ts
export async function GET(request: NextRequest) {
  // Run syncs sequentially with error isolation
  const jobs = [
    { name: "eSMR", fn: syncESMR },
    { name: "SMARTS Violations", fn: syncSMARTSViolations },
    { name: "SMARTS Enforcement", fn: syncSMARTSEnforcement },
  ]

  for (const job of jobs) {
    try {
      await job.fn()
    } catch (error) {
      console.error(`${job.name} failed:`, error)
      continue // Error isolation
    }
  }
}
```

**Benefits:**
- ✅ Ready in 1-2 days
- ✅ $0 cost
- ✅ Handles 3-4 datasets easily

---

## When to Switch to GitHub Actions

**Triggers:**
- Total processing time > 8 minutes consistently
- Need to add 4+ more datasets
- Want better timeout limits (6 hours vs 10 minutes)

**Migration Time:** ~4 hours

---

## Cost Summary

| Solution | Free Tier | When to Pay |
|----------|-----------|-------------|
| **Vercel Orchestrator** | Forever | Never (within 2 cron limit) |
| **GitHub Actions** | Forever (public repo) | Private repos > 2000 min/month |
| **Cloudflare Workers** | Forever | > 100k requests/day (unlikely) |
| **Supabase Edge Functions** | Forever | Never (within compute quota) |
| **AWS Lambda** | Forever | > 1M requests/month (unlikely) |
| **Render** | $1/month | Immediately |
| **Railway** | $5/month | After trial |

---

## Decision Tree

```
START: Need to add SMARTS data sync
  │
  ├─ Can total sync complete in < 8 minutes?
  │   ├─ YES → Use Vercel Single Orchestrator ✅
  │   │         (Recommended for Phase 1: eSMR + 2-3 SMARTS files)
  │   │
  │   └─ NO → Need > 8 minutes
  │       │
  │       ├─ Willing to setup GitHub Actions?
  │       │   ├─ YES → Use GitHub Actions ✅
  │       │   │         (6-hour timeout, still $0)
  │       │   │
  │       │   └─ NO → Use AWS Lambda + EventBridge
  │       │             (15-min timeout, complex setup)
  │       │
  │       └─ Need real-time / edge features?
  │           └─ YES → Use Cloudflare Workers
  │                     (requires hourly cron for 15-min timeout)
```

---

## Processing Time Estimates

Based on current eSMR sync (5K records in 2-5 minutes):

| Dataset | Size | Estimated Time | Confidence |
|---------|------|----------------|------------|
| eSMR | 5K records | 2-5 min | ✅ Known |
| SMARTS Violations | 32 MB | 2-3 min | 🔸 Medium |
| SMARTS Enforcement | 35 MB | 2-3 min | 🔸 Medium |
| SMARTS Facilities | 23 MB | 1-2 min | 🔸 Medium |
| **Phase 1 Total** | ~90 MB | **5-11 min** | **✅ Within limit** |
| | | |
| SMARTS Monitoring (Industrial) | 644 MB | 15-30 min | 🔸 Medium |
| SMARTS Monitoring (Construction) | 324 MB | 10-20 min | 🔸 Medium |
| **All Datasets Total** | ~1.2 GB | **30-60 min** | **❌ Needs GitHub Actions** |

---

## Fallback Setup (Do in Week 4)

Even if Vercel works well, prepare GitHub Actions as insurance:

```yaml
# .github/workflows/data-sync.yml
name: Weekly Data Sync
on:
  schedule:
    - cron: '0 3 * * 0'  # Sunday 3 AM UTC

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx prisma generate
      - run: npm run sync:esmr
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**Setup time:** 2-3 hours
**Benefit:** Can switch in < 1 hour if Vercel hits limits

---

## Key Metrics to Monitor

Track in first 4 weeks:

```typescript
// Add to orchestrator response
return NextResponse.json({
  success: true,
  totalDuration: `${duration}s`,  // ⚠️ Watch this!
  jobsRun: 3,
  jobsSucceeded: 3,
  details: [
    { name: "eSMR", duration: "4.2s", records: 4823 },
    { name: "SMARTS Violations", duration: "2.8s", records: 1240 },
    { name: "SMARTS Enforcement", duration: "1.9s", records: 890 },
  ]
})
```

**Red flags:**
- 🚨 Total duration > 8 minutes → Prepare to migrate
- 🚨 Any job > 4 minutes → Optimize or split
- 🚨 Memory errors → Use streaming (see full doc)

---

## Code Snippets

### Streaming Large CSVs (if needed)

```typescript
import { parse } from 'csv-parse'

async function processLargeCSV(url: string) {
  const response = await fetch(url)
  const stream = response.body

  let buffer = []
  const parser = stream.pipe(parse({ columns: true }))

  for await (const record of parser) {
    buffer.push(record)

    if (buffer.length >= 1000) {
      await prisma.smartsSample.createMany({
        data: buffer,
        skipDuplicates: true,
      })
      buffer = []
    }
  }

  // Insert remaining
  if (buffer.length > 0) {
    await prisma.smartsSample.createMany({ data: buffer })
  }
}
```

### Error Isolation Pattern

```typescript
const results = { succeeded: 0, failed: 0, errors: [] }

for (const job of jobs) {
  try {
    await job.fn()
    results.succeeded++
  } catch (error) {
    results.failed++
    results.errors.push({ job: job.name, error: error.message })
    continue // Don't break, keep going!
  }
}

// Partial success is OK
return NextResponse.json({
  success: results.failed === 0,
  ...results,
})
```

---

## Platform Quick Facts

### Vercel
- **Limit:** 2 cron jobs, 10-min timeout
- **Cost:** $0 forever
- **Setup:** 1 day
- **Best for:** Our Phase 1 ✅

### GitHub Actions
- **Limit:** 2000 min/month (private), unlimited (public)
- **Timeout:** 6 hours
- **Cost:** $0 (make repo public if needed)
- **Setup:** 0.5 days
- **Best for:** Fallback, heavy processing ✅

### Cloudflare Workers
- **Limit:** 100k req/day, 30s CPU (weekly cron)
- **Cost:** $0 forever
- **Setup:** 2 days
- **Best for:** Hourly/daily syncs, edge features

### Supabase Edge Functions
- **Limit:** 150s timeout
- **Cost:** $0 forever
- **Setup:** 1 day
- **Best for:** Database-heavy, smaller datasets

### AWS Lambda
- **Limit:** 1M requests/month, 15-min timeout
- **Cost:** $0 (permanent free tier)
- **Setup:** 3 days (complex)
- **Best for:** Enterprise needs, already on AWS

---

## Get Help

**Full research document:**
`/research/cron-consolidation-and-alternatives.md`

**Related docs:**
- `/prompts/003-smarts-ciwqs-automation-strategy.md`
- `/app/api/cron/esmr-sync/route.ts` (reference implementation)

**Key decision:**
Start simple (Vercel), plan fallback (GitHub Actions), scale later if needed.

---

**Last Updated:** December 6, 2025
