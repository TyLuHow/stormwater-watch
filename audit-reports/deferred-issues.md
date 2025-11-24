# Deferred Issues & Future Enhancements

**Last Updated:** November 24, 2025
**Priority Legend:** 🔴 HIGH | 🟡 MEDIUM | 🟢 LOW

---

## 1. Dependency Updates 🟢 LOW

### Issue
Multiple packages have newer versions available with non-breaking updates.

### Affected Packages

**Minor Updates (Safe):**
- @radix-ui/* components (1.x → 1.x) - 20+ packages
- lucide-react: 0.454.0 → 0.554.0
- next: 16.0.0 → 16.0.4
- @types/node: 22.19.1 → 24.10.1
- Various other minor/patch updates

**Major Updates (Breaking Changes):**
- @prisma/client: 6.19.0 → 7.0.0
- prisma: 6.19.0 → 7.0.0
- zod: 3.25.76 → 4.1.13
- recharts: 2.15.4 → 3.5.0

### Recommended Action

**Phase 1 (Next Sprint):**
```bash
# Safe minor updates
npm update @radix-ui/react-*
npm update lucide-react
npm update next
npm update @types/node @types/react
```

**Phase 2 (Separate Branch):**
Test major version migrations individually:
1. Create feature branch for Prisma 7.x migration
2. Test Zod 4.x compatibility
3. Evaluate Recharts 3.x breaking changes

### Risk Assessment
- **Current Risk:** VERY LOW - all packages stable
- **Urgency:** Can defer 3-6 months
- **Effort:** 2-4 hours for minor updates, 1-2 days for major updates

---

## 2. Test Suite Implementation 🟡 MEDIUM

### Issue
No automated testing framework currently implemented.

### Missing Test Coverage
- Unit tests for utility functions
- Integration tests for API routes
- Component tests for React components
- End-to-end tests for critical user flows

### Recommended Approach

**Option A: Jest + React Testing Library** (Recommended)
```bash
npm install -D jest @testing-library/react @testing-library/jest-dom
```

**Option B: Vitest + Testing Library** (Faster)
```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react
```

### Priority Test Areas

1. **Critical Business Logic** (Priority: HIGH)
   - Violation detection algorithm (`lib/violations/detector.ts`)
   - Spatial matching (`lib/subscriptions/matcher.ts`)
   - Unit conversions (`lib/utils/units.ts`)

2. **API Routes** (Priority: MEDIUM)
   - `/api/violations` - filtering and pagination
   - `/api/subscriptions` - creation and validation
   - `/api/ingest/smarts-upload` - data parsing

3. **Components** (Priority: LOW)
   - Form validation
   - Map interactions
   - Table sorting/filtering

### Estimated Effort
- Setup: 2-3 hours
- Core business logic tests: 8-12 hours
- API route tests: 12-16 hours
- Component tests: 16-24 hours
- **Total:** 38-55 hours (1-1.5 weeks)

---

## 3. Global Error Handler 🟢 LOW

### Issue
Optional `app/global-error.tsx` not present.

### Current State
- `app/error.tsx` handles most errors correctly
- Works well for page-level errors
- Missing boundary for root layout errors

### Recommended Implementation

Create `app/global-error.tsx`:
```typescript
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
```

### Estimated Effort
- Implementation: 30 minutes
- Testing: 30 minutes
- **Total:** 1 hour

---

## 4. Structured Logging & Monitoring 🟡 MEDIUM

### Issue
Current logging uses console.log/console.error without structured format or centralized monitoring.

### Current Logging
- API routes: `console.error("Error message:", error)`
- Cron jobs: `console.log("Processing...")`
- No request IDs or trace correlation
- No performance metrics
- No alerting on critical errors

### Recommended Solution

**Option A: Sentry (Recommended)**
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

**Benefits:**
- Error tracking with stack traces
- Performance monitoring
- Release tracking
- User feedback collection
- Free tier: 5,000 errors/month

**Option B: Vercel Log Drains + DataDog/LogRocket**
- Stream logs to DataDog or LogRocket
- More expensive but more features
- Better for large-scale applications

### Implementation Checklist
- [ ] Set up Sentry project
- [ ] Install @sentry/nextjs
- [ ] Configure sentry.client.config.ts
- [ ] Configure sentry.server.config.ts
- [ ] Add custom error boundaries
- [ ] Set up release tracking
- [ ] Configure alert rules

### Estimated Effort
- Sentry setup: 2-3 hours
- Custom instrumentation: 4-6 hours
- Alert configuration: 1-2 hours
- **Total:** 7-11 hours (1 day)

---

## 5. Bundle Size Optimization 🟢 LOW

### Issue
Some heavy dependencies loaded on every page could be code-split.

### Current Bundle Analysis

**Large Dependencies:**
- Mapbox GL: ~600KB (required for maps)
- Recharts: ~250KB (used for charts)
- React PDF: ~200KB (used for case packets)

### Optimization Opportunities

1. **Lazy Load Recharts**
   ```typescript
   const SampleChart = dynamic(() => import('@/components/facilities/sample-chart'), {
     loading: () => <Skeleton className="h-64" />,
     ssr: false
   })
   ```

2. **Code-split Map Components**
   - Already done with react-map-gl/mapbox import
   - Consider lazy loading map on dashboard

3. **Defer React PDF**
   - Only load when generating case packet
   - Use dynamic import in case-packet-button.tsx

### Expected Savings
- Initial bundle: -100-150KB
- Faster initial page load: ~200-300ms

### Estimated Effort
- Analysis: 1-2 hours
- Implementation: 3-4 hours
- Testing: 1-2 hours
- **Total:** 5-8 hours

---

## 6. API Rate Limiting Enhancement 🟡 MEDIUM

### Issue
Rate limiting implemented with @upstash/ratelimit but not applied to all sensitive endpoints.

### Current Coverage
- ✅ `/api/violations` - rate limited
- ❌ `/api/subscriptions` - not rate limited
- ❌ `/api/case-packet` - not rate limited
- ❌ `/api/ingest/smarts-upload` - not rate limited

### Recommended Implementation

Apply rate limiting to all POST/PUT/DELETE endpoints:

```typescript
// lib/middleware/rate-limit.ts enhancement
export const rateLimitByEndpoint = {
  '/api/subscriptions': { requests: 20, window: '1h' },
  '/api/case-packet': { requests: 5, window: '1m' },
  '/api/ingest': { requests: 10, window: '1m' },
}
```

### Estimated Effort
- Implementation: 2-3 hours
- Testing: 1-2 hours
- **Total:** 3-5 hours

---

## 7. Content Security Policy (CSP) 🟡 MEDIUM

### Issue
No Content Security Policy headers configured.

### Recommended CSP

Add to `next.config.mjs`:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.mapbox.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https://api.mapbox.com https://*.tiles.mapbox.com",
            "font-src 'self' data:",
            "connect-src 'self' https://api.mapbox.com https://events.mapbox.com",
            "frame-ancestors 'none'",
          ].join('; '),
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
      ],
    },
  ]
}
```

### Estimated Effort
- Implementation: 2-3 hours
- Testing across all pages: 2-3 hours
- CSP tuning: 1-2 hours
- **Total:** 5-8 hours

---

## 8. Database Indexes Optimization 🟢 LOW

### Issue
Some potentially high-traffic queries could benefit from composite indexes.

### Recommended Indexes

Add to `prisma/schema.prisma`:
```prisma
model ViolationEvent {
  // ... existing fields

  // Add composite indexes for common query patterns
  @@index([facilityId, dismissed, maxRatio])
  @@index([dismissed, reportingYear, maxRatio])
  @@index([createdAt, dismissed])
}

model Sample {
  // ... existing fields

  // Add composite index for facility + date queries
  @@index([facilityId, sampleDate, pollutant])
}
```

### Expected Performance Improvement
- Violation queries: 20-30% faster
- Dashboard loading: 10-15% faster

### Estimated Effort
- Analysis: 1-2 hours
- Implementation: 1 hour
- Migration testing: 1-2 hours
- **Total:** 3-5 hours

---

## 9. End-to-End Testing 🟡 MEDIUM

### Issue
No E2E tests for critical user flows.

### Recommended Tool: Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

### Critical Flows to Test

1. **Authentication Flow**
   - Sign in with email
   - Verify email token
   - Session persistence

2. **Dashboard Flow**
   - Load violations
   - Apply filters
   - View facility details

3. **Subscription Flow**
   - Create subscription
   - Draw polygon on map
   - Save subscription

4. **Case Packet Flow**
   - View facility
   - Generate case packet
   - Download PDF

### Estimated Effort
- Playwright setup: 2-3 hours
- Test implementation: 16-20 hours
- CI/CD integration: 2-3 hours
- **Total:** 20-26 hours (2.5-3 days)

---

## 10. Accessibility Improvements 🟢 LOW

### Issue
While Radix UI components provide good accessibility, custom components should be audited.

### Recommendations

1. **Run Lighthouse Audit**
   - Target: 95+ accessibility score
   - Fix any critical issues

2. **Keyboard Navigation**
   - Test all forms with keyboard only
   - Ensure map controls are accessible

3. **Screen Reader Testing**
   - Test with NVDA/JAWS/VoiceOver
   - Add ARIA labels where missing

4. **Color Contrast**
   - Verify all text meets WCAG AA standards
   - Test with color blindness simulators

### Estimated Effort
- Audit: 2-3 hours
- Fixes: 4-6 hours
- Testing: 2-3 hours
- **Total:** 8-12 hours (1-1.5 days)

---

## 11. Documentation 🟢 LOW

### Missing Documentation

1. **API Documentation**
   - OpenAPI/Swagger spec
   - Request/response examples
   - Authentication requirements

2. **Component Storybook**
   - UI component documentation
   - Usage examples
   - Props documentation

3. **Developer Onboarding**
   - Setup guide (enhanced)
   - Architecture overview
   - Deployment runbook

### Recommended Tools

- **API Docs:** OpenAPI + Swagger UI
- **Components:** Storybook
- **General:** Enhanced README.md + CONTRIBUTING.md

### Estimated Effort
- API documentation: 8-12 hours
- Storybook setup: 6-8 hours
- Developer docs: 4-6 hours
- **Total:** 18-26 hours (2-3 days)

---

## 12. Continuous Integration 🟡 MEDIUM

### Issue
No CI/CD pipeline for automated testing and deployment validation.

### Recommended Setup: GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm test (when tests exist)
      - run: npm run build
```

### Estimated Effort
- GitHub Actions setup: 2-3 hours
- Test integration: 2-3 hours
- Deployment workflow: 2-3 hours
- **Total:** 6-9 hours (1 day)

---

## Summary & Prioritization

### Recommended Timeline

**Sprint 1 (Week 1-2) - Post-Deployment**
1. 🟡 Structured Logging & Monitoring (Sentry) - 1 day
2. 🟡 API Rate Limiting Enhancement - 0.5 days
3. 🟢 Minor Dependency Updates - 0.5 days

**Sprint 2 (Week 3-4) - Quality & Testing**
1. 🟡 Test Suite Implementation (Phase 1) - 1 week
2. 🟡 Continuous Integration - 1 day
3. 🟢 Global Error Handler - 0.5 days

**Sprint 3 (Week 5-6) - Performance & Security**
1. 🟡 Content Security Policy - 1 day
2. 🟡 End-to-End Testing - 2-3 days
3. 🟢 Bundle Size Optimization - 1 day

**Backlog (3-6 months)**
- Major dependency upgrades (Prisma 7, Zod 4)
- Component Storybook
- API documentation
- Accessibility improvements
- Database index optimization

---

**Total Estimated Effort for High/Medium Priority Items:** ~3-4 weeks
**Total Estimated Effort for All Items:** ~6-8 weeks

---

**Last Updated:** November 24, 2025
**Next Review:** After Sprint 1 completion
