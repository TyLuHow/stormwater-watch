<objective>
Implement the eSMR data import pipeline based on the schema analysis from prompt 006.

This prompt DEPENDS on `./research/esmr-schema-analysis.md` and `./prisma/schema-esmr-proposed.prisma` being completed first. Read those files to understand the schema design before implementing.
</objective>

<context>
**Prerequisites** (must exist before running this prompt):
- `./research/esmr-schema-analysis.md` - Schema analysis with field mappings
- `./prisma/schema-esmr-proposed.prisma` - Proposed Prisma models

**Data Source**:
- eSMR CSV files from data.ca.gov
- Monthly updates, yearly files available
- Files can be 600MB+, requires streaming approach

**Tech Stack**:
- Next.js 16 with App Router
- Prisma ORM with PostgreSQL
- TypeScript
- csv-parse for CSV parsing (already in package.json)
</context>

<requirements>

<phase name="schema-integration">
**Integrate the proposed schema into the project**

1. Read `./prisma/schema-esmr-proposed.prisma`
2. Merge new models into `./prisma/schema.prisma`
3. Ensure no conflicts with existing models
4. Run `npx prisma db push` to update database (or create migration)
5. Run `npx prisma generate` to update client
</phase>

<phase name="type-definitions">
**Create TypeScript types matching the schema**

File: `./lib/types/esmr.ts`
- Raw CSV row type (as parsed from CSV)
- Transformed record type (ready for database)
- Import options type
- Import result/statistics type
</phase>

<phase name="download-service">
**Create download service for eSMR files**

File: `./lib/services/esmr/download.ts`

Requirements:
- Function to download by year: `downloadESMRByYear(year: number)`
- Function to download full dataset: `downloadESMRFull()`
- Stream downloads to disk (don't load 600MB into memory)
- Save to `./data/esmr/` directory
- Return file path and metadata (size, checksum)
- Handle download failures gracefully
- Support resume/retry for large files
</phase>

<phase name="parser-service">
**Create streaming CSV parser**

File: `./lib/services/esmr/parser.ts`

Requirements:
- Use csv-parse with streaming API
- Transform raw CSV columns to schema field names (use mappings from analysis)
- Parse dates, numbers, handle nulls appropriately
- Yield records in batches (configurable batch size, default 1000)
- Track and collect parse errors without stopping
- Emit progress events (records parsed, errors, etc.)
</phase>

<phase name="import-service">
**Create main import orchestration**

File: `./lib/services/esmr/import.ts`

Requirements:
- Main function: `importESMR(options: ImportOptions)`
- Options: year, dryRun, batchSize, onProgress callback
- For each batch:
  1. Validate records
  2. Upsert to database (handle duplicates)
  3. Track statistics
- Return comprehensive import summary
- Support cancellation
- Log to console with progress indicator
</phase>

<phase name="cli-script">
**Create CLI script for running imports**

File: `./scripts/import-esmr.ts`

Requirements:
- Parse args: --year=2025, --all, --dry-run, --batch-size=1000
- Show progress bar or percentage
- Print summary at end
- Exit codes: 0 success, 1 error

Add to package.json:
```json
"import:esmr": "tsx scripts/import-esmr.ts"
```

Usage examples:
```bash
npm run import:esmr -- --year=2025 --dry-run
npm run import:esmr -- --year=2025
npm run import:esmr -- --all
```
</phase>

<phase name="api-routes">
**Create API routes for triggering imports**

File: `./app/api/import/esmr/route.ts`
- POST: Trigger import (body: { year, dryRun })
- Requires authentication (admin only)
- Returns job ID for tracking

File: `./app/api/import/esmr/[jobId]/route.ts`
- GET: Check import status by job ID
- Returns progress, stats, errors
</phase>

</requirements>

<implementation_notes>

**Batch Processing Pattern**:
```typescript
async function* parseInBatches(filePath: string, batchSize: number) {
  const parser = fs.createReadStream(filePath).pipe(parse({ columns: true }));
  let batch: Record[] = [];

  for await (const record of parser) {
    batch.push(transform(record));
    if (batch.length >= batchSize) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length > 0) yield batch;
}
```

**Upsert Strategy**:
Use Prisma's createMany with skipDuplicates, or implement upsert logic based on unique constraints defined in schema.

**Progress Tracking**:
Use a simple in-memory store or Redis (if available via Upstash) to track import job progress for the API.

**Error Recovery**:
- Log failed records to `./data/esmr/errors-{timestamp}.json`
- Continue processing on individual record failures
- Fail fast on critical errors (DB connection, file not found)
</implementation_notes>

<output>
Create/modify these files:
- `./prisma/schema.prisma` - Merge eSMR models
- `./lib/types/esmr.ts` - TypeScript types
- `./lib/services/esmr/download.ts` - Download service
- `./lib/services/esmr/parser.ts` - CSV parser
- `./lib/services/esmr/import.ts` - Import orchestration
- `./lib/services/esmr/index.ts` - Re-exports
- `./scripts/import-esmr.ts` - CLI script
- `./app/api/import/esmr/route.ts` - API trigger
- `./package.json` - Add npm script

Ensure directory exists:
- `./data/esmr/.gitkeep`
</output>

<verification>
Before declaring complete:

1. Schema is integrated:
```bash
npx prisma db push
npx prisma generate
```

2. TypeScript compiles:
```bash
npm run type-check
```

3. Dry run works with sample data:
```bash
# First ensure sample exists from prompt 006
npm run import:esmr -- --year=2025 --dry-run
```

4. Test API endpoint (if dev server available):
```bash
curl -X POST http://localhost:3000/api/import/esmr \
  -H "Content-Type: application/json" \
  -d '{"year": 2025, "dryRun": true}'
```
</verification>

<success_criteria>
- [ ] eSMR Prisma models merged into schema.prisma
- [ ] Database updated with new tables
- [ ] TypeScript types match schema
- [ ] Download service can fetch CSV files
- [ ] Parser streams large files without memory issues
- [ ] Import service processes batches and tracks stats
- [ ] CLI script runs with --dry-run successfully
- [ ] All TypeScript compiles without errors
- [ ] Import creates records in database (non-dry-run)
</success_criteria>
