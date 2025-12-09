/**
 * CSV Export Utilities
 *
 * Utilities for converting table data to CSV format with proper escaping
 * and metadata handling.
 */

/**
 * Escape CSV field value
 */
function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) {
    return ""
  }

  const stringValue = String(value)

  // If the value contains comma, quotes, or newlines, wrap in quotes and escape quotes
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  columns?: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) {
    return ""
  }

  // If columns not provided, use all keys from first object
  const finalColumns =
    columns ||
    Object.keys(data[0]).map((key) => ({
      key: key as keyof T,
      label: key,
    }))

  // Create header row
  const headers = finalColumns.map((col) => escapeCsvValue(col.label))
  const headerRow = headers.join(",")

  // Create data rows
  const dataRows = data.map((row) => {
    const values = finalColumns.map((col) => escapeCsvValue(row[col.key]))
    return values.join(",")
  })

  return [headerRow, ...dataRows].join("\n")
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(
  prefix: string,
  filterDescription?: string
): string {
  const timestamp = new Date().toISOString().split("T")[0]
  const filterPart = filterDescription ? `-${filterDescription}` : ""
  return `${prefix}${filterPart}-${timestamp}.csv`
}

/**
 * Format filter description for filename
 */
export function formatFilterDescription(filters: Record<string, any>): string {
  const parts: string[] = []

  for (const [key, value] of Object.entries(filters)) {
    if (value && value !== "") {
      // Convert camelCase to kebab-case and truncate long values
      const formattedKey = key.replace(/([A-Z])/g, "-$1").toLowerCase()
      const formattedValue =
        typeof value === "string" && value.length > 20
          ? value.substring(0, 20)
          : String(value)
      parts.push(`${formattedKey}-${formattedValue}`)
    }
  }

  return parts.slice(0, 3).join("_") // Limit to 3 filter parts to keep filename reasonable
}

/**
 * Add metadata header to CSV
 */
export function addMetadataHeader(
  csv: string,
  metadata: Record<string, any>
): string {
  const metadataLines = [
    "# Export Metadata",
    ...Object.entries(metadata).map(
      ([key, value]) => `# ${key}: ${value}`
    ),
    "",
  ]
  return metadataLines.join("\n") + csv
}

/**
 * Export violations to CSV
 */
export interface ViolationExport {
  facilityName: string
  facilityId: string
  county: string | null
  pollutant: string
  firstDate: string
  lastDate: string
  count: number
  maxRatio: string
  severity: string
  impairedWater: boolean
  dischargeLimit?: string | null
  screeningStandard?: string | null
  exceedanceRatio?: string | null
  daysActive?: number
}

export function exportViolations(
  violations: ViolationExport[],
  filters?: Record<string, any>
): void {
  const columns = [
    { key: "facilityName" as const, label: "Facility Name" },
    { key: "facilityId" as const, label: "Facility ID" },
    { key: "county" as const, label: "County" },
    { key: "pollutant" as const, label: "Pollutant" },
    { key: "firstDate" as const, label: "First Violation Date" },
    { key: "lastDate" as const, label: "Last Violation Date" },
    { key: "count" as const, label: "Violation Count" },
    { key: "maxRatio" as const, label: "Max Exceedance Ratio" },
    { key: "severity" as const, label: "Severity" },
    { key: "dischargeLimit" as const, label: "Discharge Limit" },
    { key: "screeningStandard" as const, label: "Screening Standard" },
    { key: "daysActive" as const, label: "Days Active" },
    { key: "impairedWater" as const, label: "Impaired Water" },
  ]

  let csv = arrayToCSV(violations, columns)

  // Add metadata if filters provided
  if (filters) {
    const metadata = {
      "Export Date": new Date().toISOString(),
      "Total Records": violations.length,
      "Applied Filters": formatFilterDescription(filters),
    }
    csv = addMetadataHeader(csv, metadata)
  }

  const filterDesc = filters ? formatFilterDescription(filters) : undefined
  const filename = generateFilename("violations", filterDesc)
  downloadCSV(csv, filename)
}

/**
 * Export samples to CSV
 */
export interface SampleExport {
  samplingDate: string
  samplingTime?: string
  facilityName: string
  locationType?: string
  locationCode: string
  parameterName: string
  parameterCategory: string | null
  result: string | null
  units: string
  qualifier: string
  dischargeLimit?: string | null
  screeningStandard?: string | null
  complianceStatus?: string
  mdl?: string | null
  ml?: string | null
  rl?: string | null
  analyticalMethod?: string | null
}

export function exportSamples(
  samples: SampleExport[],
  filters?: Record<string, any>
): void {
  const columns = [
    { key: "samplingDate" as const, label: "Sampling Date" },
    { key: "samplingTime" as const, label: "Sampling Time" },
    { key: "facilityName" as const, label: "Facility Name" },
    { key: "locationType" as const, label: "Location Type" },
    { key: "locationCode" as const, label: "Location Code" },
    { key: "parameterName" as const, label: "Parameter" },
    { key: "parameterCategory" as const, label: "Category" },
    { key: "result" as const, label: "Result" },
    { key: "units" as const, label: "Units" },
    { key: "qualifier" as const, label: "Qualifier" },
    { key: "dischargeLimit" as const, label: "Discharge Limit" },
    { key: "screeningStandard" as const, label: "Screening Standard" },
    { key: "complianceStatus" as const, label: "Compliance Status" },
    { key: "mdl" as const, label: "MDL" },
    { key: "ml" as const, label: "ML" },
    { key: "rl" as const, label: "RL" },
    { key: "analyticalMethod" as const, label: "Analytical Method" },
  ]

  let csv = arrayToCSV(samples, columns)

  // Add metadata if filters provided
  if (filters) {
    const metadata = {
      "Export Date": new Date().toISOString(),
      "Total Records": samples.length,
      "Applied Filters": formatFilterDescription(filters),
    }
    csv = addMetadataHeader(csv, metadata)
  }

  const filterDesc = filters ? formatFilterDescription(filters) : undefined
  const filename = generateFilename("samples", filterDesc)
  downloadCSV(csv, filename)
}

/**
 * Export facilities to CSV
 */
export interface FacilityExport {
  facilityName: string
  facilityPlaceId: number | string
  regionName: string
  receivingWaterBody: string | null
  locationCount: number
  sampleCount: number
  violationCount?: number
}

export function exportFacilities(
  facilities: FacilityExport[],
  filters?: Record<string, any>
): void {
  const columns = [
    { key: "facilityName" as const, label: "Facility Name" },
    { key: "facilityPlaceId" as const, label: "Facility ID" },
    { key: "regionName" as const, label: "Region" },
    { key: "receivingWaterBody" as const, label: "Receiving Water Body" },
    { key: "locationCount" as const, label: "Monitoring Locations" },
    { key: "sampleCount" as const, label: "Total Samples" },
    { key: "violationCount" as const, label: "Violation Count" },
  ]

  let csv = arrayToCSV(facilities, columns)

  // Add metadata if filters provided
  if (filters) {
    const metadata = {
      "Export Date": new Date().toISOString(),
      "Total Records": facilities.length,
      "Applied Filters": formatFilterDescription(filters),
    }
    csv = addMetadataHeader(csv, metadata)
  }

  const filterDesc = filters ? formatFilterDescription(filters) : undefined
  const filename = generateFilename("facilities", filterDesc)
  downloadCSV(csv, filename)
}
