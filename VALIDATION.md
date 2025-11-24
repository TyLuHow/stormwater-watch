# Validation and Health Check Guide

This guide covers the validation and health check scripts for the Stormwater Watch platform. These tools help verify that your environment is correctly configured and all services are operational.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Scripts Overview](#scripts-overview)
3. [Environment Variable Checker](#environment-variable-checker)
4. [API Health Check](#api-health-check)
5. [Common Issues and Solutions](#common-issues-and-solutions)
6. [Integration with CI/CD](#integration-with-cicd)

## Quick Start

Run all validation checks:

```bash
npm run validate           # Check env vars + type checking + linting
npm run check:env         # Check environment variables only
npm run check:health      # Check API endpoints only
npm run check:all         # Check env vars + API health
```

## Scripts Overview

### Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `check:env` | `npm run check:env` | Verify all required environment variables are set |
| `check:health` | `npm run check:health` | Test API endpoints and service health |
| `check:all` | `npm run check:all` | Run both env check and health check |
| `validate` | `npm run validate` | Full validation: env + type-check + lint |

## Environment Variable Checker

### Purpose

The environment variable checker (`scripts/check-env.ts`) ensures all required variables are configured before starting the application. This prevents confusing runtime errors caused by missing configuration.

### Running the Script

```bash
npm run check:env

# Or directly with tsx:
npx tsx scripts/check-env.ts
```

### What It Checks

#### Required Variables (10 total)

Must be set for the application to function:

| Variable | Service | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | Supabase | PostgreSQL connection string |
| `SUPABASE_URL` | Supabase | Project URL |
| `SUPABASE_ANON_KEY` | Supabase | Client-side access key |
| `UPSTASH_REDIS_REST_URL` | Upstash | Redis REST API endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash | Redis authentication token |
| `RESEND_API_KEY` | Resend | Email service API key |
| `MAPBOX_TOKEN` | Mapbox | Server-side token |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox | Client-side token |
| `NEXTAUTH_SECRET` | NextAuth.js | Session encryption secret |
| `NEXTAUTH_URL` | NextAuth.js | Authentication callback URL |

#### Optional Variables (8 total)

Enhance functionality but are not required:

| Variable | Service | Purpose |
|----------|---------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Admin access for server operations |
| `SLACK_WEBHOOK_URL` | Slack | Alert notifications |
| `CRON_SECRET` | Internal | Protect cron job endpoints |
| `NWS_USER_AGENT` | NOAA | User-Agent for Weather Service API |
| `INTERNVL_ENABLED` | AI | Enable InternVL model |
| `INTERNVL_BASE_URL` | AI | AI service endpoint |
| `RESEND_FROM_EMAIL` | Resend | Sender email address |

### Output Format

```
========================================
   Environment Variable Checker
========================================

REQUIRED ENVIRONMENT VARIABLES:
--------------------------------
DATABASE_URL = postgresql://****
SUPABASE_URL = https://****
...

OPTIONAL ENVIRONMENT VARIABLES:
--------------------------------
SLACK_WEBHOOK_URL (not set)
...

========================================
SUMMARY:
--------
Total variables: 18 (10 required, 8 optional)
Present: 15
Required missing: 0
Optional missing: 3

✅ All required environment variables are set!
========================================
```

### Exit Codes

- `0`: All required variables are set (success)
- `1`: One or more required variables are missing (failure)

### Security Note

The script shows only the first 20 characters of each variable value, masking sensitive information. Full values are never displayed in logs.

## API Health Check

### Purpose

The health check script (`scripts/health-check.sh`) tests API endpoints to verify the application is running and properly configured. It validates both public and protected endpoints.

### Running the Script

```bash
# Test local development server
npm run check:health

# Or directly:
./scripts/health-check.sh

# Test remote environment
./scripts/health-check.sh https://example.com
./scripts/health-check.sh https://staging.example.com
```

### What It Checks

#### Public Endpoints (expect HTTP 200)

| Endpoint | Purpose |
|----------|---------|
| `/api/health` | Comprehensive service health check |

#### Protected Endpoints (expect HTTP 401 without auth)

| Endpoint | Purpose |
|----------|---------|
| `/api/violations` | Protected violation data |
| `/api/subscriptions` | Protected subscription management |

#### Admin/Cron Endpoints (expect HTTP 401 without CRON_SECRET)

| Endpoint | Purpose |
|----------|---------|
| `/api/cron/weather-update` | Scheduled weather updates |
| `/api/cron/alert-check` | Scheduled alert processing |

### Output Format

```
API Health Check for Stormwater Watch
Testing: http://localhost:3000
Timeout: 10s

========================================
PUBLIC ENDPOINTS (expect HTTP 200)
========================================

✓ /api/health
  Expected: HTTP 200 | Got: HTTP 200
  Description: Comprehensive health check of all services
  Response:
    {
      "status": "healthy",
      "services": {
        "database": "up",
        "redis": "up",
        "storage": "up"
      },
      "timestamp": "2024-11-23T22:43:00.000Z"
    }

========================================
PROTECTED ENDPOINTS (expect HTTP 401 without auth)
========================================

✓ /api/violations
  Expected: HTTP 401 | Got: HTTP 401
  Description: List violations - requires authentication

========================================
HEALTH CHECK SUMMARY
========================================

Total checks: 5
Passed: 5
Failed: 0

✓ All health checks passed!
```

### Exit Codes

- `0`: All health checks passed
- `1`: One or more health checks failed

### Customization

The script is highly customizable. Edit `scripts/health-check.sh` to:

- Add more endpoint tests
- Change timeout duration (currently 10 seconds)
- Modify expected HTTP status codes
- Add authentication headers for protected endpoint testing
- Change output colors

### Requirements

- `curl` (required)
- `jq` (optional, for pretty-printing JSON responses)

Install missing tools:

```bash
# macOS
brew install curl jq

# Ubuntu/Debian
sudo apt-get install curl jq

# Windows with WSL
sudo apt-get install curl jq
```

## Common Issues and Solutions

### Missing Required Variables

#### Problem
```
❌ SUPABASE_URL (MISSING)
❌ SUPABASE_ANON_KEY (MISSING)
```

#### Solution

1. **Check .env file exists**
   ```bash
   ls -la .env
   ```

2. **Copy from example if missing**
   ```bash
   cp .env.example .env
   ```

3. **Get values from Supabase**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to Settings → API
   - Copy `URL` and `anon public key`
   - Add to `.env`:
     ```
     SUPABASE_URL=https://[project].supabase.co
     SUPABASE_ANON_KEY=your_key_here
     ```

4. **Verify with check:env**
   ```bash
   npm run check:env
   ```

### Database Connection Issues

#### Problem
```
❌ Database connection failed: Error: connect ECONNREFUSED
```

#### Solution

1. **Verify DATABASE_URL format**
   ```bash
   echo $DATABASE_URL
   # Should be: postgresql://user:pass@host:5432/dbname
   ```

2. **For Supabase:**
   - Get connection string from Supabase dashboard
   - Settings → Database → Connection string
   - Copy URI (PostgreSQL)
   - Add to `.env`:
     ```
     DATABASE_URL="postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres?schema=public"
     ```

3. **Test connection**
   ```bash
   npm run setup:validate
   ```

### Redis/Upstash Connection Issues

#### Problem
```
❌ Redis connection failed: Error: Connection refused
```

#### Solution

1. **Verify Upstash credentials**
   ```bash
   echo "URL: $UPSTASH_REDIS_REST_URL"
   echo "Token: $UPSTASH_REDIS_REST_TOKEN"
   ```

2. **Get correct values from Upstash**
   - Go to [upstash.com/console](https://upstash.com/console)
   - Select your Redis database
   - Go to "REST API" tab
   - Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

3. **Update .env**
   ```bash
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

4. **Test connection**
   ```bash
   npm run setup:validate
   ```

### Mapbox Token Issues

#### Problem
```
❌ MAPBOX_TOKEN (MISSING)
❌ NEXT_PUBLIC_MAPBOX_TOKEN (MISSING)
```

#### Solution

1. **Create Mapbox account**
   - Go to [mapbox.com](https://mapbox.com)
   - Create account and verify email

2. **Get access tokens**
   - Go to Account → Tokens
   - Create two tokens:
     - One for server use: `MAPBOX_TOKEN`
     - One for public use: `NEXT_PUBLIC_MAPBOX_TOKEN`

3. **Add to .env**
   ```bash
   MAPBOX_TOKEN=pk.eyJ1...
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
   ```

4. **Verify setup**
   ```bash
   npm run check:env
   ```

### NextAuth Configuration Issues

#### Problem
```
❌ NEXTAUTH_SECRET (MISSING)
❌ NEXTAUTH_URL (MISSING)
```

#### Solution

1. **Generate NEXTAUTH_SECRET**
   ```bash
   openssl rand -base64 32
   # Or use Node:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Add to .env**
   ```bash
   NEXTAUTH_SECRET=your_generated_secret_here
   NEXTAUTH_URL=http://localhost:3000  # For development
   # For production: NEXTAUTH_URL=https://yourdomain.com
   ```

3. **Verify**
   ```bash
   npm run check:env
   ```

### Health Check Endpoint Failures

#### Problem
```
✗ /api/health
  Expected: HTTP 200 | Got: HTTP 503
```

#### Solution

1. **Check if app is running**
   ```bash
   npm run dev
   # Or for production:
   npm run build && npm run start
   ```

2. **Check database connectivity in health endpoint**
   - The `/api/health` endpoint tests: database, Redis, and Supabase storage
   - Ensure all three services are accessible

3. **View detailed errors**
   ```bash
   curl -i http://localhost:3000/api/health
   ```

4. **Test specific services separately**
   ```bash
   npm run setup:validate
   ```

#### Problem
```
✗ /api/violations
  Expected: HTTP 401 | Got: HTTP 404
```

#### Solution

1. **Verify endpoint exists**
   - Check `/app/api/violations/route.ts` exists

2. **Rebuild TypeScript**
   ```bash
   npm run db:generate
   npm run build
   ```

3. **Restart dev server**
   ```bash
   npm run dev
   ```

### Authentication and Protected Endpoints

#### Problem
```
Testing protected endpoints returns 404 instead of 401
```

#### Solution

The health check script expects certain endpoints to return 401 (unauthorized) when no authentication is provided. If you get 404:

1. **Verify endpoints exist**
   ```bash
   ls app/api/violations/
   ls app/api/subscriptions/
   ```

2. **Check route configuration**
   - Ensure routes are properly exported
   - Verify middleware is protecting endpoints

3. **Test with authentication**
   ```bash
   curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/violations
   ```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - run: npm ci

      - name: Check environment variables
        run: npm run check:env

      - name: Check TypeScript types
        run: npm run type-check

      - name: Run linter
        run: npm run lint

      - name: Build project
        run: npm run build
```

### Pre-commit Hook Example

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running validation checks..."
npm run validate

if [ $? -ne 0 ]; then
    echo "Validation failed. Commit aborted."
    exit 1
fi
```

### Docker Example

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Validate environment
RUN npm run check:env

# Type check and build
RUN npm run type-check && npm run build

CMD ["npm", "start"]
```

## Environment Configuration Strategies

### Development

```bash
# .env.development
NEXTAUTH_URL=http://localhost:3000
RESEND_API_KEY=re_...
SLACK_WEBHOOK_URL=  # Optional

# All other required variables
DATABASE_URL=...
SUPABASE_URL=...
# etc.
```

### Staging

```bash
# .env.staging
NEXTAUTH_URL=https://staging.example.com
CRON_SECRET=your_staging_secret
SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# All required variables
# etc.
```

### Production

```bash
# .env.production
NEXTAUTH_URL=https://example.com
CRON_SECRET=very_secure_secret_here
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
SUPABASE_SERVICE_ROLE_KEY=required_for_production_admin_ops

# All required variables
# etc.
```

## Monitoring and Alerting

### Regular Health Checks

Add a cron job to monitor health:

```bash
# Every 5 minutes
*/5 * * * * /path/to/scripts/health-check.sh https://example.com >> /var/log/health-check.log 2>&1
```

### Slack Notifications

Create a wrapper script to send health check results to Slack:

```bash
#!/bin/bash
# scripts/health-check-with-notification.sh

RESULT=$(./scripts/health-check.sh)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    curl -X POST $SLACK_WEBHOOK_URL \
         -H 'Content-Type: application/json' \
         -d "{\"text\": \"Health check failed!\n\`\`\`\n$RESULT\n\`\`\`\"}"
fi

exit $EXIT_CODE
```

## Advanced Usage

### Testing Multiple Environments

```bash
#!/bin/bash
ENVIRONMENTS=(
    "http://localhost:3000"
    "https://staging.example.com"
    "https://example.com"
)

for env in "${ENVIRONMENTS[@]}"; do
    echo "Testing: $env"
    ./scripts/health-check.sh "$env"
    echo ""
done
```

### Customizing Health Check

Edit `scripts/health-check.sh` to add custom checks:

```bash
# Add custom endpoint test
test_endpoint_response "/api/custom-endpoint" "200" "GET" "" "My custom endpoint"
```

### Environment Variable Validation

Extend `scripts/check-env.ts` to validate values:

```typescript
// Example: Validate NEXTAUTH_URL is a valid URL
const url = process.env.NEXTAUTH_URL;
try {
    new URL(url);
} catch {
    console.error('NEXTAUTH_URL is not a valid URL');
    process.exit(1);
}
```

## Troubleshooting

### Script Permission Errors

```bash
# Make scripts executable
chmod +x scripts/health-check.sh
chmod +x scripts/check-env.ts
```

### tsx not found

```bash
# Install tsx globally or locally
npm install -g tsx
# Or run with npx
npx tsx scripts/check-env.ts
```

### curl timeout

The health check script has a 10-second timeout. For slow networks:

```bash
# Edit scripts/health-check.sh and change:
TIMEOUT=30  # Increase from 10 to 30 seconds
```

### Colors not displaying

```bash
# Disable colors if terminal doesn't support them
# Edit scripts/health-check.sh and comment out color definitions
# Or redirect output to a file:
./scripts/health-check.sh > health-check.log 2>&1
```

## Support and Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Upstash Documentation](https://upstash.com/docs)
- [Mapbox Documentation](https://docs.mapbox.com)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Resend Documentation](https://resend.com/docs)
- [Project Repository](https://github.com/yourusername/stormwater-watch)
