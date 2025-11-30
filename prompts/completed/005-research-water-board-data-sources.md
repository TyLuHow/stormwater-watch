<research_objective>
Research California Water Board data sources (SMARTS and CIWQS) to identify the easiest single data source for building the first automation pipeline.

This research will inform the design of data import automations for a storm water compliance application. The goal is to find a data source that:
1. Has reliable programmatic access (API or stable download URLs)
2. Contains valuable data for the application
3. Is well-documented with clear field definitions
4. Can serve as a foundation for more complex imports later
</research_objective>

<scope>
Focus on these California Water Board systems:

**SMARTS (Storm Water Multi-Application and Report Tracking System)**
- URL: https://smarts.waterboards.ca.gov/
- Public reports: https://smarts.waterboards.ca.gov/smarts/faces/SwSmartsPublicReports.xhtml
- Data types: NOI data, facility info, storm water reports (Industrial, Construction, Municipal)

**CIWQS (California Integrated Water Quality System)**
- URL: https://ciwqs.waterboards.ca.gov/
- Public reports: https://ciwqs.waterboards.ca.gov/ciwqs/publicReports.jsp
- Data types: eSMR data, violations, enforcement, facility data, SSO reports

**data.ca.gov**
- eSMR Data by Year (CSV/Parquet with Data API)
- Other Water Board datasets
</scope>

<research_tasks>

<task priority="1">
<name>Explore data.ca.gov Water Board datasets</name>
<actions>
1. Search data.ca.gov for Water Board datasets
2. Find the eSMR Data endpoint and document:
   - API endpoint URL
   - Available query parameters
   - Data format (CSV, JSON, Parquet)
   - Update frequency
   - Field schema/data dictionary
3. Identify any other relevant datasets (facilities, violations, permits)
4. Test API accessibility with sample queries
</actions>
<output>Document API endpoints, schemas, and sample data for each discovered dataset</output>
</task>

<task priority="2">
<name>Analyze SMARTS public data exports</name>
<actions>
1. Navigate to SMARTS public reports
2. Identify downloadable data:
   - "Download NOI Data By Regional Board" - what format? What fields?
   - Storm Water Reports - are these downloadable as data or just PDFs?
3. If direct download URLs exist, document them
4. If manual export is needed, provide EXACT navigation path:
   - Example: "Go to https://smarts.waterboards.ca.gov/... → Click 'Download NOI Data' → Select Region 4 → Export CSV"
</actions>
<output>List of available SMARTS data exports with access methods</output>
</task>

<task priority="3">
<name>Analyze CIWQS public data exports</name>
<actions>
1. Navigate to CIWQS public reports
2. Focus on these reports that likely have data exports:
   - eSMR Data Report (Excel format mentioned)
   - Sanitary Sewer System Data Flat Files
   - NPDES Permits spreadsheet
   - Facility At-A-Glance
3. Document download URLs and formats
4. For interactive reports, note if they have export functionality
</actions>
<output>List of available CIWQS data exports with access methods</output>
</task>

<task priority="4">
<name>Request manual exports for field analysis</name>
<instructions>
When you encounter a data source that:
- Requires login or manual navigation to export
- Has no API documentation
- Needs a sample to understand the schema

Request a manual export from the user with this format:

```
MANUAL EXPORT REQUEST
=====================
Data Source: [Name]
URL: [Full URL to navigate to]
Steps:
1. [Exact step-by-step instructions]
2. [Include button names, dropdown selections]
3. [Specify any filters to apply]
Export Format: [CSV/Excel/etc]
Save As: ./data/samples/[descriptive-filename].csv
Purpose: [What fields/schema you need to understand]
```
</instructions>
</task>

<task priority="5">
<name>Evaluate and rank data sources</name>
<criteria>
Score each data source (1-5) on:
- **API Availability**: 5=REST API, 4=stable download URL, 3=exportable, 2=manual only, 1=no access
- **Data Value**: How useful for storm water compliance app
- **Documentation**: Quality of field definitions and data dictionary
- **Update Frequency**: How often data is refreshed
- **Complexity**: Inverse of difficulty (5=simple flat file, 1=complex nested data)
</criteria>
<output>
Create a ranked table:
| Data Source | API | Value | Docs | Frequency | Simplicity | TOTAL | Recommendation |
</output>
</task>

</research_tasks>

<deliverables>

<deliverable type="primary">
<name>Data Source Ranking and Recommendation</name>
<content>
A clear recommendation for which data source to automate FIRST, including:
1. Why this source ranks highest
2. What the automation will do
3. What database tables/models are needed
4. Estimated complexity
</content>
</deliverable>

<deliverable type="secondary">
<name>Field Schema Documentation</name>
<content>
For the top 3 recommended sources, document:
- All available fields
- Data types
- Sample values
- Mapping to application concepts (facilities, permits, samples, violations)
</content>
</deliverable>

<deliverable type="tertiary">
<name>Manual Export Requests</name>
<content>
If any data sources require manual export for analysis, compile all requests in a single list with exact instructions.
</content>
</deliverable>

</deliverables>

<output_format>
Save findings to: `./research/water-board-data-sources.md`

Structure:
1. Executive Summary (recommended first automation)
2. Data Source Inventory (all discovered sources)
3. Detailed Analysis (per source)
4. Ranking Table
5. Manual Export Requests (if any)
6. Recommended Implementation Plan for #1 source
</output_format>

<verification>
Before completing, verify:
- [ ] data.ca.gov has been searched for Water Board datasets
- [ ] At least one API endpoint has been tested
- [ ] SMARTS public downloads have been documented
- [ ] CIWQS public downloads have been documented
- [ ] A clear #1 recommendation has been made with justification
- [ ] Any needed manual exports have been requested with exact instructions
</verification>
