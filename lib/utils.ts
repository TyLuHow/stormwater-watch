import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Reporting year: Jul 1 – Jun 30
export function getReportingYear(date: Date): string {
  const month = date.getMonth()
  const year = date.getFullYear()
  const fiscalYear = month >= 6 ? year : year - 1
  return `${fiscalYear}-${fiscalYear + 1}`
}

// Exceedance ratio calculation
export function computeExceedanceRatio(value: number, benchmark: number, pollutant: string): number | null {
  if (pollutant === "PH") return null // pH is range-based
  if (benchmark === 0) return null
  return value / benchmark
}

// Unit normalization: convert to canonical
export function normalizeUnits(value: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return value
  if (fromUnit === "mg/L" && toUnit === "µg/L") return value * 1000
  if (fromUnit === "µg/L" && toUnit === "mg/L") return value / 1000
  return value
}

// Deduplication check
export function isDuplicate(existing: any, incoming: any, tolerance = 0.05): boolean {
  return (
    existing.facilityId === incoming.facilityId &&
    existing.pollutant === incoming.pollutant &&
    new Date(existing.sampleDate).getTime() === new Date(incoming.sampleDate).getTime() &&
    Math.abs(Number(existing.value) - Number(incoming.value)) / Number(existing.value) < tolerance
  )
}

// Haversine distance
export function haversineDistance(point1: { lat: number; lon: number }, point2: { lat: number; lon: number }): number {
  const R = 3959 // Earth radius in miles
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(point2.lat - point1.lat)
  const dLon = toRad(point2.lon - point1.lon)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Format numbers consistently for hydration (server/client match)
// Uses explicit 'en-US' locale to prevent hydration mismatches
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}
