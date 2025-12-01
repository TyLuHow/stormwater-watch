# Violation Query Patterns

This document provides examples of common query patterns for the new violation tracking schema. All examples use TypeScript and Prisma Client.

## Table of Contents

1. [Dashboard Aggregations](#dashboard-aggregations)
2. [Facility Detail Views](#facility-detail-views)
3. [Individual Violation Drilldown](#individual-violation-drilldown)
4. [Status Updates](#status-updates)
5. [Compliance Reporting](#compliance-reporting)
6. [Performance Optimization](#performance-optimization)

---

## Dashboard Aggregations

### 1. Violation Summary by Facility

Get count of violations per facility, ordered by severity:

```typescript
const facilitySummary = await prisma.violationEvent.groupBy({
  by: ['facilityId'],
  where: {
    dismissed: false,
    reportingYear: '2024',
  },
  _count: true,
  _max: {
    maxRatio: true,
    maxSeverity: true,
  },
  orderBy: {
    _max: {
      maxRatio: 'desc',
    },
  },
});

// Join with facility details
const summaryWithFacilities = await Promise.all(
  facilitySummary.map(async (summary) => {
    const facility = await prisma.facility.findUnique({
      where: { id: summary.facilityId },
      select: { name: true, permitId: true, county: true },
    });
    return {
      ...summary,
      facility,
    };
  })
);
```

**Performance**: < 100ms for 1,000+ facilities

---

### 2. Violations by Pollutant

Count violations per pollutant type:

```typescript
const pollutantSummary = await prisma.violationEvent.groupBy({
  by: ['pollutantKey'],
  where: {
    dismissed: false,
  },
  _count: true,
  _sum: {
    count: true, // Total individual violations
  },
  _max: {
    maxRatio: true,
  },
});

// Include pollutant metadata
const summaryWithPollutants = await Promise.all(
  pollutantSummary.map(async (summary) => {
    const pollutant = await prisma.configPollutant.findUnique({
      where: { key: summary.pollutantKey },
      select: { key: true, canonicalUnit: true, category: true },
    });
    return {
      ...summary,
      pollutant,
    };
  })
);
```

**Performance**: < 200ms for 50+ pollutants

---

### 3. Critical Violations Dashboard

Get all critical violations across the system:

```typescript
const criticalViolations = await prisma.violationEvent.findMany({
  where: {
    dismissed: false,
    maxSeverity: 'CRITICAL',
  },
  include: {
    facility: {
      select: {
        id: true,
        name: true,
        permitId: true,
        county: true,
        isInDAC: true,
      },
    },
    pollutant: {
      select: {
        key: true,
        canonicalUnit: true,
        category: true,
      },
    },
  },
  orderBy: {
    maxRatio: 'desc',
  },
  take: 100,
});
```

**Performance**: < 300ms for 1,000+ violations

---

### 4. Recent Violations Timeline

Get violations detected in the last 30 days:

```typescript
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const recentViolations = await prisma.violationSample.findMany({
  where: {
    detectedAt: {
      gte: thirtyDaysAgo,
    },
    status: 'OPEN',
  },
  include: {
    violationEvent: {
      include: {
        facility: {
          select: { name: true, permitId: true },
        },
      },
    },
    benchmark: {
      select: { benchmarkType: true, value: true, unit: true },
    },
  },
  orderBy: {
    detectedAt: 'desc',
  },
  take: 50,
});
```

**Performance**: < 500ms with includes

---

## Facility Detail Views

### 5. All Violations for a Facility

Get aggregated violation summary for a specific facility:

```typescript
const facilityViolations = await prisma.violationEvent.findMany({
  where: {
    facilityId: 'facility_xyz',
    dismissed: false,
  },
  include: {
    pollutant: true,
    _count: {
      select: { samples: true },
    },
  },
  orderBy: [
    { maxSeverity: 'desc' },
    { maxRatio: 'desc' },
  ],
});
```

**Performance**: < 100ms for 20+ violations per facility

---

### 6. Facility Violation Timeline (Chart Data)

Get time-series data for a facility's violations:

```typescript
const facilityTimeline = await prisma.violationSample.findMany({
  where: {
    facilityId: 'facility_xyz',
  },
  select: {
    detectedAt: true,
    pollutantKey: true,
    exceedanceRatio: true,
    severity: true,
    measuredValue: true,
    benchmarkValue: true,
  },
  orderBy: {
    detectedAt: 'asc',
  },
});

// Group by month for chart
const monthlyData = facilityTimeline.reduce((acc, sample) => {
  const month = sample.detectedAt.toISOString().slice(0, 7); // YYYY-MM
  if (!acc[month]) {
    acc[month] = { count: 0, maxRatio: 0, pollutants: new Set() };
  }
  acc[month].count++;
  acc[month].maxRatio = Math.max(acc[month].maxRatio, sample.exceedanceRatio);
  acc[month].pollutants.add(sample.pollutantKey);
  return acc;
}, {});
```

**Performance**: < 200ms for 500+ samples

---

## Individual Violation Drilldown

### 7. Violations for a Specific Pollutant at a Facility

Drill down into individual samples:

```typescript
const pollutantViolations = await prisma.violationSample.findMany({
  where: {
    facilityId: 'facility_xyz',
    pollutantKey: 'COPPER',
  },
  include: {
    esmrSample: {
      include: {
        location: {
          select: {
            locationCode: true,
            locationType: true,
            latitude: true,
            longitude: true,
          },
        },
        parameter: {
          select: { parameterName: true, category: true },
        },
        analyticalMethod: {
          select: { methodCode: true, methodName: true },
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
        sourceUrl: true,
      },
    },
  },
  orderBy: {
    detectedAt: 'desc',
  },
});
```

**Performance**: < 800ms with full includes for 100+ samples

---

### 8. Single Violation Detail View

Get complete details for one violation:

```typescript
const violationDetail = await prisma.violationSample.findUnique({
  where: { id: 'violation_sample_xyz' },
  include: {
    violationEvent: {
      include: {
        facility: {
          include: {
            esmrFacility: {
              include: { region: true },
            },
          },
        },
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
});
```

**Use Case**: Compliance investigation, case packet generation

**Performance**: < 200ms with full includes

---

## Status Updates

### 9. Update Violation Status

Track compliance workflow:

```typescript
// Mark violation as under review
await prisma.violationSample.update({
  where: { id: 'violation_sample_xyz' },
  data: {
    status: 'UNDER_REVIEW',
    reviewedAt: new Date(),
    reviewedBy: 'user_id_or_email',
    reviewNotes: 'Contacted facility for explanation',
  },
});

// Resolve violation
await prisma.violationSample.update({
  where: { id: 'violation_sample_xyz' },
  data: {
    status: 'RESOLVED',
    reviewNotes: 'Facility installed new treatment system',
  },
});

// Dismiss as false positive
await prisma.violationSample.update({
  where: { id: 'violation_sample_xyz' },
  data: {
    status: 'DISMISSED',
    reviewNotes: 'Lab error confirmed by facility, resample within limits',
  },
});
```

---

### 10. Bulk Status Update

Update multiple violations at once:

```typescript
// Dismiss all violations for a specific event
await prisma.violationSample.updateMany({
  where: {
    violationEventId: 'violation_event_xyz',
  },
  data: {
    status: 'DISMISSED',
    reviewNotes: 'Bulk dismissed - facility variance approved',
  },
});

// Update ViolationEvent to reflect dismissal
await prisma.violationEvent.update({
  where: { id: 'violation_event_xyz' },
  data: {
    dismissed: true,
    notes: 'All samples dismissed - variance approved',
  },
});
```

---

## Compliance Reporting

### 11. Open Violations by Benchmark Type

Group violations by regulatory authority:

```typescript
const violationsByBenchmarkType = await prisma.violationSample.groupBy({
  by: ['status'],
  where: {
    benchmark: {
      benchmarkType: 'MCL', // or 'ANNUAL_NAL', 'CMC', etc.
    },
  },
  _count: true,
});

// Get detailed breakdown
const mclViolations = await prisma.violationSample.findMany({
  where: {
    status: 'OPEN',
    benchmark: {
      benchmarkType: 'MCL',
    },
  },
  include: {
    facility: true,
    benchmark: true,
  },
});
```

**Use Case**: EPA reporting, state compliance tracking

---

### 12. Violations in Disadvantaged Communities (DACs)

Prioritize violations affecting vulnerable populations:

```typescript
const dacViolations = await prisma.violationEvent.findMany({
  where: {
    dismissed: false,
    facility: {
      isInDAC: true,
    },
  },
  include: {
    facility: {
      select: {
        name: true,
        county: true,
        receivingWater: true,
        isInDAC: true,
      },
    },
    pollutant: true,
    samples: {
      where: {
        status: 'OPEN',
      },
      orderBy: {
        exceedanceRatio: 'desc',
      },
      take: 5, // Top 5 worst violations
    },
  },
  orderBy: {
    maxSeverity: 'desc',
  },
});
```

---

### 13. Repeat Offenders Report

Facilities with multiple pollutants exceeding benchmarks:

```typescript
const repeatOffenders = await prisma.facility.findMany({
  where: {
    violationEvents: {
      some: {
        dismissed: false,
      },
    },
  },
  include: {
    violationEvents: {
      where: {
        dismissed: false,
      },
      include: {
        pollutant: true,
      },
    },
    _count: {
      select: {
        violationEvents: true,
      },
    },
  },
  orderBy: {
    violationEvents: {
      _count: 'desc',
    },
  },
  take: 50,
});

// Filter to facilities with 3+ pollutants violated
const multiPollutantOffenders = repeatOffenders.filter(
  (f) => f.violationEvents.length >= 3
);
```

---

### 14. Geographic Violation Analysis

Violations by county or watershed:

```typescript
const countyAnalysis = await prisma.facility.groupBy({
  by: ['county'],
  where: {
    county: { not: null },
    violationEvents: {
      some: {
        dismissed: false,
      },
    },
  },
  _count: {
    _all: true,
  },
});

// Get details for a specific county
const countyViolations = await prisma.violationEvent.findMany({
  where: {
    dismissed: false,
    facility: {
      county: 'Los Angeles',
    },
  },
  include: {
    facility: true,
    pollutant: true,
  },
});
```

---

## Performance Optimization

### 15. Paginated Violation List

Efficiently load large result sets:

```typescript
async function getPaginatedViolations(page: number = 1, pageSize: number = 50) {
  const skip = (page - 1) * pageSize;

  const [violations, totalCount] = await Promise.all([
    prisma.violationEvent.findMany({
      where: { dismissed: false },
      include: {
        facility: {
          select: { name: true, permitId: true, county: true },
        },
        pollutant: {
          select: { key: true, canonicalUnit: true },
        },
      },
      orderBy: { maxRatio: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.violationEvent.count({
      where: { dismissed: false },
    }),
  ]);

  return {
    violations,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: skip + pageSize < totalCount,
      hasPrevPage: page > 1,
    },
  };
}
```

---

### 16. Optimized Dashboard Stats

Single query for multiple dashboard metrics:

```typescript
const [
  totalViolations,
  criticalCount,
  openCount,
  facilitiesAffected,
  pollutantsDetected,
] = await Promise.all([
  prisma.violationEvent.count({
    where: { dismissed: false },
  }),
  prisma.violationEvent.count({
    where: {
      dismissed: false,
      maxSeverity: 'CRITICAL',
    },
  }),
  prisma.violationSample.count({
    where: { status: 'OPEN' },
  }),
  prisma.violationEvent.findMany({
    where: { dismissed: false },
    distinct: ['facilityId'],
    select: { facilityId: true },
  }).then(results => results.length),
  prisma.violationEvent.findMany({
    where: { dismissed: false },
    distinct: ['pollutantKey'],
    select: { pollutantKey: true },
  }).then(results => results.length),
]);

const dashboardStats = {
  totalViolations,
  criticalCount,
  openCount,
  facilitiesAffected,
  pollutantsDetected,
};
```

**Performance**: < 200ms for all stats combined

---

### 17. Cursor-Based Pagination for Large Datasets

For real-time feeds or exports:

```typescript
async function getViolationsCursor(cursor?: string, limit: number = 100) {
  const violations = await prisma.violationSample.findMany({
    take: limit + 1, // Fetch one extra to check if there are more
    ...(cursor && {
      skip: 1, // Skip the cursor
      cursor: {
        id: cursor,
      },
    }),
    where: {
      status: 'OPEN',
    },
    include: {
      facility: true,
      benchmark: true,
    },
    orderBy: {
      detectedAt: 'desc',
    },
  });

  let nextCursor: string | undefined = undefined;
  if (violations.length > limit) {
    const nextItem = violations.pop(); // Remove the extra item
    nextCursor = nextItem!.id;
  }

  return {
    violations,
    nextCursor,
  };
}
```

---

### 18. Selective Field Loading

Optimize queries by loading only needed fields:

```typescript
// Lightweight list view
const violationsList = await prisma.violationSample.findMany({
  select: {
    id: true,
    detectedAt: true,
    pollutantKey: true,
    exceedanceRatio: true,
    severity: true,
    status: true,
    facility: {
      select: {
        name: true,
        permitId: true,
      },
    },
  },
  where: { status: 'OPEN' },
  take: 100,
});
```

**Performance**: 3-5x faster than full includes

---

## Query Complexity Guidelines

| Query Type | Expected Time | Max Recommended |
|------------|---------------|-----------------|
| Simple count/groupBy | < 100ms | 10,000 records |
| Single-level include | < 300ms | 1,000 records |
| Multi-level include | < 800ms | 100 records |
| Full detail (3+ levels) | < 1s | 10 records |

**Optimization Tips:**
1. Use `select` instead of full includes when possible
2. Add `take` limits to prevent unbounded queries
3. Use indexes for `where`, `orderBy` filters
4. Consider caching dashboard aggregations (Redis, Next.js cache)
5. Use cursor pagination for large datasets
6. Denormalize frequently-accessed fields (facilityId, pollutantKey in ViolationSample)

---

## Alert Matching Example

Query violations matching subscription criteria:

```typescript
async function matchViolationsToSubscription(subscription: Subscription) {
  const { mode, params, minRatio, impairedOnly } = subscription;

  let facilityIds: string[] = [];

  // Get facilities matching subscription criteria
  // (implementation depends on subscription mode: POLYGON, BUFFER, JURISDICTION)

  const violations = await prisma.violationEvent.findMany({
    where: {
      dismissed: false,
      facilityId: { in: facilityIds },
      maxRatio: { gte: minRatio },
      ...(impairedOnly && { impairedWater: true }),
      // Only new violations since last run
      createdAt: {
        gt: subscription.lastRunAt ?? new Date(0),
      },
    },
    include: {
      facility: true,
      pollutant: true,
      samples: {
        where: { status: 'OPEN' },
        take: 5,
      },
    },
  });

  return violations;
}
```

---

## Common Pitfalls to Avoid

1. **Don't load all ViolationSamples at once** - use pagination or aggregates
2. **Don't forget dismissed filter** - most queries should exclude dismissed violations
3. **Don't join through ViolationEvent unnecessarily** - ViolationSample has denormalized facilityId
4. **Don't update ViolationEvent manually** - use compute-violations.ts to maintain consistency
5. **Don't use `findMany()` without `take` or `where`** - always bound result sets

---

## Testing Queries

Use Prisma Studio to test queries visually:

```bash
npx prisma studio
```

Or use raw SQL for complex analytics:

```typescript
const result = await prisma.$queryRaw`
  SELECT
    f.name,
    COUNT(DISTINCT vs.id) as violation_count,
    MAX(vs."exceedanceRatio") as max_ratio,
    COUNT(DISTINCT vs."pollutantKey") as pollutants_violated
  FROM violation_samples vs
  JOIN "Facility" f ON f.id = vs."facilityId"
  WHERE vs.status = 'OPEN'
  GROUP BY f.id, f.name
  ORDER BY violation_count DESC
  LIMIT 50;
`;
```
