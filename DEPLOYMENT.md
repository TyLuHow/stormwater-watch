# Stormwater Watch Deployment Guide

## Overview

Stormwater Watch is a Next.js 16 application for California stormwater violation monitoring. This document covers deployment, configuration, and operational procedures.

---

## Prerequisites

- Node.js 18+ or Node.js 22+ (recommended)
- PostgreSQL 14+ (production) or SQLite (development)
- pnpm 10+ (recommended) or npm
- Supabase account (production) or local database
- Email service (Resend recommended)

---

## Environment Variables

### Required for Production

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Authentication
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_FROM_EMAIL="noreply@yourdomain.com"

# Email (Resend)
RESEND_API_KEY="re_..."

# Supabase (optional, for storage)
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Redis (optional, for caching)
KV_REST_API_URL="https://xxx.upstash.io"
KV_REST_API_TOKEN="AX..."
```

### Optional / Feature-Specific

```bash
# Development Mode (bypasses auth, uses mock data)
DEV_MODE="false"

# Mapbox (for facility maps)
MAPBOX_TOKEN="pk.eyJ..."

# NOAA/NWS API (precipitation data)
NWS_USER_AGENT="(Contact)your-email@domain.org (Stormwater Watch)"

# Slack Notifications (optional)
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."

# Geodata Storage (if using Supabase Storage)
GEODATA_STORAGE_BUCKET="stormwater-geodata"
```

---

## Installation & Setup

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/your-org/stormwater-watch.git
cd stormwater-watch
pnpm install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your actual values
nano .env
```

### 3. Setup Database

#### For Production (PostgreSQL)

```bash
# Set DATABASE_URL in .env first
npx prisma migrate deploy
npx prisma generate
```

#### For Development (SQLite)

```bash
export DATABASE_URL="file:./dev.db"
npx prisma db push
npx prisma generate
```

### 4. Load Geodata (for Spatial Enrichment)

```bash
# Download and prepare geodata files
npm run script:load-geodata

# Manually place downloaded geodata in public/geodata/:
# - california-counties.geojson
# - huc12-california.geojson
# - calenviroscreen-dacs.geojson
# - ms4-boundaries.geojson

# See scripts/load-geodata.ts for download sources
```

### 5. Seed Database (Optional)

```bash
npx tsx prisma/seed.ts
```

---

## Development

### Run Development Server

```bash
# With environment variables
export DEV_MODE=true
export DATABASE_URL="file:./dev.db"
pnpm dev
```

Server runs at http://localhost:3000

### Development Mode Features

When `DEV_MODE=true`:
- Authentication is bypassed (auto-login as dev user)
- Mock data is used for geodata and external APIs
- Simplified error handling
- No external service dependencies

---

## Build & Production

### Build Application

```bash
pnpm build
```

This will:
- Type-check all TypeScript (errors will fail the build)
- Compile Next.js application
- Generate Prisma client
- Optimize assets

### Start Production Server

```bash
pnpm start
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Make sure to set all required environment variables in Vercel dashboard.

---

## Feature-Specific Setup

### 1. Spatial Enrichment

**Purpose:** Automatically enrich facilities with geographic context (county, watershed, DAC status, MS4 jurisdiction)

**Setup:**

1. Download geodata files (see `scripts/load-geodata.ts` for sources)
2. Place GeoJSON files in `public/geodata/`
3. Run enrichment:

```bash
curl -X POST http://localhost:3000/api/enrichment/spatial \
  -H "Content-Type: application/json" \
  -d '{"mode": "all"}'
```

**Check Status:**

```bash
curl http://localhost:3000/api/enrichment/spatial
```

**Re-run Enrichment:**

```bash
# Force re-enrich all facilities
curl -X POST http://localhost:3000/api/enrichment/spatial \
  -H "Content-Type: application/json" \
  -d '{"mode": "all", "forceUpdate": true}'
```

---

### 2. Spatial Subscription Matching

**Purpose:** Alert subscribers when violations occur within their area of interest

**Subscription Modes:**

- **POLYGON:** Alerts for facilities inside a GeoJSON polygon boundary
- **BUFFER:** Alerts for facilities within X km of a point
- **JURISDICTION:** Alerts for facilities in specific counties/watersheds/MS4s

**Example Subscription (POLYGON mode):**

```json
{
  "name": "San Francisco Bay Monitoring",
  "mode": "POLYGON",
  "params": {
    "polygon": {
      "type": "Polygon",
      "coordinates": [[[-122.5, 37.7], [-122.3, 37.7], [-122.3, 37.9], [-122.5, 37.9], [-122.5, 37.7]]]
    }
  },
  "minRatio": 1.5,
  "repeatOffenderThreshold": 2,
  "impairedOnly": false,
  "schedule": "DAILY",
  "delivery": "EMAIL"
}
```

**Testing Subscription Match:**

```bash
curl -X POST http://localhost:3000/api/subscriptions/test \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "BUFFER",
    "params": {"centerLat": 37.7749, "centerLon": -122.4194, "radiusKm": 10},
    "facilityId": "facility-id-here"
  }'
```

---

### 3. Case Packet Generation

**Purpose:** Generate attorney-ready PDFs for violation events

**Generate Case Packet:**

```bash
curl -X POST http://localhost:3000/api/case-packet \
  -H "Content-Type: application/json" \
  -d '{"violationEventId": "evt_abc123", "includePrecipitation": true}' \
  --output case-packet.pdf
```

**Via GET (for browser downloads):**

```
http://localhost:3000/api/case-packet?violationEventId=evt_abc123
```

**Options:**
- `includePrecipitation`: Add NOAA precipitation data for sample dates
- `includeMap`: Add facility location map (requires Mapbox token)
- `includeChart`: Add timeline chart of samples

---

### 4. Precipitation Context

**Purpose:** Fetch rainfall data for stormwater sample dates from NOAA

**Get Precipitation for Single Date:**

```bash
curl "http://localhost:3000/api/precipitation?lat=37.7749&lon=-122.4194&date=2024-01-15"
```

**Batch Request (multiple dates):**

```bash
curl -X POST http://localhost:3000/api/precipitation \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {"lat": 37.7749, "lon": -122.4194, "date": "2024-01-15"},
      {"lat": 37.7749, "lon": -122.4194, "date": "2024-01-16"}
    ]
  }'
```

**Caching:**
- Precipitation data is cached in Redis for 6 hours
- Grid point mappings are cached for 24 hours
- In dev mode, returns mock data

**Rate Limits:**
- NOAA API has rate limits (typically 5 requests/second)
- Batch requests are automatically throttled
- Maximum 50 locations per batch request

---

## Cron Jobs & Background Tasks

### Daily Alert Processing

**Endpoint:** `GET /api/cron/daily`

**What it does:**
1. Finds new violation events since last run
2. Matches violations against active subscriptions (spatial + filter criteria)
3. Generates and sends email/Slack alerts
4. Updates subscription `lastRunAt` timestamp

**Setup with Vercel Cron:**

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/daily",
    "schedule": "0 9 * * *"
  }]
}
```

**Manual Trigger (testing):**

```bash
curl http://localhost:3000/api/cron/daily
```

---

## Database Migrations

### Create Migration

```bash
npx prisma migrate dev --name add_feature_name
```

### Apply Migrations (Production)

```bash
npx prisma migrate deploy
```

### Reset Database (Development Only!)

```bash
npx prisma migrate reset
```

---

## Monitoring & Observability

### Health Check

```bash
curl http://localhost:3000/api/setup/health
```

Returns status of:
- Database connection
- External services (Supabase, Redis, etc.)
- Geodata availability

### Logs

- Application logs go to stdout (captured by Vercel/hosting platform)
- Critical operations log to Slack if `SLACK_WEBHOOK_URL` is set
- Enrichment operations log detailed stats to console

### Key Metrics to Monitor

- Enrichment success rate (`GET /api/enrichment/spatial`)
- Subscription match rate (check daily cron logs)
- Case packet generation time
- Precipitation API cache hit rate

---

## Troubleshooting

### "Facility not enriched" errors

Run spatial enrichment:
```bash
npm run enrich
```

### TypeScript build errors

The application now requires all TypeScript to type-check. Fix errors before deploying:
```bash
pnpm build
```

### Geodata not loading

1. Check files exist in `public/geodata/`
2. Verify GeoJSON is valid (use https://geojson.io)
3. Check browser console for fetch errors
4. In dev mode, system falls back to mock data

### Precipitation API errors

1. Verify `NWS_USER_AGENT` is set with valid contact email
2. Check NOAA API status: https://api.weather.gov/
3. Redis cache errors are non-fatal (will still work without cache)
4. Review logs for specific API error codes

### PDF generation fails

1. Ensure @react-pdf/renderer is installed
2. Check violation has associated samples
3. Verify facility has valid coordinates
4. Large PDFs may timeout (increase API timeout in next.config.mjs)

---

## Security Considerations

1. **Authentication:** Uses NextAuth with email magic links (no passwords)
2. **API Routes:** Most routes require authentication (except /setup and /api/auth/*)
3. **Environment Variables:** Never commit .env files to git
4. **Case Packets:** Include disclaimer that attorney review is required
5. **Rate Limiting:** Implement rate limiting for production (not included in MVP)

---

## Data Sources & Licensing

### Geodata Sources

- **California Counties:** Census TIGER files (public domain)
- **HUC12 Watersheds:** USGS WBD (public domain)
- **CalEnviroScreen:** OEHHA (public domain)
- **MS4 Boundaries:** Regional Water Boards (public domain)

### API Sources

- **NOAA/NWS:** Weather.gov API (free, requires attribution)
- **Mapbox:** Mapbox GL JS (requires token, free tier available)

### Compliance

- All data sources are public regulatory data
- Proper attribution is included in case packets
- No personal data is collected beyond email for authentication

---

## Support & Contribution

- Documentation: This file
- Issues: GitHub Issues
- Contact: Check SLACK_WEBHOOK_URL for team Slack

---

## Appendix: Full Environment Variable Reference

```bash
# === Core Application ===
NODE_ENV=production
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=https://...
NEXTAUTH_FROM_EMAIL=noreply@...

# === Email ===
RESEND_API_KEY=re_...

# === Supabase (Optional) ===
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEODATA_STORAGE_BUCKET=stormwater-geodata

# === Redis (Optional) ===
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=AX...

# === Features ===
MAPBOX_TOKEN=pk.eyJ...
NWS_USER_AGENT="(Contact)your-email (Stormwater Watch)"
SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# === Development ===
DEV_MODE=false  # Set to 'true' for local development only
```

---

**Last Updated:** November 8, 2025  
**Version:** 1.0.0 (MVP Complete)
