# California Water Board Data Sources Research
**Research Date:** November 29, 2025
**Purpose:** Identify the easiest single data source for building the first automation pipeline

---

## Executive Summary

**Recommended First Automation: eSMR Data from data.ca.gov**

After comprehensive research of California Water Board data sources, the **eSMR (Electronic Self-Monitoring Report) dataset on data.ca.gov** is the clear winner for the first automation pipeline.

### Why eSMR Data?
1. **Mature API Access**: REST API via CKAN platform, stable download URLs, no authentication required
2. **High Data Value**: Contains actual water quality monitoring results from NPDES-permitted facilities
3. **Multiple Format Options**: CSV (409MB), Parquet (268MB), yearly files, with API query capability
4. **Well-Maintained**: Monthly updates, data from 2006-present, professionally managed
5. **Low Complexity**: Flat file structure, single comprehensive dataset
6. **Production-Ready Documentation**: Includes data dictionary (PDF), clear field definitions

### Quick Start
```bash
# Download complete dataset (2006-2025)
curl -o esmr-data.zip "https://data.ca.gov/dataset/203e5d1f-ec9d-4d07-93aa-d8b74d3fe71f/resource/5ebbd97a-ffa9-4b75-8904-80e71a5e92c3/download/esmr-analytical-export_years-2006-2025_2025-11-05.zip"

# Or get just 2025 data (613MB)
curl -o esmr-2025.csv "https://data.ca.gov/dataset/203e5d1f-ec9d-4d07-93aa-d8b74d3fe71f/resource/176a58bf-6f5d-4e3f-9ed9-592a509870eb/download/esmr-analytical-export_year-2025_2025-11-05.csv"

# Data dictionary
curl -o esmr-data-dictionary.pdf "https://data.ca.gov/dataset/203e5d1f-ec9d-4d07-93aa-d8b74d3fe71f/resource/675b79d9-a2ec-4685-980e-8b5881ea2251/download/esmr_data_dictionary.pdf"
```

---

## Data Source Inventory

### 1. data.ca.gov Datasets

#### 1A. eSMR (Electronic Self-Monitoring Report) Data
- **URL**: https://data.ca.gov/dataset/water-quality-effluent-electronic-self-monitoring-report-esmr-data
- **Source System**: CIWQS (California Integrated Water Quality System)
- **Data Type**: Wastewater discharge monitoring results from NPDES-permitted facilities
- **Format**: CSV, Parquet
- **Update Frequency**: Monthly
- **Last Updated**: November 5, 2025
- **Coverage**: 2006-present
- **API**: CKAN REST API available

#### 1B. Stormwater Regulatory Data
- **URL**: https://data.ca.gov/dataset/stormwater-regulatory-including-enforcement-actions-information-and-water-quality-results
- **Source System**: SMARTS (Storm Water Multiple Application and Report Tracking System)
- **Data Type**: Industrial/construction facility info, monitoring data, inspections, violations, enforcement
- **Format**: CSV (7 separate files)
- **Update Frequency**: Weekly
- **Last Updated**: November 25, 2025
- **API**: CKAN REST API available

### 2. CIWQS Public Reports

#### 2A. eSMR Data Report
- **URL**: https://ciwqs.waterboards.ca.gov/ciwqs/readOnly/CiwqsReportServlet?inCommand=reset&reportName=esmrAnalytical
- **Format**: Excel (limited to 100,000 records per query)
- **Access Type**: Interactive query tool (manual export)
- **Data Type**: Same as data.ca.gov eSMR but with query filters

#### 2B. NPDES Permits Spreadsheet
- **URL**: Via CIWQS Public Reports page
- **Format**: Excel
- **Data Type**: Active permits from past 3 years with facility addresses
- **Access Type**: Direct download
- **Update Frequency**: Nightly refresh

#### 2C. Sanitary Sewer System (SSO) Flat Files
- **URL**: https://www.waterboards.ca.gov/water_issues/programs/sso/docs/index.php
- **Format**: Text files (tab-delimited, convertible to Excel)
- **Data Type**: Sewer spills, enrollee info, annual reports, SSMP compliance
- **Access Type**: Direct download URLs
- **Update Frequency**: Regular updates
- **Files Available**: 11 separate files (154KB - 50.9MB)

### 3. SMARTS Public Reports

#### 3A. Download NOI Data By Regional Board
- **URL**: https://smarts.waterboards.ca.gov/smarts/SwPublicUserMenu.xhtml
- **Format**: Unknown (requires manual navigation)
- **Data Type**: Notice of Intent submissions by regional jurisdiction
- **Access Type**: Interactive download

#### 3B. Storm Water Reports (Industrial/Construction/Municipal)
- **URL**: Via SMARTS Public User Menu
- **Format**: Unknown (appears to be web reports, not flat files)
- **Data Type**: Compliance reports for different permit types
- **Access Type**: Interactive web reports

---

## Detailed Analysis

### eSMR Data (data.ca.gov) - RECOMMENDED

**API Availability**: 5/5
- CKAN REST API with full metadata access
- Direct download URLs (no authentication)
- Multiple format options (CSV, Parquet)
- Yearly files for incremental loading
- API endpoint: `https://data.ca.gov/api/3/action/package_show?id=water-quality-effluent-electronic-self-monitoring-report-esmr-data`

**Data Value**: 5/5
- Actual water quality monitoring results from regulated facilities
- Includes analytical data, calculated values, monitoring locations
- Links to facilities via NPDES permits
- Critical for compliance tracking and trend analysis
- Generally applies to discharges into surface waters regulated by individual NPDES permits

**Documentation**: 4/5
- Dedicated data dictionary (PDF) available
- Clear field definitions for analytical data
- Excludes ~0.1% of records (missing/invalid dates, pre-2006)
- Contact provided: [email protected]
- CIWQS User Guide available for context

**Update Frequency**: 5/5
- Monthly updates
- Data from 2006-present (19 years of history)
- Consistent naming convention with date stamps
- Reliable update schedule

**Simplicity**: 5/5
- Single comprehensive CSV file (or partitioned by year)
- Flat file structure (no nested JSON)
- Standard CSV format
- Parquet option for optimized storage/queries
- Direct HTTP download (no OAuth, no API keys)

**TOTAL SCORE**: 24/25

**Strengths**:
- Production-ready with stable URLs
- No authentication barriers
- Comprehensive historical data
- Multiple consumption patterns supported (bulk, incremental, API)
- Well-maintained by State Water Resources Control Board

**Weaknesses**:
- Large file size (409MB compressed for full dataset)
- May require data cleaning for missing values
- Limited to facilities approved for electronic submission
- Data dictionary in PDF (not machine-readable schema)

---

### Stormwater Regulatory Data (data.ca.gov)

**API Availability**: 5/5
- CKAN REST API available
- Direct download URLs for 7 CSV files
- Weekly updates with consistent naming
- No authentication required

**Data Value**: 5/5
- Industrial facility information (23.1 MB)
- Industrial monitoring data (644.6 MB)
- Construction facility information (91.1 MB)
- Construction monitoring data (324.5 MB)
- Inspections (51.4 MB)
- Violations (32.9 MB)
- Enforcement actions (35.5 MB)
- Comprehensive stormwater compliance dataset

**Documentation**: 2/5
- No data dictionary provided on dataset page
- Limited field descriptions
- Must infer schema from data
- Contact: Patrick.Otsuji@waterboards.ca.gov

**Update Frequency**: 5/5
- Weekly updates (better than eSMR monthly)
- Last updated November 25, 2025
- Consistent update schedule

**Simplicity**: 3/5
- 7 separate files to manage
- Need to understand relationships between files
- Large monitoring data files (644MB, 324MB)
- Requires integration logic for complete picture

**TOTAL SCORE**: 20/25

**Strengths**:
- Excellent coverage of stormwater programs
- Weekly updates (fresher than eSMR)
- Comprehensive enforcement/violation tracking
- Multiple data dimensions available

**Weaknesses**:
- No published data dictionary
- Multiple files require integration
- Large file sizes
- Less mature documentation than eSMR

---

### Sanitary Sewer System (SSO) Flat Files

**API Availability**: 4/5
- Direct download URLs
- No authentication required
- Simple HTTP GET requests
- No formal API (just static file hosting)

**Data Value**: 4/5
- Spill events with detailed information (50.9 MB SSO.txt)
- Enrollee information (149 KB)
- Monthly no-spill certifications (13.3 MB)
- Private lateral spills (154 KB)
- Annual reports and SSMP compliance
- Valuable for sewer system compliance tracking

**Documentation**: 3/5
- Field descriptions on download page
- Clear explanation of data exclusions/inclusions
- Status field documented (Active vs Historical)
- Step field documented (Certified vs Amended)
- No comprehensive data dictionary

**Update Frequency**: 4/5
- Regular updates (frequency not specified)
- Data spans from 2007 to present
- Historical data preserved
- Some files split by regulatory order timeframe

**Simplicity**: 4/5
- Text files (tab-delimited)
- Simple flat file structure
- Easy to convert to Excel/CSV
- 11 files to manage
- Clear file naming convention

**TOTAL SCORE**: 19/25

**Strengths**:
- Simple download mechanism
- Clear file descriptions
- Comprehensive spill tracking
- Long historical record (2007-present)

**Weaknesses**:
- Not a formal API (just file hosting)
- Text format requires parsing
- Multiple files to coordinate
- Update frequency unclear
- Limited to sanitary sewer systems (not stormwater)

---

### CIWQS eSMR Data Report (Interactive Query)

**API Availability**: 2/5
- Interactive query tool only
- Excel export with 100,000 record limit
- No direct API access
- Requires manual interaction

**Data Value**: 5/5
- Same data as data.ca.gov eSMR
- Ability to filter by facility, agency, order, location
- Query by date range and report type
- Useful for targeted exports

**Documentation**: 4/5
- Same data dictionary as data.ca.gov version
- Query interface is self-explanatory
- CIWQS help available

**Update Frequency**: 5/5
- Nightly refresh
- More current than data.ca.gov monthly updates

**Simplicity**: 2/5
- Manual export required
- 100,000 record limit per query
- Excel format (not ideal for large datasets)
- No automation capability

**TOTAL SCORE**: 18/25

**Strengths**:
- Nightly updates (most current)
- Flexible query filters
- Same comprehensive data

**Weaknesses**:
- Not automatable
- Record limits require multiple exports
- Manual process
- Excel format limitations

---

### SMARTS Stormwater Data (data.ca.gov version recommended instead)

**API Availability**: 1/5
- Web interface only for SMARTS portal
- Data.ca.gov has API-accessible version
- Public reports appear to be web-based
- Download formats unclear

**Data Value**: 4/5
- NOI data by regional board
- Industrial, construction, municipal reports
- Compliance tracking
- QSD/QISP professional information

**Documentation**: 2/5
- Discharger's Guide available (PDF)
- Help guides for NOI submission
- Limited public data documentation
- Contact: stormwater@waterboards.ca.gov, (866) 563-3107

**Update Frequency**: 3/5
- Unknown update schedule for public downloads
- SMARTS database updated as submissions occur

**Simplicity**: 2/5
- Requires navigation through web interface
- Format of downloads unclear
- Manual export process
- Multiple report types to navigate

**TOTAL SCORE**: 12/25

**Strengths**:
- Comprehensive stormwater program coverage
- Multiple report types available
- Public access without login

**Weaknesses**:
- Use data.ca.gov version instead (better API)
- Unclear download formats
- Manual navigation required
- Poor automation potential

**Recommendation**: Skip SMARTS portal, use data.ca.gov stormwater dataset instead.

---

## Ranking Table

| Data Source | API | Value | Docs | Frequency | Simplicity | TOTAL | Recommendation |
|-------------|-----|-------|------|-----------|------------|-------|----------------|
| **eSMR Data (data.ca.gov)** | 5 | 5 | 4 | 5 | 5 | **24** | **START HERE** |
| Stormwater Data (data.ca.gov) | 5 | 5 | 2 | 5 | 3 | **20** | Second Priority |
| SSO Flat Files | 4 | 4 | 3 | 4 | 4 | **19** | Third Priority |
| CIWQS eSMR Report | 2 | 5 | 4 | 5 | 2 | **18** | Supplement only |
| SMARTS Portal | 1 | 4 | 2 | 3 | 2 | **12** | Skip - use data.ca.gov |

**Scoring Key**:
- **API**: 5=REST API, 4=stable URL, 3=exportable, 2=manual, 1=no access
- **Value**: 5=critical data, 4=very useful, 3=useful, 2=limited use, 1=low value
- **Docs**: 5=excellent, 4=good, 3=adequate, 2=limited, 1=none
- **Frequency**: 5=daily/weekly, 4=monthly, 3=quarterly, 2=annual, 1=static
- **Simplicity**: 5=single flat file, 4=few files, 3=moderate, 2=complex, 1=very complex

---

## Manual Export Requests

### Request 1: NPDES Permits Spreadsheet

```
MANUAL EXPORT REQUEST
=====================
Data Source: NPDES Permits Excel Spreadsheet
URL: https://www.waterboards.ca.gov/ciwqs/publicreports.html
Steps:
1. Navigate to "CIWQS Public Reports" page
2. Scroll to "Downloadable Spreadsheets" section
3. Click link for "NPDES Permits" spreadsheet
4. Save the Excel file when prompted
Export Format: Excel (.xlsx or .xls)
Save As: ./data/samples/npdes-permits.xlsx
Purpose: Understand facility identification schema, permit types, regional board
         assignments, and link between Regulatory Measure ID and facilities
Notes: This file lists NPDES permits including stormwater general permit enrollees
       that are active or have been active within past 3 years. May have multiple
       listings per permit due to multiple dischargers/facilities/addresses. Use
       Regulatory Measure ID (column E) as unique identifier.
```

### Request 2: Sample eSMR Data for Field Analysis

```
MANUAL EXPORT REQUEST
=====================
Data Source: eSMR Data Sample (2025 only)
URL: https://data.ca.gov/dataset/203e5d1f-ec9d-4d07-93aa-d8b74d3fe71f/resource/176a58bf-6f5d-4e3f-9ed9-592a509870eb/download/esmr-analytical-export_year-2025_2025-11-05.csv
Steps:
1. Use curl or wget to download:
   curl -o esmr-2025-sample.csv "[URL above]"
2. Open in Excel or analyze first 1000 rows:
   head -n 1000 esmr-2025-sample.csv > esmr-2025-sample-1k.csv
Export Format: CSV
Save As: ./data/samples/esmr-2025-sample-1k.csv
Purpose: Analyze actual field names, data types, value ranges, null patterns, and
         correlate with data dictionary to understand import requirements
File Size: 613 MB (full), suggest sampling first 1000-10000 records
```

### Request 3: Stormwater Industrial Facility Sample

```
MANUAL EXPORT REQUEST
=====================
Data Source: Industrial Discharge - Facility Information
URL: https://data.ca.gov/dataset/stormwater-regulatory-including-enforcement-actions-information-and-water-quality-results
Steps:
1. Download the "Industrial Discharge - Facility Information" CSV
2. File name should be: industrial_application_specific_data_YYYY-MM-DD.csv
3. Extract first 1000 rows for analysis:
   head -n 1000 industrial_application_specific_data_*.csv > industrial-facilities-sample.csv
Export Format: CSV
Save As: ./data/samples/industrial-facilities-sample.csv
Purpose: Understand facility registration schema, SIC codes, regional assignments,
         permit types, and NOI status fields for stormwater industrial program
File Size: 23.1 MB (full), sampling recommended
```

---

## Recommended Implementation Plan: eSMR Data Pipeline

### Phase 1: Foundation (Week 1)

**Objective**: Establish automated download and basic parsing

#### Tasks:
1. **Create data download service**
   ```typescript
   // lib/services/esmr-download.ts
   export async function downloadESMRData(year?: number) {
     const baseUrl = 'https://data.ca.gov/dataset/203e5d1f-ec9d-4d07-93aa-d8b74d3fe71f/resource/';
     // Use yearly files for incremental loading
     // Or full dataset for initial load
   }
   ```

2. **Set up database schema**
   ```prisma
   model ESMRSample {
     id                String   @id @default(cuid())
     facilityName      String
     permitNumber      String
     monitoringLocation String
     sampleDate        DateTime
     parameter         String
     result            Float?
     units             String?
     // ... additional fields from data dictionary
   }
   ```

3. **Implement CSV parser**
   - Use `csv-parser` or `papaparse`
   - Handle data type conversions
   - Log parsing errors
   - Create validation rules

4. **Download and parse data dictionary**
   - Extract field definitions
   - Map to database schema
   - Document any ambiguities

#### Success Criteria:
- [ ] Can download yearly eSMR CSV file programmatically
- [ ] Can parse CSV into JavaScript objects
- [ ] Database schema matches data dictionary
- [ ] Sample data (1000 records) loads successfully

---

### Phase 2: Data Transformation (Week 2)

**Objective**: Clean, validate, and normalize data for application use

#### Tasks:
1. **Data cleaning pipeline**
   - Handle null/missing values
   - Standardize date formats
   - Normalize facility names
   - Convert units where needed
   - Filter out excluded records (missing dates, pre-2006)

2. **Validation rules**
   - Date range validation (2006-present, not future dates)
   - Numeric range checks for analytical results
   - Required field validation
   - Cross-field validation (e.g., result matches expected parameter range)

3. **Facility linking**
   - Extract unique facility identifiers
   - Create facility master table
   - Link samples to facilities
   - Geocode facilities if coordinates available

4. **Parameter standardization**
   - Create parameter lookup table
   - Group related parameters
   - Standardize parameter names
   - Document parameter categories

#### Success Criteria:
- [ ] 100,000+ records processed without errors
- [ ] Data validation catches anomalies
- [ ] Facilities properly deduplicated
- [ ] Parameters normalized and categorized

---

### Phase 3: Incremental Updates (Week 3)

**Objective**: Automate monthly updates without full reloads

#### Tasks:
1. **Change detection**
   - Track last import date
   - Download only new yearly file if needed
   - Implement upsert logic (update existing, insert new)
   - Handle late-arriving data corrections

2. **Scheduling**
   - Set up monthly cron job (first week of month)
   - Email notifications on success/failure
   - Log import statistics (records added, updated, errors)

3. **Data freshness tracking**
   - Store metadata about last import
   - Display data freshness in UI
   - Alert if data becomes stale (>45 days)

4. **Error recovery**
   - Retry failed downloads
   - Rollback on validation failures
   - Maintain import history/audit log

#### Success Criteria:
- [ ] Automated monthly import runs successfully
- [ ] Only new/changed records processed
- [ ] Failed imports don't corrupt existing data
- [ ] Import metrics tracked and visible

---

### Phase 4: API Integration (Week 4)

**Objective**: Expose eSMR data through application API

#### Tasks:
1. **Query API endpoints**
   ```typescript
   // app/api/esmr/samples/route.ts
   // GET /api/esmr/samples?facility=ABC&startDate=2024-01-01&parameter=pH
   // Returns paginated sample results
   ```

2. **Aggregation endpoints**
   ```typescript
   // app/api/esmr/summary/route.ts
   // GET /api/esmr/summary?facility=ABC&year=2024
   // Returns summary statistics, parameter averages, compliance indicators
   ```

3. **Facility search**
   ```typescript
   // app/api/facilities/route.ts
   // GET /api/facilities?name=XYZ&county=Los+Angeles
   // Returns facilities with eSMR data available
   ```

4. **Visualization preparation**
   - Time series data for charting
   - Comparison across facilities
   - Compliance trend analysis
   - Parameter distribution statistics

#### Success Criteria:
- [ ] API endpoints respond in <500ms for typical queries
- [ ] Pagination works correctly
- [ ] Filtering by facility, date, parameter works
- [ ] Data formatted for frontend consumption

---

### Phase 5: UI Integration (Week 5)

**Objective**: Display eSMR data in application interface

#### Tasks:
1. **Facility detail enhancement**
   - Add "Monitoring Data" tab to facility pages
   - Display recent sample results
   - Show compliance trends
   - Link to source data in CIWQS

2. **Data visualization**
   - Time series charts for key parameters (pH, TSS, BOD, etc.)
   - Comparison to permit limits
   - Exceedance highlighting
   - Download filtered results as CSV

3. **Search and filter**
   - Facility search with eSMR data indicator
   - Filter by parameter type
   - Date range selection
   - Regional board filtering

4. **Data quality indicators**
   - Show data freshness
   - Indicate incomplete records
   - Link to data dictionary
   - Provide context about eSMR vs other monitoring

#### Success Criteria:
- [ ] Users can view facility monitoring data
- [ ] Charts render correctly with real data
- [ ] Search and filters work smoothly
- [ ] UI clearly indicates data source and freshness

---

### Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Monthly Scheduled Job                     │
│                  (Vercel Cron / GitHub Actions)               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Download Service                           │
│  • Fetch yearly CSV from data.ca.gov                         │
│  • Validate file integrity                                   │
│  • Stream processing for large files                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   ETL Pipeline                               │
│  • Parse CSV rows                                            │
│  • Clean and validate data                                   │
│  • Transform to schema format                                │
│  • Batch insert/update to database                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                         │
│  Tables:                                                      │
│  • esmr_samples (main fact table)                            │
│  • esmr_facilities (dimension)                               │
│  • esmr_parameters (dimension)                               │
│  • esmr_import_log (audit)                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js API Routes                          │
│  • /api/esmr/samples - query samples                         │
│  • /api/esmr/summary - aggregations                          │
│  • /api/facilities - facility search                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   React Components                            │
│  • FacilityMonitoringData.tsx                                │
│  • SampleChart.tsx (already exists!)                         │
│  • ESMRDataTable.tsx                                         │
│  • ComplianceTrends.tsx                                      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Example

```
1. Monthly cron triggers download
2. Download 2025 eSMR CSV (613 MB)
3. Stream parse CSV (avoid memory issues)
4. For each row:
   a. Validate required fields
   b. Parse dates, numbers
   c. Normalize facility ID
   d. Lookup/create facility record
   e. Lookup/create parameter record
   f. Upsert sample record
5. Log statistics:
   - Records processed: 2,350,000
   - New records: 185,000
   - Updated records: 425
   - Errors: 12 (logged separately)
6. Send notification email with summary
```

---

### Key Implementation Considerations

#### 1. Performance
- **Large file handling**: Use streaming CSV parser (csv-parser, fast-csv)
- **Batch inserts**: Insert 1000-5000 records at a time
- **Indexing**: Add indexes on facility_id, sample_date, parameter
- **Partitioning**: Consider partitioning by year for very large tables

#### 2. Data Quality
- **Validation before insert**: Don't pollute database with bad data
- **Error logging**: Separate table for rejected records
- **Data profiling**: Run statistics on each import to detect anomalies
- **Manual review queue**: Flag unusual values for review

#### 3. Monitoring
- **Import metrics**: Track duration, records processed, error rate
- **Data freshness**: Alert if data becomes stale
- **Storage growth**: Monitor database size
- **Query performance**: Track slow queries

#### 4. Compliance with Data License
- **Attribution**: Display "Data source: California State Water Resources Control Board"
- **Link to source**: Provide link to data.ca.gov dataset
- **Freshness indicator**: Show "Last updated: [date]"
- **No redistribution**: Don't allow bulk export of processed data

#### 5. Future Enhancements
- **Link to NPDES permits**: Join with permit data for context
- **Compliance calculations**: Compare results to permit limits
- **Trend analysis**: Calculate rolling averages, detect trends
- **Alert system**: Notify when facilities exceed limits
- **Export to Excel**: Allow filtered export for analysis
- **API rate limiting**: Protect backend if exposing data publicly

---

## Additional Resources

### Official Documentation
- **CIWQS Help Center**: ciwqs@waterboards.ca.gov, (866) 792-4977
- **SMARTS Help Center**: stormwater@waterboards.ca.gov, (866) 563-3107
- **Water Boards GitHub**: https://github.com/CAWaterBoardDataCenter
- **Water Boards Data Contact**: waterdata@waterboards.ca.gov

### Data Portal URLs
- **California Open Data**: https://data.ca.gov/group/water
- **CNRA Open Data**: https://data.cnra.ca.gov
- **CIWQS Public Reports**: https://www.waterboards.ca.gov/ciwqs/publicreports.html
- **SMARTS Public Reports**: https://smarts.waterboards.ca.gov/smarts/SwPublicUserMenu.xhtml

### API Documentation
- **CKAN API Guide**: https://docs.ckan.org/en/2.9/api/
- **CNRA API Documentation**: https://data.cnra.ca.gov/pages/api

---

## Verification Checklist

- [x] data.ca.gov has been searched for Water Board datasets
- [x] At least one API endpoint has been documented (CKAN API for eSMR data)
- [x] SMARTS public downloads have been documented
- [x] CIWQS public downloads have been documented
- [x] A clear #1 recommendation has been made (eSMR Data from data.ca.gov)
- [x] Justification provided with scoring rubric
- [x] Manual exports documented with exact instructions
- [x] Implementation plan created for recommended source
- [x] Technical architecture designed
- [x] Performance and compliance considerations addressed

---

## Next Steps

1. **Download sample data** using Manual Export Requests above
2. **Review data dictionary** to finalize database schema
3. **Create proof-of-concept** parser for 1000 records
4. **Validate data quality** and assess cleaning requirements
5. **Estimate infrastructure costs** (storage, compute for monthly imports)
6. **Begin Phase 1 implementation** following plan above

---

*Research completed: November 29, 2025*
*Researcher: Claude (Sonnet 4.5)*
*Document version: 1.0*
