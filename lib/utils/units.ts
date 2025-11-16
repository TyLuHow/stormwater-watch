/**
 * Unit normalization utilities
 * Converts pollutant values to canonical units
 */

/**
 * Normalize metal unit (always store as µg/L internally)
 */
export function normalizeMetalUnit(value: number, unit: string): { value: number; unit: string } {
  const unitLower = unit.toLowerCase()

  if (unitLower.includes("mg/l") || unitLower === "mg/l") {
    return { value: value * 1000, unit: "µg/L" }
  }

  // Already in µg/L or compatible
  if (unitLower.includes("µg/l") || unitLower.includes("ug/l") || unitLower === "µg/l") {
    return { value, unit: "µg/L" }
  }

  // Default to µg/L if unknown
  return { value, unit: "µg/L" }
}

/**
 * Normalize TSS/O&G unit (always store as mg/L)
 */
export function normalizeMassUnit(value: number, unit: string): { value: number; unit: string } {
  const unitLower = unit.toLowerCase()

  if (unitLower.includes("mg/l") || unitLower === "mg/l") {
    return { value, unit: "mg/L" }
  }

  // Default to mg/L if unknown
  return { value, unit: "mg/L" }
}

/**
 * Check if pH value is within acceptable range (6.0-9.0)
 */
export function isPhExceedance(value: number): boolean {
  return value < 6.0 || value > 9.0
}

/**
 * Check if a unit represents pH
 */
export function isPhUnit(unit: string): boolean {
  const unitLower = unit.toLowerCase()
  return unitLower === "ph" || unitLower === "ph units" || unitLower === "dimensionless"
}




