/**
 * Prisma Seed Script: Water Quality Benchmarks
 *
 * Populates comprehensive water quality benchmark values from multiple sources:
 * - California Industrial General Permit (IGP) Numeric Action Levels (NALs)
 * - EPA National Primary Drinking Water Regulations (MCLs)
 * - EPA Aquatic Life Criteria (CMC/CCC for freshwater and saltwater)
 *
 * These benchmarks enable automated violation detection by comparing
 * eSMR sample results against established regulatory thresholds.
 *
 * Safe to run multiple times - uses upsert pattern
 */

import { PrismaClient, BenchmarkType, WaterType } from '@prisma/client';

const prisma = new PrismaClient();

interface BenchmarkData {
  pollutantKey: string;
  benchmarkType: BenchmarkType;
  waterType: WaterType;
  value: number;
  valueMax?: number;
  unit: string;
  source: string;
  sourceDocument?: string;
  sourceUrl?: string;
  hardnessDependent?: boolean;
  hardnessEquation?: string;
  notes?: string;
}

/**
 * California IGP Numeric Action Levels (NALs)
 * Source: Order 2014-0057-DWQ as amended by Order 2018-0028-DWQ
 * Table 2: Parameter NAL Values
 */
const californiaIGPNALs: BenchmarkData[] = [
  // Universal Parameters (all facilities must test)
  {
    pollutantKey: 'PH',
    benchmarkType: 'ANNUAL_NAL',
    waterType: 'ALL',
    value: 6.0,
    valueMax: 9.0,
    unit: 'pH',
    source: 'California IGP',
    sourceDocument: 'Order 2014-0057-DWQ (amended 2018-0028-DWQ)',
    sourceUrl: 'https://www.waterboards.ca.gov/water_issues/programs/stormwater/industrial.html',
    notes: 'pH is range-based; exceedance occurs outside 6.0-9.0 range',
  },
  {
    pollutantKey: 'PH',
    benchmarkType: 'INSTANT_NAL',
    waterType: 'ALL',
    value: 6.0,
    valueMax: 9.0,
    unit: 'pH',
    source: 'California IGP',
    sourceDocument: 'Order 2014-0057-DWQ (amended 2018-0028-DWQ)',
    sourceUrl: 'https://www.waterboards.ca.gov/water_issues/programs/stormwater/industrial.html',
    notes: 'Instantaneous maximum - same as annual NAL',
  },
  {
    pollutantKey: 'TSS',
    benchmarkType: 'ANNUAL_NAL',
    waterType: 'ALL',
    value: 100,
    unit: 'mg/L',
    source: 'California IGP',
    sourceDocument: 'Order 2014-0057-DWQ (amended 2018-0028-DWQ)',
    sourceUrl: 'https://www.waterboards.ca.gov/water_issues/programs/stormwater/industrial.html',
    notes: 'Total Suspended Solids - primary stormwater pollutant',
  },
  {
    pollutantKey: 'TSS',
    benchmarkType: 'INSTANT_NAL',
    waterType: 'ALL',
    value: 400,
    unit: 'mg/L',
    source: 'California IGP',
    sourceDocument: 'Order 2014-0057-DWQ (amended 2018-0028-DWQ)',
    sourceUrl: 'https://www.waterboards.ca.gov/water_issues/programs/stormwater/industrial.html',
    notes: 'Instantaneous maximum NAL',
  },
  {
    pollutantKey: 'O&G',
    benchmarkType: 'ANNUAL_NAL',
    waterType: 'ALL',
    value: 15,
    unit: 'mg/L',
    source: 'California IGP',
    sourceDocument: 'Order 2014-0057-DWQ (amended 2018-0028-DWQ)',
    sourceUrl: 'https://www.waterboards.ca.gov/water_issues/programs/stormwater/industrial.html',
    notes: 'Oil and Grease - common industrial discharge pollutant',
  },
  {
    pollutantKey: 'O&G',
    benchmarkType: 'INSTANT_NAL',
    waterType: 'ALL',
    value: 25,
    unit: 'mg/L',
    source: 'California IGP',
    sourceDocument: 'Order 2014-0057-DWQ (amended 2018-0028-DWQ)',
    sourceUrl: 'https://www.waterboards.ca.gov/water_issues/programs/stormwater/industrial.html',
    notes: 'Instantaneous maximum NAL',
  },

  // Metals - SIC Code specific
  {
    pollutantKey: 'COPPER',
    benchmarkType: 'ANNUAL_NAL',
    waterType: 'ALL',
    value: 33.2,
    unit: 'µg/L',
    source: 'California IGP',
    sourceDocument: 'Order 2014-0057-DWQ (amended 2018-0028-DWQ)',
    sourceUrl: 'https://www.waterboards.ca.gov/water_issues/programs/stormwater/industrial.html',
    notes: 'Annual NAL for copper; applicable to specific SIC codes',
  },
  {
    pollutantKey: 'ZINC',
    benchmarkType: 'ANNUAL_NAL',
    waterType: 'ALL',
    value: 260,
    unit: 'µg/L',
    source: 'California IGP',
    sourceDocument: 'Order 2014-0057-DWQ (amended 2018-0028-DWQ)',
    sourceUrl: 'https://www.waterboards.ca.gov/water_issues/programs/stormwater/industrial.html',
    notes: 'Annual NAL for zinc (0.26 mg/L); applicable to specific SIC codes',
  },
  {
    pollutantKey: 'IRON',
    benchmarkType: 'ANNUAL_NAL',
    waterType: 'ALL',
    value: 1.0,
    unit: 'mg/L',
    source: 'California IGP',
    sourceDocument: 'Order 2014-0057-DWQ (amended 2018-0028-DWQ)',
    sourceUrl: 'https://www.waterboards.ca.gov/water_issues/programs/stormwater/industrial.html',
    notes: 'Annual NAL for iron; applicable to specific SIC codes',
  },
  {
    pollutantKey: 'ALUMINUM',
    benchmarkType: 'ANNUAL_NAL',
    waterType: 'ALL',
    value: 750,
    unit: 'µg/L',
    source: 'California IGP',
    sourceDocument: 'Order 2014-0057-DWQ (amended 2018-0028-DWQ)',
    sourceUrl: 'https://www.waterboards.ca.gov/water_issues/programs/stormwater/industrial.html',
    notes: 'Annual NAL for aluminum (0.75 mg/L); applicable to specific SIC codes',
  },
  {
    pollutantKey: 'LEAD',
    benchmarkType: 'ANNUAL_NAL',
    waterType: 'ALL',
    value: 15,
    unit: 'µg/L',
    source: 'California IGP',
    sourceDocument: 'Order 2014-0057-DWQ (amended 2018-0028-DWQ)',
    sourceUrl: 'https://www.waterboards.ca.gov/water_issues/programs/stormwater/industrial.html',
    notes: 'Annual NAL for lead; applicable to specific SIC codes',
  },
];

/**
 * EPA National Primary Drinking Water Regulations - Maximum Contaminant Levels
 * Source: EPA Safe Drinking Water Act (SDWA)
 * Reference: https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations
 */
const epaDrinkingWaterMCLs: BenchmarkData[] = [
  // Inorganic Contaminants
  {
    pollutantKey: 'ARSENIC',
    benchmarkType: 'MCL',
    waterType: 'DRINKING',
    value: 0.010,
    unit: 'mg/L',
    source: 'EPA NPDWR',
    sourceDocument: 'National Primary Drinking Water Regulations',
    sourceUrl: 'https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations',
    notes: 'Maximum Contaminant Level for arsenic',
  },
  {
    pollutantKey: 'LEAD',
    benchmarkType: 'ACTION_LEVEL',
    waterType: 'DRINKING',
    value: 0.015,
    unit: 'mg/L',
    source: 'EPA NPDWR',
    sourceDocument: 'Lead and Copper Rule',
    sourceUrl: 'https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations',
    notes: 'Action Level (AL) - not an MCL; treatment technique trigger',
  },
  {
    pollutantKey: 'COPPER',
    benchmarkType: 'ACTION_LEVEL',
    waterType: 'DRINKING',
    value: 1.3,
    unit: 'mg/L',
    source: 'EPA NPDWR',
    sourceDocument: 'Lead and Copper Rule',
    sourceUrl: 'https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations',
    notes: 'Action Level (AL) - not an MCL; treatment technique trigger',
  },
  {
    pollutantKey: 'MERCURY',
    benchmarkType: 'MCL',
    waterType: 'DRINKING',
    value: 0.002,
    unit: 'mg/L',
    source: 'EPA NPDWR',
    sourceDocument: 'National Primary Drinking Water Regulations',
    sourceUrl: 'https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations',
    notes: 'Inorganic mercury MCL',
  },
  {
    pollutantKey: 'CADMIUM',
    benchmarkType: 'MCL',
    waterType: 'DRINKING',
    value: 0.005,
    unit: 'mg/L',
    source: 'EPA NPDWR',
    sourceDocument: 'National Primary Drinking Water Regulations',
    sourceUrl: 'https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations',
  },
  {
    pollutantKey: 'CHROMIUM',
    benchmarkType: 'MCL',
    waterType: 'DRINKING',
    value: 0.1,
    unit: 'mg/L',
    source: 'EPA NPDWR',
    sourceDocument: 'National Primary Drinking Water Regulations',
    sourceUrl: 'https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations',
    notes: 'Total chromium MCL',
  },
  {
    pollutantKey: 'SELENIUM',
    benchmarkType: 'MCL',
    waterType: 'DRINKING',
    value: 0.05,
    unit: 'mg/L',
    source: 'EPA NPDWR',
    sourceDocument: 'National Primary Drinking Water Regulations',
    sourceUrl: 'https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations',
  },
  {
    pollutantKey: 'NITRATE',
    benchmarkType: 'MCL',
    waterType: 'DRINKING',
    value: 10,
    unit: 'mg/L',
    source: 'EPA NPDWR',
    sourceDocument: 'National Primary Drinking Water Regulations',
    sourceUrl: 'https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations',
    notes: 'As nitrogen (N); key nutrient pollutant',
  },
];

/**
 * EPA Aquatic Life Criteria - Freshwater
 * Source: EPA National Recommended Water Quality Criteria
 * Values calculated at 100 mg/L hardness for hardness-dependent metals
 * Reference: https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table
 */
const epaAquaticLifeFreshwater: BenchmarkData[] = [
  // CMC (Criteria Maximum Concentration) - Acute exposure, 1-hour average
  {
    pollutantKey: 'ARSENIC',
    benchmarkType: 'CMC',
    waterType: 'FRESHWATER',
    value: 340,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Acute criterion (1-hour average)',
  },
  {
    pollutantKey: 'ARSENIC',
    benchmarkType: 'CCC',
    waterType: 'FRESHWATER',
    value: 150,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Chronic criterion (4-day average)',
  },
  {
    pollutantKey: 'LEAD',
    benchmarkType: 'CMC',
    waterType: 'FRESHWATER',
    value: 65,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    hardnessDependent: true,
    hardnessEquation: 'exp(1.273 * ln(hardness) - 1.460) * CF, where CF = 1.46203 - (ln(hardness) * 0.145712)',
    notes: 'Acute criterion; value at 100 mg/L hardness; hardness-dependent',
  },
  {
    pollutantKey: 'LEAD',
    benchmarkType: 'CCC',
    waterType: 'FRESHWATER',
    value: 2.5,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    hardnessDependent: true,
    hardnessEquation: 'exp(1.273 * ln(hardness) - 4.705) * CF, where CF = 1.46203 - (ln(hardness) * 0.145712)',
    notes: 'Chronic criterion; value at 100 mg/L hardness; hardness-dependent',
  },
  {
    pollutantKey: 'MERCURY',
    benchmarkType: 'CMC',
    waterType: 'FRESHWATER',
    value: 1.4,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Acute criterion for mercury',
  },
  {
    pollutantKey: 'MERCURY',
    benchmarkType: 'CCC',
    waterType: 'FRESHWATER',
    value: 0.77,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Chronic criterion for mercury',
  },
  {
    pollutantKey: 'ZINC',
    benchmarkType: 'CMC',
    waterType: 'FRESHWATER',
    value: 120,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    hardnessDependent: true,
    hardnessEquation: 'exp(0.8473 * ln(hardness) + 0.884) * 0.978',
    notes: 'Acute criterion; value at 100 mg/L hardness; hardness-dependent',
  },
  {
    pollutantKey: 'ZINC',
    benchmarkType: 'CCC',
    waterType: 'FRESHWATER',
    value: 120,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    hardnessDependent: true,
    hardnessEquation: 'exp(0.8473 * ln(hardness) + 0.884) * 0.986',
    notes: 'Chronic criterion; value at 100 mg/L hardness; hardness-dependent',
  },
  {
    pollutantKey: 'COPPER',
    benchmarkType: 'CMC',
    waterType: 'FRESHWATER',
    value: 13,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    hardnessDependent: true,
    notes: 'Acute criterion; value at 100 mg/L hardness; hardness-dependent',
  },
  {
    pollutantKey: 'COPPER',
    benchmarkType: 'CCC',
    waterType: 'FRESHWATER',
    value: 9,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    hardnessDependent: true,
    notes: 'Chronic criterion; value at 100 mg/L hardness; hardness-dependent',
  },
  {
    pollutantKey: 'CADMIUM',
    benchmarkType: 'CMC',
    waterType: 'FRESHWATER',
    value: 1.8,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    hardnessDependent: true,
    hardnessEquation: 'exp(0.9789 * ln(hardness) - 3.866) * CF, where CF = 1.136672 - (ln(hardness) * 0.041838)',
    notes: 'Acute criterion; value at 100 mg/L hardness; hardness-dependent',
  },
  {
    pollutantKey: 'CHROMIUM',
    benchmarkType: 'CMC',
    waterType: 'FRESHWATER',
    value: 570,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria (Chromium III)',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    hardnessDependent: true,
    notes: 'Chromium III acute criterion; value at 100 mg/L hardness',
  },
  {
    pollutantKey: 'CHROMIUM',
    benchmarkType: 'CCC',
    waterType: 'FRESHWATER',
    value: 74,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria (Chromium III)',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    hardnessDependent: true,
    notes: 'Chromium III chronic criterion; value at 100 mg/L hardness',
  },
  {
    pollutantKey: 'NICKEL',
    benchmarkType: 'CMC',
    waterType: 'FRESHWATER',
    value: 470,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    hardnessDependent: true,
    notes: 'Acute criterion; value at 100 mg/L hardness; hardness-dependent',
  },
  {
    pollutantKey: 'NICKEL',
    benchmarkType: 'CCC',
    waterType: 'FRESHWATER',
    value: 52,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    hardnessDependent: true,
    notes: 'Chronic criterion; value at 100 mg/L hardness; hardness-dependent',
  },
  {
    pollutantKey: 'IRON',
    benchmarkType: 'CCC',
    waterType: 'FRESHWATER',
    value: 1000,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Chronic criterion for iron (1.0 mg/L)',
  },
];

/**
 * EPA Aquatic Life Criteria - Saltwater
 * Source: EPA National Recommended Water Quality Criteria
 */
const epaAquaticLifeSaltwater: BenchmarkData[] = [
  {
    pollutantKey: 'ARSENIC',
    benchmarkType: 'CMC',
    waterType: 'SALTWATER',
    value: 69,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Acute criterion (1-hour average) for saltwater',
  },
  {
    pollutantKey: 'ARSENIC',
    benchmarkType: 'CCC',
    waterType: 'SALTWATER',
    value: 36,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Chronic criterion (4-day average) for saltwater',
  },
  {
    pollutantKey: 'LEAD',
    benchmarkType: 'CMC',
    waterType: 'SALTWATER',
    value: 210,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Acute criterion for saltwater',
  },
  {
    pollutantKey: 'LEAD',
    benchmarkType: 'CCC',
    waterType: 'SALTWATER',
    value: 8.1,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Chronic criterion for saltwater',
  },
  {
    pollutantKey: 'MERCURY',
    benchmarkType: 'CMC',
    waterType: 'SALTWATER',
    value: 1.8,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Acute criterion for saltwater',
  },
  {
    pollutantKey: 'MERCURY',
    benchmarkType: 'CCC',
    waterType: 'SALTWATER',
    value: 0.94,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Chronic criterion for saltwater',
  },
  {
    pollutantKey: 'ZINC',
    benchmarkType: 'CMC',
    waterType: 'SALTWATER',
    value: 90,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Acute criterion for saltwater',
  },
  {
    pollutantKey: 'ZINC',
    benchmarkType: 'CCC',
    waterType: 'SALTWATER',
    value: 81,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Chronic criterion for saltwater',
  },
  {
    pollutantKey: 'COPPER',
    benchmarkType: 'CMC',
    waterType: 'SALTWATER',
    value: 4.8,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Acute criterion for saltwater',
  },
  {
    pollutantKey: 'COPPER',
    benchmarkType: 'CCC',
    waterType: 'SALTWATER',
    value: 3.1,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Chronic criterion for saltwater',
  },
  {
    pollutantKey: 'CADMIUM',
    benchmarkType: 'CMC',
    waterType: 'SALTWATER',
    value: 33,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Acute criterion for saltwater',
  },
  {
    pollutantKey: 'CADMIUM',
    benchmarkType: 'CCC',
    waterType: 'SALTWATER',
    value: 7.9,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Chronic criterion for saltwater',
  },
  {
    pollutantKey: 'CHROMIUM',
    benchmarkType: 'CMC',
    waterType: 'SALTWATER',
    value: 1100,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria (Chromium VI)',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Chromium VI acute criterion for saltwater',
  },
  {
    pollutantKey: 'CHROMIUM',
    benchmarkType: 'CCC',
    waterType: 'SALTWATER',
    value: 50,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria (Chromium VI)',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Chromium VI chronic criterion for saltwater',
  },
  {
    pollutantKey: 'NICKEL',
    benchmarkType: 'CMC',
    waterType: 'SALTWATER',
    value: 74,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Acute criterion for saltwater',
  },
  {
    pollutantKey: 'NICKEL',
    benchmarkType: 'CCC',
    waterType: 'SALTWATER',
    value: 8.2,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Chronic criterion for saltwater',
  },
  {
    pollutantKey: 'SELENIUM',
    benchmarkType: 'CMC',
    waterType: 'SALTWATER',
    value: 290,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Acute criterion for saltwater',
  },
  {
    pollutantKey: 'SELENIUM',
    benchmarkType: 'CCC',
    waterType: 'SALTWATER',
    value: 71,
    unit: 'µg/L',
    source: 'EPA Aquatic Life Criteria',
    sourceDocument: 'National Recommended Water Quality Criteria',
    sourceUrl: 'https://www.epa.gov/wqc/national-recommended-water-quality-criteria-aquatic-life-criteria-table',
    notes: 'Chronic criterion for saltwater',
  },
];

/**
 * Combine all benchmark datasets
 */
const allBenchmarks: BenchmarkData[] = [
  ...californiaIGPNALs,
  ...epaDrinkingWaterMCLs,
  ...epaAquaticLifeFreshwater,
  ...epaAquaticLifeSaltwater,
];

/**
 * Seed function
 */
async function main() {
  console.log('🌱 Seeding Water Quality Benchmarks...\n');
  console.log('=' .repeat(80));

  let createdCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  // First, ensure ConfigPollutant entries exist for all pollutants
  const pollutantKeys = [...new Set(allBenchmarks.map(b => b.pollutantKey))];
  console.log(`\n📊 Processing ${pollutantKeys.length} unique pollutants...`);

  for (const key of pollutantKeys) {
    try {
      await prisma.configPollutant.upsert({
        where: { key },
        update: {},
        create: {
          key,
          aliases: [key],
          canonicalUnit: 'mg/L', // Default unit
          notes: 'Created by benchmark seeding',
        },
      });
    } catch (error) {
      // Pollutant might already exist, that's okay
    }
  }

  // Seed benchmarks
  console.log(`\n📈 Seeding ${allBenchmarks.length} benchmark values...\n`);

  for (const benchmark of allBenchmarks) {
    try {
      const result = await prisma.pollutantBenchmark.upsert({
        where: {
          pollutantKey_benchmarkType_waterType: {
            pollutantKey: benchmark.pollutantKey,
            benchmarkType: benchmark.benchmarkType,
            waterType: benchmark.waterType,
          },
        },
        update: {
          value: benchmark.value,
          valueMax: benchmark.valueMax,
          unit: benchmark.unit,
          source: benchmark.source,
          sourceDocument: benchmark.sourceDocument,
          sourceUrl: benchmark.sourceUrl,
          hardnessDependent: benchmark.hardnessDependent || false,
          hardnessEquation: benchmark.hardnessEquation,
          notes: benchmark.notes,
        },
        create: {
          pollutantKey: benchmark.pollutantKey,
          benchmarkType: benchmark.benchmarkType,
          waterType: benchmark.waterType,
          value: benchmark.value,
          valueMax: benchmark.valueMax,
          unit: benchmark.unit,
          source: benchmark.source,
          sourceDocument: benchmark.sourceDocument,
          sourceUrl: benchmark.sourceUrl,
          hardnessDependent: benchmark.hardnessDependent || false,
          hardnessEquation: benchmark.hardnessEquation,
          notes: benchmark.notes,
        },
      });

      console.log(
        `✓ ${benchmark.pollutantKey.padEnd(15)} | ${benchmark.benchmarkType.padEnd(12)} | ${benchmark.waterType.padEnd(10)} | ${benchmark.value} ${benchmark.unit}`,
      );
      createdCount++;
    } catch (error) {
      console.error(`✗ Error seeding ${benchmark.pollutantKey}: ${error}`);
      errorCount++;
    }
  }

  // Generate summary statistics
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Summary Statistics:\n');

  const totalBenchmarks = await prisma.pollutantBenchmark.count();
  console.log(`Total benchmarks in database: ${totalBenchmarks}`);

  // By source
  const bySource = await prisma.pollutantBenchmark.groupBy({
    by: ['source'],
    _count: true,
  });
  console.log('\nBenchmarks by Source:');
  bySource.forEach(s => console.log(`  ${s.source}: ${s._count}`));

  // By benchmark type
  const byType = await prisma.pollutantBenchmark.groupBy({
    by: ['benchmarkType'],
    _count: true,
  });
  console.log('\nBenchmarks by Type:');
  byType.forEach(t => console.log(`  ${t.benchmarkType}: ${t._count}`));

  // By water type
  const byWater = await prisma.pollutantBenchmark.groupBy({
    by: ['waterType'],
    _count: true,
  });
  console.log('\nBenchmarks by Water Type:');
  byWater.forEach(w => console.log(`  ${w.waterType}: ${w._count}`));

  // Hardness-dependent
  const hardnessDependent = await prisma.pollutantBenchmark.count({
    where: { hardnessDependent: true },
  });
  console.log(`\nHardness-dependent benchmarks: ${hardnessDependent}`);

  console.log('\n✅ Water Quality Benchmark seeding complete!');
  console.log(`   Created/Updated: ${createdCount}`);
  console.log(`   Errors: ${errorCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
