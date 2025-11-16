import { prisma } from "@/lib/prisma"
import { parseDate, convertUnit } from "./parser"
import { getReportingYear } from "@/lib/utils/dates"

export interface NormalizedSample {
  facilityName: string
  permitId: string
  pollutant: string
  value: number
  unit: string
  benchmark: number
  benchmarkUnit: string
  sampleDate: Date
  reportingYear: string
  sourceDocUrl?: string
  county?: string
  lat?: number
  lon?: number
}

export async function normalizeSamples(
  rows: any[],
  sourceUrl?: string,
): Promise<{ samples: NormalizedSample[]; warnings: string[] }> {
  const warnings: string[] = []
  const samples: NormalizedSample[] = []

  // Load pollutant config
  const pollutants = await prisma.configPollutant.findMany()
  // Create map of alias -> canonical key
  const pollutantMap = new Map<string, string>()
  for (const p of pollutants) {
    for (const alias of p.aliases) {
      pollutantMap.set(alias.toLowerCase(), p.key)
    }
    pollutantMap.set(p.key.toLowerCase(), p.key)
  }

  for (const row of rows) {
    try {
      const facilityName = row.facilityName || ""
      const permitId = row.permitId || row.wdid || ""
      const pollutantRaw = row.pollutant || row.parameter || ""

      if (!permitId || !pollutantRaw) {
        warnings.push(`Skipping row: missing permit ID or pollutant`)
        continue
      }

      // Normalize pollutant using alias map
      const pollutantRawLower = pollutantRaw.trim().toLowerCase()
      const pollutant = pollutantMap.get(pollutantRawLower) || pollutantRaw.trim().toUpperCase()
      const value = Number.parseFloat(row.value || row.result)
      const benchmark = Number.parseFloat(row.benchmark)
      const unit = (row.unit || "mg/L").trim()
      const sampleDate = parseDate(row.sampleDate || row.occurrenceDate)

      if (isNaN(value) || isNaN(benchmark) || !sampleDate) {
        warnings.push(`Skipping row: invalid value, benchmark, or date`)
        continue
      }

      const reportingYear = row.reportingYear || getReportingYear(sampleDate)

      // Get canonical unit for pollutant
      const pollutantConfig = pollutants.find((p) => p.key === pollutant)
      const canonicalUnit = pollutantConfig?.canonicalUnit || unit
      const convertedValue = convertUnit(value, unit, canonicalUnit)
      const convertedBenchmark = convertUnit(benchmark, unit, canonicalUnit)

      samples.push({
        facilityName,
        permitId,
        pollutant,
        value: convertedValue,
        unit: canonicalUnit,
        benchmark: convertedBenchmark,
        benchmarkUnit: canonicalUnit,
        sampleDate,
        reportingYear,
        sourceDocUrl: sourceUrl,
        county: row.county,
      })
    } catch (error) {
      warnings.push(`Error processing row: ${error instanceof Error ? error.message : "Unknown"}`)
    }
  }

  return { samples, warnings }
}

// Calculate exceedance ratio (null for pH)
export function computeExceedanceRatio(value: number, benchmark: number, pollutant: string): number | null {
  if (pollutant === "PH") return null
  if (benchmark === 0) return null
  const ratio = value / benchmark
  return Number.parseFloat(ratio.toFixed(4))
}
