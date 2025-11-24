<objective>
Create environment validation and API health check scripts to verify the Stormwater Watch platform is correctly configured and operational. These scripts enable quick diagnosis of configuration issues and verify all external service integrations.

Used for: Initial setup validation, deployment verification, troubleshooting production issues.
</objective>

<context>
The Stormwater Watch platform integrates with 5 external services (Supabase, Upstash Redis, Resend, Mapbox, Slack) and requires 12 environment variables for core functionality. Quick validation scripts help identify misconfigurations before they cause runtime errors.

Project: Stormwater Watch (Next.js 14)
Target: Development and production environments
Users: Developers, DevOps, deployment automation
</context>

<requirements>
Create three validation scripts:

1. **Environment Variable Checker** (`scripts/check-env.ts`):
   - Verify all 12 required environment variables are set
   - Check optional variables (Slack, NWS_USER_AGENT, AI features)
   - Report missing variables with clear error messages
   - Exit with code 1 if any required vars missing (CI/CD friendly)
   - Show first 20 characters of each value for confirmation (security-conscious)

2. **API Health Check** (`scripts/health-check.sh`):
   - Test public endpoints (expect 200)
   - Test protected endpoints (expect 401 without auth)
   - Test cron endpoints (expect 401 without CRON_SECRET)
   - Support custom BASE_URL argument for testing different environments
   - Report HTTP status codes for each endpoint
   - Use curl with silent mode and status code extraction

3. **Summary Report** (`VALIDATION.md`):
   - Document what each script checks
   - Include usage examples
   - List common failure scenarios with solutions
   - Provide troubleshooting steps for each integration
</requirements>

<implementation>
Execute these steps:

### Step 1: Create Environment Variable Checker

Create `./scripts/check-env.ts`:

```typescript
#!/usr/bin/env tsx
/**
 * Environment Variable Validation Script
 * Verifies all required environment variables are set for Stormwater Watch
 *
 * Usage: npm run check:env
 *    or: npx tsx scripts/check-env.ts
 */

const required = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'RESEND_API_KEY',
  'NEXT_PUBLIC_MAPBOX_TOKEN',
  'MAPBOX_TOKEN',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'CRON_SECRET',
]

const optional = [
  'SLACK_WEBHOOK_URL',
  'RESEND_FROM_EMAIL',
  'NWS_USER_AGENT',
  'INTERNVL_ENABLED',
  'INTERNVL_BASE_URL',
  'SLACK_CHANNEL',
]

console.log('🔍 Stormwater Watch - Environment Variable Check\n')

let missing = 0
let warnings = 0

console.log('Required Variables:')
console.log('─'.repeat(70))
for (const key of required) {
  const val = process.env[key]
  if (val) {
    // Show first 20 chars for confirmation (security-conscious)
    const preview = val.length > 20 ? val.slice(0, 20) + '...' : val
    console.log(`  ✅ ${key.padEnd(30)} ${preview}`)
  } else {
    console.log(`  ❌ ${key.padEnd(30)} MISSING`)
    missing++
  }
}

console.log('\nOptional Variables:')
console.log('─'.repeat(70))
for (const key of optional) {
  const val = process.env[key]
  if (val) {
    const preview = val.length > 20 ? val.slice(0, 20) + '...' : val
    console.log(`  ✅ ${key.padEnd(30)} ${preview}`)
  } else {
    console.log(`  ⚪ ${key.padEnd(30)} not set`)
    warnings++
  }
}

console.log('\n' + '═'.repeat(70))
if (missing === 0) {
  console.log('✅ All required environment variables are set!')
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} optional variable(s) not set (non-blocking)`)
  }
  console.log('\nNext steps:')
  console.log('  - Run health check: npm run check:health')
  console.log('  - Start dev server: npm run dev')
  console.log('  - Run database seed: npm run db:seed')
} else {
  console.log(`❌ ${missing} required variable(s) missing!`)
  console.log('\nFix by:')
  console.log('  1. Copy .env.example to .env: cp .env.example .env')
  console.log('  2. Fill in missing values in .env')
  console.log('  3. Re-run this check: npm run check:env')
  console.log('\nSee SETUP.md for detailed configuration instructions')
}
console.log('═'.repeat(70) + '\n')

process.exit(missing > 0 ? 1 : 0)
```

### Step 2: Create API Health Check Script

Create `./scripts/health-check.sh`:

```bash
#!/bin/bash
#
# API Health Check Script
# Tests Stormwater Watch API endpoints for proper responses
#
# Usage: ./scripts/health-check.sh [BASE_URL]
#    Default BASE_URL: http://localhost:3000
#    Example: ./scripts/health-check.sh https://stormwater-watch.vercel.app
#

BASE_URL="${1:-http://localhost:3000}"
ERRORS=0

echo "🏥 Stormwater Watch - API Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Target: $BASE_URL"
echo ""

# Check if server is reachable
if ! curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BASE_URL" > /dev/null 2>&1; then
  echo "❌ Server unreachable at $BASE_URL"
  echo "   Is the dev server running? (npm run dev)"
  exit 1
fi

echo "✓ Server is reachable"
echo ""

# Public endpoints (should return 200)
echo "Public Endpoints (expect 200):"
echo "────────────────────────────────────────────"

check_endpoint() {
  local path=$1
  local expected=$2
  local description=$3

  local status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path" 2>/dev/null)

  if [ "$status" = "$expected" ]; then
    echo "  ✅ $path → $status  $description"
  else
    echo "  ❌ $path → $status (expected $expected)  $description"
    ((ERRORS++))
  fi
}

check_endpoint "/api/health" "200" "Health check endpoint"
check_endpoint "/" "200" "Home page"

echo ""
echo "Protected Endpoints (expect 401 without auth):"
echo "────────────────────────────────────────────"

check_endpoint "/api/cron/daily" "401" "Daily cron job (requires CRON_SECRET)"
check_endpoint "/api/cron/weekly" "401" "Weekly cron job (requires CRON_SECRET)"
check_endpoint "/api/subscriptions" "401" "Subscriptions API (requires auth)"
check_endpoint "/api/violations/recompute" "401" "Violations recompute (requires ADMIN)"

echo ""
echo "Data Endpoints (variable responses):"
echo "────────────────────────────────────────────"

# These might be 200 (with data) or 401 (auth required) depending on implementation
violations_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/violations" 2>/dev/null)
echo "  ℹ️  /api/violations → $violations_status"

facilities_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/facilities" 2>/dev/null)
echo "  ℹ️  /api/facilities → $facilities_status"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ]; then
  echo "✅ All health checks passed!"
  echo ""
  echo "Next steps:"
  echo "  - Test CSV upload: Visit $BASE_URL/ingest"
  echo "  - View dashboard: Visit $BASE_URL/dashboard"
  echo "  - Check Prisma Studio: npm run db:studio"
else
  echo "❌ $ERRORS health check(s) failed"
  echo ""
  echo "Troubleshooting:"
  echo "  - Check environment variables: npm run check:env"
  echo "  - Review logs: Check console output from npm run dev"
  echo "  - Verify database: npm run db:push"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit $ERRORS
```

Make it executable:
```bash
chmod +x scripts/health-check.sh
```

### Step 3: Update package.json Scripts

Add convenience scripts to `package.json`:

```json
{
  "scripts": {
    "check:env": "tsx scripts/check-env.ts",
    "check:health": "./scripts/health-check.sh",
    "check:all": "npm run check:env && npm run check:health",
    "validate": "npm run check:env && npm run type-check && npm run lint"
  }
}
```

Use the Edit tool to add these scripts if they don't already exist.

### Step 4: Create Validation Documentation

Create `./VALIDATION.md`:

```markdown
# Stormwater Watch - Validation & Health Checks

This document describes the validation scripts available for verifying the platform is correctly configured and operational.

## Quick Start

```bash
# Check environment variables
npm run check:env

# Check API health (requires dev server running)
npm run dev  # In another terminal
npm run check:health

# Run all checks
npm run check:all
```

## Scripts

### 1. Environment Variable Checker

**File**: `scripts/check-env.ts`
**Usage**: `npm run check:env`

Verifies all required environment variables are configured.

**Required Variables** (12):
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (admin access)
- `NEXTAUTH_URL` - Application URL for NextAuth
- `NEXTAUTH_SECRET` - Secret for session encryption
- `RESEND_API_KEY` - Resend email API key
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox public token
- `MAPBOX_TOKEN` - Mapbox secret token (server-side)
- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST API URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST API token
- `CRON_SECRET` - Secret for protecting cron endpoints

**Optional Variables** (6):
- `SLACK_WEBHOOK_URL` - Slack webhook for alert notifications
- `RESEND_FROM_EMAIL` - Custom from email address
- `NWS_USER_AGENT` - User agent for NOAA weather API
- `INTERNVL_ENABLED` - Enable AI vision features
- `INTERNVL_BASE_URL` - AI vision API base URL
- `SLACK_CHANNEL` - Slack channel for notifications

**Exit Codes**:
- `0` - All required variables set
- `1` - One or more required variables missing

### 2. API Health Check

**File**: `scripts/health-check.sh`
**Usage**: `./scripts/health-check.sh [BASE_URL]`

Tests API endpoints to verify the application is responding correctly.

**Default BASE_URL**: `http://localhost:3000`

**Examples**:
```bash
# Test local development server
npm run dev  # Start server first
./scripts/health-check.sh

# Test production deployment
./scripts/health-check.sh https://stormwater-watch.vercel.app

# Test staging environment
./scripts/health-check.sh https://staging.stormwater-watch.org
```

**Endpoints Tested**:

| Endpoint | Expected | Purpose |
|----------|----------|---------|
| `/api/health` | 200 | Basic health check |
| `/` | 200 | Home page renders |
| `/api/cron/daily` | 401 | Cron auth protection |
| `/api/cron/weekly` | 401 | Cron auth protection |
| `/api/subscriptions` | 401 | User auth required |
| `/api/violations/recompute` | 401 | Admin auth required |

**Exit Codes**:
- `0` - All checks passed
- `>0` - Number of failed checks

## Common Issues & Solutions

### Issue: "DATABASE_URL not set"

**Solution**:
1. Copy environment template: `cp .env.example .env`
2. Get Supabase credentials from dashboard
3. Add to `.env`: `DATABASE_URL="postgresql://..."`

### Issue: "Server unreachable at http://localhost:3000"

**Solution**:
1. Start development server: `npm run dev`
2. Wait for "ready started server on" message
3. Re-run health check

### Issue: "All endpoints return 500"

**Solution**:
1. Check database connection: `npx prisma db push`
2. Verify Prisma client generated: `npx prisma generate`
3. Check logs for specific error messages

### Issue: "CRON_SECRET missing"

**Solution**:
Generate a random secret:
```bash
openssl rand -hex 16
```
Add to `.env`:
```
CRON_SECRET="generated-value-here"
```

### Issue: "Mapbox map not loading"

**Solution**:
1. Verify `NEXT_PUBLIC_MAPBOX_TOKEN` is set (public token)
2. Check token is valid on Mapbox dashboard
3. Ensure token has appropriate scopes (styles:read, fonts:read)

### Issue: "Emails not sending"

**Solution**:
1. Verify `RESEND_API_KEY` is correct
2. Check Resend dashboard for API key status
3. Verify `RESEND_FROM_EMAIL` uses verified domain
4. Test with: `curl -X POST http://localhost:3000/api/subscriptions/send`

## Integration Testing

### Testing Supabase Connection

```bash
# Via Prisma
npx prisma studio

# Via health check endpoint
curl http://localhost:3000/api/setup/health
```

### Testing Upstash Redis

```bash
# Check rate limiting is working
for i in {1..15}; do
  curl -w "\n" http://localhost:3000/api/violations
done
# Should see 429 (rate limited) after 10 requests
```

### Testing Mapbox

1. Visit `/dashboard`
2. Map should load with facility markers
3. Check browser console for Mapbox errors

### Testing Resend Email

```bash
# Trigger a test subscription alert
curl -X POST http://localhost:3000/api/subscriptions/send \
  -H "Content-Type: application/json" \
  -d '{"subscriptionId":"test-id"}'
```

### Testing Slack Webhooks

```bash
# Send test notification
curl -X POST $SLACK_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"text":"Test from Stormwater Watch"}'
```

## Continuous Integration

Use these scripts in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Validate environment
  run: npm run check:env

- name: Type check
  run: npm run type-check

- name: Build application
  run: npm run build

- name: Start server and health check
  run: |
    npm run start &
    sleep 10
    npm run check:health
```

## Production Validation

Before deploying to production:

```bash
# 1. Validate environment
npm run check:env

# 2. Run type checking
npm run type-check

# 3. Run linting
npm run lint

# 4. Build successfully
npm run build

# 5. Test production build
npm run start
npm run check:health
```

## Monitoring

For ongoing monitoring in production:

1. **Uptime Monitoring**: Use service like UptimeRobot to ping `/api/health`
2. **Error Tracking**: Configure Sentry in `lib/monitoring/index.ts`
3. **Log Aggregation**: Use Vercel logs or external service (Datadog, LogDNA)
4. **Cron Job Monitoring**: Check `/api/cron/daily` and `/api/cron/weekly` logs

## Troubleshooting Commands

```bash
# Check database migrations
npx prisma migrate status

# Regenerate Prisma client
npx prisma generate

# Check Next.js build
npm run build

# Clear Next.js cache
rm -rf .next

# Check environment in runtime
node -e "console.log(process.env.DATABASE_URL)"

# Test database query directly
npx prisma studio
```

## Support

If validation fails:
1. Check this document's troubleshooting section
2. Review logs from `npm run dev`
3. Verify all environment variables are set correctly
4. Check service dashboards (Supabase, Upstash, Resend, Mapbox)
5. See `SETUP.md` for detailed setup instructions
```
</output>

<verification>
Before declaring complete, verify:

1. Files created:
   - `./scripts/check-env.ts` (executable TypeScript)
   - `./scripts/health-check.sh` (executable bash, chmod +x)
   - `./VALIDATION.md` (comprehensive documentation)

2. Scripts are executable:
```bash
ls -la scripts/check-env.ts scripts/health-check.sh
```

3. Test env checker (safe to run without database):
```bash
npx tsx scripts/check-env.ts
```

4. If dev server is running, test health check:
```bash
# Only if npm run dev is active
./scripts/health-check.sh
```

5. Verify package.json has new scripts:
```bash
grep -A 4 '"check:' package.json
```

6. Report what was created and how to use it
</verification>

<success_criteria>
- Environment checker created and reports missing variables correctly
- Health check script created with proper curl commands
- Both scripts have clear output with emoji indicators
- VALIDATION.md provides comprehensive troubleshooting guide
- Scripts are executable (chmod +x applied)
- Package.json updated with convenience scripts
- Clear instructions for using scripts in development and CI/CD
- Exit codes are correct (0 for success, 1+ for failures)
- Scripts handle missing tools gracefully (curl, jq, tsx)
</success_criteria>
