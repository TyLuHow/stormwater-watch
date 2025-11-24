<objective>
Create and execute database seeding scripts to populate the ConfigPollutant table with pollutant aliases and optionally create test facility/sample data for development. These seeds enable the data normalization pipeline and provide sample data for UI testing.

The ConfigPollutant table is critical for the ingestion system to map varying pollutant names (e.g., "Total Suspended Solids", "TSS mg/L", "Suspended Solids") to canonical keys and units.
</objective>

<context>
The Stormwater Watch platform normalizes diverse CSV data from California SMARTS reports. Pollutant names vary across reports, so the system uses a configurable alias mapping stored in the ConfigPollutant database table.

Project: Stormwater Watch (Next.js 14 + Prisma + Supabase)
Database schema: `./prisma/schema.prisma`
Used by: `lib/ingest/normalize.ts` for pollutant normalization during CSV import
</context>

<requirements>
Create two seed scripts:

1. **Pollutant Configuration Seed** (Required):
   - Populate ConfigPollutant table with 12 common stormwater pollutants
   - Each pollutant includes: key, aliases array, canonicalUnit, notes
   - Use upsert to avoid duplicates (safe to run multiple times)
   - Covers: TSS, O&G, pH, metals (Copper, Zinc, Lead, Iron, Aluminum), nutrients (Nitrate, Phosphorus), organics (COD, BOD)

2. **Test Data Seed** (Optional - for development):
   - Create 1 test facility (San Francisco Bay Area)
   - Create 3 sample violations (TSS x2, Copper x1) with exceedances
   - Use upsert to avoid duplicates if run multiple times

Both scripts should:
- Use Prisma Client
- Include proper error handling
- Report what was seeded
- Be safe to run multiple times (idempotent)
</requirements>

<implementation>
Execute these steps sequentially:

### Step 1: Verify ConfigPollutant Model Exists

Check that the schema has the ConfigPollutant model:

```bash
grep -A 10 "model ConfigPollutant" prisma/schema.prisma
```

If not found, report error and suggest checking schema. The model should have:
- id (auto-increment)
- key (unique string)
- aliases (string array)
- canonicalUnit (string)
- notes (nullable string)

### Step 2: Create Pollutant Configuration Seed

Create `./prisma/seed-pollutants.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const pollutants = [
  {
    key: 'TSS',
    aliases: ['Total Suspended Solids', 'TSS', 'TSS mg/L', 'Suspended Solids', 'Total Suspended Solids (TSS)'],
    canonicalUnit: 'mg/L',
    notes: 'Standard benchmark: 100 mg/L. Common in stormwater runoff.'
  },
  {
    key: 'OG',
    aliases: ['Oil and Grease', 'O&G', 'HEM', 'Oil & Grease', 'Hexane Extractable Material'],
    canonicalUnit: 'mg/L',
    notes: 'Standard benchmark: 15 mg/L. Use HEM (Hexane Extractable Material) method.'
  },
  {
    key: 'PH',
    aliases: ['pH', 'PH', 'pH Units', 'pH (SU)'],
    canonicalUnit: 'SU',
    notes: 'Range check: 6.0-9.0 (no exceedance ratio calculated, uses range)'
  },
  {
    key: 'COPPER',
    aliases: ['Copper', 'Cu', 'Copper total recoverable', 'Total Copper', 'Copper, Total'],
    canonicalUnit: 'ug/L',
    notes: 'NAL varies. Convert mg/L to ug/L (multiply by 1000). Common industrial pollutant.'
  },
  {
    key: 'ZINC',
    aliases: ['Zinc', 'Zn', 'Zinc total recoverable', 'Total Zinc', 'Zinc, Total'],
    canonicalUnit: 'ug/L',
    notes: 'NAL varies. Convert mg/L to ug/L (multiply by 1000). Common in metal finishing.'
  },
  {
    key: 'LEAD',
    aliases: ['Lead', 'Pb', 'Lead total recoverable', 'Total Lead', 'Lead, Total'],
    canonicalUnit: 'ug/L',
    notes: 'NAL varies. Convert mg/L to ug/L (multiply by 1000). Toxic metal.'
  },
  {
    key: 'IRON',
    aliases: ['Iron', 'Fe', 'Iron total recoverable', 'Total Iron', 'Iron, Total'],
    canonicalUnit: 'ug/L',
    notes: 'Convert mg/L to ug/L (multiply by 1000).'
  },
  {
    key: 'ALUMINUM',
    aliases: ['Aluminum', 'Al', 'Aluminum total recoverable', 'Total Aluminum', 'Aluminium'],
    canonicalUnit: 'ug/L',
    notes: 'Convert mg/L to ug/L (multiply by 1000). Common in manufacturing.'
  },
  {
    key: 'COD',
    aliases: ['Chemical Oxygen Demand', 'COD', 'COD mg/L', 'COD (Chemical Oxygen Demand)'],
    canonicalUnit: 'mg/L',
    notes: 'Measure of organic pollutants. Higher values indicate more contamination.'
  },
  {
    key: 'BOD',
    aliases: ['Biochemical Oxygen Demand', 'BOD5', 'BOD', 'BOD mg/L', 'BOD (5 day)'],
    canonicalUnit: 'mg/L',
    notes: 'Measure of biodegradable organic matter. Typically 5-day test (BOD5).'
  },
  {
    key: 'NITRATE',
    aliases: ['Nitrate', 'NO3', 'Nitrate-N', 'Nitrate as N', 'Nitrate + Nitrite'],
    canonicalUnit: 'mg/L',
    notes: 'Nutrient pollution. May be reported as nitrogen (N) fraction.'
  },
  {
    key: 'PHOSPHORUS',
    aliases: ['Phosphorus', 'Total Phosphorus', 'TP', 'Phosphorus, Total', 'P'],
    canonicalUnit: 'mg/L',
    notes: 'Nutrient pollution. Can cause algal blooms in receiving waters.'
  },
]

async function main() {
  console.log('🌱 Seeding pollutant configuration...\n')

  let created = 0
  let updated = 0

  for (const p of pollutants) {
    const result = await prisma.configPollutant.upsert({
      where: { key: p.key },
      update: {
        aliases: p.aliases,
        canonicalUnit: p.canonicalUnit,
        notes: p.notes
      },
      create: p,
    })

    // Check if it was just created or updated (Prisma doesn't return this info directly)
    // Simple heuristic: if all fields match exactly, it was probably already there
    console.log(`  ✓ ${p.key} (${p.canonicalUnit})`)
    created++
  }

  console.log(`\n✅ Seeded ${pollutants.length} pollutant configurations`)
  console.log('   These enable normalization of varied pollutant names in SMARTS CSV imports\n')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### Step 3: Create Test Data Seed (Optional)

Create `./prisma/seed-test-data.ts`:

```typescript
import { PrismaClient, Decimal } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding test data for development...\n')

  // Create test facility in San Francisco Bay Area
  const facility = await prisma.facility.upsert({
    where: { permitId: 'TEST-001' },
    update: {},
    create: {
      name: 'Test Industrial Facility - SF Bay',
      permitId: 'TEST-001',
      naicsCode: '336111', // Automobile manufacturing
      lat: new Decimal('37.7749'),
      lon: new Decimal('-122.4194'),
      county: 'San Francisco',
      watershedHuc12: '180500020101',
      ms4Jurisdiction: 'San Francisco',
      receivingWater: 'San Francisco Bay',
      isInDAC: false,
      lastSeenAt: new Date(),
    }
  })
  console.log(`✓ Created facility: ${facility.name} (${facility.id})`)

  // Create test samples with exceedances (2024 reporting year)
  const samples = await prisma.sample.createMany({
    data: [
      {
        facilityId: facility.id,
        sampleDate: new Date('2024-01-15'),
        pollutant: 'TSS',
        value: new Decimal('250'),
        unit: 'mg/L',
        benchmark: new Decimal('100'),
        benchmarkUnit: 'mg/L',
        exceedanceRatio: new Decimal('2.5'),
        reportingYear: '2023-2024',
        source: 'TEST_SEED',
        sourceDocUrl: 'https://example.com/test-seed',
      },
      {
        facilityId: facility.id,
        sampleDate: new Date('2024-02-20'),
        pollutant: 'TSS',
        value: new Decimal('180'),
        unit: 'mg/L',
        benchmark: new Decimal('100'),
        benchmarkUnit: 'mg/L',
        exceedanceRatio: new Decimal('1.8'),
        reportingYear: '2023-2024',
        source: 'TEST_SEED',
        sourceDocUrl: 'https://example.com/test-seed',
      },
      {
        facilityId: facility.id,
        sampleDate: new Date('2024-03-10'),
        pollutant: 'COPPER',
        value: new Decimal('50'),
        unit: 'ug/L',
        benchmark: new Decimal('25'),
        benchmarkUnit: 'ug/L',
        exceedanceRatio: new Decimal('2.0'),
        reportingYear: '2023-2024',
        source: 'TEST_SEED',
        sourceDocUrl: 'https://example.com/test-seed',
      },
    ],
    skipDuplicates: true,
  })
  console.log(`✓ Created ${samples.count} test samples with exceedances\n`)

  console.log('✅ Test data seeded successfully!')
  console.log('   View in Prisma Studio: npm run db:studio')
  console.log('   Test violation detection: npm run dev -> visit /dashboard\n')
}

main()
  .catch((e) => {
    console.error('❌ Test data seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### Step 4: Execute Seeds

Run the pollutant configuration seed (required):

```bash
# Check if DATABASE_URL is configured
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set. Configure .env before running seeds."
  echo "   See .env.example for required variables"
  exit 1
fi

echo "Running pollutant configuration seed..."
npx tsx prisma/seed-pollutants.ts

echo ""
echo "Run test data seed? (optional - creates 1 facility + 3 samples for testing)"
read -p "Run test seed? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Running test data seed..."
  npx tsx prisma/seed-test-data.ts
else
  echo "Skipped test data seed. Run manually with: npx tsx prisma/seed-test-data.ts"
fi
```
</implementation>

<error_handling>
Handle these scenarios gracefully:

1. **DATABASE_URL not set**: Report error with instructions to configure .env
2. **Prisma client not generated**: Run `npx prisma generate` first
3. **Database connection failed**: Report connection error with troubleshooting steps
4. **ConfigPollutant model not found**: Report schema mismatch and suggest checking prisma/schema.prisma
5. **Duplicate key errors**: Should not occur due to upsert, but catch and report if it does

Do NOT fail silently. Report clear error messages with actionable next steps.
</error_handling>

<output>
Create a summary report and save to `./DATABASE_SEED.md`:

```markdown
# Database Seeding Status

## Pollutant Configuration
- Status: [✅ COMPLETE / ❌ FAILED]
- Records: 12 pollutant aliases configured
- File: `prisma/seed-pollutants.ts`

## Test Data (Optional)
- Status: [✅ COMPLETE / ⏭️ SKIPPED / ❌ FAILED]
- Facilities: 1 test facility
- Samples: 3 test samples with exceedances
- File: `prisma/seed-test-data.ts`

## Next Steps

1. Verify seeds in Prisma Studio: `npm run db:studio`
2. Test CSV import: Upload a SMARTS CSV via `/ingest`
3. Check normalization: Samples should map to canonical pollutant keys
4. Run violation detection: `POST /api/violations/recompute`

## Troubleshooting

If pollutant normalization fails:
- Check ConfigPollutant table has records
- Verify aliases include variations from your CSV
- Add new aliases via Prisma Studio or re-run seed with updates

## Re-running Seeds

Both seeds are idempotent (safe to run multiple times):
- Pollutants: `npx tsx prisma/seed-pollutants.ts`
- Test data: `npx tsx prisma/seed-test-data.ts`
```
</output>

<verification>
Before declaring complete, verify:

1. Files created:
   - `./prisma/seed-pollutants.ts`
   - `./prisma/seed-test-data.ts`
   - `./DATABASE_SEED.md`

2. Check DATABASE_URL is set:
```bash
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."
```

3. If database is accessible, run the pollutant seed:
```bash
npx tsx prisma/seed-pollutants.ts
```

4. Verify records in database:
```bash
# Using Prisma Studio
npm run db:studio
# Or direct query (if psql available)
# psql $DATABASE_URL -c "SELECT key, array_length(aliases, 1) as alias_count FROM \"ConfigPollutant\";"
```

5. Report seed execution results with clear success/failure indicators
</verification>

<success_criteria>
- Both seed files created with proper TypeScript and Prisma syntax
- Pollutant seed executes successfully (12 records in ConfigPollutant table)
- Test seed is available but optional (user can choose to run)
- DATABASE_SEED.md created with status and instructions
- Seeds are idempotent (can be run multiple times safely)
- Clear error messages if database is not accessible
- User knows how to verify seeds and re-run if needed
</success_criteria>
