# eSMR Schema Analysis - Project Complete

**Completion Date**: November 29, 2025
**Status**: READY FOR REVIEW ✅

---

## Executive Summary

Successfully analyzed California Water Board eSMR (Electronic Self-Monitoring Report) data to discover the true schema structure and design an optimal database schema. The analysis was based on 9,999 actual records from the 2025 dataset and employed a **data-first approach** - letting the actual data structure drive the schema design rather than forcing it into an existing model.

### Key Outcomes

1. **Complete Schema Understanding**: All 29 CSV columns analyzed with data types, nullability, cardinality, and sample values documented
2. **Optimal Schema Design**: Star schema with 8 models, 2 enums, and strategic indexes optimized for millions of records
3. **Clear Migration Strategy**: Phased approach starting with separate eSMR tables, followed by integration views
4. **Production-Ready**: Syntactically valid Prisma schema ready for implementation
5. **Comprehensive Documentation**: 28KB analysis document with detailed findings and recommendations

---

## Deliverables

### 📊 Main Deliverables

| File | Size | Description |
|------|------|-------------|
| **`./research/esmr-schema-analysis.md`** | 28 KB | Complete analysis with column inventory, entity relationships, and migration strategy |
| **`./prisma/schema-esmr-proposed.prisma`** | 13 KB | Production-ready Prisma schema (8 models, 2 enums, validated) |

### 📁 Supporting Files

| File | Size | Description |
|------|------|-------------|
| `./data/esmr/sample-2025.csv` | 4.8 MB | 9,999 sample records from 2025 dataset |
| `./data/esmr/schema-analysis.txt` | 9.4 KB | Automated analysis output |
| `./data/esmr/sample-data-stats.txt` | 2.0 KB | Additional statistics |
| `./data/esmr/analyze_schema.py` | 5.1 KB | Python analysis script |
| `./data/esmr/esmr_data_dictionary.pdf` | 99 KB | Official data dictionary |

---

## Schema Design Overview

### Entity Architecture

```
ESMRRegion (5 regions)
    ↓
ESMRFacility (thousands of facilities)
    ↓
ESMRLocation (multiple locations per facility)
    ↓
ESMRSample (millions of measurements) ← FACT TABLE
    ↓
ESMRParameter (238+ pollutants)
ESMRAnalyticalMethod (66+ lab methods)
```

### 8 Models Defined

1. **ESMRRegion** - Regional Water Quality Control Boards (5 regions)
2. **ESMRFacility** - Wastewater treatment plants (thousands)
3. **ESMRLocation** - Monitoring points within facilities (tens of thousands)
4. **ESMRSample** - Individual measurements (MILLIONS - fact table)
5. **ESMRParameter** - Pollutants/parameters measured (238+)
6. **ESMRAnalyticalMethod** - EPA/Standard Methods (66+)
7. **ESMRImport** - Data import audit trail
8. **ESMRImportError** - Error logging for malformed records

### 2 Enums Defined

1. **ESMRLocationType** - Effluent/Influent/Receiving Water/etc. (5 values)
2. **ESMRQualifier** - Detected/Not Detected/Less Than/etc. (4 values)

### 13 Strategic Indexes

Optimized for common query patterns:
- Time-series by location/parameter
- Date range filtering
- Detection filtering (qualifier)
- Report grouping
- Regional/facility searches

---

## Data Structure Discovered

### 29 CSV Columns Analyzed

**Facility/Location (7 fields)**:
- region, facility_name, facility_place_id
- location, location_place_id, location_place_type, location_desc
- receiving_water_body, latitude, longitude

**Measurement/Sample (12 fields)**:
- parameter, result, units, qualifier
- sampling_date, sampling_time, analysis_date, analysis_time
- mdl, ml, rl (detection limits)
- analytical_method_code, analytical_method, calculated_method

**Quality Assurance (3 fields)**:
- review_priority_indicator, qa_codes, comments

**Metadata (2 fields)**:
- report_name, smr_document_id

### Data Quality Insights

**High Completeness**:
- 15 required fields (0% null): facility info, dates, parameter, result qualifier
- Core measurement data is reliable

**Variable Nullability**:
- Analytical method: 59.7% null (not required for all measurements)
- Coordinates: 86.6% null (likely only for receiving water locations)
- Detection limits: 72-99% null (method-dependent)
- QA codes: 100% null (rarely used in practice)

**Data Inconsistencies**:
- Multiple null representations: "NaN", "NA", empty strings
- BOM character in CSV header
- Need standardization during import

---

## Recommended Migration Strategy

### ✅ RECOMMENDED: Phase 1 - Separate eSMR Tables

**Approach**: Implement eSMR data in dedicated tables, separate from existing models

**Benefits**:
- ✅ Clean separation of concerns
- ✅ No risk to existing data
- ✅ Independent schema optimization
- ✅ Clear data lineage and provenance
- ✅ Easier to update/re-import

**Implementation Path**:

1. **Phase 1** (Week 1-2): Add eSMR tables to schema
   - Deploy new models (no breaking changes)
   - Build ETL pipeline for monthly imports
   - Test with 2023-2025 data

2. **Phase 2** (Week 3-4): Create integration views
   - `vw_all_facilities` - Union of eSMR + existing facilities
   - `vw_all_samples` - Unified sample data
   - `vw_facility_monitoring_summary` - Aggregated stats

3. **Phase 3** (Future): Gradual migration
   - Once eSMR proves reliable, consider migrating existing Sample data
   - Add `source` column to distinguish datasets
   - Maintain backward compatibility

---

## Performance Considerations

### Scale Estimates

- **Full Dataset**: 2006-2025 (19 years) ≈ 10-20 GB
- **Sample Table**: Millions of records (largest by far)
- **Annual Growth**: ~500 MB per year
- **Import Frequency**: Monthly (2nd of each month after source updates)

### Optimization Strategy

1. **Partitioning**: Partition `esmr_samples` by year (samplingDate)
2. **Indexing**: 13 strategic indexes on filter/join columns
3. **Batch Imports**: 5,000-10,000 records per transaction
4. **Materialized Views**: For common aggregations
5. **Archive Strategy**: Consider archiving data older than 5 years

---

## Integration Points

### Link to Existing Schema

1. **Facility Mapping**:
   - ESMRFacility.facilityPlaceId → CIWQS Place ID
   - Can create optional ESMRFacilityLink table to map to existing Facility.id

2. **Parameter Standardization**:
   - ESMRParameter.canonicalKey → ConfigPollutant.key
   - Enables cross-dataset parameter queries

3. **Coordinate Enrichment**:
   - Only 13% of eSMR locations have coordinates
   - Can enrich from existing Facility.lat/lon when linking

---

## Open Questions for Review

### Critical Questions

1. **Permit Linking**: How do we link eSMR facilities to NPDES permits?
   - eSMR has facility_place_id but no permit number
   - Need to download NPDES Permits spreadsheet and create mapping

2. **Parameter Mapping**: How do 238 eSMR parameters map to ConfigPollutant?
   - Need to create canonical mapping table
   - Some may be duplicates with different names

3. **Permit Limits**: Where do permit limits come from?
   - eSMR has results but not limits
   - Can't calculate exceedances without limits
   - May need separate dataset or manual configuration

### Implementation Questions

4. **Historical Import**: Import all 19 years or start recent?
   - Option A: All years (complete history, ~10GB, slow)
   - Option B: Last 3 years (faster, ~2GB, typical compliance period)
   - **Recommendation**: Start with 2023-2025, backfill if needed

5. **Coordinate Completeness**: Why are 86.6% of coordinates null?
   - Hypothesis: Only receiving water locations have coordinates
   - Action: Cross-reference with NPDES Permits for facility coordinates

6. **Duplicate Detection**: Natural key for upsert strategy?
   - Proposed: (location_place_id, parameter, sampling_date, sampling_time)
   - Handles corrections/amendments from source

---

## Example Use Cases

### 1. Get All Samples for a Facility

```typescript
const samples = await prisma.esmrSample.findMany({
  where: {
    location: {
      facilityPlaceId: 222130 // EBMUD SD#1
    },
    samplingDate: {
      gte: new Date('2025-01-01'),
      lte: new Date('2025-12-31')
    }
  },
  include: {
    location: { include: { facility: true } },
    parameter: true
  },
  orderBy: { samplingDate: 'asc' }
});
```

### 2. Get Detections for a Parameter

```typescript
const detections = await prisma.esmrSample.findMany({
  where: {
    parameter: { parameterName: 'Total Coliform' },
    qualifier: { in: ['DETECTED', 'LESS_THAN'] }
  },
  include: {
    location: { include: { facility: true } }
  }
});
```

### 3. Get Facilities by Region

```typescript
const facilities = await prisma.esmrFacility.findMany({
  where: { regionCode: 'R2' },
  include: {
    region: true,
    locations: {
      include: {
        _count: { select: { samples: true } }
      }
    }
  }
});
```

---

## Next Steps

### Immediate Actions (This Week)

1. ✅ Review `./research/esmr-schema-analysis.md` (28 KB detailed analysis)
2. ✅ Review `./prisma/schema-esmr-proposed.prisma` (13 KB schema definition)
3. ⏳ Team review meeting to discuss findings
4. ⏳ Resolve open questions (permit linking, parameter mapping, limit data)

### Short-Term (Next 2 Weeks)

5. ⏳ Create proof-of-concept import script for 1,000 records
6. ⏳ Test schema with sample data in dev environment
7. ⏳ Benchmark query performance with realistic data volume
8. ⏳ Finalize migration strategy and timeline

### Medium-Term (Next Month)

9. ⏳ Implement Phase 1 (separate eSMR tables)
10. ⏳ Build ETL pipeline for monthly imports
11. ⏳ Create API endpoints to expose eSMR data
12. ⏳ Update UI to display eSMR data alongside existing data

---

## Validation Complete ✅

- ✅ Sample CSV downloaded successfully (10,000 lines)
- ✅ All CSV columns documented with types and examples (29 columns)
- ✅ Entity relationships clearly identified (Facility → Location → Sample)
- ✅ Prisma schema is syntactically valid (`prisma validate` passed)
- ✅ Schema includes appropriate indexes (13 indexes defined)
- ✅ Migration strategy recommendation is clear (Phased approach documented)
- ✅ Data quality observations documented (nullability, inconsistencies)
- ✅ Performance considerations addressed (partitioning, batch inserts)
- ✅ Integration points identified (Facility, ConfigPollutant)

---

## Resources

### Data Source
- **Dataset**: https://data.ca.gov/dataset/water-quality-effluent-electronic-self-monitoring-report-esmr-data
- **API Endpoint**: CKAN REST API available
- **Update Frequency**: Monthly (1st week of each month)
- **Coverage**: 2006-present (19 years)

### Documentation
- Data Dictionary (PDF): Included in `./data/esmr/`
- CIWQS User Guide: Available from Water Board
- Water Board GitHub: https://github.com/CAWaterBoardDataCenter

### Support Contacts
- Water Board Data Team: waterdata@waterboards.ca.gov
- CIWQS Help Center: ciwqs@waterboards.ca.gov, (866) 792-4977

---

## Analysis Methodology

### Data Collection
1. Downloaded 9,999 sample records from 2025 dataset (first 10,000 lines)
2. Analyzed actual CSV structure (not just documentation)
3. Downloaded official data dictionary for cross-reference

### Analysis Approach
1. **Automated Analysis**: Python script to analyze data types, nullability, cardinality
2. **Manual Review**: Examined sample records to understand relationships
3. **Domain Knowledge**: Applied water quality monitoring expertise
4. **Best Practices**: Referenced existing schema patterns from current app

### Design Principles
1. **Preserve Source Fidelity**: Don't lose data by over-normalizing
2. **Enable Efficient Queries**: Index fields used for filtering/joining
3. **Support Incremental Imports**: Track data lineage and handle updates
4. **Consider Scale**: Design for millions of records across decades

---

**Analysis Complete**: November 29, 2025
**Analyst**: Claude (Sonnet 4.5)
**Document Version**: 1.0
**Status**: READY FOR TEAM REVIEW ✅
