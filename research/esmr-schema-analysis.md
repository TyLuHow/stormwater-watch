# eSMR Data Schema Analysis

**Date**: November 29, 2025
**Analyst**: Claude (Sonnet 4.5)
**Data Source**: California Water Board eSMR 2025 Dataset
**Sample Size**: 9,999 records analyzed

---

## Executive Summary

The eSMR (Electronic Self-Monitoring Report) dataset from the California State Water Resources Control Board contains wastewater discharge monitoring data from NPDES-permitted facilities. After analyzing 9,999 sample records from the 2025 dataset, we've identified a clear structure with 29 columns representing:

- **Facility/Location entities**: Where sampling occurs (8 unique facilities in sample)
- **Measurement/Sample entities**: What was measured (238 unique parameters)
- **Reference/Lookup data**: Standardized codes and descriptions (regions, methods, qualifiers)
- **Temporal data**: When samples were collected and analyzed
- **Quality assurance**: QA codes, review indicators, comments

### Key Findings

1. **Data Structure**: Denormalized flat file optimized for reporting, not OLTP
2. **Relationships**: Clear hierarchy of Facility → Location → Sample → Result
3. **Normalization Opportunities**: Many repeated values (regions, methods, parameters) suitable for lookup tables
4. **Data Quality**: High completeness for core fields, moderate nullability for optional fields
5. **Scale**: Designed for millions of records across 19+ years (2006-present)

### Recommendation

Implement a **star schema** approach with:
- Central fact table: `esmr_samples` (measurement data)
- Dimension tables: `esmr_facilities`, `esmr_locations`, `esmr_parameters`, `esmr_analytical_methods`
- Lookup tables: `esmr_regions`, `esmr_qualifiers`, `esmr_qa_codes`
- Audit table: `esmr_imports` (track data lineage)

This preserves source fidelity while enabling efficient queries and reducing storage overhead.

---

## Column Inventory

### Complete Field Analysis (29 columns)

#### 1. region
- **Type**: String
- **Nullable**: No (0% null)
- **Cardinality**: Very Low (5 unique values)
- **Sample Values**:
  - "Region 2 - San Francisco Bay"
  - "Region 4 - Los Angeles"
  - "Region 5F - Fresno"
  - "Region 3 - Central Coast"
  - "Region 9 - San Diego"
- **Purpose**: Regional Water Quality Control Board jurisdiction
- **Schema Role**: LOOKUP TABLE (esmr_regions)
- **Index**: Yes (filter by region is common)

#### 2. location
- **Type**: String
- **Nullable**: No (0% null)
- **Cardinality**: Low (26 unique values)
- **Sample Values**: "E-003", "E-001", "E-002", "REC-001", "EFF001 WRR"
- **Purpose**: Monitoring location code (facility-specific)
- **Schema Role**: Part of esmr_locations composite key
- **Index**: Yes (part of primary search)

#### 3. location_place_id
- **Type**: Integer
- **Nullable**: No (0% null)
- **Cardinality**: Low (31 unique values)
- **Sample Values**: 784043, 784041, 784042, 812836, 826234
- **Purpose**: CIWQS place ID for monitoring location
- **Schema Role**: PRIMARY KEY for esmr_locations table
- **Index**: Yes (foreign key from samples)

#### 4. location_place_type
- **Type**: String
- **Nullable**: No (0% null)
- **Cardinality**: Very Low (5 unique values)
- **Sample Values**:
  - "Effluent Monitoring"
  - "Recycled Water Monitoring"
  - "Influent Monitoring"
  - "Receiving Water Monitoring"
  - "Internal Monitoring"
- **Purpose**: Categorize monitoring point type
- **Schema Role**: ENUM or LOOKUP TABLE
- **Index**: Yes (filter by type)

#### 5. parameter
- **Type**: String
- **Nullable**: No (0% null)
- **Cardinality**: Medium (238 unique values)
- **Sample Values**: "Total Coliform", "Flow", "pH", "Chlorine, Total Residual", "Chloride"
- **Purpose**: Pollutant/parameter being measured
- **Schema Role**: LOOKUP TABLE (esmr_parameters) or foreign key
- **Index**: Yes (critical for filtering)
- **Notes**: Should link to ConfigPollutant table for canonical mapping

#### 6. analytical_method_code
- **Type**: String
- **Nullable**: Yes (59.7% null)
- **Cardinality**: Low (66 unique values)
- **Sample Values**: "A9221B", "DU", "E150.1", "E300.0", "E821013"
- **Purpose**: EPA/Standard method code used for analysis
- **Schema Role**: Foreign key to esmr_analytical_methods
- **Index**: No (rarely queried directly)

#### 7. analytical_method
- **Type**: String
- **Nullable**: Yes (59.7% null)
- **Cardinality**: Low (66 unique values)
- **Sample Values**:
  - "Standard Method 9221 B: Total Coliform Fermentation Technique"
  - "Data Unavailable"
  - "pH, Electrometric"
- **Purpose**: Full name of analytical method
- **Schema Role**: LOOKUP TABLE (esmr_analytical_methods)
- **Index**: No (use code for joins)

#### 8. calculated_method
- **Type**: String
- **Nullable**: Yes (40.3% null)
- **Cardinality**: Low (31 unique values)
- **Sample Values**:
  - "Daily Maximum"
  - "Daily Discharge"
  - "Monthly Discharge"
  - "Daily Average (Mean)"
  - "Instantaneous Minimum (IMIN)"
- **Purpose**: How result was calculated/aggregated
- **Schema Role**: ENUM or LOOKUP TABLE
- **Index**: No (rarely filtered)

#### 9. qualifier
- **Type**: String
- **Nullable**: No (0% null)
- **Cardinality**: Very Low (4 unique values)
- **Sample Values**: "=", "<", "ND", "DNQ"
- **Purpose**: Result qualifier (detected, not detected, less than, etc.)
- **Schema Role**: ENUM (store as char(3))
- **Index**: Yes (filter for detections)
- **Notes**:
  - "=" = Detected at reported value
  - "<" = Less than detection limit
  - "ND" = Not Detected
  - "DNQ" = Detected Not Quantified

#### 10. result
- **Type**: Decimal/Integer
- **Nullable**: Yes (20.9% null)
- **Cardinality**: High (1000+ unique values)
- **Sample Values**: 23, 42.1, 20.6, 12.9, 18.9
- **Purpose**: Measured result value
- **Schema Role**: Fact table column (DECIMAL)
- **Index**: No (range queries possible but uncommon)
- **Notes**: Null when qualifier is ND or DNQ

#### 11. units
- **Type**: String
- **Nullable**: No (0% null)
- **Cardinality**: Low (28 unique values)
- **Sample Values**: "MPN/100 mL", "MGD", "SU", "mg/L", "MGM"
- **Purpose**: Units of measurement for result
- **Schema Role**: LOOKUP TABLE or VARCHAR(20)
- **Index**: No (filter by parameter, not unit)

#### 12. mdl (Method Detection Limit)
- **Type**: Decimal/Integer
- **Nullable**: Yes (71.9% null)
- **Cardinality**: Medium (161 unique values)
- **Sample Values**: 0.2, 2, 0.1, 0.5, 0.23
- **Purpose**: Minimum detection limit of analytical method
- **Schema Role**: Fact table column (DECIMAL, nullable)
- **Index**: No

#### 13. ml (Minimum Level)
- **Type**: Decimal/Integer
- **Nullable**: Yes (99.5% null)
- **Cardinality**: Low (10 unique values)
- **Sample Values**: 1, 5, 0.1, 0.2, 10
- **Purpose**: Minimum level (rarely used)
- **Schema Role**: Fact table column (DECIMAL, nullable)
- **Index**: No

#### 14. rl (Reporting Limit)
- **Type**: Decimal/Integer
- **Nullable**: Yes (80.5% null)
- **Cardinality**: Low (40 unique values)
- **Sample Values**: 2, 3, 1, 0.5, 0.1
- **Purpose**: Reporting limit for parameter
- **Schema Role**: Fact table column (DECIMAL, nullable)
- **Index**: No

#### 15. sampling_date
- **Type**: Date
- **Nullable**: No (0% null)
- **Cardinality**: Medium (212 unique values in sample)
- **Sample Values**: "2025-02-13", "2025-02-04", "2025-02-14"
- **Purpose**: Date sample was collected
- **Schema Role**: Fact table column (DATE) - CRITICAL
- **Index**: YES (primary time-series query)
- **Notes**: Core field for temporal analysis

#### 16. sampling_time
- **Type**: Time
- **Nullable**: No (0% null)
- **Cardinality**: Medium (435 unique values)
- **Sample Values**: "05:20:00", "19:02:00", "05:58:00"
- **Purpose**: Time sample was collected
- **Schema Role**: Fact table column (TIME)
- **Index**: No (rarely queried alone)

#### 17. analysis_date
- **Type**: Date
- **Nullable**: No (0% null)
- **Cardinality**: Medium (212 unique values)
- **Sample Values**: "2025-02-13", "2025-02-04", "2025-02-14"
- **Purpose**: Date sample was analyzed in lab
- **Schema Role**: Fact table column (DATE)
- **Index**: No

#### 18. analysis_time
- **Type**: Time
- **Nullable**: No (0% null)
- **Cardinality**: Very Low (2 unique values)
- **Sample Values**: "00:00:00", "13:48:00"
- **Purpose**: Time sample was analyzed
- **Schema Role**: Fact table column (TIME)
- **Index**: No
- **Notes**: Often "00:00:00" indicating time not tracked

#### 19. review_priority_indicator
- **Type**: String
- **Nullable**: Yes (73.8% null)
- **Cardinality**: Very Low (2 unique values)
- **Sample Values**: "Y", "N"
- **Purpose**: Flags samples requiring review
- **Schema Role**: BOOLEAN (nullable)
- **Index**: Yes (filter for priority reviews)

#### 20. qa_codes
- **Type**: String
- **Nullable**: Yes (100.0% null in sample)
- **Cardinality**: Very Low (3 unique values)
- **Sample Values**: "D", "FO", "GB"
- **Purpose**: Quality assurance codes
- **Schema Role**: VARCHAR(10), nullable
- **Index**: No
- **Notes**: Extremely rare, meaning unknown

#### 21. comments
- **Type**: String
- **Nullable**: Yes (93.1% null)
- **Cardinality**: Low (13 unique values)
- **Sample Values**:
  - "Instantaneous Flow Rate"
  - "Total Event Discharge (MG)"
  - "Peak Flow Rate in Dry Weather Discharge"
- **Purpose**: Additional context about measurement
- **Schema Role**: TEXT, nullable
- **Index**: No

#### 22. facility_name
- **Type**: String
- **Nullable**: No (0% null)
- **Cardinality**: Very Low (8 unique in sample)
- **Sample Values**:
  - "EBMUD SD#1-Wet Wthr Bypass"
  - "Burbank WRP"
  - "Whittier Narrows Water Reclamation Plant"
- **Purpose**: Facility name
- **Schema Role**: Part of esmr_facilities dimension
- **Index**: Yes (text search)

#### 23. facility_place_id
- **Type**: Integer
- **Nullable**: No (0% null)
- **Cardinality**: Very Low (8 unique in sample)
- **Sample Values**: 222130, 212135, 235826, 222491, 219552
- **Purpose**: CIWQS place ID for facility
- **Schema Role**: PRIMARY KEY for esmr_facilities table
- **Index**: Yes (foreign key from locations)

#### 24. report_name
- **Type**: String
- **Nullable**: No (0% null)
- **Cardinality**: Low (19 unique values)
- **Sample Values**:
  - "Monthly SMR ( MONNPDES ) report for February 2025"
  - "Quarterly SMR ( MONRPT ) report for Q1 2025"
- **Purpose**: Report submission name/period
- **Schema Role**: VARCHAR(100)
- **Index**: No (derived from smr_document_id)

#### 25. latitude
- **Type**: Decimal
- **Nullable**: Yes (86.6% null)
- **Cardinality**: Very Low (5 unique values)
- **Sample Values**: 37.67, 37.669167, 37.672778, 33.3341601
- **Purpose**: Latitude coordinate of monitoring location
- **Schema Role**: Part of esmr_locations (DECIMAL(9,6))
- **Index**: No (use PostGIS for spatial queries if needed)

#### 26. longitude
- **Type**: Decimal
- **Nullable**: Yes (86.6% null)
- **Cardinality**: Very Low (4 unique values)
- **Sample Values**: -119.81, -119.816944, -118.3084702, 117.391389
- **Purpose**: Longitude coordinate of monitoring location
- **Schema Role**: Part of esmr_locations (DECIMAL(9,6))
- **Index**: No

#### 27. receiving_water_body
- **Type**: String
- **Nullable**: Yes (96.2% null)
- **Cardinality**: Very Low (3 unique values)
- **Sample Values**:
  - "Merced River- Source to McClure Lake"
  - "None"
  - "Pacific Ocean"
- **Purpose**: Water body receiving discharge
- **Schema Role**: Part of esmr_facilities (VARCHAR(200))
- **Index**: Yes (search by water body)

#### 28. smr_document_id
- **Type**: Integer
- **Nullable**: No (0% null)
- **Cardinality**: Low (23 unique values)
- **Sample Values**: 1554047, 1554049, 1554051, 1767729, 1767730
- **Purpose**: Unique ID for SMR report submission
- **Schema Role**: Foreign key (could create esmr_reports table)
- **Index**: Yes (group samples by report)

#### 29. location_desc
- **Type**: String
- **Nullable**: Yes (12.6% null)
- **Cardinality**: Low (29 unique values)
- **Sample Values**: "At any point in the Oakport WWF outfall where all waste tributaries to that outfall are present (may be the same as E-003-D)"
- **Purpose**: Detailed description of monitoring location
- **Schema Role**: Part of esmr_locations (TEXT)
- **Index**: No (full-text search if needed)

---

## Entity Analysis

### Entity Relationship Discovery

Based on the data structure, we've identified the following entities and relationships:

```
esmr_regions (5 records)
    ↓ (1:many)
esmr_facilities (thousands)
    ↓ (1:many)
esmr_locations (tens of thousands)
    ↓ (1:many)
esmr_samples (millions)
    ↓ (many:1)
esmr_parameters (hundreds)
esmr_analytical_methods (hundreds)
```

### 1. Facility Entity (esmr_facilities)

**Purpose**: Represents wastewater treatment plants or discharge facilities

**Key Fields**:
- `facility_place_id` (PK) - CIWQS unique identifier
- `facility_name` - Display name
- `region_code` (FK) - Link to esmr_regions
- `receiving_water_body` - Where discharge goes
- `created_at`, `last_seen_at` - Data lineage

**Cardinality**: Thousands of facilities statewide (8 in sample)

**Relationship to existing schema**: Could merge with or link to existing `Facility` table

### 2. Location Entity (esmr_locations)

**Purpose**: Represents specific monitoring points within or around a facility

**Key Fields**:
- `location_place_id` (PK) - CIWQS unique identifier
- `facility_place_id` (FK) - Parent facility
- `location_code` - Short code (e.g., "E-001")
- `location_type` - Effluent/Influent/Receiving/etc.
- `latitude`, `longitude` - Coordinates (when available)
- `location_desc` - Detailed description
- `created_at`, `last_seen_at`

**Cardinality**: Multiple locations per facility (31 in sample)

**Notes**: One facility can have many monitoring points (effluent, influent, receiving water)

### 3. Sample/Measurement Entity (esmr_samples)

**Purpose**: Individual analytical measurements - the fact table

**Key Fields**:
- `id` (PK) - Generated unique ID
- `location_place_id` (FK) - Where measured
- `parameter_id` (FK) - What was measured
- `analytical_method_id` (FK, nullable) - How measured
- `sampling_date`, `sampling_time` - When collected
- `analysis_date`, `analysis_time` - When analyzed
- `qualifier` - Detection qualifier (=, <, ND, DNQ)
- `result` (nullable) - Measured value
- `units` - Units of result
- `mdl`, `ml`, `rl` (nullable) - Detection/reporting limits
- `review_priority_indicator` - QA flag
- `qa_codes` - Quality codes
- `comments` - Additional notes
- `smr_document_id` - Source report
- `created_at` - Import timestamp

**Cardinality**: Millions of records (9,999 in sample)

**Notes**: This is the largest table by far

### 4. Parameter Entity (esmr_parameters)

**Purpose**: Standardized list of pollutants/parameters that can be measured

**Key Fields**:
- `id` (PK) - Generated ID
- `parameter_name` - Name as it appears in eSMR
- `canonical_name` (nullable) - Link to ConfigPollutant.key
- `category` - Grouping (metals, nutrients, bacteria, etc.)
- `notes`

**Cardinality**: 238 unique parameters in sample, likely 500-1000 total

**Relationship to existing schema**: Should link to `ConfigPollutant` for canonical mapping

### 5. Analytical Method Entity (esmr_analytical_methods)

**Purpose**: EPA/Standard Methods used for laboratory analysis

**Key Fields**:
- `method_code` (PK) - Short code (e.g., "A9221B")
- `method_name` - Full description
- `category` - Type of method
- `notes`

**Cardinality**: 66 unique methods in sample, likely 200-300 total

**Notes**: 59.7% of samples don't have method recorded

### 6. Supporting Lookup Tables

**esmr_regions**:
- `region_code` (PK) - e.g., "R2"
- `region_name` - e.g., "Region 2 - San Francisco Bay"

**esmr_location_types** (ENUM alternative):
- Effluent Monitoring
- Influent Monitoring
- Receiving Water Monitoring
- Recycled Water Monitoring
- Internal Monitoring

**esmr_qualifiers** (ENUM alternative):
- `=` - Detected at reported value
- `<` - Less than detection limit
- `ND` - Not Detected
- `DNQ` - Detected Not Quantified

**esmr_calculated_methods** (optional):
- Daily Maximum
- Daily Average (Mean)
- Monthly Discharge
- etc.

### 7. Audit/Lineage Entity (esmr_imports)

**Purpose**: Track data import history

**Key Fields**:
- `id` (PK)
- `import_date`
- `source_file` - URL or filename
- `year` - Data year imported
- `records_processed`
- `records_inserted`
- `records_updated`
- `errors`
- `notes`

**Cardinality**: One per import (monthly)

---

## Data Dictionary Comparison

The data dictionary PDF was not directly accessible during this analysis, but based on the CSV header structure and data patterns, we can infer:

### Discrepancies Found

1. **BOM in header**: CSV has UTF-8 BOM (byte order mark) character at start
2. **Field naming**: Uses snake_case consistently
3. **NA vs NaN**: Both "NA" and "NaN" appear in data (should standardize)
4. **Empty strings vs nulls**: Some fields use empty string, others use NA/NaN

### Field Purpose Inference

Based on data patterns and domain knowledge:

- **mdl** = Method Detection Limit (lowest concentration measurable)
- **ml** = Minimum Level (rarely used, regulatory threshold)
- **rl** = Reporting Limit (concentration above which reporting required)
- **smr_document_id** = Self-Monitoring Report document ID in CIWQS
- **place_id** = CIWQS Place identifier (facility or location)
- **review_priority_indicator** = Flags unusual results for review

### Data Quality Notes

1. **Coordinates**: 86.6% null - likely only provided for receiving water locations
2. **QA Codes**: 100% null in sample - rarely used in practice
3. **Analytical Method**: 59.7% null - not required for all measurements
4. **Comments**: 93.1% null - provided only when needed

---

## Recommended Prisma Schema

See `./prisma/schema-esmr-proposed.prisma` for the complete schema.

### Design Decisions

1. **Star Schema**: Central fact table (`esmr_samples`) with dimension tables
2. **Preserve Source Fidelity**: All 29 CSV columns represented
3. **Normalization**: Extract repeated values to lookup tables
4. **Flexible Typing**: Use Decimal for numeric fields to preserve precision
5. **Nullable Strategy**: Match source data (don't enforce constraints source doesn't have)
6. **Indexes**: Strategic indexes on filter/join columns only
7. **Data Lineage**: Track when records were created/last seen
8. **Integration Points**: Foreign keys to link with existing Facility/ConfigPollutant

### Performance Considerations

1. **Partitioning**: Consider partitioning `esmr_samples` by year (2006-2025+)
2. **Materialized Views**: Create aggregated views for common queries
3. **Indexes**: Composite indexes on (location_place_id, sampling_date, parameter_id)
4. **Storage**: ~10-20GB for full dataset, ~500MB per year
5. **Import Performance**: Batch inserts of 5000-10000 records at a time

---

## Migration Strategy

### Option 1: Separate eSMR Tables (RECOMMENDED)

**Approach**: Keep eSMR data in dedicated tables, separate from existing models

**Pros**:
- Clean separation of concerns
- No risk to existing data
- Can optimize eSMR schema independently
- Easier to update/re-import eSMR data
- Clear data lineage and provenance

**Cons**:
- Duplication if same facilities exist in both schemas
- Need to create facility links explicitly
- More complex queries when joining eSMR + existing data

**Implementation**:
1. Add all eSMR tables as proposed
2. Create `esmr_facility_links` table to map `esmr_facilities.facility_place_id` to existing `Facility.id`
3. Build views that join across schemas for unified reporting

**Recommended**: YES - cleanest approach for first iteration

---

### Option 2: Shared Facility Table

**Approach**: Link eSMR data to existing `Facility` model

**Pros**:
- No facility duplication
- Unified facility search
- Easier to show "all data for this facility"

**Cons**:
- Requires migrating existing Facility table to accommodate eSMR IDs
- eSMR facilities may not have all fields current Facility requires
- Risk of data pollution if eSMR facility data is incomplete
- Complex upsert logic during imports

**Implementation**:
1. Add `ciwqsFacilityPlaceId` to existing `Facility` model
2. Link `esmr_locations` to `Facility.id` instead of separate table
3. Merge facility data on import (upsert by CIWQS ID)

**Recommended**: NO - too risky for initial implementation

---

### Option 3: View-Based Integration

**Approach**: Raw eSMR tables + Postgres views that map to app concepts

**Pros**:
- Flexible querying without changing core data
- Can create multiple views for different use cases
- No data duplication
- Easy to modify view logic

**Cons**:
- Views can be slow for large datasets
- Prisma doesn't support views natively (need raw SQL)
- More complex application code
- Hard to add app-specific fields to views

**Implementation**:
1. Create raw eSMR tables as proposed
2. Create views like `vw_facility_samples` that join eSMR + existing data
3. Use Prisma.$queryRaw for view access

**Recommended**: MAYBE - good for reporting, but not primary strategy

---

### Option 4: Replace Existing Schema

**Approach**: Migrate existing Sample/Facility to new eSMR-based schema

**Pros**:
- Single source of truth
- Simplified schema
- Better data quality from official source

**Cons**:
- Breaks existing app code
- Loses any custom data in current Sample table
- Requires complete application rewrite
- Risky migration

**Implementation**:
1. Export existing Sample data
2. Drop Sample and Facility tables
3. Create eSMR schema
4. Attempt to map old data to new schema
5. Rewrite all API/UI code

**Recommended**: NO - far too risky

---

### FINAL RECOMMENDATION: Option 1 + Option 3

**Hybrid Approach**:

1. **Phase 1**: Implement separate eSMR tables (Option 1)
   - No risk to existing system
   - Clean import pipeline
   - Full data preservation

2. **Phase 2**: Create integration views (Option 3)
   - `vw_all_facilities` - Union of eSMR facilities + existing facilities
   - `vw_all_samples` - Union of eSMR samples + existing samples (with schema mapping)
   - `vw_facility_monitoring_summary` - Aggregated stats per facility

3. **Phase 3**: Gradual migration (if needed)
   - Once eSMR data proves reliable, consider migrating existing Sample data
   - Add `source` column to distinguish eSMR vs legacy data
   - Maintain backward compatibility

4. **Integration Layer**:
   ```typescript
   // lib/data/facilities.ts
   export async function getFacility(id: string) {
     // Try existing Facility first
     const facility = await prisma.facility.findUnique({ where: { id } });
     if (facility) return facility;

     // Try eSMR facility by CIWQS ID
     const esmrFacility = await prisma.esmrFacility.findUnique({
       where: { facilityPlaceId: parseInt(id) }
     });

     return esmrFacility ? mapToFacility(esmrFacility) : null;
   }
   ```

---

## Open Questions

### 1. Data Dictionary Access
- **Question**: Can we extract field definitions from the PDF programmatically?
- **Impact**: Would help validate our inferred field purposes
- **Action**: Download PDF and parse with PDF library, or request machine-readable version

### 2. NPDES Permit Linking
- **Question**: How do we link eSMR facilities to NPDES permits?
- **Current State**: No permit number in eSMR data
- **Impact**: Can't validate facilities against permit list
- **Action**: Download NPDES Permits spreadsheet and match on facility_place_id

### 3. Parameter Standardization
- **Question**: How do eSMR parameter names map to existing ConfigPollutant?
- **Current State**: 238 parameters in eSMR vs unknown in ConfigPollutant
- **Impact**: Can't use canonical names for cross-dataset queries
- **Action**: Create mapping table between eSMR parameters and ConfigPollutant.key

### 4. Benchmark/Limit Data
- **Question**: Where do permit limits come from for comparison?
- **Current State**: eSMR has results but not limits
- **Impact**: Can't calculate exceedances from eSMR alone
- **Action**: Investigate if permit limits are in separate dataset or must be manually configured

### 5. Coordinate Completeness
- **Question**: Why are 86.6% of coordinates null?
- **Hypothesis**: Only receiving water locations have coordinates, not facility locations
- **Impact**: Can't map most monitoring locations
- **Action**: Cross-reference with NPDES Permits spreadsheet for facility coordinates

### 6. Historical Data Import Strategy
- **Question**: Import all 19 years (2006-2025) or start with recent years?
- **Options**:
  - All years (~10GB): Complete history but slow initial import
  - Last 3 years (~2GB): Faster, covers typical compliance period
  - Year-by-year: Gradual backfill
- **Impact**: Storage, import time, data completeness
- **Recommendation**: Start with 2023-2025, backfill earlier years if needed

### 7. Update Frequency
- **Question**: Daily, weekly, or monthly imports?
- **Source Update**: Monthly on data.ca.gov
- **Impact**: Data freshness vs import overhead
- **Recommendation**: Monthly, run on 2nd of each month after source updates

### 8. Duplicate Detection
- **Question**: How to handle duplicate samples if re-importing same year?
- **Strategy**:
  - Use (location_place_id, parameter, sampling_date, sampling_time) as natural key
  - Upsert: Update if exists, insert if new
  - Track `created_at` vs `updated_at` for lineage
- **Impact**: Prevents duplicate records, handles corrections

### 9. Error Handling
- **Question**: How to handle malformed rows during import?
- **Strategy**:
  - Log to separate `esmr_import_errors` table
  - Continue processing (don't fail entire import)
  - Alert if error rate > 1%
- **Impact**: Robust imports, data quality visibility

### 10. Performance at Scale
- **Question**: Will queries perform well with 10M+ records?
- **Concerns**:
  - Full table scans on esmr_samples
  - Joins across large tables
  - Time-series queries
- **Mitigations**:
  - Partition by year
  - Strategic composite indexes
  - Materialized views for aggregations
  - Consider TimescaleDB extension for time-series optimization

---

## Validation Checklist

- [x] Sample CSV downloaded successfully (10,000 rows)
- [x] All 29 CSV columns documented with types and examples
- [x] Entity relationships clearly identified (Facility → Location → Sample)
- [x] Prisma schema created and syntactically valid
- [x] Schema includes appropriate indexes (7 indexes defined)
- [x] Migration strategy recommendation is clear (Option 1: Separate tables)
- [x] Data quality issues documented (nullability, BOM, NA vs NaN)
- [x] Performance considerations addressed (partitioning, indexing, batch inserts)
- [x] Integration points identified (Facility, ConfigPollutant)
- [ ] Data dictionary PDF parsed (attempted, not accessible - using inferred definitions)

---

## Next Steps

1. **Review proposed schema** with team
2. **Resolve open questions** (especially permit linking and parameter mapping)
3. **Create proof-of-concept** import script for 1000 records
4. **Test schema** with sample data
5. **Benchmark query performance** with realistic data volume
6. **Implement Phase 1** of migration strategy (separate eSMR tables)
7. **Build ETL pipeline** for monthly imports
8. **Create API endpoints** to expose eSMR data
9. **Update UI** to display eSMR data alongside existing data

---

**Analysis Complete**: November 29, 2025
**Document Version**: 1.0
**Ready for Review**: Yes
