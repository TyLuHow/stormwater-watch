<objective>
Analyze the actual eSMR (Electronic Self-Monitoring Report) CSV data to discover the true schema structure, compare it against the data dictionary, and design an optimal database schema that faithfully represents the source data.

This is a data-first approach: let the actual data structure drive the schema design rather than forcing it into an existing model.
</objective>

<context>
**Data Source**: California State Water Resources Control Board eSMR Data
- Dataset: https://data.ca.gov/dataset/water-quality-effluent-electronic-self-monitoring-report-esmr-data
- 2025 CSV (~613MB): Contains actual field names and data
- Data Dictionary (PDF): https://data.ca.gov/dataset/203e5d1f-ec9d-4d07-93aa-d8b74d3fe71f/resource/675b79d9-a2ec-4685-980e-8b5881ea2251/download/esmr_data_dictionary.pdf

**Existing Schema Context**:
Review `./prisma/schema.prisma` to understand current models (Facility, Sample, etc.) but DO NOT constrain the new schema to fit these. The goal is to design what makes most sense for the eSMR data.

**Research Context**:
Review `./research/water-board-data-sources.md` for background on data sources.
</context>

<tasks>

<task name="download-sample">
Download a sample of the actual eSMR CSV data for analysis.

```bash
# Create data directory
mkdir -p ./data/esmr

# Download first 5000 lines (header + 4999 records) for analysis
curl -s "https://data.ca.gov/dataset/203e5d1f-ec9d-4d07-93aa-d8b74d3fe71f/resource/176a58bf-6f5d-4e3f-9ed9-592a509870eb/download/esmr-analytical-export_year-2025_2025-11-05.csv" | head -5000 > ./data/esmr/sample-2025.csv

# Also get just the header to see all columns
head -1 ./data/esmr/sample-2025.csv > ./data/esmr/columns.txt
```

If the download fails or URL has changed, search data.ca.gov for the current eSMR dataset URL.
</task>

<task name="analyze-columns">
Analyze every column in the CSV:

1. List all column names exactly as they appear
2. For each column, determine:
   - Data type (string, integer, decimal, date, boolean, etc.)
   - Nullable? (are there empty values?)
   - Sample values (3-5 examples)
   - Cardinality (unique count estimate: high/medium/low)
   - Potential as primary key or foreign key

Create a comprehensive field inventory.
</task>

<task name="identify-entities">
Analyze the data to identify distinct entities and relationships:

1. **Facility/Location entity**: Which fields describe WHERE sampling occurs?
   - Facility identifiers, names, addresses, coordinates
   - Permit numbers, regulatory measures
   - Regional board assignments

2. **Sample/Measurement entity**: Which fields describe WHAT was measured?
   - Sample dates, collection info
   - Parameters/constituents measured
   - Results, units, detection limits
   - Regulatory limits, exceedances

3. **Reference/Lookup entities**: Which fields are categorical and should be normalized?
   - Parameter types
   - Unit types
   - Sample types
   - Monitoring locations

4. **Relationships**: How do entities relate?
   - One facility → many samples
   - One sample → one parameter (or many?)
   - Hierarchical relationships (region → facility → location)
</task>

<task name="compare-dictionary">
If the data dictionary PDF can be accessed/parsed:
1. Compare documented fields to actual CSV columns
2. Note any discrepancies (missing fields, extra fields, name differences)
3. Use dictionary descriptions to clarify field purposes
4. Document any ambiguities that need resolution
</task>

<task name="design-schema">
Design an optimal Prisma schema based on analysis:

**Design Principles**:
1. **Preserve source fidelity**: Don't lose data by over-normalizing
2. **Enable efficient queries**: Index fields used for filtering/joining
3. **Support incremental imports**: Include fields for tracking data lineage
4. **Consider scale**: 19 years of data, potentially millions of records

**Schema Requirements**:
- Use appropriate Prisma types (@db.Decimal for precision, @db.Date for dates, etc.)
- Add indexes for common query patterns
- Include created/updated timestamps
- Consider partitioning strategy for large tables
- Document each model and field with comments

**Output format**: Provide complete Prisma model definitions ready to add to schema.prisma
</task>

<task name="migration-strategy">
Recommend how the new schema should relate to existing models:

Options to evaluate:
1. **Separate tables**: ESMRFacility, ESMRSample as independent tables
2. **Shared facility table**: Link eSMR data to existing Facility model
3. **View-based integration**: Raw eSMR tables + views that map to app concepts
4. **Replace existing**: Migrate existing Sample/Facility to new eSMR-based schema

Provide pros/cons and recommendation.
</task>

</tasks>

<output>
Save analysis to: `./research/esmr-schema-analysis.md`

Structure:
1. **Executive Summary**: Key findings and recommended schema approach
2. **Column Inventory**: Complete list of all CSV fields with analysis
3. **Entity Analysis**: Identified entities and relationships
4. **Data Dictionary Comparison**: Discrepancies and clarifications
5. **Recommended Prisma Schema**: Complete model definitions
6. **Migration Strategy**: How to integrate with existing schema
7. **Open Questions**: Any ambiguities needing user input

Also create: `./prisma/schema-esmr-proposed.prisma`
- Contains ONLY the new eSMR-related models
- Ready to be merged into main schema.prisma after review
</output>

<verification>
Before completing:
- [ ] Sample CSV downloaded successfully (./data/esmr/sample-2025.csv exists)
- [ ] All CSV columns documented with types and examples
- [ ] Entity relationships clearly identified
- [ ] Prisma schema is syntactically valid
- [ ] Schema includes appropriate indexes
- [ ] Migration strategy recommendation is clear
- [ ] Any blocking questions are documented
</verification>

<success_criteria>
- Complete field inventory of actual eSMR data
- Clear entity/relationship model derived from data
- Production-ready Prisma schema that preserves data fidelity
- Actionable migration strategy recommendation
- Analysis document suitable for review before implementation
</success_criteria>
