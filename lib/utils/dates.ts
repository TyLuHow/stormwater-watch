/**
 * Date utilities for Stormwater Watch
 * Implements reporting year calculation (July 1 - June 30 fiscal year)
 */

/**
 * Calculate reporting year for a given sample date
 * Reporting year runs from July 1 to June 30
 * 
 * @param sampleDate - The date of the sample
 * @returns Reporting year in format "YYYY–YYYY" (e.g., "2023–2024")
 */
export function getReportingYear(sampleDate: Date): string {
  const year = sampleDate.getFullYear()
  const month = sampleDate.getMonth() // 0-11

  // July (month 6) onwards belongs to current year's reporting period
  if (month >= 6) {
    // July 2023 - June 2024 = "2023–2024"
    return `${year}–${year + 1}`
  } else {
    // January 2024 - June 2024 = "2023–2024" (part of previous fiscal year)
    return `${year - 1}–${year}`
  }
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}




