# Stormwater Watch - Complete Setup Guide

## 📋 Manual Setup Steps

Follow these steps in order to fully set up the Stormwater Watch system.

---

## Step 1: Environment Variables Setup

### 1.1 Create `.env` file

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 1.2 Fill in Required Environment Variables

Edit `.env` and set the following **REQUIRED** variables:

```bash
# Database (REQUIRED)
DATABASE_URL="postgresql://user:password@localhost:5432/stormwater_watch"
# OR for local SQLite development:
# DATABASE_URL="file:./dev.db"

# NextAuth (REQUIRED)
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_FROM_EMAIL="Stormwater Watch <alerts@yourdomain.org>"

# Email Service (REQUIRED)
RESEND_API_KEY="re_..."
```

**How to get NEXTAUTH_SECRET:**
```bash
# On Linux/Mac:
openssl rand -base64 32

# On Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 1.3 Fill in Optional Environment Variables

```bash
# Supabase (Optional - for file storage)
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
SUPABASE_ANON_KEY="eyJ..."

# Redis Cache (Optional - for caching)
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AX..."

# Mapbox (Optional - for maps)
MAPBOX_TOKEN="pk.eyJ..."
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ..."  # Same as above usually

# Slack (Optional - for alerts)
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."

# Weather API (Optional - for precipitation)
NWS_USER_AGENT="(Contact)your-email@domain.org (Stormwater Watch)"

# Cron Protection (Optional - for production)
CRON_SECRET="generate-random-string-here"
```

---

## Step 2: Database Setup

### 2.1 Install Dependencies

```bash
pnpm install
```

### 2.2 Set Up Database Schema

**For PostgreSQL (Production):**
```bash
# Create database first (in PostgreSQL)
createdb stormwater_watch

# Run migrations
pnpm db:migrate

# OR push schema directly (for development)
pnpm db:push
```

**For SQLite (Local Development):**
```bash
# Just set DATABASE_URL in .env to "file:./dev.db"
# Then run:
pnpm db:push
```

### 2.3 Generate Prisma Client

```bash
pnpm db:generate
```

### 2.4 Seed Test Data

```bash
pnpm seed
```

This creates:
- 1 ADMIN user
- 2 PARTNER users
- 10 facilities across 3 counties
- 60+ samples
- 3 test subscriptions

**Verify seed worked:**
```bash
# Check database
# For PostgreSQL:
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Facility\";"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Sample\";"

# Expected: 3 users, 10 facilities, 60+ samples
```

---

## Step 3: Verify Integrations

### 3.1 Start Development Server

```bash
pnpm dev
```

Server will start at: **http://localhost:3000**

### 3.2 Visit Setup Page

Navigate to: **http://localhost:3000/setup**

**Expected Results:**
- ✅ Database: **PASS** (green)
- ✅ NextAuth: **PASS** (if NEXTAUTH_SECRET set)
- ✅ Resend Email: **PASS** (if RESEND_API_KEY set)
- ⚠️ Supabase: **WARNING** (optional)
- ⚠️ Redis: **WARNING** (optional)
- ⚠️ Mapbox: **WARNING** (optional)
- ⚠️ Slack: **WARNING** (optional)

**Fix any FAILED checks before proceeding.**

---

## Step 4: Load Geodata (Optional but Recommended)

### 4.1 Download Geodata Files

**California Counties:**
```bash
# Download from Census TIGER
# Or use this direct link:
curl -o public/geodata/california-counties.geojson \
  "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/california-counties.geojson"
```

**HUC12 Watersheds:**
- Visit: https://www.usgs.gov/national-hydrography/watershed-boundary-dataset
- Download California HUC12 shapefile
- Convert to GeoJSON (use QGIS or ogr2ogr)
- Save as: `public/geodata/huc12-california.geojson`

**CalEnviroScreen DACs:**
- Visit: https://oehha.ca.gov/calenviroscreen/maps-data
- Download CalEnviroScreen 4.0 shapefile
- Convert to GeoJSON
- Save as: `public/geodata/calenviroscreen-dacs.geojson`

**MS4 Boundaries:**
- Visit regional water board GIS portals
- Download Phase I MS4 permit boundaries
- Convert to GeoJSON
- Save as: `public/geodata/ms4-boundaries.geojson`

### 4.2 Verify Geodata Files

```bash
# Check files exist
ls -la public/geodata/

# Verify they're valid GeoJSON (optional)
python3 -c "import json; json.load(open('public/geodata/california-counties.geojson'))"
```

### 4.3 Run Spatial Enrichment

```bash
# Enrich all facilities
pnpm enrich

# OR manually:
curl -X POST http://localhost:3000/api/enrichment/spatial \
  -H "Content-Type: application/json" \
  -d '{"mode": "all"}'
```

**Check results:**
```bash
curl http://localhost:3000/api/enrichment/spatial
```

---

## Step 5: Configure External Services

### 5.1 Resend Email Setup

1. Sign up at https://resend.com
2. Create API key
3. Add to `.env`: `RESEND_API_KEY="re_..."`
4. Verify domain (for production)
5. Test email sending:
   ```bash
   # Visit /setup page and check Resend status
   ```

### 5.2 Slack Webhook Setup

1. Go to your Slack workspace
2. Create new app or use existing
3. Enable Incoming Webhooks
4. Create webhook for your channel
5. Copy webhook URL
6. Add to `.env`: `SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."`
7. Test webhook:
   ```bash
   curl -X POST $SLACK_WEBHOOK_URL \
     -H "Content-Type: application/json" \
     -d '{"text": "Test message from Stormwater Watch"}'
   ```

### 5.3 Mapbox Setup

1. Sign up at https://mapbox.com
2. Get access token from dashboard
3. Add to `.env`:
   ```bash
   MAPBOX_TOKEN="pk.eyJ..."
   NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ..."
   ```
4. (Optional) Restrict token to your domain in production

### 5.4 Supabase Setup (Optional)

1. Create project at https://supabase.com
2. Get project URL and service role key
3. Create storage bucket named "raw" (or update code)
4. Add to `.env`:
   ```bash
   SUPABASE_URL="https://xxx.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="eyJ..."
   ```

### 5.5 Upstash Redis Setup (Optional)

1. Create database at https://upstash.com
2. Get REST URL and token
3. Add to `.env`:
   ```bash
   UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
   UPSTASH_REDIS_REST_TOKEN="AX..."
   ```

---

## Step 6: Test Core Functionality

### 6.1 Test CSV Upload

1. Create test CSV file: `test-data/sample-violations.csv`
```csv
Facility Name,WDID,Parameter,Result,Unit,Occurrence Date,County,Benchmark
Acme Manufacturing,3 12I000123,Total Suspended Solids,450,mg/L,2025-01-15,Alameda,100
Beta Industries,3 12I000456,Copper,75,µg/L,2025-01-20,Santa Clara,14
```

2. Visit: **http://localhost:3000/ingest** (ADMIN only)
3. Upload CSV file
4. Verify:
   - Facilities created in database
   - Samples inserted
   - Provenance record created

### 6.2 Test Violation Detection

```bash
# Manually trigger recompute
curl -X POST http://localhost:3000/api/violations/recompute \
  -H "Content-Type: application/json"

# Check violations created
# Visit: http://localhost:3000/dashboard
```

### 6.3 Test Spatial Enrichment

```bash
# Run enrichment
pnpm enrich

# Check facility detail page - should show county, HUC12, etc.
```

### 6.4 Test Subscription Creation

1. Visit: **http://localhost:3000/subscriptions**
2. Create a JURISDICTION subscription:
   - Name: "Test Alameda County"
   - Mode: JURISDICTION
   - County: Alameda
   - Min Ratio: 1.5
   - Schedule: DAILY
   - Delivery: EMAIL
3. Click "Create Subscription"
4. Verify subscription appears in list

### 6.5 Test Alert Sending

```bash
# Test send for a subscription
curl -X POST http://localhost:3000/api/subscriptions/send \
  -H "Content-Type: application/json" \
  -d '{"subscriptionId": "your-subscription-id"}'

# Check email inbox (if RESEND_API_KEY configured)
# Check Slack channel (if SLACK_WEBHOOK_URL configured)
```

### 6.6 Test Case Packet Generation

1. Visit facility detail page: **http://localhost:3000/facilities/[id]**
2. Find a violation with samples
3. Click "Generate Case Packet"
4. Verify PDF downloads
5. Open PDF and verify:
   - Facility information present
   - Violation summary correct
   - Sample data included
   - Provenance footer present

---

## Step 7: Production Deployment

### 7.1 Build for Production

```bash
# Test build
pnpm build

# Should complete with zero TypeScript errors
```

### 7.2 Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Set all environment variables in Vercel dashboard
4. Deploy

**Required Vercel Environment Variables:**
- All variables from `.env` (see Step 1)
- Set `NODE_ENV=production`
- Set `NEXTAUTH_URL` to production domain

### 7.3 Configure Vercel Cron Jobs

1. Go to Vercel project settings
2. Navigate to "Cron Jobs" section
3. Add cron jobs (or use `vercel.json`):
   - Daily: `15 2 * * *` → `/api/cron/daily`
   - Weekly: `30 2 * * 1` → `/api/cron/weekly`
4. Set `CRON_SECRET` in environment variables
5. Verify cron jobs are scheduled

### 7.4 Post-Deployment Verification

1. Visit production `/setup` page
2. Verify all checks are GREEN
3. Test CSV upload on production
4. Create test subscription
5. Manually trigger cron job:
   ```bash
   curl -X GET https://your-domain.com/api/cron/daily \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

---

## Step 8: Initial Data Load

### 8.1 Upload Historical Data

1. Prepare CSV files from CIWQS/SMARTS exports
2. Visit `/ingest` page
3. Upload each CSV file
4. Note: Large files may take several minutes

### 8.2 Run Violation Detection

```bash
# After uploading samples, recompute violations
curl -X POST https://your-domain.com/api/violations/recompute \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 8.3 Run Spatial Enrichment

```bash
# Enrich all facilities with geographic data
curl -X POST https://your-domain.com/api/enrichment/spatial \
  -H "Content-Type: application/json" \
  -d '{"mode": "all"}'
```

### 8.4 Create Production Subscriptions

1. Visit `/subscriptions` page
2. Create subscriptions for each monitoring area
3. Test each subscription with "Test Send"
4. Verify alerts are received

---

## Step 9: Monitoring & Maintenance

### 9.1 Set Up Monitoring

**Slack Alerts:**
- Configure `SLACK_WEBHOOK_URL` for operational alerts
- Critical errors will automatically post to Slack

**Health Checks:**
- Monitor `/api/setup` endpoint
- Set up uptime monitoring (UptimeRobot, etc.)
- Monitor Vercel function logs

### 9.2 Regular Maintenance Tasks

**Daily:**
- Cron jobs run automatically (2:15 AM PT)
- Check Slack for error alerts

**Weekly:**
- Review violation events
- Check subscription activity
- Monitor database size

**Monthly:**
- Review and update geodata files
- Check for new pollutant configurations
- Review and optimize queries

---

## Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server`

**Solution:**
1. Verify `DATABASE_URL` is correct
2. Check PostgreSQL is running: `pg_isready`
3. Verify network/firewall allows connection
4. Check credentials are correct

### Authentication Not Working

**Error:** `NEXTAUTH_SECRET is missing`

**Solution:**
1. Generate new secret: `openssl rand -base64 32`
2. Add to `.env`: `NEXTAUTH_SECRET="..."`
3. Restart dev server

### Email Not Sending

**Error:** Resend API errors

**Solution:**
1. Verify `RESEND_API_KEY` is valid
2. Check Resend dashboard for API usage
3. Verify domain is verified (production)
4. Check email isn't going to spam

### Mapbox Not Loading

**Error:** Map shows "Map unavailable"

**Solution:**
1. Verify `NEXT_PUBLIC_MAPBOX_TOKEN` is set
2. Check token is valid in Mapbox dashboard
3. Verify token has correct scopes
4. Check browser console for errors

### Cron Jobs Not Running

**Error:** Cron jobs not triggering

**Solution:**
1. Verify `vercel.json` has correct cron configuration
2. Check Vercel project has cron jobs enabled
3. Verify `CRON_SECRET` is set
4. Check Vercel function logs for errors

### PDF Generation Fails

**Error:** Case packet generation times out

**Solution:**
1. Increase function timeout in `vercel.json`:
   ```json
   {
     "functions": {
       "app/api/case-packet/route.ts": {
         "maxDuration": 30
       }
     }
   }
   ```
2. Reduce number of samples in query
3. Check server logs for memory issues

---

## Quick Setup Checklist

- [ ] `.env` file created with all required variables
- [ ] Database created and schema migrated
- [ ] Test data seeded (`pnpm seed`)
- [ ] Development server running (`pnpm dev`)
- [ ] Setup page shows all green checks
- [ ] CSV upload tested and working
- [ ] Violation detection tested
- [ ] Subscription created and tested
- [ ] Alert sending tested (email/Slack)
- [ ] Case packet generation tested
- [ ] Production build succeeds (`pnpm build`)
- [ ] Production environment variables set
- [ ] Vercel cron jobs configured
- [ ] Production deployment verified

---

## Next Steps After Setup

1. **Load Real Data:** Upload historical CSV files from CIWQS
2. **Create Subscriptions:** Set up monitoring areas for your organization
3. **Configure Alerts:** Set up email/Slack delivery
4. **Train Users:** Show partners how to use dashboard and create subscriptions
5. **Monitor:** Set up monitoring and alerting for operational issues

---

## Support

**Common Issues:**
- Check `SETUP_GUIDE.md` (this file)
- Check `DEPLOYMENT.md` for deployment-specific issues
- Check `IMPLEMENTATION_STATUS.md` for feature status

**Getting Help:**
- Review error logs in Vercel dashboard
- Check Slack channel for operational alerts
- Review code comments in relevant files

---

**Last Updated:** November 8, 2025




