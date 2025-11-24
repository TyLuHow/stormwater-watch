# Database Seeding Guide - Stormwater Watch

## Overview

This document describes the database seeding scripts created for the Stormwater Watch platform. These scripts populate the `ConfigPollutant` table (required for data ingestion) and optionally create test data for development.

## Created Seed Scripts

### 1. Pollutant Configuration Seed (Required)

**File:** `/prisma/seed-pollutants.ts`

**Purpose:** Populates the `ConfigPollutant` table with 12 common stormwater pollutants and their alias mappings.

**What it seeds:**
- **TSS** (Total Suspended Solids) - mg/L
- **O&G** (Oil & Grease) - mg/L
- **pH** - pH units
- **COPPER** - µg/L
- **ZINC** - µg/L
- **LEAD** - µg/L
- **IRON** - µg/L
- **ALUMINUM** - µg/L
- **NITRATE** - mg/L
- **PHOSPHORUS** - mg/L
- **COD** (Chemical Oxygen Demand) - mg/L
- **BOD** (Biochemical Oxygen Demand) - mg/L

Each pollutant includes:
- **key:** Canonical identifier (e.g., "TSS", "COPPER")
- **aliases:** Array of alternate names used in CSV files (e.g., "Total Suspended Solids", "Suspended Solids")
- **canonicalUnit:** Standard unit for storage and comparison
- **notes:** Reference information about benchmarks and usage

**Why this is important:**
The data normalization pipeline (`lib/ingest/normalize.ts`) uses ConfigPollutant to map varying pollutant names from different California SMARTS CSV reports to canonical keys and units. Without this table populated, CSV ingestion will fail.

**Safe to run multiple times:** Yes - uses upsert pattern, so re-running won't create duplicates.

### 2. Test Data Seed (Optional)

**File:** `/prisma/seed-test-data.ts`

**Purpose:** Creates sample test data for UI development and manual testing.

**What it creates:**
- **1 Test Facility:** "SF Bay Test Facility" in San Francisco (DAC - Disadvantaged Community)
- **3 Test Samples:**
  - TSS = 150.5 mg/L (exceeds 100 mg/L benchmark) - 30 days ago
  - TSS = 175.25 mg/L (exceeds 100 mg/L benchmark) - 25 days ago
  - COPPER = 25.5 µg/L (exceeds 14 µg/L benchmark) - 20 days ago
- **2 Test Violation Events:**
  - TSS violation with 2 exceedances (max ratio: 1.75)
  - COPPER violation with 1 exceedance (max ratio: 1.82)

**Safe to run multiple times:** Yes - uses upsert pattern.

## How to Run the Seeds

### Prerequisites

1. **Environment Setup**
   ```bash
   # Ensure .env is configured with DATABASE_URL
   cat .env | grep DATABASE_URL
   ```

2. **Prisma Client Generation**
   ```bash
   npm run db:generate
   ```

3. **Database Connection**
   The seeds require a working database connection. Update `.env` with your Supabase credentials:
   ```
   DATABASE_URL="postgresql://user:password@host:port/database?pgbouncer=true"
   ```

### Running the Seeds

#### Option 1: Using npm scripts (Recommended)

Add these scripts to `package.json`:
```json
{
  "scripts": {
    "db:seed:pollutants": "tsx prisma/seed-pollutants.ts",
    "db:seed:test-data": "tsx prisma/seed-test-data.ts"
  }
}
```

Then run:
```bash
# Seed pollutant configuration (required)
npm run db:seed:pollutants

# Seed test data (optional)
npm run db:seed:test-data
```

#### Option 2: Direct execution with npx

```bash
# Compile TypeScript to JavaScript
npx tsc prisma/seed-pollutants.ts --module commonjs --target es2020

# Run the compiled JavaScript
node prisma/seed-pollutants.js

# Repeat for test data
npx tsc prisma/seed-test-data.ts --module commonjs --target es2020
node prisma/seed-test-data.js
```

#### Option 3: Using tsx (if esbuild platform issue is fixed)

```bash
npx tsx prisma/seed-pollutants.ts
npx tsx prisma/seed-test-data.ts
```

## Expected Output

### Pollutant Configuration Seed

```
🌱 Seeding ConfigPollutant table...
✓ TSS: mg/L (5 aliases)
✓ O&G: mg/L (5 aliases)
✓ PH: pH (5 aliases)
✓ COPPER: µg/L (6 aliases)
✓ ZINC: µg/L (6 aliases)
✓ LEAD: µg/L (6 aliases)
✓ IRON: µg/L (6 aliases)
✓ ALUMINUM: µg/L (6 aliases)
✓ NITRATE: mg/L (5 aliases)
✓ PHOSPHORUS: mg/L (6 aliases)
✓ COD: mg/L (4 aliases)
✓ BOD: mg/L (5 aliases)

✅ ConfigPollutant seeding complete!
Total pollutants in database: 12
```

### Test Data Seed

```
🌱 Seeding test data (facility and violations)...

Creating test facility...
✓ Facility: SF Bay Test Facility (TEST-SF-BAY-001) at (37.7749, -122.4194)

Creating test samples...
✓ Sample: TSS = 150.5 mg/L (ratio: 1.51)
✓ Sample: TSS = 175.25 mg/L (ratio: 1.75)
✓ Sample: COPPER = 25.5 µg/L (ratio: 1.82)

Creating test violation events...
✓ Violation: TSS (2 exceedances, max ratio: 1.75)
✓ Violation: COPPER (1 exceedance, max ratio: 1.82)

✅ Test data seeding complete!
```

## Verifying the Seeds

After running the seeds, verify the data:

```bash
# Open Prisma Studio
npm run db:studio

# Or query directly
npm run db:seed:pollutants  # Run again to see idempotent behavior
```

In Prisma Studio, navigate to:
- **ConfigPollutant** - Should show 12 pollutants
- **Facility** - Should show test facility (if test-data seed was run)
- **Sample** - Should show 3 test samples (if test-data seed was run)
- **ViolationEvent** - Should show 2 test violations (if test-data seed was run)

## Troubleshooting

### Error: "FATAL: Tenant or user not found"

**Cause:** The DATABASE_URL in `.env` has invalid credentials or the Supabase project is not accessible.

**Solution:**
1. Verify Supabase credentials:
   ```bash
   # Check your .env file
   cat .env | grep "DATABASE_URL\|SUPABASE"
   ```

2. Update with correct credentials from Supabase dashboard:
   - Go to Supabase dashboard
   - Project Settings → Database
   - Copy the connection string and update `.env`

3. Test the connection:
   ```bash
   npm run db:studio
   ```

### Error: "Prisma client not generated"

**Cause:** Prisma client binary wasn't generated.

**Solution:**
```bash
npm run db:generate
```

### Error: "Cannot find module 'tsx'"

**Cause:** tsx is not installed or esbuild has platform compatibility issues.

**Solution:**
- Use TypeScript compilation directly:
  ```bash
  npx tsc prisma/seed-pollutants.ts --module commonjs --target es2020
  node prisma/seed-pollutants.js
  ```

### Seeds don't seem to run

**Cause:** Seeds may need Prisma Client to be generated first.

**Solution:**
```bash
# Generate Prisma Client
npm run db:generate

# Then run seed
node prisma/seed-pollutants.js
```

## Integration with Data Ingestion

The ConfigPollutant table is essential for the CSV ingestion pipeline:

1. **CSV Upload** → `/api/ingest/smarts-upload`
2. **Normalization** → `lib/ingest/normalize.ts` uses ConfigPollutant aliases
3. **Sample Storage** → Data normalized to canonical keys/units
4. **Dashboard Display** → Unified pollutant names across all sources

Example normalization in `lib/ingest/normalize.ts`:
```typescript
// Load pollutant config
const pollutants = await prisma.configPollutant.findMany()

// Create alias map
const pollutantMap = new Map<string, string>()
for (const p of pollutants) {
  for (const alias of p.aliases) {
    pollutantMap.set(alias.toLowerCase(), p.key)
  }
}

// Use to normalize incoming data
const pollutantRawLower = pollutantRaw.trim().toLowerCase()
const pollutant = pollutantMap.get(pollutantRawLower) || pollutantRaw.trim().toUpperCase()
```

## Database Schema

### ConfigPollutant Table

```prisma
model ConfigPollutant {
  key           String   @id              // e.g., "TSS", "COPPER"
  aliases       String[]                  // Array of alternate names
  canonicalUnit String                    // e.g., "mg/L", "µg/L"
  notes         String?  @db.Text         // Reference notes
}
```

## Next Steps

1. **Seed the pollutant configuration** (required for ingestion):
   ```bash
   npm run db:seed:pollutants
   ```

2. **Test CSV ingestion** - Upload a test SMARTS report to verify normalization

3. **Optionally seed test data** for UI testing:
   ```bash
   npm run db:seed:test-data
   ```

4. **View data** in Prisma Studio:
   ```bash
   npm run db:studio
   ```

## Support

- **Prisma Documentation:** https://www.prisma.io/docs/
- **Supabase Database:** https://supabase.com/docs/guides/database
- **Project README:** See `README.md` for setup instructions

---

**Created:** 2025-11-24
**Schema Version:** From `prisma/schema.prisma`
**Seed Scripts Version:** 1.0
