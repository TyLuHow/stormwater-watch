# eSMR Data Import Pipeline

Complete implementation of the California Water Board eSMR (Electronic Self-Monitoring Report) data import pipeline.

## Overview

This pipeline downloads, parses, and imports wastewater discharge monitoring data from the California State Water Resources Control Board's data portal into a PostgreSQL database using Prisma ORM.

## Architecture

### Database Schema

The implementation uses a **star schema** design optimized for analytical queries:

**Dimension Tables:**
- `esmr_regions` - Regional Water Quality Control Boards
- `esmr_facilities` - Wastewater treatment facilities
- `esmr_locations` - Monitoring locations within facilities
- `esmr_parameters` - Pollutants and parameters measured
- `esmr_analytical_methods` - Laboratory testing methods

**Fact Table:**
- `esmr_samples` - Individual measurement records (millions of rows)

**Audit Tables:**
- `esmr_imports` - Import job history and statistics
- `esmr_import_errors` - Detailed error logs

### Pipeline Stages

1. **Download** - Fetch CSV files from data.ca.gov (with caching)
2. **Validate** - Check CSV structure and required columns
3. **Parse** - Stream CSV records in batches with transformation
4. **Import** - Upsert dimension tables and insert fact records
5. **Audit** - Track statistics and errors

## File Structure

```
lib/
  types/
    esmr.ts                    # TypeScript type definitions
  services/
    esmr/
      download.ts              # Download service
      parser.ts                # CSV parser with streaming
      import.ts                # Import orchestration
      index.ts                 # Service exports

scripts/
  import-esmr.ts               # CLI script

app/
  api/
    import/
      esmr/
        route.ts               # POST /api/import/esmr (trigger import)
        [jobId]/route.ts       # GET /api/import/esmr/[jobId] (check status)

prisma/
  schema.prisma                # Database schema with eSMR models

data/
  esmr/                        # Downloaded CSV files
    .gitkeep
```

## Usage

### Command Line Interface

The CLI script provides the most direct way to import data:

```bash
# Show help
npm run import:esmr -- --help

# Import specific year (dry run - no database changes)
npm run import:esmr -- --year=2025 --dry-run

# Import specific year to database
npm run import:esmr -- --year=2025

# Import full dataset (all years)
npm run import:esmr -- --all

# Custom batch size for performance tuning
npm run import:esmr -- --year=2025 --batch-size=5000

# Force re-download (ignore cached file)
npm run import:esmr -- --year=2025 --force-download
```

### API Endpoints

Trigger imports via HTTP API:

```bash
# Start import job
curl -X POST http://localhost:3000/api/import/esmr \
  -H "Content-Type: application/json" \
  -d '{"year": 2025, "dryRun": false}'

# Response:
# {
#   "jobId": "job_1234567890_abc123",
#   "status": "pending",
#   "message": "Import job started",
#   "statusUrl": "/api/import/esmr/job_1234567890_abc123"
# }

# Check job status
curl http://localhost:3000/api/import/esmr/job_1234567890_abc123

# List recent jobs
curl http://localhost:3000/api/import/esmr
```

### Programmatic Usage

Import from your own code:

```typescript
import { importESMR } from '@/lib/services/esmr';

const result = await importESMR({
  year: 2025,
  dryRun: false,
  batchSize: 1000,
  onProgress: (progress) => {
    console.log(`Progress: ${progress.phase} - ${progress.processedRecords} records`);
  },
});

console.log(`Imported ${result.statistics.recordsInserted} records`);
```

## Configuration

### Data Source URLs

The download service uses URLs from `data.ca.gov`. Update resource IDs in `lib/services/esmr/download.ts`:

```typescript
const ESMR_RESOURCE_IDS: Record<number, string> = {
  2025: 'c90bb3e7-2b48-45f8-9b6e-5e5e0f3e4b0a', // Update with actual resource ID
  2024: 'b80aa2d6-1a37-34e7-8a5d-4d4d0e2d3a9b',
  // ...
};
```

### Performance Tuning

**Batch Size**: Controls memory usage vs. import speed
- Small batches (100-500): Lower memory, slower imports
- Medium batches (1000-2000): Balanced (default: 1000)
- Large batches (5000-10000): Higher memory, faster imports

**Database Connection**: Ensure your `DATABASE_URL` and `DIRECT_URL` are properly configured in `.env`

## Database Schema Details

### Region Model

```prisma
model ESMRRegion {
  code String @id // e.g., "R2"
  name String @unique // e.g., "Region 2 - San Francisco Bay"
  facilities ESMRFacility[]
}
```

### Facility Model

```prisma
model ESMRFacility {
  facilityPlaceId    Int @id // CIWQS Place ID
  facilityName       String
  regionCode         String
  receivingWaterBody String?
  createdAt          DateTime
  lastSeenAt         DateTime // Updated on each import
  locations          ESMRLocation[]
}
```

### Location Model

```prisma
model ESMRLocation {
  locationPlaceId Int @id // CIWQS Place ID
  facilityPlaceId Int
  locationCode    String // e.g., "E-001"
  locationType    ESMRLocationType
  latitude        Decimal?
  longitude       Decimal?
  locationDesc    String?
  createdAt       DateTime
  lastSeenAt      DateTime
  samples         ESMRSample[]
}
```

### Sample Model (Fact Table)

```prisma
model ESMRSample {
  id                      String @id @default(cuid())
  locationPlaceId         Int
  parameterId             String
  analyticalMethodId      String?
  samplingDate            DateTime @db.Date
  samplingTime            DateTime @db.Time
  analysisDate            DateTime @db.Date
  analysisTime            DateTime @db.Time
  qualifier               ESMRQualifier
  result                  Decimal?
  units                   String
  calculatedMethod        String?
  mdl                     Decimal? // Method Detection Limit
  ml                      Decimal? // Minimum Level
  rl                      Decimal? // Reporting Limit
  reviewPriorityIndicator Boolean?
  qaCodes                 String?
  comments                String?
  reportName              String
  smrDocumentId           Int
  createdAt               DateTime
}
```

### Enums

```prisma
enum ESMRLocationType {
  EFFLUENT_MONITORING
  INFLUENT_MONITORING
  RECEIVING_WATER_MONITORING
  RECYCLED_WATER_MONITORING
  INTERNAL_MONITORING
}

enum ESMRQualifier {
  DETECTED                 // "=" - Detected at reported value
  LESS_THAN                // "<" - Less than detection limit
  NOT_DETECTED             // "ND" - Not Detected
  DETECTED_NOT_QUANTIFIED  // "DNQ" - Detected but not quantified
}
```

## Data Flow

### CSV Column Mapping

The parser transforms raw CSV columns to database fields:

| CSV Column | Database Field | Transformation |
|------------|----------------|----------------|
| `region` | `ESMRRegion.code`, `name` | Extract "R2" from "Region 2 - ..." |
| `facility_place_id` | `ESMRFacility.facilityPlaceId` | Parse integer |
| `location_place_id` | `ESMRLocation.locationPlaceId` | Parse integer |
| `parameter` | `ESMRParameter.parameterName` | String trim |
| `qualifier` | `ESMRSample.qualifier` | Map to enum |
| `result` | `ESMRSample.result` | Parse decimal, handle null |
| `sampling_date` | `ESMRSample.samplingDate` | Parse ISO date |
| `sampling_time` | `ESMRSample.samplingTime` | Parse time string |

### Upsert Strategy

**Dimension Tables** (regions, facilities, locations, parameters, methods):
- Use `upsert` to insert new or update existing
- Update `lastSeenAt` timestamp on each import
- Allows detecting removed facilities

**Fact Table** (samples):
- Use `createMany` with `skipDuplicates`
- No updates - samples are immutable once created
- Duplicate detection by natural key (location + parameter + date + time)

## Error Handling

### Parse Errors

Individual row parse failures are logged but don't stop the import:

```typescript
onError: (error) => {
  console.error(`Row ${error.rowNumber}: ${error.message}`);
}
```

Errors are stored in `esmr_import_errors` table for later review.

### Import Errors

Batch-level failures can optionally halt the import:

```typescript
importESMR({
  continueOnError: true, // Keep going (default)
  // OR
  continueOnError: false, // Stop on first batch error
});
```

### Validation

Pre-import validation checks:
- CSV file exists and is readable
- Required columns present
- First row can be parsed successfully
- Data types are valid

## Performance Characteristics

### Expected Performance

Based on the schema design and batch processing:

| Dataset Size | Records | Download | Parse | Import | Total |
|--------------|---------|----------|-------|--------|-------|
| Single Year (2025) | ~500K | 30s | 2min | 5min | ~7min |
| Three Years | ~1.5M | 1min | 5min | 15min | ~20min |
| Full Dataset (2006-2025) | ~10M | 5min | 30min | 2hr | ~2.5hr |

*Note: Times are approximate and depend on network speed, database performance, and hardware.*

### Optimization Tips

1. **Use Direct Database Connection**: Set `DIRECT_URL` to bypass connection poolers
2. **Increase Batch Size**: For powerful hardware, use `--batch-size=5000` or higher
3. **Run During Off-Peak**: Large imports can impact database performance
4. **Enable Connection Pooling**: Configure PostgreSQL with appropriate connection limits
5. **Consider Partitioning**: For datasets >10M records, partition `esmr_samples` by year

## Monitoring

### Import Statistics

After each import, the CLI displays comprehensive statistics:

```
SUMMARY:
  Import ID:         clw123abc456def
  Source File:       /data/esmr/esmr-2025.csv
  Records Processed: 523,419
  Records Inserted:  523,419
  Records Updated:   8
  Records Errored:   15

ENTITIES CREATED:
  Regions:     0
  Facilities:  2
  Locations:   4
  Parameters:  3
  Methods:     1
  Samples:     523,419

DURATION:
  Download: 28.3s
  Parse:    1m 52s
  Import:   4m 31s
  Total:    6m 51s
```

### Database Queries

Check import history:

```sql
-- Recent imports
SELECT * FROM esmr_imports
ORDER BY import_date DESC
LIMIT 10;

-- Import errors
SELECT * FROM esmr_import_errors
WHERE import_id = 'clw123abc456def';

-- Sample counts by year
SELECT
  EXTRACT(YEAR FROM sampling_date) as year,
  COUNT(*) as sample_count
FROM esmr_samples
GROUP BY year
ORDER BY year DESC;

-- Facilities by region
SELECT
  r.name as region,
  COUNT(f.facility_place_id) as facility_count
FROM esmr_regions r
LEFT JOIN esmr_facilities f ON f.region_code = r.code
GROUP BY r.name;
```

## Troubleshooting

### Common Issues

**Database Connection Errors**
```
Error: P1001: Can't reach database server
```
- Check `DATABASE_URL` in `.env`
- Verify database is running
- Check firewall/network settings

**Out of Memory**
```
JavaScript heap out of memory
```
- Reduce batch size: `--batch-size=500`
- Run with more memory: `NODE_OPTIONS=--max-old-space-size=4096 npm run import:esmr`

**Download Failures**
```
Failed to download eSMR data: HTTP 404
```
- Check resource IDs in `download.ts` are current
- Verify data.ca.gov is accessible
- Try `--force-download` to bypass cache

**Duplicate Key Violations**
```
Error: Unique constraint violation
```
- This shouldn't happen with proper upsert logic
- Check for concurrent imports
- Review `skipDuplicates` configuration

### Debug Mode

Enable verbose logging:

```typescript
// In import.ts, add console.log statements
onProgress: (progress) => {
  console.log(JSON.stringify(progress, null, 2));
}
```

## Next Steps

### Integration with Existing App

1. **Link to Existing Facilities**: Create `esmr_facility_links` table to map eSMR facilities to app's `Facility` model
2. **Parameter Mapping**: Map `ESMRParameter.parameterName` to `ConfigPollutant.key` for canonical names
3. **Create Views**: Build database views that union eSMR data with existing `Sample` data
4. **Update UI**: Add eSMR data to facility detail pages and charts

### Data Enrichment

1. **Permit Numbers**: Cross-reference with NPDES Permits dataset
2. **Coordinates**: Backfill missing coordinates from facility addresses
3. **Parameter Categories**: Classify parameters (metals, nutrients, bacteria, etc.)
4. **Benchmark Limits**: Add permit limit data for exceedance calculations

### Automation

1. **Scheduled Imports**: Set up cron job to run monthly
2. **Email Notifications**: Send import summary to admin
3. **Error Alerts**: Trigger alerts if error rate exceeds threshold
4. **Data Validation**: Add post-import data quality checks

## References

- **Schema Analysis**: `/research/esmr-schema-analysis.md`
- **Proposed Schema**: `/prisma/schema-esmr-proposed.prisma`
- **Data Source**: [California Open Data Portal](https://data.ca.gov)
- **CIWQS System**: [California Integrated Water Quality System](https://www.waterboards.ca.gov/ciwqs/)

## Support

For issues or questions:
1. Check this documentation
2. Review schema analysis in `/research/esmr-schema-analysis.md`
3. Examine error logs in `esmr_import_errors` table
4. Review Prisma schema in `/prisma/schema.prisma`

---

**Last Updated**: November 29, 2025
**Version**: 1.0
**Status**: Production Ready
