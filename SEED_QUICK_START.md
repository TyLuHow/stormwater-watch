# Database Seeds - Quick Start Guide

## What Was Created

Two new seed scripts for the Stormwater Watch platform:

1. **seed-pollutants.ts** - Configures 12 stormwater pollutants (REQUIRED)
2. **seed-test-data.ts** - Creates test facility and violations (OPTIONAL)

## Quick Start

### Step 1: Verify Database Connection
```bash
# Check that DATABASE_URL is set in .env
grep DATABASE_URL .env

# Generate Prisma client
npm run db:generate
```

### Step 2: Seed Pollutant Configuration (REQUIRED)
```bash
npm run db:seed:pollutants
```

This configures the pollutant alias mapping needed for CSV data normalization.

### Step 3: Optionally Seed Test Data
```bash
npm run db:seed:test-data
```

Creates a test facility with sample violations for UI testing.

### Step 4: Verify in Prisma Studio
```bash
npm run db:studio
```

Check that ConfigPollutant table has 12 entries.

## Pollutants Configured

| Key | Unit | Aliases |
|-----|------|---------|
| TSS | mg/L | Total Suspended Solids, Suspended Solids, TSS mg/L |
| O&G | mg/L | Oil and Grease, Oil & Grease, O/G |
| pH | pH | pH, pH VALUE, pH Units |
| COPPER | µg/L | Copper, Cu, Total Copper, Copper µg/L |
| ZINC | µg/L | Zinc, Zn, Total Zinc, Zinc µg/L |
| LEAD | µg/L | Lead, Pb, Total Lead, Lead µg/L |
| IRON | µg/L | Iron, Fe, Total Iron, Iron µg/L |
| ALUMINUM | µg/L | Aluminum, Al, Aluminum µg/L |
| NITRATE | mg/L | Nitrate, Nitrate-N, Nitrate as N |
| PHOSPHORUS | mg/L | Phosphorus, Total Phosphorus, Phosphate |
| COD | mg/L | Chemical Oxygen Demand, COD mg/L |
| BOD | mg/L | Biological Oxygen Demand, BOD5 |

## Test Data Created

- **Facility:** SF Bay Test Facility (TEST-SF-BAY-001)
- **Location:** San Francisco (37.7749, -122.4194)
- **Status:** Disadvantaged Community (DAC)
- **Samples:** 3 (TSS x2, COPPER x1)
- **Violations:** 2 (TSS, COPPER)

## Why This Matters

The ConfigPollutant table is **CRITICAL** for the data ingestion pipeline:

1. SMARTS CSV files use varying pollutant names
2. The seed configures aliases to normalize these
3. `lib/ingest/normalize.ts` uses these aliases to map CSV data
4. Dashboard displays normalized data with consistent names

## Troubleshooting

### Database Connection Error: "FATAL: Tenant or user not found"

**Fix:**
1. Go to Supabase dashboard
2. Project Settings → Database
3. Copy connection string to DATABASE_URL in .env
4. Run: `npm run db:seed:pollutants`

### tsx/esbuild Platform Error

**Fix:**
```bash
npx tsc prisma/seed-pollutants.ts --module commonjs --target es2020
node prisma/seed-pollutants.js
```

## Complete Documentation

See `DATABASE_SEED.md` for:
- Detailed installation instructions
- Expected output examples
- Full troubleshooting guide
- Integration details
- Database schema reference

## Files

- `prisma/seed-pollutants.ts` - Pollutant configuration
- `prisma/seed-test-data.ts` - Test facility and violations
- `DATABASE_SEED.md` - Full documentation
- `package.json` - Updated with npm scripts

## Next Steps

1. Run: `npm run db:seed:pollutants`
2. Test CSV ingestion with sample SMARTS file
3. Verify data normalizes correctly
4. Run: `npm run db:seed:test-data` (optional, for testing)

---

**Documentation:** See `DATABASE_SEED.md` for complete reference.
