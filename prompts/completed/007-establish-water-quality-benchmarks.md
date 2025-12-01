# Prompt 007: Establish Comprehensive Water Quality Benchmark Values

<metadata>
created: 2024-11-30
complexity: ultrathink
scope: regulatory + health-based benchmarks
parameters: all eSMR + high-priority pollutants
outputs: database seed, JSON config, research report
</metadata>

<objective>
Establish a comprehensive, authoritative water quality benchmark system by:
1. Researching and compiling benchmark values from multiple regulatory and health-based sources
2. Mapping 899 eSMR parameters to standardized pollutant names with aliases
3. Categorizing all parameters into logical groups
4. Creating a multi-tier benchmark hierarchy (regulatory NALs, drinking water MCLs, aquatic life criteria)
5. Generating database seed files, JSON configuration, and a research report

This enables the application to automatically detect violations by comparing eSMR sample results against established thresholds.
</objective>

<context>
## Current Database State

### eSMR Parameters (899 total, all uncategorized)
The database contains 899 unique parameters from eSMR data. Examples include:
- Chemical compounds: 1-Methylnaphthalene, 1,1-Dichloroethane, 1,1-Dichloroethylene
- Metals: Various forms of copper, zinc, lead, arsenic, mercury
- Organics: Benzene, toluene, xylenes, PCBs
- Nutrients: Nitrate, nitrite, ammonia, phosphorus
- Conventional: pH, TSS, BOD, COD, oil and grease

### Existing ConfigPollutant Entries (6 records)
```
COPPER:    unit=µg/L, aliases=[Copper, CU, Total Copper, Cu]
ZINC:      unit=µg/L, aliases=[Zinc, ZN, Total Zinc, Zn]
TSS:       unit=mg/L, aliases=[Total Suspended Solids, TSS, Suspended Solids]
O&G:       unit=mg/L, aliases=[Oil and Grease, O&G, Oil & Grease, O/G]
PH:        unit=pH,   aliases=[pH, PH VALUE, pH Value]
TURBIDITY: unit=NTU,  aliases=[Turbidity, TURB]
```

### ConfigPollutant Schema
```prisma
model ConfigPollutant {
  key           String   @id      // e.g., "TSS", "COPPER"
  aliases       String[]          // Array of alternate names
  canonicalUnit String            // e.g., "mg/L", "µg/L"
  notes         String?  @db.Text // Reference notes
}
```

**CRITICAL GAP**: The current ConfigPollutant model lacks benchmark value fields. The schema needs to be extended to include:
- `benchmarkValue`: The numeric threshold
- `benchmarkType`: Type of benchmark (NAL, MCL, CCC, CMC, etc.)
- `benchmarkSource`: Regulatory source (IGP, EPA, WHO, etc.)
- `category`: Parameter category for grouping
</context>

<research_findings>
## 1. California Industrial General Permit (IGP) - Order 2014-0057-DWQ

### Overview
- Primary regulatory framework for industrial stormwater in California
- Effective July 1, 2020 (administratively continued after June 30, 2020 expiration)
- New permit expected Spring 2025 with potential PFAS NALs
- Table 2 contains Numeric Action Levels (NALs)

### NAL Types
1. **Annual NAL**: Average of all analytical results for a parameter within reporting year
2. **Instantaneous Maximum NAL**: Single sample threshold (only pH, TSS, O&G)

### Confirmed NAL Values from Research

| Parameter | Annual NAL | Instantaneous NAL | Units | Notes |
|-----------|-----------|-------------------|-------|-------|
| pH | 6.0-9.0 | 6.0-9.0 | pH units | Range-based |
| Total Suspended Solids (TSS) | 100 | 400 | mg/L | Both annual and instant |
| Oil and Grease (O&G) | 15 | 25 | mg/L | Both annual and instant |
| Copper (Total) | 0.0332 | — | mg/L | 33.2 µg/L |
| Zinc (Total) | 0.26 | — | mg/L | 260 µg/L |
| Iron (Total) | 1.0 | — | mg/L | |
| Aluminum (Total) | 0.75 | — | mg/L | 750 µg/L |

### Additional Parameters Requiring Research
The complete IGP Table 2 includes NALs for:
- Antimony, Arsenic, Beryllium, Cadmium, Chromium (III and VI)
- Lead, Magnesium, Mercury, Nickel, Selenium, Silver
- Nitrate + Nitrite nitrogen, Ammonia, COD, BOD
- Sector-specific parameters based on SIC codes

### Level Status System
- **Baseline**: No NAL exceedances
- **Level 1**: Annual NAL exceeded OR 2+ instantaneous NAL exceedances
- **Level 2**: Continued exceedances, requires Exceedance Response Action (ERA)

**Source**: [California Water Boards IGP Program](https://www.waterboards.ca.gov/water_issues/programs/stormwater/igp_20140057dwq.html)

---

## 2. EPA Multi-Sector General Permit (MSGP) 2021

### Overview
- Federal permit for industrial stormwater (NPDES CAS000001)
- Effective March 1, 2021, modified September 29, 2021
- Proposed 2026 MSGP includes new ammonia, nitrate, nitrite benchmarks

### Key Benchmark Values

| Parameter | Freshwater Benchmark | Saltwater Benchmark | Units | Notes |
|-----------|---------------------|---------------------|-------|-------|
| TSS | 100 | 100 | mg/L | Standard across sectors |
| Aluminum (Total) | 1,100 | — | µg/L | Sector F2 foundries |
| Copper (Total) | 5.19 | 4.8 | µg/L | Hardness-dependent fresh |
| Zinc (Total) | Hardness-dependent | 90 | µg/L | |
| Iron | Removed | Removed | — | No longer benchmarked |
| Magnesium | Removed | Removed | — | No longer benchmarked |

### Hardness-Dependent Metals
Benchmarks vary based on receiving water hardness (mg/L CaCO3):
- Beryllium, Cadmium, Copper, Lead, Nickel, Silver, Zinc
- Appendix J provides calculation methodology

**Source**: [EPA 2021 MSGP](https://www.epa.gov/npdes/stormwater-discharges-industrial-activities-epas-2021-msgp)

---

## 3. EPA National Recommended Water Quality Criteria - Aquatic Life

### Criteria Types
- **CMC (Criterion Maximum Concentration)**: Acute, 1-hour average
- **CCC (Criterion Continuous Concentration)**: Chronic, 4-day average

### Aquatic Life Criteria (100 mg/L hardness normalization)

| Pollutant | FW CMC (µg/L) | FW CCC (µg/L) | SW CMC (µg/L) | SW CCC (µg/L) |
|-----------|--------------|--------------|--------------|--------------|
| Arsenic | 340 | 150 | 69 | 36 |
| Cadmium | 1.8 | vacated | 33 | 7.9 |
| Chromium (III) | 570 | 74 | — | — |
| Chromium (VI) | 16 | 11 | 1,100 | 50 |
| Copper | — | — | 4.8 | 3.1 |
| Lead | 65 | 2.5 | 210 | 8.1 |
| Mercury | 1.4 | 0.77 | 1.8 | 0.94 |
| Nickel | 470 | 52 | 74 | 8.2 |
| Silver | 3.2 | — | 1.9 | — |
| Zinc | 120 | 120 | 90 | 81 |
| Cyanide | 22 | 5.2 | 1 | 1 |

**Source**: [EPA Aquatic Life Criteria Table](https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table)

---

## 4. EPA Drinking Water Maximum Contaminant Levels (MCLs)

### Primary Drinking Water Standards

| Contaminant | MCL | Units | MCLG | Notes |
|-------------|-----|-------|------|-------|
| Arsenic | 0.010 | mg/L | 0 | Carcinogen |
| Lead | 0.015 (AL) | mg/L | 0 | Action Level (LCRI: 0.010) |
| Copper | 1.3 (AL) | mg/L | 1.3 | Action Level |
| Chromium (Total) | 0.1 | mg/L | 0.1 | |
| Nitrate (as N) | 10 | mg/L | 10 | Methemoglobinemia |
| Nitrite (as N) | 1 | mg/L | 1 | |
| Mercury | 0.002 | mg/L | 0.002 | |
| Cadmium | 0.005 | mg/L | 0.005 | |
| Selenium | 0.05 | mg/L | 0.05 | |
| Antimony | 0.006 | mg/L | 0.006 | |
| Barium | 2 | mg/L | 2 | |
| Beryllium | 0.004 | mg/L | 0.004 | |

**Source**: [EPA National Primary Drinking Water Regulations](https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations)

---

## 5. California Toxics Rule (CTR) - 40 CFR § 131.38

### Overview
- EPA-promulgated May 18, 2000 for California waters
- Fills gap after 1994 state court overturned California water quality criteria
- Applies to inland surface waters, enclosed bays, estuaries

### Key Provisions
- Freshwater criteria apply when salinity ≤ 1 ppt 95%+ of time
- Metal criteria expressed as dissolved (except where noted)
- Hardness-based equations for metals (max 400 mg/L CaCO3)

**Source**: [EPA California Toxics Rule](https://www.epa.gov/wqs-tech/water-quality-standards-establishment-numeric-criteria-priority-toxic-pollutants-state)
</research_findings>

<requirements>
## Phase 1: Schema Extension

### 1.1 Extend ConfigPollutant Model
Add benchmark-related fields to the Prisma schema:

```prisma
model ConfigPollutant {
  key            String   @id
  aliases        String[]
  canonicalUnit  String
  category       String?              // NEW: e.g., "Metals", "Nutrients", "Organics"
  notes          String?  @db.Text

  // NEW: Benchmark fields
  benchmarks     PollutantBenchmark[]
}

model PollutantBenchmark {
  id              Int     @id @default(autoincrement())
  pollutantKey    String
  pollutant       ConfigPollutant @relation(fields: [pollutantKey], references: [key])

  benchmarkType   String  // "ANNUAL_NAL", "INSTANT_NAL", "MCL", "CMC", "CCC"
  waterType       String  // "FRESHWATER", "SALTWATER", "DRINKING", "ALL"
  value           Decimal @db.Decimal(15, 6)
  valueMax        Decimal? @db.Decimal(15, 6)  // For ranges like pH 6.0-9.0
  unit            String
  source          String  // "CA_IGP", "EPA_MSGP", "EPA_MCL", "EPA_AQUATIC", "CTR"
  sourceDocument  String? // Permit number or regulation cite
  effectiveDate   DateTime?
  hardnessDependent Boolean @default(false)
  hardnessEquation String?  // For metals that vary with hardness
  notes           String? @db.Text

  @@unique([pollutantKey, benchmarkType, waterType, source])
  @@map("pollutant_benchmarks")
}
```

### 1.2 Create Category Taxonomy
Define parameter categories:

```typescript
const PARAMETER_CATEGORIES = {
  METALS_HEAVY: "Heavy Metals",           // Pb, Hg, Cd, As, etc.
  METALS_TRACE: "Trace Metals",           // Cu, Zn, Fe, Al, Mn, etc.
  NUTRIENTS: "Nutrients",                  // N, P, ammonia
  CONVENTIONAL: "Conventional Pollutants", // TSS, BOD, COD, pH, O&G
  ORGANICS_VOC: "Volatile Organics",      // Benzene, toluene, etc.
  ORGANICS_SVOC: "Semi-Volatile Organics", // PAHs, phthalates
  PESTICIDES: "Pesticides",               // Chlordane, DDT, etc.
  PCBS: "PCBs",
  PATHOGENS: "Pathogens",                 // E. coli, fecal coliform
  PHYSICAL: "Physical Parameters",         // Temperature, turbidity
  RADIOLOGICAL: "Radiological",
  PFAS: "PFAS",                           // Emerging contaminants
  OTHER: "Other"
};
```

---

## Phase 2: Parameter Mapping & Categorization

### 2.1 Create Parameter Mapping Script
Create `scripts/map-esmr-parameters.ts` that:

1. Reads all 899 eSMRParameter records
2. Applies fuzzy matching to identify standard pollutant names
3. Assigns categories based on parameter characteristics
4. Generates a mapping file for review

### 2.2 Mapping Rules
```typescript
const PARAMETER_MAPPINGS = {
  // Exact matches and common aliases
  "Total Suspended Solids": { key: "TSS", category: "CONVENTIONAL" },
  "TSS": { key: "TSS", category: "CONVENTIONAL" },
  "Suspended Solids": { key: "TSS", category: "CONVENTIONAL" },

  // Pattern-based matches
  "/^Copper/i": { key: "COPPER", category: "METALS_TRACE" },
  "/^Cu\\b/i": { key: "COPPER", category: "METALS_TRACE" },
  "/Total Copper/i": { key: "COPPER", category: "METALS_TRACE" },

  // Chemical compound patterns
  "/Benzene$/": { key: "BENZENE", category: "ORGANICS_VOC" },
  "/^1,1-Dichloro/": { category: "ORGANICS_VOC" },
  "/naphthalene/i": { category: "ORGANICS_SVOC" },

  // Nutrient patterns
  "/Nitrate/i": { key: "NITRATE", category: "NUTRIENTS" },
  "/Nitrite/i": { key: "NITRITE", category: "NUTRIENTS" },
  "/Ammonia/i": { key: "AMMONIA", category: "NUTRIENTS" },
  "/Phosph/i": { category: "NUTRIENTS" },
};
```

---

## Phase 3: Benchmark Data Population

### 3.1 Create Comprehensive Seed File
Create `prisma/seed-benchmarks.ts` with ALL benchmark data:

```typescript
const BENCHMARK_DATA = {
  // California IGP NALs (Primary for this application)
  CA_IGP: [
    {
      key: "TSS",
      benchmarks: [
        { type: "ANNUAL_NAL", value: 100, unit: "mg/L", source: "CA_IGP" },
        { type: "INSTANT_NAL", value: 400, unit: "mg/L", source: "CA_IGP" }
      ]
    },
    {
      key: "PH",
      benchmarks: [
        { type: "ANNUAL_NAL", value: 6.0, valueMax: 9.0, unit: "pH", source: "CA_IGP" },
        { type: "INSTANT_NAL", value: 6.0, valueMax: 9.0, unit: "pH", source: "CA_IGP" }
      ]
    },
    {
      key: "OIL_GREASE",
      benchmarks: [
        { type: "ANNUAL_NAL", value: 15, unit: "mg/L", source: "CA_IGP" },
        { type: "INSTANT_NAL", value: 25, unit: "mg/L", source: "CA_IGP" }
      ]
    },
    {
      key: "COPPER",
      benchmarks: [
        { type: "ANNUAL_NAL", value: 0.0332, unit: "mg/L", source: "CA_IGP" }
      ]
    },
    {
      key: "ZINC",
      benchmarks: [
        { type: "ANNUAL_NAL", value: 0.26, unit: "mg/L", source: "CA_IGP" }
      ]
    },
    {
      key: "IRON",
      benchmarks: [
        { type: "ANNUAL_NAL", value: 1.0, unit: "mg/L", source: "CA_IGP" }
      ]
    },
    {
      key: "ALUMINUM",
      benchmarks: [
        { type: "ANNUAL_NAL", value: 0.75, unit: "mg/L", source: "CA_IGP" }
      ]
    }
    // ... continue for all IGP parameters
  ],

  // EPA Drinking Water MCLs (Secondary reference)
  EPA_MCL: [
    { key: "ARSENIC", value: 0.010, unit: "mg/L" },
    { key: "LEAD", value: 0.015, unit: "mg/L", notes: "Action Level" },
    { key: "COPPER", value: 1.3, unit: "mg/L", notes: "Action Level" },
    { key: "NITRATE", value: 10, unit: "mg/L", notes: "as N" },
    { key: "MERCURY", value: 0.002, unit: "mg/L" },
    { key: "CADMIUM", value: 0.005, unit: "mg/L" },
    { key: "CHROMIUM", value: 0.1, unit: "mg/L", notes: "Total" }
    // ... continue for all MCLs
  ],

  // EPA Aquatic Life Criteria (Tertiary reference)
  EPA_AQUATIC: [
    {
      key: "ARSENIC",
      benchmarks: [
        { type: "CMC", waterType: "FRESHWATER", value: 340, unit: "µg/L" },
        { type: "CCC", waterType: "FRESHWATER", value: 150, unit: "µg/L" },
        { type: "CMC", waterType: "SALTWATER", value: 69, unit: "µg/L" },
        { type: "CCC", waterType: "SALTWATER", value: 36, unit: "µg/L" }
      ]
    }
    // ... continue for all aquatic life criteria
  ]
};
```

### 3.2 Complete IGP Table 2 Values to Research
The following parameters need complete NAL values from the official IGP document:

**Metals (Total Recoverable)**:
- Antimony, Arsenic, Beryllium, Cadmium, Chromium (total, III, VI)
- Lead, Magnesium, Manganese, Mercury, Molybdenum
- Nickel, Selenium, Silver, Thallium, Vanadium

**Nutrients**:
- Nitrate + Nitrite (as N), Ammonia (as N), Total Kjeldahl Nitrogen
- Total Phosphorus, Orthophosphate

**Organics (sector-specific)**:
- BOD5, COD, TOC
- Specific organic compounds by SIC code

---

## Phase 4: Violation Detection Enhancement

### 4.1 Update Violation Computation Logic
Modify the violation detection to use new benchmark structure:

```typescript
async function computeViolation(sample: ESMRSample): Promise<ViolationResult | null> {
  // 1. Map eSMR parameter to ConfigPollutant
  const pollutant = await mapParameterToPollutant(sample.parameterName);
  if (!pollutant) return null;

  // 2. Get applicable benchmarks (prioritize CA_IGP)
  const benchmarks = await getBenchmarks(pollutant.key, {
    sources: ["CA_IGP", "EPA_MCL", "EPA_AQUATIC"],
    waterType: determineWaterType(sample.facility)
  });

  // 3. Compare sample value to benchmarks
  const sampleValue = parseFloat(sample.result);
  const unit = sample.units;

  for (const benchmark of benchmarks) {
    const normalizedValue = convertUnits(sampleValue, unit, benchmark.unit);
    const exceedanceRatio = normalizedValue / benchmark.value;

    if (exceedanceRatio > 1.0) {
      return {
        pollutantKey: pollutant.key,
        benchmarkType: benchmark.benchmarkType,
        benchmarkValue: benchmark.value,
        sampleValue: normalizedValue,
        exceedanceRatio,
        source: benchmark.source
      };
    }
  }

  return null;
}
```

---

## Phase 5: Deliverables

### 5.1 Database Seed File
`prisma/seed-benchmarks.ts` - Complete benchmark data for seeding

### 5.2 JSON Configuration
`config/water-quality-benchmarks.json`:
```json
{
  "version": "1.0.0",
  "generated": "2024-11-30",
  "sources": {
    "CA_IGP": {
      "name": "California Industrial General Permit",
      "document": "Order 2014-0057-DWQ",
      "effectiveDate": "2020-07-01"
    },
    "EPA_MSGP": {
      "name": "EPA Multi-Sector General Permit",
      "document": "2021 MSGP",
      "effectiveDate": "2021-03-01"
    }
  },
  "benchmarks": [
    // All benchmark data in JSON format
  ]
}
```

### 5.3 Research Report
`docs/WATER_QUALITY_BENCHMARKS.md` with:
- Complete benchmark tables by source
- Parameter categorization scheme
- Mapping methodology
- Data gaps and recommendations
- Update procedures for new permits
</requirements>

<implementation>
## Step-by-Step Implementation

### Step 1: Schema Migration
1. Create Prisma migration for PollutantBenchmark model
2. Run migration: `npx prisma migrate dev --name add_pollutant_benchmarks`
3. Generate client: `npx prisma generate`

### Step 2: Research Completion
1. Download official IGP Order 2014-0057-DWQ PDF
2. Extract complete Table 2 NAL values manually
3. Cross-reference with EPA MSGP 2021 Part 8
4. Compile all drinking water MCLs from EPA

### Step 3: Parameter Mapping
1. Create scripts/map-esmr-parameters.ts
2. Run against all 899 parameters
3. Generate mapping report for review
4. Manually resolve ambiguous mappings

### Step 4: Benchmark Seeding
1. Create prisma/seed-benchmarks.ts
2. Populate all CA_IGP NALs (primary)
3. Add EPA_MCL values (secondary)
4. Add EPA_AQUATIC criteria (tertiary)
5. Run: `npm run db:seed:benchmarks`

### Step 5: Integration
1. Update violation computation logic
2. Test with sample eSMR data
3. Verify exceedance detection accuracy
4. Update dashboard stats to use new violations
</implementation>

<verification>
## Testing Checklist

### Schema Verification
```bash
npx prisma db push
npx prisma studio
# Verify PollutantBenchmark table exists with correct columns
```

### Data Verification
```bash
npm run db:seed:benchmarks
# Check: ConfigPollutant count increased
# Check: PollutantBenchmark records created
```

### Violation Detection Test
```typescript
// Test known exceedance case
const testSample = {
  parameterName: "Total Suspended Solids",
  result: "150", // Exceeds 100 mg/L NAL
  units: "mg/L"
};
const violation = await computeViolation(testSample);
assert(violation.exceedanceRatio === 1.5);
```

### Dashboard Verification
1. Run facility creation: `npm run db:create-facilities`
2. Run violation computation
3. Check dashboard shows:
   - Active Violations > 0
   - Top Pollutant populated
   - Peak Exceedance > 1.0
</verification>

<success_criteria>
1. **Schema extended** with PollutantBenchmark model
2. **899 parameters** mapped and categorized
3. **CA IGP NALs** complete for all Table 2 parameters
4. **EPA MCLs** complete for all primary contaminants
5. **EPA Aquatic Criteria** for priority toxic pollutants
6. **Violation detection** working with new benchmarks
7. **Dashboard** showing real violation data
8. **Documentation** complete with update procedures
</success_criteria>

<data_sources>
## Official Sources to Consult

1. **California IGP Order 2014-0057-DWQ**
   - URL: https://www.waterboards.ca.gov/water_issues/programs/stormwater/igp_20140057dwq.html
   - Table 2 on page 43-47

2. **EPA MSGP 2021**
   - URL: https://www.epa.gov/npdes/stormwater-discharges-industrial-activities-epas-2021-msgp
   - Part 8 Sector-Specific Requirements

3. **EPA Drinking Water MCLs**
   - URL: https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations

4. **EPA Aquatic Life Criteria**
   - URL: https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table

5. **California Toxics Rule (40 CFR 131.38)**
   - URL: https://www.epa.gov/wqs-tech/water-quality-standards-establishment-numeric-criteria-priority-toxic-pollutants-state

6. **California MCLs (State)**
   - URL: https://www.waterboards.ca.gov/drinking_water/certlic/drinkingwater/documents/mclreview/mcls_dlrs_phgs.pdf
</data_sources>

<notes>
## Important Considerations

### Unit Conversions
- IGP uses both mg/L and µg/L - standardize to canonical unit
- 1 mg/L = 1000 µg/L = 1 ppm
- Ensure consistent unit handling in violation computation

### Hardness-Dependent Metals
- Cu, Zn, Pb, Cd, Ni, Ag in freshwater vary with hardness
- Consider storing hardness equations for dynamic calculation
- Default to 100 mg/L CaCO3 if hardness unknown

### pH Range Handling
- pH is a range (6.0-9.0), not a single threshold
- Both below 6.0 and above 9.0 are violations
- Implement special range-based comparison logic

### Sector-Specific Parameters
- Some NALs apply only to specific SIC codes
- Consider adding sectorCodes field to benchmarks
- Initially focus on universal parameters

### Future Updates
- New IGP expected Spring 2025 with PFAS NALs
- 2026 MSGP proposed with ammonia/nitrate benchmarks
- Establish update procedure documentation
</notes>
