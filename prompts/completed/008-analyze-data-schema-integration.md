<research_objective>
Thoroughly analyze the actual data from eSMR and SMARTS datasets to design a comprehensive, integrated database schema that supports the complete Stormwater Watch system. This research will download and examine real data samples to understand structure, relationships, data quality, and integration requirements.

The goal is to create a unified schema design that efficiently stores and relates all datasets (eSMR monitoring data + 7 SMARTS datasets) while supporting the platform's core features: violation detection, facility tracking, enforcement monitoring, and alert subscriptions.
</research_objective>

<context>
**Current State:**
- Existing eSMR schema implemented in @prisma/schema.prisma
- eSMR data actively syncing (facilities, locations, samples, parameters)
- Violations computed from eSMR samples against water quality benchmarks
- Planning to add 7 SMARTS datasets (see @prompts/003-smarts-ciwqs-automation-strategy.md)

**Available Resources:**
- Research on data sources: @research/water-board-data-sources.md
- SMARTS automation strategy: @prompts/003-smarts-ciwqs-automation-strategy.md (contains proposed schema)
- Current schema: @prisma/schema.prisma
- Existing eSMR sync: @app/api/cron/esmr-sync/route.ts

**The Challenge:**
We have conceptual schema designs but need to validate them against REAL data. The SMARTS datasets have no published data dictionary, so we must infer schema from actual data samples.
</context>

<scope>
This research will comprehensively analyze data from multiple sources to design an integrated schema.

## Part 1: Download Sample Data

Download first 1000-5000 rows from each dataset for analysis:

**eSMR Data** (already have this, but verify current structure):
- Latest eSMR samples from existing database
- Check what fields are actually populated vs always null
- Understand real-world data patterns

**SMARTS Datasets** (7 CSV files from data.ca.gov):
1. Industrial Discharge - Facility Information (23.1 MB)
2. Industrial Discharge - Monitoring Data (644.6 MB)
3. Construction Activity - Facility Information (91.1 MB)
4. Construction Activity - Monitoring Data (324.5 MB)
5. Inspections (51.4 MB)
6. Violations (32.9 MB)
7. Enforcement Actions (35.5 MB)

For each file:
- Download first 5000 rows to `./data/samples/smarts-[dataset-name]-sample.csv`
- If file has headers, preserve them
- Use curl or similar to download from data.ca.gov

## Part 2: Data Structure Analysis

For each dataset, thoroughly analyze and document:

**Field Discovery:**
- List all columns/fields with data types inferred from values
- Identify primary keys and unique identifiers
- Find foreign key relationships (fields that reference other datasets)
- Note field naming patterns and conventions

**Data Quality Assessment:**
- % of null/missing values per field
- Data type consistency (e.g., dates always formatted same way?)
- Value ranges and distributions
- Anomalies or data quality issues
- Fields that are always the same value (candidates for removal)

**Relationship Mapping:**
- How does this dataset relate to others?
- What fields serve as join keys?
- One-to-many vs many-to-many relationships
- Cross-dataset entity references (e.g., facility IDs)

## Part 3: Entity Relationship Design

Design the complete integrated schema:

**Core Entities:**
Identify and define all entities across eSMR + SMARTS:
- Facilities (how do eSMR and SMARTS facilities relate?)
- Monitoring locations
- Samples/measurements
- Parameters/pollutants
- Violations
- Enforcement actions
- Inspections
- Permits
- Regions

**Relationships:**
Map all relationships between entities:
- Facility → Locations → Samples (existing eSMR pattern)
- Facility → Violations → Enforcement (SMARTS pattern)
- How to link eSMR facilities to SMARTS facilities?
- Violation detection from monitoring data
- Inspection → Violation relationships

**Normalization Strategy:**
- What should be normalized (separate tables)?
- What can be denormalized for query performance?
- Lookup tables vs embedded enums
- Historical data tracking (created_at, updated_at, last_seen_at)

## Part 4: Integration Challenges

Identify and propose solutions for:

**Facility Matching:**
- eSMR facilities have `facilityPlaceId` (integer)
- SMARTS facilities likely have different IDs
- How to match facilities across systems?
- Need for linking table or unified facility model?

**Data Type Conflicts:**
- If same concept has different types in different datasets
- String vs numeric IDs
- Date format variations
- Unit conversions

**Duplicate Data:**
- Do eSMR and SMARTS have overlapping data?
- Which source is authoritative for what?
- How to handle conflicts?

**Hierarchical Data:**
- Regions → Facilities → Locations → Samples
- How deep should the hierarchy go?
- Where to denormalize for performance?

## Part 5: Performance Considerations

**Index Strategy:**
- What fields will be queried most frequently?
- Composite indexes for common query patterns
- Balance between query speed and write performance

**Data Volume Projections:**
- Estimate total rows per table based on sample data
- Project growth over time (weekly incremental loads)
- Identify large tables that need partitioning

**Query Patterns:**
- How will violations be queried? (by facility, date, pollutant, severity)
- How will facilities be searched? (by location, name, permit)
- Dashboard aggregations needed
- Alert subscription matching queries

## Part 6: Prisma Schema Design

Create the complete, production-ready Prisma schema including:

**All Models:**
- Keep existing eSMR models
- Add SMARTS models
- Add integration/linking models
- Include proper relationships (@relation)

**Data Types:**
- Map CSV data types to Prisma/PostgreSQL types
- Handle nullable vs required fields based on real data
- Use appropriate precision for decimals (e.g., @db.Decimal(12, 6))

**Indexes:**
- @@index for all foreign keys
- @@index for frequently queried fields
- @@unique for natural keys
- Composite indexes for common query patterns

**Constraints:**
- @@unique constraints to prevent duplicates
- Cascading deletes where appropriate (onDelete: Cascade)
- Required vs optional fields based on data analysis
</scope>

<deliverables>
Create a comprehensive research report with the following sections:

## 1. Executive Summary
- Overview of all datasets analyzed
- Key findings and recommendations
- Schema complexity assessment (number of tables, relationships)
- Data quality summary

## 2. Data Sample Analysis
For each of the 8 datasets (1 eSMR + 7 SMARTS):

### Dataset Name
- **Source**: URL and file details
- **Sample size**: Number of rows analyzed
- **Fields**: Complete field list with inferred types
- **Sample data**: 3-5 example rows (formatted)
- **Data quality**: Null percentages, anomalies, issues
- **Key identifiers**: Primary keys, foreign keys
- **Relationships**: How this connects to other datasets

## 3. Entity-Relationship Diagram
- ASCII diagram showing all entities and relationships
- Cardinality notation (1:1, 1:N, N:M)
- Key fields for each entity

## 4. Integration Strategy
- How eSMR and SMARTS facilities will be linked
- Handling of duplicate/overlapping data
- Data type resolution strategies
- Conflict resolution rules

## 5. Complete Prisma Schema
- Full schema code ready for implementation
- All models, relationships, indexes
- Comments explaining design decisions
- Migration strategy notes

## 6. Performance Analysis
- Estimated table sizes
- Recommended indexes with rationale
- Query optimization suggestions
- Partitioning recommendations if needed

## 7. Implementation Recommendations
- Schema migration plan (what to build first)
- Data quality concerns to address during import
- Validation rules needed
- Edge cases to handle

## 8. Appendices
- **Appendix A**: Sample data files (in `./data/samples/`)
- **Appendix B**: Data quality statistics
- **Appendix C**: Alternative schema designs considered

Save primary report to: `./research/data-schema-integration-analysis.md`
Save Prisma schema to: `./prisma/schema-integrated-proposed.prisma`
Save sample data files to: `./data/samples/smarts-*.csv`
</deliverables>

<research_methodology>

**Step 1: Gather Sample Data**
1. Identify data.ca.gov URLs for all 7 SMARTS datasets
   - Use WebSearch if URLs not in existing research docs
   - Look for direct CSV download links or CKAN API endpoints

2. Download samples using bash commands:
   ```bash
   # Create directory
   mkdir -p ./data/samples

   # Download with curl, limit to first 5000 rows
   curl "URL" | head -5000 > ./data/samples/smarts-violations-sample.csv
   ```

3. Extract current eSMR data from database:
   ```bash
   # Use Prisma or direct SQL to get sample eSMR data
   ```

**Step 2: Analyze Each Dataset**
1. Read CSV files using Read tool
2. Parse headers and infer field types
3. Calculate data quality metrics:
   - Count rows
   - Count nulls per column
   - Identify unique values for potential FKs
   - Find data type inconsistencies

4. Create field inventory spreadsheet (markdown table)

**Step 3: Map Relationships**
1. Identify ID fields across datasets
2. Look for common identifiers (facility IDs, permit numbers)
3. Cross-reference field names (e.g., "facility_id" in multiple files)
4. Test sample joins to validate relationships

**Step 4: Design Schema**
1. Start with existing eSMR schema as baseline
2. Add SMARTS entities one at a time
3. Define relationships and foreign keys
4. Add indexes based on expected query patterns
5. Review for normalization vs performance tradeoffs

**Step 5: Validate Design**
1. Check schema can answer key business questions:
   - "Show all violations for facility X"
   - "Find repeat offenders in region Y"
   - "List enforcement actions for pollutant Z"
2. Estimate query performance
3. Verify all relationships are navigable
</research_methodology>

<success_criteria>
- [ ] Sample data downloaded for all 7 SMARTS datasets (5000 rows each)
- [ ] Current eSMR data structure documented from existing DB
- [ ] Complete field inventory for all 8 datasets with data types
- [ ] Data quality metrics calculated (null %, anomalies)
- [ ] All entity relationships mapped with cardinality
- [ ] Facility linking strategy defined (eSMR ↔ SMARTS)
- [ ] Complete Prisma schema created with all models
- [ ] All foreign keys and indexes specified
- [ ] ER diagram illustrating complete system
- [ ] Performance analysis with table size estimates
- [ ] Implementation roadmap with migration steps
- [ ] Research report saved to `./research/data-schema-integration-analysis.md`
- [ ] Proposed schema saved to `./prisma/schema-integrated-proposed.prisma`
</success_criteria>

<verification>
Before completing, verify:

**Data Coverage:**
- All 7 SMARTS datasets have been analyzed
- Current eSMR structure is accurately documented
- Sample data represents real production data patterns

**Schema Completeness:**
- Every entity from source data is represented
- All relationships are bidirectional (can navigate both ways)
- No orphaned entities (everything connects to the graph)
- Primary keys defined for all tables
- Foreign keys match types exactly

**Practical Validation:**
- Schema can answer the 10 key business questions (list them)
- No N+1 query problems in common access patterns
- Indexes support subscription matching queries
- Can compute violations from monitoring data efficiently

**Implementation Readiness:**
- Prisma schema is syntactically valid (can be parsed)
- Migration strategy is clear and achievable
- Data quality issues have mitigation plans
- Edge cases are documented

**Documentation Quality:**
- ER diagram is clear and complete
- Field inventory is comprehensive
- Design decisions are explained
- Alternative approaches are noted
</verification>

<tools_and_commands>
You'll need to use these tools extensively:

**For data download:**
```bash
# Create directories
mkdir -p ./data/samples

# Download SMARTS samples (find URLs from data.ca.gov)
curl -o ./data/samples/smarts-violations-sample.csv \
  "https://data.ca.gov/dataset/.../violations.csv" | head -5000
```

**For data analysis:**
- Read tool: Read CSV files, examine structure
- Bash: Count rows, calculate statistics
- Grep: Search for patterns in data

**For schema design:**
- Read: Examine @prisma/schema.prisma for existing patterns
- Write: Create new proposed schema

**For research:**
- WebSearch: Find current data.ca.gov URLs (they may have changed)
- WebFetch: Get CKAN API metadata for datasets
</tools_and_commands>

<key_questions_to_answer>
The research must definitively answer these questions:

1. **Facility Integration**: How do we unify eSMR facilities and SMARTS facilities into a single Facility model?
2. **Violation Source**: Do violations come from eSMR data, SMARTS data, or both? How to handle duplicates?
3. **Monitoring vs Violations**: What's the relationship between monitoring data and violations? Are they separate or computed?
4. **Permit Tracking**: Where do permit IDs come from? Are they in eSMR, SMARTS, or both?
5. **Regional Hierarchy**: How do regions relate to facilities? Are regions consistent across eSMR and SMARTS?
6. **Inspection-Violation Link**: When an inspection finds a violation, how is that recorded?
7. **Enforcement Triggers**: What links enforcement actions to violations? Is it always 1:1?
8. **Location Granularity**: Do SMARTS datasets have monitoring locations like eSMR, or just facility-level?
9. **Parameter Standardization**: Are pollutant/parameter names consistent across eSMR and SMARTS?
10. **Temporal Data**: How do we track changes over time? Which tables need created_at, updated_at, last_seen_at?

Every question must have a clear answer backed by actual data evidence.
</key_questions_to_answer>

<additional_context>
**Why This Matters:**
This schema will be the foundation of the entire Stormwater Watch platform. Getting it wrong means expensive refactoring later. We need to design it correctly upfront based on real data, not assumptions.

**Current Pain Points:**
- Proposed SMARTS schema in @prompts/003-smarts-ciwqs-automation-strategy.md is conceptual
- No data dictionary exists for SMARTS datasets
- Don't know if eSMR and SMARTS facilities can be easily matched
- Unclear if there's data overlap that could cause duplicates

**Success Looks Like:**
- A schema that stores all data efficiently
- Clear path to compute violations from monitoring data
- Facility profiles that show eSMR + SMARTS data together
- Fast queries for alerts and dashboards
- Schema that scales to millions of records
</additional_context>
