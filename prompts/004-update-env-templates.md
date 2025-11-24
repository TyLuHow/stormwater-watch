<objective>
Update and enhance the .env.example template file to provide clear, comprehensive guidance for environment configuration. Ensure all 16 required environment variables are documented with examples, descriptions, and instructions for obtaining values.

This template is the first reference point for developers setting up the platform and must be complete and accurate.
</objective>

<context>
The Stormwater Watch platform requires 16 environment variables across 5 external services. Developers setting up the project for the first time need clear instructions on how to obtain and configure each variable.

Current state: .env.example exists but may be incomplete or missing detailed instructions
Target: Complete, well-documented template that reduces setup friction
</context>

<requirements>
Update `.env.example` to include:

1. **All Required Variables** (16 total):
   - Database (4): DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
   - Authentication (2): NEXTAUTH_URL, NEXTAUTH_SECRET
   - Email (2): RESEND_API_KEY, RESEND_FROM_EMAIL
   - Maps (2): NEXT_PUBLIC_MAPBOX_TOKEN, MAPBOX_TOKEN
   - Queue/Cache (2): UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
   - Jobs (1): CRON_SECRET
   - External APIs (1): NWS_USER_AGENT

2. **Optional Variables** (6 total):
   - Monitoring: SLACK_WEBHOOK_URL, SLACK_CHANNEL
   - AI Features: INTERNVL_ENABLED, INTERNVL_BASE_URL
   - Application: NODE_ENV, NEXT_PUBLIC_APP_URL

3. **For Each Variable**:
   - Clear description of purpose
   - Example value format
   - Instructions for obtaining the value
   - Security notes where applicable
   - Default value if any

4. **Organization**:
   - Group by service/category
   - Add section headers with descriptions
   - Include setup instructions at the top
   - Add security warnings for sensitive keys
</requirements>

<implementation>
Read the current `.env.example` first, then update it comprehensively:

```bash
# Read current template
cat .env.example
```

Create an enhanced `.env.example`:

```env
#──────────────────────────────────────────────────────────────────────────────
# Stormwater Watch - Environment Configuration Template
#──────────────────────────────────────────────────────────────────────────────
#
# SETUP INSTRUCTIONS:
#
# 1. Copy this file to .env:
#    cp .env.example .env
#
# 2. Fill in all required values (marked with *REQUIRED*)
#
# 3. Generate secrets:
#    NEXTAUTH_SECRET:  openssl rand -base64 32
#    CRON_SECRET:      openssl rand -hex 16
#
# 4. Validate configuration:
#    npm run check:env
#
# 5. See SETUP.md for detailed instructions on obtaining API keys
#
# ⚠️  SECURITY WARNING:
#    - Never commit .env to version control (it's in .gitignore)
#    - Use different secrets for dev/staging/production
#    - Rotate secrets regularly in production
#    - Service role keys grant full admin access - protect them
#
#──────────────────────────────────────────────────────────────────────────────

#──────────────────────────────────────────────────────────────────────────────
# DATABASE (Supabase PostgreSQL)
#──────────────────────────────────────────────────────────────────────────────
# Sign up: https://supabase.com
# Get credentials: Project Settings > Database > Connection string

# *REQUIRED* PostgreSQL connection string with pgbouncer for connection pooling
# Format: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# *REQUIRED* Supabase project URL
# Format: https://[PROJECT_REF].supabase.co
# Find at: Project Settings > API > Project URL
SUPABASE_URL="https://[project-ref].supabase.co"

# *REQUIRED* Supabase anonymous key (public, safe for client-side)
# Find at: Project Settings > API > Project API keys > anon public
# Used for: Client-side Supabase queries (RLS policies apply)
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# *REQUIRED* Supabase service role key (SECRET - full admin access)
# Find at: Project Settings > API > Project API keys > service_role secret
# Used for: Server-side admin operations, storage management
# ⚠️  WARNING: This key bypasses Row Level Security. Never expose client-side!
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

#──────────────────────────────────────────────────────────────────────────────
# AUTHENTICATION (NextAuth.js)
#──────────────────────────────────────────────────────────────────────────────

# *REQUIRED* Application URL for NextAuth callbacks
# Development: http://localhost:3000
# Production:  https://your-domain.com
NEXTAUTH_URL="http://localhost:3000"

# *REQUIRED* Secret for session encryption (generate with: openssl rand -base64 32)
# ⚠️  SECURITY: Generate unique secrets for each environment
# Must be: At least 32 characters, random, never shared
NEXTAUTH_SECRET="GENERATE_WITH: openssl rand -base64 32"

#──────────────────────────────────────────────────────────────────────────────
# EMAIL (Resend)
#──────────────────────────────────────────────────────────────────────────────
# Sign up: https://resend.com
# Get key: Dashboard > API Keys > Create API Key

# *REQUIRED* Resend API key for sending alert emails
# Format: re_[random_string]
# Permissions: Send emails (read-only or full access)
RESEND_API_KEY="re_..."

# *REQUIRED* From email address for alert notifications
# Must be: A verified domain in Resend dashboard
# Format: "Display Name <email@verified-domain.com>"
# Default: Use resend.dev domain for testing
RESEND_FROM_EMAIL="Stormwater Watch <alerts@yourdomain.org>"

#──────────────────────────────────────────────────────────────────────────────
# MAPS (Mapbox GL)
#──────────────────────────────────────────────────────────────────────────────
# Sign up: https://mapbox.com
# Get tokens: Account > Access tokens

# *REQUIRED* Mapbox public token (safe for client-side use)
# Format: pk.eyJ...
# Scopes: styles:read, fonts:read (default public token scopes)
# Used for: Map rendering in dashboard and subscription form
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJja..."

# *REQUIRED* Mapbox secret token (server-side only)
# Format: sk.eyJ... (or use public token if no server-side features needed)
# Scopes: styles:read, fonts:read, datasets:read (if using datasets)
# Used for: Server-side geocoding, static maps (if implemented)
MAPBOX_TOKEN="sk.eyJ1IjoiZXhhbXBsZSIsImEiOiJja..."

#──────────────────────────────────────────────────────────────────────────────
# JOB QUEUE & RATE LIMITING (Upstash Redis)
#──────────────────────────────────────────────────────────────────────────────
# Sign up: https://upstash.com
# Create: Redis database (free tier available)
# Get credentials: Database > REST API > Copy REST URL and Token

# *REQUIRED* Upstash Redis REST API URL
# Format: https://[region]-[id].upstash.io
UPSTASH_REDIS_REST_URL="https://[region]-[id].upstash.io"

# *REQUIRED* Upstash Redis REST API token
# Format: Long random string starting with "A"
# Used for: Rate limiting on public API endpoints
UPSTASH_REDIS_REST_TOKEN="A..."

#──────────────────────────────────────────────────────────────────────────────
# CRON JOBS (Vercel Cron or manual triggers)
#──────────────────────────────────────────────────────────────────────────────

# *REQUIRED* Secret for protecting cron endpoints (generate with: openssl rand -hex 16)
# Must be: At least 16 characters, random
# Used for: Vercel Cron authentication (Authorization: Bearer CRON_SECRET)
# Endpoints: /api/cron/daily, /api/cron/weekly
CRON_SECRET="GENERATE_WITH: openssl rand -hex 16"

#──────────────────────────────────────────────────────────────────────────────
# EXTERNAL APIs
#──────────────────────────────────────────────────────────────────────────────

# *REQUIRED* User agent for NOAA National Weather Service API requests
# Format: app-name (contact-email)
# Purpose: NOAA requires identification for API usage tracking
# Used for: Precipitation data lookup for violation context
NWS_USER_AGENT="stormwater-watch.org (your-email@domain.org)"

#──────────────────────────────────────────────────────────────────────────────
# MONITORING & ALERTS (Optional)
#──────────────────────────────────────────────────────────────────────────────

# OPTIONAL: Slack webhook for error monitoring and system notifications
# Get webhook: Slack App > Incoming Webhooks > Add New Webhook
# Format: https://hooks.slack.com/services/T.../B.../...
# Used for: Critical error notifications, system alerts
SLACK_WEBHOOK_URL=""

# OPTIONAL: Default Slack channel for notifications
# Format: #channel-name or @username
# Default: #stormwater-alerts
SLACK_CHANNEL="#stormwater-alerts"

#──────────────────────────────────────────────────────────────────────────────
# AI FEATURES (Optional - Experimental)
#──────────────────────────────────────────────────────────────────────────────

# OPTIONAL: Enable AI vision features for document analysis
# Values: "true" | "false"
# Default: "false" (disabled)
# When enabled: Requires INTERNVL_BASE_URL to be configured
INTERNVL_ENABLED="false"

# OPTIONAL: InternVL API base URL (only needed if INTERNVL_ENABLED=true)
# Format: https://your-internvl-instance.com
# Purpose: AI-powered document analysis for SMARTS CSV validation
INTERNVL_BASE_URL=""

#──────────────────────────────────────────────────────────────────────────────
# APPLICATION SETTINGS
#──────────────────────────────────────────────────────────────────────────────

# OPTIONAL: Node environment
# Values: "development" | "production" | "test"
# Default: Automatically set by Next.js
NODE_ENV="development"

# OPTIONAL: Public application URL
# Used for: Absolute URLs in emails, OG tags, sitemap
# Development: http://localhost:3000
# Production: https://your-domain.com
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# OPTIONAL: Enable development mode features
# Values: "true" | "false"
# When true: Shows debug info, verbose logging, test UI elements
DEV_MODE="false"

#──────────────────────────────────────────────────────────────────────────────
# VALIDATION
#──────────────────────────────────────────────────────────────────────────────
# After configuration, validate with:
#   npm run check:env     - Check all variables are set
#   npm run check:health  - Test API endpoints (requires server running)
#   npm run check:all     - Run both checks
#
# See SETUP.md for detailed setup instructions
# See VALIDATION.md for troubleshooting common issues
#──────────────────────────────────────────────────────────────────────────────
```
</implementation>

<additional_tasks>
After updating .env.example, also:

1. **Verify .gitignore** includes .env files:
```bash
# Check .gitignore
grep -E '\.env$|\.env\.local|\.env\.*' .gitignore || echo "⚠️  Add .env* to .gitignore"
```

If missing, add to .gitignore:
```
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

2. **Create environment variable summary**:

Create `./ENV_VARIABLES.md`:

```markdown
# Environment Variables Reference

Quick reference for all Stormwater Watch environment variables.

## Required (12 variables)

| Variable | Service | Purpose | How to Get |
|----------|---------|---------|------------|
| `DATABASE_URL` | Supabase | PostgreSQL connection string | Supabase Dashboard → Database → Connection string |
| `SUPABASE_URL` | Supabase | API endpoint | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase | Public client key | Supabase Dashboard → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Admin server key | Supabase Dashboard → Settings → API → service_role |
| `NEXTAUTH_URL` | NextAuth | App URL for callbacks | `http://localhost:3000` (dev) or your domain |
| `NEXTAUTH_SECRET` | NextAuth | Session encryption | Generate: `openssl rand -base64 32` |
| `RESEND_API_KEY` | Resend | Email sending | Resend Dashboard → API Keys |
| `RESEND_FROM_EMAIL` | Resend | From address | Must be verified domain in Resend |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox | Public map token | Mapbox Dashboard → Access Tokens |
| `MAPBOX_TOKEN` | Mapbox | Server map token | Mapbox Dashboard → Access Tokens (secret) |
| `UPSTASH_REDIS_REST_URL` | Upstash | Redis endpoint | Upstash Dashboard → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash | Redis auth token | Upstash Dashboard → REST API |
| `CRON_SECRET` | Internal | Cron protection | Generate: `openssl rand -hex 16` |
| `NWS_USER_AGENT` | NOAA | API identification | Format: `app-name (email@domain.com)` |

## Optional (6 variables)

| Variable | Default | Purpose |
|----------|---------|---------|
| `SLACK_WEBHOOK_URL` | None | Error notifications |
| `SLACK_CHANNEL` | `#stormwater-alerts` | Notification channel |
| `INTERNVL_ENABLED` | `false` | AI document analysis |
| `INTERNVL_BASE_URL` | None | AI API endpoint |
| `NODE_ENV` | `development` | Environment mode |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public URL |

## Security Notes

### Secret Variables (Never Expose)
- `SUPABASE_SERVICE_ROLE_KEY` - Full database admin access
- `NEXTAUTH_SECRET` - Session compromise if exposed
- `RESEND_API_KEY` - Unauthorized email sending
- `MAPBOX_TOKEN` - Secret token (if used)
- `UPSTASH_REDIS_REST_TOKEN` - Database access
- `CRON_SECRET` - Job execution control

### Public Variables (Safe for Client)
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Public map token
- `NEXT_PUBLIC_APP_URL` - Application URL
- `SUPABASE_URL` - API endpoint (public)
- `SUPABASE_ANON_KEY` - Client key (RLS protected)

### Generation Commands

```bash
# NEXTAUTH_SECRET (32+ characters)
openssl rand -base64 32

# CRON_SECRET (16+ characters)
openssl rand -hex 16

# Or use: https://generate-secret.vercel.app/32
```

## Verification

Check configuration:
```bash
npm run check:env
```

Expected output:
```
✅ All required environment variables are set!
```

## Quick Setup

```bash
# 1. Copy template
cp .env.example .env

# 2. Generate secrets
echo "NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env
echo "CRON_SECRET=\"$(openssl rand -hex 16)\"" >> .env

# 3. Fill in service API keys (manually from dashboards)
# Edit .env with your editor

# 4. Validate
npm run check:env
```

## Service Sign-up Links

- **Supabase**: https://supabase.com (database + storage)
- **Upstash**: https://upstash.com (Redis, free tier available)
- **Resend**: https://resend.com (email, free 3000 emails/month)
- **Mapbox**: https://mapbox.com (maps, free tier available)
- **Slack**: https://api.slack.com/messaging/webhooks (optional)

## Troubleshooting

See `VALIDATION.md` for detailed troubleshooting guides for each service.
```
</additional_tasks>

<verification>
Before declaring complete, verify:

1. `.env.example` file is updated with all 16 required variables
2. Each variable has clear description and example
3. Security warnings are prominent for sensitive keys
4. Instructions for obtaining values are provided
5. Generation commands are included for secrets

Check the file:
```bash
# Count environment variables
grep -c '^[A-Z_]*=' .env.example

# Verify critical variables present
for var in DATABASE_URL NEXTAUTH_SECRET RESEND_API_KEY; do
  grep -q "^$var=" .env.example && echo "✓ $var" || echo "✗ $var MISSING"
done
```

6. `.gitignore` properly excludes .env files:
```bash
grep '\.env' .gitignore
```

7. `ENV_VARIABLES.md` created with reference table
8. All files are properly formatted and readable
</verification>

<output>
After completing updates, create a summary file `./ENV_SETUP_STATUS.md`:

```markdown
# Environment Configuration Status

## Files Updated

- [✓] `.env.example` - Comprehensive template with all 16 required variables
- [✓] `.gitignore` - Verified .env files are excluded
- [✓] `ENV_VARIABLES.md` - Quick reference guide

## What's Configured

### Required Variables (12)
✓ All 12 required variables documented in .env.example with:
  - Clear descriptions
  - Example formats
  - Instructions for obtaining values
  - Security warnings where applicable

### Optional Variables (6)
✓ All 6 optional variables documented with defaults and purposes

## Next Steps

1. **Copy template**: `cp .env.example .env`

2. **Generate secrets**:
   ```bash
   openssl rand -base64 32  # For NEXTAUTH_SECRET
   openssl rand -hex 16     # For CRON_SECRET
   ```

3. **Obtain API keys** from service dashboards:
   - Supabase: Database credentials
   - Upstash: Redis credentials
   - Resend: Email API key
   - Mapbox: Map tokens

4. **Fill in .env** with actual values

5. **Validate configuration**: `npm run check:env`

## Documentation

- **Setup Guide**: See `SETUP.md` for detailed step-by-step instructions
- **Validation**: See `VALIDATION.md` for troubleshooting
- **Quick Reference**: See `ENV_VARIABLES.md` for variable table

## Security Checklist

- [ ] .env is in .gitignore (verified)
- [ ] NEXTAUTH_SECRET generated (32+ characters)
- [ ] CRON_SECRET generated (16+ characters)
- [ ] Different secrets for dev/staging/production
- [ ] Service role keys kept secret (not exposed client-side)
- [ ] API keys have minimum required permissions

## Service Sign-ups Required

If you don't have accounts yet:

1. **Supabase** (https://supabase.com) - Database + Storage
2. **Upstash** (https://upstash.com) - Redis (free tier OK)
3. **Resend** (https://resend.com) - Email (free tier OK)
4. **Mapbox** (https://mapbox.com) - Maps (free tier OK)
5. **Slack** (https://api.slack.com/messaging/webhooks) - Optional

All services offer free tiers suitable for development and small deployments.
```
</output>

<success_criteria>
- `.env.example` comprehensively updated with all variables
- Each variable includes description, example, and instructions
- Security warnings prominently displayed
- `.gitignore` verified to exclude .env files
- `ENV_VARIABLES.md` created as quick reference
- `ENV_SETUP_STATUS.md` created with next steps
- All files are well-formatted and easy to understand
- Setup instructions are clear and actionable
- No sensitive values hardcoded in examples
</success_criteria>
