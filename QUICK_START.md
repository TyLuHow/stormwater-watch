# 🚀 Quick Start Checklist

## Essential Manual Steps (15 minutes)

### ✅ Step 1: Environment Setup (5 min)

1. **Create `.env` file:**
   ```bash
   # Copy this template or create manually
   ```

2. **Set REQUIRED variables:**
   ```bash
   DATABASE_URL="postgresql://user:pass@localhost:5432/stormwater_watch"
   NEXTAUTH_SECRET="paste-generated-secret-here"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_FROM_EMAIL="alerts@yourdomain.org"
   RESEND_API_KEY="re_..."
   ```

3. **Generate NEXTAUTH_SECRET:**
   ```bash
   # PowerShell:
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
   ```

### ✅ Step 2: Database Setup (3 min)

```bash
# Install dependencies
pnpm install

# Create database (PostgreSQL) or use SQLite
# For SQLite (easiest for local):
# Just ensure DATABASE_URL="file:./dev.db" in .env

# Push schema
pnpm db:push

# Generate Prisma client
pnpm db:generate

# Seed test data
pnpm seed
```

### ✅ Step 3: Start Server (1 min)

```bash
pnpm dev
```

Visit: **http://localhost:3000**

### ✅ Step 4: Verify Setup (2 min)

1. Go to: **http://localhost:3000/setup**
2. Check all integration statuses
3. Fix any **FAILED** (red) items
4. **WARNINGS** (yellow) are OK - those are optional services

### ✅ Step 5: Test Core Features (4 min)

**Test Dashboard:**
- Visit: http://localhost:3000/dashboard
- Should show test data from seed

**Test Facility Page:**
- Click on a facility from dashboard
- Should show facility details, violations, samples

**Test Subscription:**
- Visit: http://localhost:3000/subscriptions
- Create a test subscription
- Verify it appears in list

---

## Optional: Full Production Setup (30 minutes)

### Load Geodata
```bash
# Download geodata files (see SETUP_GUIDE.md for sources)
# Place in: public/geodata/
# Then run:
pnpm enrich
```

### Configure External Services
- **Resend:** Sign up, get API key, verify domain
- **Slack:** Create webhook, add URL to `.env`
- **Mapbox:** Sign up, get token, add to `.env`
- **Supabase:** Create project, get credentials (optional)
- **Redis:** Create Upstash database (optional)

### Deploy to Production
1. Push to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel
4. Deploy
5. Configure cron jobs in Vercel dashboard

---

## ⚠️ Common Issues

**"Database connection failed"**
- Check `DATABASE_URL` is correct
- Verify PostgreSQL is running (if using PostgreSQL)
- For SQLite: ensure `DATABASE_URL="file:./dev.db"`

**"NEXTAUTH_SECRET is missing"**
- Generate secret and add to `.env`
- Restart dev server

**"Map unavailable"**
- Set `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env`
- Maps will work without it, but won't display

**"Email not sending"**
- Check `RESEND_API_KEY` is valid
- Verify Resend account is active
- Check email isn't in spam

---

## 📚 Full Documentation

- **SETUP_GUIDE.md** - Complete setup instructions
- **DEPLOYMENT.md** - Production deployment guide
- **IMPLEMENTATION_STATUS.md** - Feature status

---

## ✅ You're Ready When...

- [ ] Server runs without errors
- [ ] `/setup` page shows all green checks (or yellow warnings)
- [ ] Dashboard loads with test data
- [ ] You can create a subscription
- [ ] Facility pages show data
- [ ] Case packet generation works (if violations exist)

**Once these pass, you're ready to use the system!**




