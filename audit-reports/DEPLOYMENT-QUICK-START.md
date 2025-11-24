# Deployment Quick Start Guide

**Last Updated:** November 24, 2025
**Status:** Ready for Production Deployment ✅

---

## Pre-Deployment Checklist

- [x] All TypeScript errors fixed
- [x] Security vulnerabilities: 0
- [x] Node.js version requirement added (≥20.9.0)
- [x] .nvmrc created for Vercel
- [x] Build command verified
- [x] Environment variables documented

---

## Quick Deploy to Vercel (5 Minutes)

### Step 1: Push to GitHub (1 min)

```bash
git add .
git commit -m "Production-ready: Fixed all TypeScript errors and added Node 20 requirement"
git push origin main
```

### Step 2: Create Vercel Project (2 min)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework Preset: **Next.js** (auto-detected)
4. Root Directory: `./` (default)
5. Build Command: `prisma generate && next build` (from vercel.json)
6. Click **Deploy** (but it will fail without env vars - that's expected)

### Step 3: Configure Environment Variables (2 min)

In Vercel Dashboard → Settings → Environment Variables, add:

#### Required Variables

```bash
# Database (Supabase)
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.co:6543/postgres?pgbouncer=true
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Authentication
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=[Generate: openssl rand -base64 32]

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL="Stormwater Watch <alerts@yourdomain.org>"

# Maps (Mapbox)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNp...
MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNp...

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://yourdb-name.upstash.io
UPSTASH_REDIS_REST_TOKEN=AUcoAAIncDJlxxxxxxxxxxxxxxxxxxxxxxxxxx

# Cron Security
CRON_SECRET=[Generate: openssl rand -hex 16]

# External APIs
NWS_USER_AGENT=stormwater-watch.org (your-email@domain.org)

# App Config
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### Optional Variables (Add if needed)

```bash
# Slack Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXX
SLACK_CHANNEL=#stormwater-alerts

# AI Features (if enabled)
INTERNVL_ENABLED=false
```

**💡 Tip:** Generate secure secrets:
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# CRON_SECRET
openssl rand -hex 16
```

### Step 4: Redeploy (30 sec)

After adding environment variables:
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Check "Use existing build cache" (optional)
4. Click **Redeploy**

---

## Post-Deployment Verification (3 Minutes)

### 1. Check Deployment Status

✅ Build should complete successfully
✅ No TypeScript errors
✅ No build warnings

### 2. Test Core Features

Visit your deployment URL and test:

- [ ] Homepage loads
- [ ] Dashboard displays (even with no data)
- [ ] Map renders correctly
- [ ] Sign-in page works (can test email flow)
- [ ] Setup page accessible

### 3. Initialize Database (One-time)

Run from your local machine (or Vercel CLI):

```bash
# Set DATABASE_URL locally to production database
DATABASE_URL="your-production-db-url" npm run db:push
DATABASE_URL="your-production-db-url" npm run db:seed
```

**Or** run in Vercel CLI:
```bash
vercel env pull .env.production
npm run db:push
npm run db:seed
```

### 4. Verify Cron Jobs

Cron jobs are configured in `vercel.json`:
- Daily: 2:15 AM UTC (`15 2 * * *`)
- Weekly: 2:30 AM UTC on Mondays (`30 2 * * 1`)

To test cron manually:
```bash
curl -X POST https://your-app.vercel.app/api/cron/daily \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Troubleshooting

### Build Fails with Node Version Error

**Error:** "Node.js version >=20.9.0 is required"

**Solution:**
- Vercel should automatically use Node 20.x from package.json engines field
- If not, go to Settings → General → Node.js Version → Select "20.x"

### Build Fails with TypeScript Errors

**All TypeScript errors should be fixed.** If you see errors:

1. Pull latest changes: `git pull origin main`
2. Check audit report: `./audit-reports/deployment-audit-20251124.md`
3. Verify all fixes were committed

### Database Connection Errors

**Error:** "Can't reach database server"

**Checklist:**
- [ ] DATABASE_URL uses pooler connection string (port 6543)
- [ ] DATABASE_URL includes `?pgbouncer=true`
- [ ] Supabase project is not paused
- [ ] IP whitelist allows Vercel IPs (or disabled)

### Map Not Loading

**Error:** Map shows "Map unavailable"

**Checklist:**
- [ ] NEXT_PUBLIC_MAPBOX_TOKEN is set (with NEXT_PUBLIC_ prefix)
- [ ] Token is valid (test at mapbox.com)
- [ ] Token has public_ReadWrite scope

### Cron Jobs Not Executing

**Checklist:**
- [ ] CRON_SECRET is set in environment variables
- [ ] Cron paths match exactly: `/api/cron/daily` and `/api/cron/weekly`
- [ ] Check Vercel → Logs for cron execution

---

## Monitoring & Alerts

### Recommended: Set Up Sentry (5 minutes)

1. Create free Sentry account: [sentry.io](https://sentry.io)
2. Install:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard -i nextjs
   ```
3. Add `SENTRY_DSN` to Vercel environment variables
4. Redeploy

### Vercel Analytics

Already included with your Vercel account:
- Go to your project → Analytics
- View performance metrics, visitors, and errors

---

## Domain Configuration (Optional)

### Add Custom Domain

1. Go to Vercel project → Settings → Domains
2. Add your domain (e.g., `app.stormwaterwatch.org`)
3. Update DNS records as instructed
4. Update environment variables:
   ```bash
   NEXTAUTH_URL=https://app.stormwaterwatch.org
   NEXT_PUBLIC_APP_URL=https://app.stormwaterwatch.org
   ```
5. Redeploy

---

## Production URLs

After deployment, your app will be available at:

**Primary:**
- `https://your-app.vercel.app` (Vercel subdomain)
- `https://your-domain.com` (if custom domain added)

**API Endpoints:**
- Health check: `https://your-app.vercel.app/api/health`
- Violations: `https://your-app.vercel.app/api/violations`

**Cron Endpoints (Secured):**
- Daily: `https://your-app.vercel.app/api/cron/daily`
- Weekly: `https://your-app.vercel.app/api/cron/weekly`

---

## Rollback Procedure

If issues arise after deployment:

### Option 1: Redeploy Previous Version
1. Go to **Deployments** tab
2. Find last working deployment
3. Click **•••** → **Promote to Production**

### Option 2: Revert Git Commit
```bash
git revert HEAD
git push origin main
```
Vercel will auto-deploy the reverted version.

---

## Support & Resources

**Audit Reports:**
- Comprehensive audit: `./audit-reports/deployment-audit-20251124.md`
- Deferred issues: `./audit-reports/deferred-issues.md`

**Vercel Documentation:**
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Cron Jobs](https://vercel.com/docs/cron-jobs)

**Project Documentation:**
- Environment setup: `.env.example`
- Deployment guide: `DEPLOYMENT.md`

**Get Help:**
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Project Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

## Success Criteria

✅ **Deployment is successful when:**

- [ ] Build completes without errors
- [ ] Application loads at production URL
- [ ] Database connection works
- [ ] Authentication flow works
- [ ] Maps display correctly
- [ ] No console errors in browser
- [ ] Cron jobs execute on schedule
- [ ] Health check endpoint returns 200

---

**Happy Deploying!** 🚀

For detailed information, see: `./audit-reports/deployment-audit-20251124.md`
