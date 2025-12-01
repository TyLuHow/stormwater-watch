# Water Quality Benchmarks Documentation

**Version:** 1.0.0
**Last Updated:** December 1, 2025
**Status:** Production

## Executive Summary

This document provides comprehensive documentation for the water quality benchmark system implemented in the application. The system establishes authoritative threshold values from multiple regulatory and health-based sources, enabling automated violation detection by comparing eSMR sample results against established benchmarks.

## Table of Contents

1. [Overview](#overview)
2. [Data Sources](#data-sources)
3. [Benchmark Types](#benchmark-types)
4. [Database Schema](#database-schema)
5. [Parameter Categories](#parameter-categories)
6. [Benchmark Values](#benchmark-values)
7. [Hardness-Dependent Metals](#hardness-dependent-metals)
8. [Usage Examples](#usage-examples)
9. [Maintenance and Updates](#maintenance-and-updates)
10. [References](#references)

## Overview

### Purpose

The water quality benchmark system provides:

- **Automated Violation Detection**: Compare sample results against regulatory thresholds
- **Multi-Tier Benchmarks**: Support for NALs, MCLs, Action Levels, and Aquatic Life Criteria
- **Comprehensive Coverage**: 60+ benchmarks across 15+ pollutants from 3 major sources
- **Flexible Querying**: Water-type-specific criteria (freshwater, saltwater, drinking water)
- **Hardness Adjustment**: Site-specific criteria for metals affected by water hardness

### Key Features

- ✅ California IGP Numeric Action Levels (NALs)
- ✅ EPA National Primary Drinking Water Regulations (MCLs)
- ✅ EPA Aquatic Life Criteria (CMC/CCC for freshwater and saltwater)
- ✅ Hardness-dependent metal criteria with calculation equations
- ✅ Multi-source benchmark hierarchy for comprehensive protection
- ✅ Idempotent seeding with upsert patterns

## Data Sources

### 1. California Industrial General Permit (IGP)

**Authority:** California State Water Resources Control Board
**Document:** Order 2014-0057-DWQ (amended by Orders 2015-0122-DWQ and 2018-0028-DWQ)
**URL:** https://www.waterboards.ca.gov/water_issues/programs/stormwater/industrial.html

**Applicability:** Industrial stormwater discharges in California

**Benchmark Types:**
- Annual NAL: Average of all analytical results within a reporting year
- Instantaneous Maximum NAL: Single sample maximum threshold

**Key Parameters:**
- Universal: pH, Total Suspended Solids (TSS), Oil & Grease (O&G)
- Metals: Copper, Zinc, Lead, Aluminum, Iron (SIC code-specific)

### 2. EPA National Primary Drinking Water Regulations (NPDWR)

**Authority:** U.S. Environmental Protection Agency
**Document:** Safe Drinking Water Act (SDWA)
**URL:** https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations

**Applicability:** Public drinking water systems (federal requirement)

**Benchmark Types:**
- Maximum Contaminant Level (MCL): Enforceable standard
- Action Level (AL): Treatment technique trigger (e.g., Lead & Copper Rule)
- Secondary MCL: Non-enforceable aesthetic guideline
- Health Advisory: Non-regulatory guidance

**Coverage:** 94 National Primary Drinking Water Regulations covering inorganic contaminants, volatile organic compounds, synthetic organic compounds, radionuclides, and disinfection byproducts.

### 3. EPA Aquatic Life Criteria

**Authority:** U.S. Environmental Protection Agency
**Document:** National Recommended Water Quality Criteria
**URL:** https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table

**Applicability:** Surface water quality standards for protection of aquatic life

**Benchmark Types:**
- CMC (Criteria Maximum Concentration): Acute exposure criterion (1-hour average)
- CCC (Criterion Continuous Concentration): Chronic exposure criterion (4-day average)

**Water Types:**
- Freshwater (rivers, lakes, streams)
- Saltwater (marine and estuarine waters)

**Coverage:** Metals, pesticides, organics, and other pollutants with aquatic toxicity data.

## Benchmark Types

### ANNUAL_NAL
- **Name:** Annual Numeric Action Level
- **Source:** California IGP
- **Timeframe:** Annual average
- **Calculation:** Average of all analytical results for a parameter from samples taken within a reporting year
- **Exceedance:** Triggers Level 2 status and enhanced monitoring requirements

### INSTANT_NAL
- **Name:** Instantaneous Maximum NAL
- **Source:** California IGP
- **Timeframe:** Instantaneous (single sample)
- **Exceedance:** Immediate action required; triggers Level 2 status

### MCL
- **Name:** Maximum Contaminant Level
- **Source:** EPA NPDWR
- **Timeframe:** Ongoing compliance
- **Description:** Highest level of a contaminant allowed in drinking water; enforceable standard set as close to MCLG as feasible using best available treatment technology

### ACTION_LEVEL
- **Name:** Action Level
- **Source:** EPA NPDWR (Lead and Copper Rule)
- **Timeframe:** Ongoing compliance
- **Description:** Concentration that triggers treatment or other requirements; not an MCL but an important regulatory threshold

### CMC
- **Name:** Criteria Maximum Concentration
- **Source:** EPA Aquatic Life Criteria
- **Timeframe:** 1-hour average
- **Description:** Acute aquatic life criterion; protects against short-term toxic effects

### CCC
- **Name:** Criterion Continuous Concentration
- **Source:** EPA Aquatic Life Criteria
- **Timeframe:** 4-day average
- **Description:** Chronic aquatic life criterion; protects against long-term toxic effects

### SECONDARY_MCL
- **Name:** Secondary Maximum Contaminant Level
- **Source:** EPA NPDWR
- **Description:** Non-enforceable guideline for contaminants affecting aesthetic quality (taste, odor, color)

### HEALTH_ADVISORY
- **Name:** Health Advisory Level
- **Source:** EPA
- **Description:** Non-regulatory guidance value for contaminants without established MCLs

## Database Schema

### ConfigPollutant Model (Extended)

```prisma
model ConfigPollutant {
  key           String   @id
  aliases       String[]
  canonicalUnit String
  category      String?  @db.VarChar(100)  // NEW
  notes         String?  @db.Text

  benchmarks PollutantBenchmark[]  // NEW: Relation to benchmarks

  @@index([category])
}
```

### PollutantBenchmark Model (New)

```prisma
model PollutantBenchmark {
  id String @id @default(cuid())

  pollutantKey String
  pollutant    ConfigPollutant @relation(fields: [pollutantKey], references: [key], onDelete: Cascade)

  benchmarkType BenchmarkType
  waterType     WaterType     @default(ALL)

  value    Decimal  @db.Decimal(12, 6)
  valueMax Decimal? @db.Decimal(12, 6)  // For range-based (pH)
  unit     String   @db.VarChar(20)

  source         String  @db.VarChar(200)
  sourceDocument String? @db.Text
  sourceUrl      String? @db.Text

  hardnessDependent Boolean @default(false)
  hardnessEquation  String? @db.Text

  notes String? @db.Text

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([pollutantKey, benchmarkType, waterType])
  @@index([pollutantKey])
  @@index([benchmarkType])
  @@index([waterType])
}
```

### Enums

```prisma
enum BenchmarkType {
  ANNUAL_NAL
  INSTANT_NAL
  MCL
  ACTION_LEVEL
  CMC
  CCC
  SECONDARY_MCL
  HEALTH_ADVISORY
}

enum WaterType {
  FRESHWATER
  SALTWATER
  DRINKING
  ALL
}
```

## Parameter Categories

The system categorizes water quality parameters into 13 logical groups:

### METALS_HEAVY
**Examples:** Lead, Mercury, Arsenic, Cadmium
**Health Concerns:** Neurotoxicity, carcinogenicity, bioaccumulation
**Regulatory Focus:** Stringent limits due to high toxicity

### METALS_TRACE
**Examples:** Copper, Zinc, Iron, Aluminum, Nickel
**Health Concerns:** Essential nutrients at low levels; toxic at elevated concentrations
**Note:** Many are hardness-dependent in aquatic criteria

### NUTRIENTS
**Examples:** Nitrate, Nitrite, Ammonia, Phosphorus
**Health Concerns:** Eutrophication, algal blooms, hypoxia
**Regulatory Focus:** Key drivers of water quality impairment

### CONVENTIONAL
**Examples:** TSS, BOD, COD, pH, Turbidity, Oil & Grease
**Health Concerns:** Water clarity, oxygen depletion, habitat degradation
**Regulatory Focus:** Universal monitoring requirements

### ORGANICS_VOC
**Examples:** Benzene, Toluene, Xylene, TCE, Vinyl Chloride
**Health Concerns:** Carcinogenicity, liver/kidney damage
**Sources:** Industrial solvents, petroleum products

### ORGANICS_SVOC
**Examples:** PAHs, Phenols, Phthalates
**Health Concerns:** Carcinogenicity, endocrine disruption
**Sources:** Combustion, industrial processes

### PESTICIDES
**Examples:** Atrazine, Chlordane, DDT, Chlorpyrifos
**Health Concerns:** Neurotoxicity, carcinogenicity, endocrine disruption
**Sources:** Agricultural and urban runoff

### PCBS
**Examples:** Aroclor series
**Health Concerns:** Carcinogenicity, bioaccumulation
**Status:** Banned but persistent in environment

### PATHOGENS
**Examples:** Coliform, E. coli, Enterococcus
**Health Concerns:** Waterborne illness
**Indicator:** Fecal contamination

### PHYSICAL
**Examples:** pH, Temperature, Conductivity, Color
**Role:** Water quality indicators and process parameters

### RADIOLOGICAL
**Examples:** Radium, Uranium, Gross Alpha/Beta
**Health Concerns:** Cancer risk from radiation exposure

### PFAS
**Examples:** PFOA, PFOS, PFNA, PFHxS, GenX
**Health Concerns:** Persistence, bioaccumulation, immune system effects
**Status:** Emerging contaminants; new EPA regulations 2024-2025

### OTHER
Uncategorized or specialty parameters

## Benchmark Values

### California IGP NALs - Universal Parameters

| Parameter | Annual NAL | Instant NAL | Unit | Notes |
|-----------|-----------|-------------|------|-------|
| pH | 6.0-9.0 | 6.0-9.0 | pH | Range-based; exceedance outside range |
| TSS | 100 | 400 | mg/L | Total Suspended Solids |
| Oil & Grease | 15 | 25 | mg/L | Common industrial discharge |

### California IGP NALs - Metals (SIC Code Specific)

| Parameter | Annual NAL | Unit | SIC Applicability |
|-----------|-----------|------|-------------------|
| Copper | 33.2 | µg/L | Varies by Table 1 |
| Zinc | 260 | µg/L | Varies by Table 1 |
| Lead | 15 | µg/L | Varies by Table 1 |
| Iron | 1.0 | mg/L | Varies by Table 1 |
| Aluminum | 750 | µg/L | Varies by Table 1 |

### EPA Drinking Water Standards (Selected)

| Parameter | MCL/AL | Unit | Type | Notes |
|-----------|--------|------|------|-------|
| Arsenic | 0.010 | mg/L | MCL | |
| Lead | 0.015 | mg/L | AL | Action Level (90th percentile) |
| Copper | 1.3 | mg/L | AL | Action Level (90th percentile) |
| Mercury | 0.002 | mg/L | MCL | Inorganic mercury |
| Cadmium | 0.005 | mg/L | MCL | |
| Chromium (total) | 0.1 | mg/L | MCL | |
| Nitrate | 10 | mg/L | MCL | As nitrogen |
| Selenium | 0.05 | mg/L | MCL | |

### EPA Aquatic Life Criteria - Freshwater (at 100 mg/L hardness)

| Pollutant | CMC (µg/L) | CCC (µg/L) | Hardness-Dependent |
|-----------|-----------|-----------|-------------------|
| Arsenic | 340 | 150 | No |
| Lead | 65 | 2.5 | Yes |
| Mercury | 1.4 | 0.77 | No |
| Zinc | 120 | 120 | Yes |
| Copper | 13 | 9 | Yes |
| Cadmium | 1.8 | vacated* | Yes |
| Chromium (III) | 570 | 74 | Yes |
| Nickel | 470 | 52 | Yes |
| Iron | - | 1000 | No |

*Note: 2016 chronic freshwater cadmium criterion vacated August 2023; use 2001 criterion.

### EPA Aquatic Life Criteria - Saltwater

| Pollutant | CMC (µg/L) | CCC (µg/L) |
|-----------|-----------|-----------|
| Arsenic | 69 | 36 |
| Lead | 210 | 8.1 |
| Mercury | 1.8 | 0.94 |
| Zinc | 90 | 81 |
| Copper | 4.8 | 3.1 |
| Cadmium | 33 | 7.9 |
| Chromium (VI) | 1100 | 50 |
| Nickel | 74 | 8.2 |
| Selenium | 290 | 71 |

## Hardness-Dependent Metals

### Overview

The toxicity of certain metals to aquatic organisms varies with water hardness (the concentration of calcium and magnesium). Higher water hardness reduces bioavailability and toxicity.

**Hardness-Dependent Metals:**
- Cadmium (Cd)
- Chromium III (Cr III)
- Copper (Cu)
- Lead (Pb)
- Nickel (Ni)
- Silver (Ag)
- Zinc (Zn)

### Calculation Method

**General Equation:**
```
Criterion = exp(m × ln(hardness) + b) × CF
```

Where:
- `hardness` = water hardness in mg/L as CaCO₃
- `m`, `b` = metal and criterion-specific coefficients
- `CF` = conversion factor (may be constant or equation)
- `exp()` = exponential function (e^x)
- `ln()` = natural logarithm

### Reference Hardness

All hardness-dependent criteria in the database are calculated at **100 mg/L hardness** as the reference point. Site-specific criteria should be calculated using actual measured hardness.

### Coefficients by Metal

#### Lead (Pb)

**CMC (Acute):**
```
CMC = exp(1.273 × ln(hardness) - 1.460) × [1.46203 - (ln(hardness) × 0.145712)]
```

**CCC (Chronic):**
```
CCC = exp(1.273 × ln(hardness) - 4.705) × [1.46203 - (ln(hardness) × 0.145712)]
```

#### Zinc (Zn)

**CMC (Acute):**
```
CMC = exp(0.8473 × ln(hardness) + 0.884) × 0.978
```

**CCC (Chronic):**
```
CCC = exp(0.8473 × ln(hardness) + 0.884) × 0.986
```

#### Copper (Cu)

**CMC and CCC:** Varies by site-specific factors including dissolved organic carbon (DOC).

#### Cadmium (Cd)

**CMC (Acute):**
```
CMC = exp(0.9789 × ln(hardness) - 3.866) × [1.136672 - (ln(hardness) × 0.041838)]
```

**CCC (Chronic):** Vacated as of August 2023; refer to 2001 criteria.

### Example Calculation

**Calculate Lead CMC at 150 mg/L hardness:**

```javascript
const hardness = 150; // mg/L as CaCO3
const m = 1.273;
const b = -1.460;
const CF = 1.46203 - (Math.log(hardness) * 0.145712);

const leadCMC = Math.exp(m * Math.log(hardness) + b) * CF;
// Result: ~82 µg/L
```

## Usage Examples

### Query All Benchmarks for a Pollutant

```typescript
const copperBenchmarks = await prisma.pollutantBenchmark.findMany({
  where: { pollutantKey: 'COPPER' },
  include: { pollutant: true },
});
```

### Get California IGP NALs Only

```typescript
const igpNALs = await prisma.pollutantBenchmark.findMany({
  where: {
    source: 'California IGP',
    benchmarkType: { in: ['ANNUAL_NAL', 'INSTANT_NAL'] },
  },
});
```

### Get Drinking Water MCLs

```typescript
const drinkingWaterMCLs = await prisma.pollutantBenchmark.findMany({
  where: {
    benchmarkType: 'MCL',
    waterType: 'DRINKING',
  },
});
```

### Get Freshwater Aquatic Life Criteria

```typescript
const freshwaterCriteria = await prisma.pollutantBenchmark.findMany({
  where: {
    waterType: 'FRESHWATER',
    benchmarkType: { in: ['CMC', 'CCC'] },
  },
});
```

### Check Sample Against Benchmark

```typescript
async function checkViolation(
  pollutantKey: string,
  sampleValue: number,
  benchmarkType: BenchmarkType,
  waterType: WaterType = 'ALL'
) {
  const benchmark = await prisma.pollutantBenchmark.findUnique({
    where: {
      pollutantKey_benchmarkType_waterType: {
        pollutantKey,
        benchmarkType,
        waterType,
      },
    },
  });

  if (!benchmark) return { violation: false, reason: 'No benchmark found' };

  // Handle range-based (pH)
  if (benchmark.valueMax) {
    const violation =
      sampleValue < benchmark.value || sampleValue > benchmark.valueMax;
    return { violation, benchmark, sampleValue };
  }

  // Standard comparison
  const violation = sampleValue > benchmark.value;
  const ratio = sampleValue / Number(benchmark.value);

  return { violation, benchmark, sampleValue, ratio };
}
```

### Calculate Hardness-Adjusted Criterion

```typescript
function calculateHardnessCriterion(
  baseValue: number,
  m: number,
  b: number,
  CF: number | string,
  hardness: number
): number {
  // If CF is a constant
  if (typeof CF === 'number') {
    return Math.exp(m * Math.log(hardness) + b) * CF;
  }

  // If CF is an equation (e.g., "1.46203 - (ln(hardness) * 0.145712)")
  // Parse and evaluate the equation
  const cfValue = 1.46203 - Math.log(hardness) * 0.145712; // Example for Lead
  return Math.exp(m * Math.log(hardness) + b) * cfValue;
}
```

## Maintenance and Updates

### Seeding

**Initial Seed:**
```bash
npm run db:seed:benchmarks
```

**Re-seed (idempotent):**
```bash
npm run db:seed:benchmarks
```

The seed script uses upsert patterns and is safe to run multiple times.

### Adding New Benchmarks

1. Add benchmark data to `prisma/seed-benchmarks.ts`
2. Update `config/water-quality-benchmarks.json` metadata
3. Run seed script
4. Update this documentation

### Monitoring for Regulatory Changes

**California IGP:**
- Check for permit amendments at: https://www.waterboards.ca.gov/water_issues/programs/stormwater/industrial.html
- Expected updates: 2025 (PFAS NALs under consideration)

**EPA Drinking Water:**
- Monitor National Primary Drinking Water Regulations: https://www.epa.gov/sdwa
- PFAS regulations: April 2024 final rule; May 2025 updates pending

**EPA Aquatic Life Criteria:**
- Check for criterion updates: https://www.epa.gov/wqc
- Cadmium CCC: Vacated 2023; monitor for replacement

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-01 | Initial implementation with 60+ benchmarks from 3 sources |

## References

### Primary Sources

1. **California State Water Resources Control Board**
   - Industrial General Permit Order 2014-0057-DWQ (amended)
   - https://www.waterboards.ca.gov/water_issues/programs/stormwater/industrial.html

2. **U.S. Environmental Protection Agency**
   - National Primary Drinking Water Regulations
   - https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations

3. **U.S. Environmental Protection Agency**
   - National Recommended Water Quality Criteria - Aquatic Life Criteria Table
   - https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table

### Additional Resources

4. **EPA - Safe Drinking Water Act (SDWA)**
   - https://www.epa.gov/sdwa

5. **EPA - Water Quality Standards Regulations**
   - https://www.epa.gov/wqs-tech

6. **California Water Boards - Stormwater Toolbox**
   - https://www.waterboards.ca.gov/water_issues/programs/stormwater/toolbox.html

7. **EPA - Aquatic Life Criteria and Methods**
   - https://www.epa.gov/wqc/aquatic-life-criteria-and-methods-toxics

### Related Documentation

- Project README
- Database Schema Documentation
- eSMR Data Integration Guide
- API Documentation

---

**Document Owner:** Development Team
**Review Frequency:** Quarterly
**Next Review:** March 1, 2026

For questions or updates, contact the project maintainers.
