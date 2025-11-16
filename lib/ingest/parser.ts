import { parse } from "csv-parse/sync"
import { createHash } from "crypto"

export interface ParsedRow {
  facilityName?: string
  permitId?: string
  wdid?: string
  pollutant?: string
  parameter?: string
  value?: string
  result?: string
  unit?: string
  benchmark?: string
  sampleDate?: string
  occurrenceDate?: string
  reportingYear?: string
  source?: string
  sourceUrl?: string
  county?: string
  errors?: string[]
}

export interface ParseResult {
  rows: ParsedRow[]
  warnings: string[]
  checksum: string
}

// Map common CIWQS/SMARTS column names to normalized keys
const COLUMN_ALIASES: { [key: string]: string } = {
  "facility name": "facilityName",
  facility_name: "facilityName",
  wdid: "permitId",
  "permit id": "permitId",
  permit_id: "permitId",
  parameter: "pollutant",
  pollutant: "pollutant",
  value: "value",
  result: "value",
  unit: "unit",
  units: "unit",
  benchmark: "benchmark",
  nал: "benchmark",
  "occurrence date": "sampleDate",
  occurrence_date: "sampleDate",
  "sample date": "sampleDate",
  sample_date: "sampleDate",
  "reporting year": "reportingYear",
  reporting_year: "reportingYear",
  county: "county",
  "regional board": "county",
}

function normalizeHeader(header: string): string {
  const normalized = header.toLowerCase().trim()
  return COLUMN_ALIASES[normalized] || normalized
}

export async function parseCSV(buffer: Buffer): Promise<ParseResult> {
  const warnings: string[] = []
  const rows: ParsedRow[] = []

  try {
    const text = buffer.toString("utf8")
    const checksum = createHash("sha256").update(text).digest("hex")

    // Parse CSV
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      on_record: (record: any) => {
        const normalized: any = {}
        for (const [key, value] of Object.entries(record)) {
          const normalizedKey = normalizeHeader(key)
          normalized[normalizedKey] = value
        }
        return normalized
      },
    }) as ParsedRow[]

    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      const errors: string[] = []

      // Validate required fields
      if (!row.facilityName && !row.permitId) {
        errors.push("Missing facility name or permit ID")
      }
      if (!row.pollutant && !row.parameter) {
        errors.push("Missing pollutant/parameter")
      }
      if (!row.value && !row.result) {
        errors.push("Missing value/result")
      }
      if (!row.sampleDate && !row.occurrenceDate) {
        errors.push("Missing sample date")
      }

      row.errors = errors
      if (errors.length === 0) {
        rows.push(row)
      } else {
        warnings.push(`Row ${i + 1}: ${errors.join("; ")}`)
      }
    }

    if (rows.length === 0) {
      warnings.push("No valid rows parsed from file")
    }

    return {
      rows,
      warnings,
      checksum,
    }
  } catch (error) {
    throw new Error(`CSV parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Note: normalizePollutant moved to normalize.ts to work with String[] aliases

// Parse and validate dates with fallback handling
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null

  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY or MM-DD-YYYY
  ]

  for (const fmt of formats) {
    const match = dateStr.match(fmt)
    if (match) {
      try {
        if (fmt === formats[0]) {
          // MM/DD/YYYY
          return new Date(Number.parseInt(match[3]), Number.parseInt(match[1]) - 1, Number.parseInt(match[2]))
        } else if (fmt === formats[1]) {
          // YYYY-MM-DD
          return new Date(Number.parseInt(match[1]), Number.parseInt(match[2]) - 1, Number.parseInt(match[3]))
        }
      } catch (e) {
        continue
      }
    }
  }

  return new Date(dateStr)
}

// Convert units
export function convertUnit(value: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return value
  if (fromUnit === "mg/L" && toUnit === "µg/L") return value * 1000
  if (fromUnit === "µg/L" && toUnit === "mg/L") return value / 1000
  return value
}
