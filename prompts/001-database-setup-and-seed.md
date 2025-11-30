<objective>
Set up the Supabase PostgreSQL database for Stormwater Watch and seed it with initial data.

This is the critical first step to get the MVP running with a real database instead of demo/mock data.
</objective>

<context>
- Next.js 16 app using Prisma ORM with Supabase PostgreSQL
- All environment variables are already configured in Vercel (DATABASE_URL, SUPABASE_URL, etc.)
- Prisma schema exists at `prisma/schema.prisma` with binaryTargets configured for Vercel
- Seed script exists at `prisma/seed.ts`
- The user needs guidance on running Prisma commands locally
</context>

<requirements>
1. Guide the user through setting up their local environment to run Prisma commands
2. Push the database schema to Supabase
3. Seed the database with test data
4. Verify the database is working
</requirements>

<implementation>
<step_1>
First, check if the user has the DATABASE_URL available locally:

```bash
# Check if .env file exists
cat .env 2>/dev/null | grep DATABASE_URL || echo "No local .env with DATABASE_URL"
```

If no local DATABASE_URL, help the user create a `.env` file:
- They can get the DATABASE_URL from Vercel: Project Settings → Environment Variables → DATABASE_URL → click to reveal
- Or from Supabase: Settings → Database → Connection string (URI)

Create `.env` file with:
```
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-us-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true"
```
</step_1>

<step_2>
Generate Prisma Client and push schema:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push
```

Expected output: "Your database is now in sync with your Prisma schema."
</step_2>

<step_3>
Seed the database with test data:

```bash
npm run db:seed
```

Expected output should show:
- 3 users created (1 ADMIN, 2 PARTNER)
- 10 facilities across 3 California counties
- ~130 samples over 90 days
- 3 subscriptions (POLYGON, BUFFER, JURISDICTION)
- Pollutant configs
</step_3>

<step_4>
Verify database is working by checking Supabase:
- Go to Supabase Dashboard → Table Editor
- You should see tables: User, Facility, Sample, ViolationEvent, Subscription, Alert, Provenance, ConfigPollutant

Or run:
```bash
npx prisma studio
```
This opens a visual database browser at http://localhost:5555
</step_4>
</implementation>

<verification>
After completing these steps, verify:
1. Run the app locally: `npm run dev`
2. Go to http://localhost:3000/dashboard
3. Should see REAL data (10 facilities, samples, violations) instead of the 3 mock facilities
4. Check that "Demo Mode" badge is NOT showing

If still showing demo mode, check:
- SUPABASE_URL environment variable is set
- Database connection is working (try `npx prisma db pull` to verify)
</verification>

<success_criteria>
- Database tables created in Supabase
- Test data seeded successfully
- Local app shows real data from database
- Ready to deploy and test on Vercel
</success_criteria>
