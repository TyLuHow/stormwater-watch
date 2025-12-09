/**
 * Monitoring Location Parser
 *
 * Utilities for parsing monitoring location codes and types into
 * human-readable descriptions. Addresses the issue where cryptic IDs
 * like "EFF-001" require site plans to understand.
 *
 * Example transformations:
 * - "EFF-001" → "Effluent Monitoring (EFF-001)"
 * - "R-001D" → "Receiving Water Monitoring (R-001D)"
 * - "INF-001" → "Influent Monitoring (INF-001)"
 */

import { ESMRLocationType } from "@prisma/client"

export type LocationType =
  | "effluent"
  | "influent"
  | "receiving"
  | "recycled"
  | "internal"
  | "groundwater"
  | "other"

export interface ParsedLocation {
  type: LocationType
  number: string
  description: string
  fullLabel: string
}

/**
 * Map ESMRLocationType enum to simplified location type
 */
export function mapLocationTypeToSimple(
  locationType: ESMRLocationType
): LocationType {
  switch (locationType) {
    case "EFFLUENT_MONITORING":
      return "effluent"
    case "INFLUENT_MONITORING":
      return "influent"
    case "RECEIVING_WATER_MONITORING":
      return "receiving"
    case "RECYCLED_WATER_MONITORING":
      return "recycled"
    case "INTERNAL_MONITORING":
      return "internal"
    case "GROUNDWATER_MONITORING":
      return "groundwater"
    default:
      return "other"
  }
}

/**
 * Get human-readable description from location type
 */
export function getLocationTypeDescription(type: LocationType): string {
  switch (type) {
    case "effluent":
      return "Effluent Monitoring"
    case "influent":
      return "Influent Monitoring"
    case "receiving":
      return "Receiving Water Monitoring"
    case "recycled":
      return "Recycled Water Monitoring"
    case "internal":
      return "Internal Monitoring"
    case "groundwater":
      return "Groundwater Monitoring"
    case "other":
      return "Monitoring Location"
  }
}

/**
 * Get human-readable description from ESMRLocationType enum
 */
export function getLocationTypeDescriptionFromEnum(
  locationType: ESMRLocationType
): string {
  const simpleType = mapLocationTypeToSimple(locationType)
  return getLocationTypeDescription(simpleType)
}

/**
 * Parse location code to extract type and number
 * Handles common patterns:
 * - EFF-001, EFF-002, etc. (Effluent)
 * - R-001D, R-002, etc. (Receiving)
 * - INF-001, INF-002, etc. (Influent)
 * - RW-001, RW-002, etc. (Recycled Water)
 * - M-001, M-002, etc. (Internal/Other)
 * - GW-001, GW-002, etc. (Groundwater)
 */
export function parseLocationCode(locationCode: string): {
  type: LocationType
  number: string
} {
  const code = locationCode.trim().toUpperCase()

  // Extract prefix and number using regex
  const match = code.match(/^([A-Z]+)-?(.+)$/)
  if (!match) {
    return {
      type: "other",
      number: code,
    }
  }

  const prefix = match[1]
  const number = match[2]

  // Map prefix to type
  let type: LocationType = "other"
  if (prefix === "EFF" || prefix === "E") {
    type = "effluent"
  } else if (prefix === "R" || prefix === "REC") {
    type = "receiving"
  } else if (prefix === "INF" || prefix === "I") {
    type = "influent"
  } else if (prefix === "RW" || prefix === "RECYCLED") {
    type = "recycled"
  } else if (prefix === "M" || prefix === "INT") {
    type = "internal"
  } else if (prefix === "GW" || prefix === "GROUND") {
    type = "groundwater"
  }

  return { type, number }
}

/**
 * Parse location ID and generate full description
 * If locationType enum is provided, it takes precedence over code parsing
 */
export function parseLocationId(
  locationCode: string,
  locationType?: ESMRLocationType
): ParsedLocation {
  // If we have the enum type, use that (more accurate)
  if (locationType) {
    const type = mapLocationTypeToSimple(locationType)
    const description = getLocationTypeDescription(type)
    return {
      type,
      number: locationCode,
      description,
      fullLabel: `${description} (${locationCode})`,
    }
  }

  // Otherwise, parse from code
  const parsed = parseLocationCode(locationCode)
  const description = getLocationTypeDescription(parsed.type)

  return {
    type: parsed.type,
    number: parsed.number,
    description,
    fullLabel: `${description} (${locationCode})`,
  }
}

/**
 * Format location for display
 */
export function formatLocationDisplay(
  locationCode: string,
  locationType?: ESMRLocationType,
  format: "full" | "compact" | "code-only" = "full"
): string {
  const parsed = parseLocationId(locationCode, locationType)

  switch (format) {
    case "full":
      return parsed.fullLabel
    case "compact":
      return parsed.description
    case "code-only":
      return locationCode
    default:
      return parsed.fullLabel
  }
}

/**
 * Get a short label for location type (useful for badges)
 */
export function getLocationTypeShortLabel(type: LocationType): string {
  switch (type) {
    case "effluent":
      return "Effluent"
    case "influent":
      return "Influent"
    case "receiving":
      return "Receiving Water"
    case "recycled":
      return "Recycled Water"
    case "internal":
      return "Internal"
    case "groundwater":
      return "Groundwater"
    case "other":
      return "Monitoring"
  }
}

/**
 * Get color variant for location type badge
 */
export function getLocationTypeBadgeVariant(
  type: LocationType
): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "effluent":
      return "default"
    case "influent":
      return "secondary"
    case "receiving":
      return "outline"
    case "recycled":
      return "secondary"
    case "internal":
      return "outline"
    case "groundwater":
      return "outline"
    case "other":
      return "outline"
  }
}

/**
 * Format ESMRLocationType enum for display (human-readable)
 */
export function formatESMRLocationType(locationType: ESMRLocationType): string {
  return locationType.replace(/_/g, " ")
}
