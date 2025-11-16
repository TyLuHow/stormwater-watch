# 📝 Manual Setup Steps - Complete Checklist

## What You Need to Do Right Now

### 1️⃣ **Install Dependencies** (if not done)
```bash
pnpm install
```

### 2️⃣ **Set Up Database** (2 minutes)

```bash
# Option A: Use SQLite (Easiest - already configured)
# Just ensure .env has: DATABASE_URL="file:./dev.db"

# Option B: Use PostgreSQL (Production)
# Create database first, then update DATABASE_URL in .env
```

Then run:
```bash
pnpm db:push        # Create database tables
pnpm db:generate    # Generate Prisma client
pnpm seed           # Load test data
```

**✅ Verify:** Check that seed created data:
```bash
# Should see: "✓ Created 3 users", "✓ Created 10 facilities", etc.
```

### 3️⃣ **Configure Environment Variables** (5 minutes)

Edit `.env` file and fill in:

**REQUIRED:**
- ✅ `DATABASE_URL` - Already set to SQLite for dev
- ✅ `NEXTAUTH_SECRET` - Generate with PowerShell command below
- ✅ `NEXTAUTH_URL` - Already set to `http://localhost:3000`
- ✅ `NEXTAUTH_FROM_EMAIL` - Set to your email
- ✅ `RESEND_API_KEY` - Get from https://resend.com (free tier available)

**OPTIONAL (can add later):**
- `MAPBOX_TOKEN` - For maps (get from mapbox.com)
- `SLACK_WEBHOOK_URL` - For Slack alerts
- `SUPABASE_URL` - For file storage
- `UPSTASH_REDIS_REST_URL` - For caching

**Generate NEXTAUTH_SECRET (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Copy the output and paste into `.env` as:
```
NEXTAUTH_SECRET="paste-generated-value-here"
```

### 4️⃣ **Start Development Server** (1 minute)

```bash
pnpm dev
```

Wait for compilation (30-60 seconds). Server should start at **http://localhost:3000**

### 5️⃣ **Verify Setup** (2 minutes)

1. Open browser: **http://localhost:3000/setup**
2. Check status of each integration:
   - ✅ **Database** - Should be GREEN
   - ✅ **NextAuth** - Should be GREEN (if NEXTAUTH_SECRET set)
   - ⚠️ **Resend Email** - YELLOW if RESEND_API_KEY not set
   - ⚠️ **Other services** - YELLOW is OK (optional)

**If any show RED (FAIL):**
- Check the error message
- Verify the corresponding environment variable is set correctly
- Restart the dev server after fixing

### 6️⃣ **Test Core Features** (5 minutes)

#### Test 1: Dashboard
- Visit: **http://localhost:3000/dashboard**
- Should see test facilities and violations
- Try filters (if implemented)

#### Test 2: Facility Page
- Click on a facility from dashboard
- Should show facility details, violations, samples
- Try "Generate Case Packet" button (if violations exist)

#### Test 3: Create Subscription
- Visit: **http://localhost:3000/subscriptions**
- Create a JURISDICTION subscription:
  - Name: "Test Subscription"
  - Mode: JURISDICTION
  - County: Alameda (or any county from seed data)
  - Min Ratio: 1.5
  - Schedule: DAILY
  - Delivery: EMAIL
- Click "Create Subscription"
- Verify it appears in the list

#### Test 4: Test Alert (Optional)
```bash
# Get subscription ID from database or UI
# Then test send:
curl -X POST http://localhost:3000/api/subscriptions/send \
  -H "Content-Type: application/json" \
  -d '{"subscriptionId": "your-sub-id-here"}'
```

---

## Optional: Additional Setup

### Load Geodata Files (15 minutes)

For spatial enrichment to work fully, download and place geodata files:

1. **California Counties:**
   ```bash
   # Download from GitHub
   curl -o public/geodata/california-counties.geojson \
     "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/california-counties.geojson"
   ```

2. **HUC12 Watersheds:**
   - Visit: https://www.usgs.gov/national-hydrography/watershed-boundary-dataset
   - Download California HUC12 data
   - Convert to GeoJSON
   - Save as: `public/geodata/huc12-california.geojson`

3. **CalEnviroScreen DACs:**
   - Visit: https://oehha.ca.gov/calenviroscreen/maps-data
   - Download shapefile
   - Convert to GeoJSON
   - Save as: `public/geodata/calenviroscreen-dacs.geojson`

4. **Run Enrichment:**
   ```bash
   pnpm enrich
   ```

### Configure External Services

#### Resend (Email)
1. Sign up at https://resend.com (free tier)
2. Create API key
3. Add to `.env`: `RESEND_API_KEY="re_..."`
4. (Production) Verify domain for sending

#### Slack
1. Go to Slack workspace
2. Create app → Incoming Webhooks
3. Create webhook for your channel
4. Add to `.env`: `SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."`

#### Mapbox
1. Sign up at https://mapbox.com (free tier)
2. Get access token
3. Add to `.env`:
   ```
   MAPBOX_TOKEN="pk.eyJ..."
   NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ..."
   ```

---

## Production Deployment Checklist

### Pre-Deploy
- [ ] All environment variables set in Vercel
- [ ] Database migrations run on production DB
- [ ] Test build succeeds: `pnpm build`
- [ ] All TypeScript errors resolved

### Deploy
- [ ] Push code to GitHub
- [ ] Connect repository to Vercel
- [ ] Set environment variables in Vercel dashboard
- [ ] Deploy

### Post-Deploy
- [ ] Visit production `/setup` page
- [ ] Verify all checks are GREEN
- [ ] Configure Vercel cron jobs
- [ ] Test CSV upload on production
- [ ] Test subscription creation
- [ ] Test alert sending

---

## Quick Command Reference

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Test production build
pnpm seed             # Seed test data

# Database
pnpm db:push          # Push schema to database
pnpm db:migrate       # Create migration
pnpm db:generate      # Generate Prisma client

# Features
pnpm enrich           # Run spatial enrichment
pnpm script:load-geodata  # Download geodata files

# Testing
curl http://localhost:3000/api/setup                    # Check setup status
curl -X POST http://localhost:3000/api/enrichment/spatial -d '{"mode":"all"}'  # Enrich
curl -X POST http://localhost:3000/api/violations/recompute  # Detect violations
```

---

## Troubleshooting Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Database connection failed | Check `DATABASE_URL` in `.env` |
| NEXTAUTH_SECRET missing | Generate and add to `.env`, restart server |
| Map not loading | Set `NEXT_PUBLIC_MAPBOX_TOKEN` (optional) |
| Email not sending | Check `RESEND_API_KEY` is valid |
| Build fails | Run `pnpm build` to see TypeScript errors |
| Seed fails | Check database is accessible, run `pnpm db:push` first |

---

## Next Steps After Setup

1. ✅ **System is ready** when `/setup` page shows all green
2. 📊 **Upload real data** via `/ingest` page
3. 🔔 **Create subscriptions** for your monitoring areas
4. 📧 **Test alerts** to verify email/Slack delivery
5. 🚀 **Deploy to production** when ready

---

**Estimated Total Setup Time:** 15-20 minutes for basic setup, 1-2 hours for full production setup with all services.

**Questions?** Check `SETUP_GUIDE.md` for detailed instructions.




