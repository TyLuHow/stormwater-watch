# Violation API Migration Guide

This document provides specific code changes required to update existing APIs and components for the new violation schema.

## Breaking Change Summary

The `pollutant` field in ViolationEvent has been renamed to `pollutantKey` and now references ConfigPollutant via foreign key.

**What This Means:**
- All queries filtering by `pollutant` must change to `pollutantKey`
- All responses returning `pollutant` should now return the full ConfigPollutant object or just the key
- TypeScript types will enforce this change

---

## Required Updates

### 1. `/app/api/violations/route.ts`

**Current Code:**
```typescript
// Line 41-44
if (params.pollutants) {
  const pollutants = params.pollutants.split(",").filter(Boolean)
  where.pollutant = { in: pollutants }
}
```

**Updated Code:**
```typescript
if (params.pollutants) {
  const pollutants = params.pollutants.split(",").filter(Boolean)
  where.pollutantKey = { in: pollutants }
}
```

**Current Code:**
```typescript
// Line 127-131
const uniquePollutants = await prisma.violationEvent.findMany({
  select: { pollutant: true },
  distinct: ["pollutant"],
  orderBy: { pollutant: "asc" },
})
```

**Updated Code:**
```typescript
const uniquePollutants = await prisma.violationEvent.findMany({
  select: { pollutantKey: true },
  distinct: ["pollutantKey"],
  orderBy: { pollutantKey: "asc" },
})
```

**Current Code:**
```typescript
// Line 166
pollutants: uniquePollutants.map((v) => v.pollutant),
```

**Updated Code:**
```typescript
pollutants: uniquePollutants.map((v) => v.pollutantKey),
```

---

### 2. `/lib/violations/detector.ts`

**Current Code:**
```typescript
// Line 46
const key = `${sample.facilityId}-${sample.pollutant}`
```

**Updated Code:**
```typescript
const key = `${sample.facilityId}-${sample.pollutantKey}`
```

**Current Code:**
```typescript
// Line 94-96
facilityId: fId,
pollutant: group[0].pollutant,
firstDate: group[0].sampleDate,
```

**Updated Code:**
```typescript
facilityId: fId,
pollutantKey: group[0].pollutantKey,
firstDate: group[0].sampleDate,
```

**Current Code:**
```typescript
// Line 84
pollutant: group[0].pollutant,
```

**Updated Code:**
```typescript
pollutantKey: group[0].pollutantKey,
```

**Current Code:**
```typescript
// Line 158
byPollutant: [...new Set(events.map((e) => e.pollutant))]
  .map((pollutant) => ({
    pollutant,
    count: events.filter((e) => e.pollutant === pollutant).length,
  }))
```

**Updated Code:**
```typescript
byPollutant: [...new Set(events.map((e) => e.pollutantKey))]
  .map((pollutantKey) => ({
    pollutantKey,
    count: events.filter((e) => e.pollutantKey === pollutantKey).length,
  }))
```

---

### 3. `/app/facilities/[id]/page.tsx`

**Current Code:**
```typescript
// Line 16
pollutant: string
```

**Updated Code:**
```typescript
pollutantKey: string
```

**If displaying pollutant name:**
```typescript
// Add pollutant relation to type
interface ViolationEvent {
  id: string
  pollutantKey: string
  pollutant: {
    key: string
    canonicalUnit: string
    category: string | null
  }
  // ... other fields
}

// Update query to include pollutant
violationEvents: {
  where: { dismissed: false },
  include: {
    pollutant: {
      select: {
        key: true,
        canonicalUnit: true,
        category: true,
      },
    },
  },
  orderBy: { maxRatio: "desc" },
}
```

---

### 4. Component Updates

Any component that displays violation pollutant names needs to be updated.

**Example: Violation List Component**

**Before:**
```tsx
<TableCell>{violation.pollutant}</TableCell>
```

**After (Option 1 - Display key):**
```tsx
<TableCell>{violation.pollutantKey}</TableCell>
```

**After (Option 2 - Display full name from relation):**
```tsx
<TableCell>
  {violation.pollutant.key}
  {violation.pollutant.category && (
    <Badge variant="outline" className="ml-2">
      {violation.pollutant.category}
    </Badge>
  )}
</TableCell>
```

---

### 5. Alert Emails and Slack Messages

Update email templates and Slack messages that reference pollutant.

**Example: `/lib/alerts/email.ts`**

**Before:**
```typescript
const pollutants = violations.map(v => v.pollutant).join(', ')
```

**After:**
```typescript
const pollutants = violations.map(v => v.pollutantKey).join(', ')
// Or if you want full names:
const pollutants = violations.map(v => v.pollutant.key).join(', ')
```

---

## Optional Enhancements

While migrating, consider these improvements:

### 1. Add Pollutant Metadata to Responses

**Enhanced Violation Response:**
```typescript
const violations = await prisma.violationEvent.findMany({
  where: { ... },
  include: {
    facility: { ... },
    pollutant: {
      select: {
        key: true,
        canonicalUnit: true,
        category: true,
        aliases: true, // Show alternative names
      },
    },
    // NEW: Include sample count and severity distribution
    _count: {
      select: { samples: true },
    },
    samples: {
      select: { severity: true },
      orderBy: { exceedanceRatio: 'desc' },
      take: 5, // Top 5 worst violations
    },
  },
});
```

### 2. Add New Endpoints for ViolationSamples

**New API: `/api/violations/[eventId]/samples/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params

  const samples = await prisma.violationSample.findMany({
    where: { violationEventId: eventId },
    include: {
      esmrSample: {
        include: {
          location: {
            select: {
              locationCode: true,
              locationType: true,
            },
          },
          parameter: {
            select: { parameterName: true },
          },
        },
      },
      benchmark: {
        select: {
          benchmarkType: true,
          waterType: true,
          value: true,
          unit: true,
          source: true,
        },
      },
    },
    orderBy: { detectedAt: 'desc' },
  })

  return NextResponse.json({ samples })
}
```

**New API: `/api/violations/samples/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET single violation sample detail
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  const sample = await prisma.violationSample.findUnique({
    where: { id },
    include: {
      violationEvent: {
        include: {
          facility: true,
        },
      },
      esmrSample: {
        include: {
          location: true,
          parameter: true,
          analyticalMethod: true,
        },
      },
      benchmark: {
        include: {
          pollutant: true,
        },
      },
    },
  })

  if (!sample) {
    return NextResponse.json(
      { error: "Violation sample not found" },
      { status: 404 }
    )
  }

  return NextResponse.json({ sample })
}

// PATCH update violation status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const body = await request.json()

  const { status, reviewNotes, reviewedBy } = body

  const updated = await prisma.violationSample.update({
    where: { id },
    data: {
      status,
      reviewNotes,
      reviewedBy,
      reviewedAt: new Date(),
    },
  })

  return NextResponse.json({ sample: updated })
}
```

### 3. Add Severity Filtering

**Enhanced Violations API:**

```typescript
// In QuerySchema
const QuerySchema = z.object({
  // ... existing fields
  severity: z.string().optional(), // CRITICAL, HIGH, MODERATE, LOW
  status: z.string().optional(),   // OPEN, UNDER_REVIEW, RESOLVED, DISMISSED
})

// In where clause
if (params.severity) {
  where.maxSeverity = params.severity as ViolationSeverity
}
```

### 4. Add Drilldown Component

**New Component: `components/violations/violation-samples-table.tsx`**

```tsx
import { ViolationSample } from '@prisma/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type ViolationSampleWithRelations = ViolationSample & {
  esmrSample: {
    location: { locationCode: string, locationType: string }
    parameter: { parameterName: string }
  }
  benchmark: {
    benchmarkType: string
    value: Decimal
    unit: string
  }
}

export function ViolationSamplesTable({
  samples
}: {
  samples: ViolationSampleWithRelations[]
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Measured</TableHead>
          <TableHead>Benchmark</TableHead>
          <TableHead>Ratio</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {samples.map((sample) => (
          <TableRow key={sample.id}>
            <TableCell>
              {sample.detectedAt.toLocaleDateString()}
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <div>{sample.esmrSample.location.locationCode}</div>
                <div className="text-muted-foreground">
                  {sample.esmrSample.location.locationType}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <strong>{sample.measuredValue.toNumber()}</strong> {sample.measuredUnit}
            </TableCell>
            <TableCell>
              {sample.benchmarkValue.toNumber()} {sample.benchmarkUnit}
              <div className="text-xs text-muted-foreground">
                {sample.benchmark.benchmarkType}
              </div>
            </TableCell>
            <TableCell>
              <strong>{sample.exceedanceRatio.toNumber()}x</strong>
            </TableCell>
            <TableCell>
              <Badge variant={
                sample.severity === 'CRITICAL' ? 'destructive' :
                sample.severity === 'HIGH' ? 'default' :
                sample.severity === 'MODERATE' ? 'secondary' :
                'outline'
              }>
                {sample.severity}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{sample.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

---

## Testing Checklist

After making changes:

### API Tests
- [ ] GET /api/violations returns violations with pollutantKey
- [ ] GET /api/violations filters by pollutantKey work
- [ ] Dashboard loads without errors
- [ ] Facility detail page loads without errors
- [ ] Violation drilldown shows individual samples
- [ ] Alert emails include correct pollutant names

### UI Tests
- [ ] Violation table displays pollutant keys/names correctly
- [ ] Facility page shows violation events correctly
- [ ] Pollutant filters work in violation search
- [ ] Case packet includes violation details
- [ ] Maps display violations correctly

### Data Tests
- [ ] ViolationEvent.count matches ViolationSample count
- [ ] ViolationEvent.maxRatio matches max ViolationSample.exceedanceRatio
- [ ] ViolationEvent.maxSeverity matches max ViolationSample.severity
- [ ] No duplicate ViolationSamples (esmrSampleId + benchmarkId unique)

---

## Migration Script

Run this script to update all API files automatically:

```bash
#!/bin/bash

# Find and replace pollutant with pollutantKey in API files
find app/api -name "*.ts" -type f -exec sed -i 's/pollutant:/pollutantKey:/g' {} \;
find app/api -name "*.ts" -type f -exec sed -i 's/\.pollutant/\.pollutantKey/g' {} \;

# Update lib/violations
sed -i 's/pollutant:/pollutantKey:/g' lib/violations/detector.ts
sed -i 's/\.pollutant/\.pollutantKey/g' lib/violations/detector.ts

# Report changes
echo "Updated the following files:"
git diff --name-only

echo ""
echo "Review changes with: git diff"
echo "Revert if needed with: git checkout ."
```

**Note**: Always review automated changes before committing!

---

## Rollback Plan

If issues arise after deployment:

1. **Revert migration:**
   ```bash
   npx prisma migrate rollback
   npx prisma generate
   ```

2. **Revert code changes:**
   ```bash
   git revert <commit-hash>
   git push
   ```

3. **Restore database backup:**
   ```bash
   psql $DATABASE_URL < backup_before_violation_schema.sql
   ```

---

## Support

For questions or issues:
- Review full schema documentation: `docs/VIOLATION_SCHEMA_MIGRATION.md`
- Check query examples: `docs/VIOLATION_QUERY_PATTERNS.md`
- Validate schema: `npx prisma validate`
- Type-check code: `npm run type-check`
