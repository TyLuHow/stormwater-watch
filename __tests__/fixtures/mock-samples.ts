/**
 * Mock samples for testing
 * Moved from app/facilities/[id]/page.tsx to test fixtures
 */

export const mockSamples = [
  {
    id: "sample-001",
    pollutant: "Total Nitrogen",
    sampleDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    value: 12.5,
    unit: "mg/L",
    benchmark: 5.0,
    benchmarkUnit: "mg/L",
    exceedanceRatio: 2.5,
  },
  {
    id: "sample-002",
    pollutant: "Total Nitrogen",
    sampleDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    value: 8.0,
    unit: "mg/L",
    benchmark: 5.0,
    benchmarkUnit: "mg/L",
    exceedanceRatio: 1.6,
  },
  {
    id: "sample-003",
    pollutant: "Phosphorus",
    sampleDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    value: 1.8,
    unit: "mg/L",
    benchmark: 1.0,
    benchmarkUnit: "mg/L",
    exceedanceRatio: 1.8,
  },
]
