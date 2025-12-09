import { z } from "zod"
import { ESMRLocationType, ESMRQualifier } from "@prisma/client"

// =============================================================================
// Validation Schemas
// =============================================================================

export const FacilitiesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  regionCode: z.string().optional(),
  facilityName: z.string().optional(),
  receivingWaterBody: z.string().optional(),
})

export const SamplesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  facilityPlaceId: z.coerce.number().int().optional(),
  locationPlaceId: z.coerce.number().int().optional(),
  parameterId: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
  qualifier: z.nativeEnum(ESMRQualifier).optional(),
  locationType: z.nativeEnum(ESMRLocationType).optional(),
  sortBy: z.enum(["samplingDate", "result"]).default("samplingDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

export const ParametersQuerySchema = z.object({
  category: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
})

// =============================================================================
// Response Types
// =============================================================================

export interface FacilityListResponse {
  facilities: {
    facilityPlaceId: number
    facilityName: string
    regionCode: string
    regionName: string
    receivingWaterBody: string | null
    locationCount: number
    sampleCount: number
  }[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface FacilityDetailResponse {
  facility: {
    facilityPlaceId: number
    facilityName: string
    regionCode: string
    regionName: string
    receivingWaterBody: string | null
    createdAt: string
    lastSeenAt: string
  }
  locations: {
    locationPlaceId: number
    locationCode: string
    locationType: ESMRLocationType
    latitude: string | null
    longitude: string | null
    locationDesc: string | null
    sampleCount: number
  }[]
  recentSamples: {
    parameter: string
    category: string | null
    latestSample: string // date
    sampleCount: number
    avgResult: string | null
    minResult: string | null
    maxResult: string | null
    units: string | null
  }[]
  stats: {
    totalLocations: number
    totalSamples: number
    totalParameters: number
    dateRange: {
      earliest: string | null
      latest: string | null
    }
  }
}

export interface SampleListResponse {
  samples: {
    id: string
    locationPlaceId: number
    locationCode: string
    locationType: ESMRLocationType
    locationDesc: string | null
    facilityPlaceId: number
    facilityName: string
    parameterName: string
    parameterCategory: string | null
    samplingDate: string
    samplingTime: string
    qualifier: ESMRQualifier
    result: string | null
    units: string
    mdl: string | null
    ml: string | null
    rl: string | null
    analyticalMethod: string | null
    reviewPriorityIndicator: boolean | null
  }[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface ParameterListResponse {
  parameters: {
    id: string
    parameterName: string
    category: string | null
    canonicalKey: string | null
    sampleCount: number
  }[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface ParametersByCategory {
  [category: string]: {
    id: string
    parameterName: string
    canonicalKey: string | null
    sampleCount: number
  }[]
}

export interface RegionListResponse {
  regions: {
    code: string
    name: string
    facilityCount: number
    locationCount: number
    sampleCount: number
  }[]
}

export interface StatsResponse {
  totals: {
    facilities: number
    locations: number
    samples: number
    parameters: number
    regions: number
  }
  recentActivity: {
    samplesLast30Days: number
    samplesLast7Days: number
  }
  topParameters: {
    parameterName: string
    category: string | null
    sampleCount: number
  }[]
  dateRange: {
    earliest: string | null
    latest: string | null
  }
  byQualifier: {
    qualifier: ESMRQualifier
    count: number
  }[]
  byLocationType: {
    locationType: ESMRLocationType
    count: number
  }[]
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Build a Prisma where clause for date range filtering
 */
export function buildDateRangeFilter(
  startDate?: string,
  endDate?: string
): { gte?: Date; lte?: Date } | undefined {
  if (!startDate && !endDate) return undefined

  const filter: { gte?: Date; lte?: Date } = {}

  if (startDate) {
    filter.gte = new Date(startDate)
  }

  if (endDate) {
    filter.lte = new Date(endDate)
  }

  return filter
}

/**
 * Build a Prisma where clause for text search (case-insensitive contains)
 */
export function buildTextSearchFilter(
  field: string,
  value?: string
): { contains: string; mode: "insensitive" } | undefined {
  if (!value) return undefined

  return {
    contains: value,
    mode: "insensitive",
  }
}

/**
 * Calculate pagination metadata
 */
export function buildPaginationResponse(
  total: number,
  limit: number,
  offset: number
) {
  return {
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  }
}

/**
 * Format Decimal to string for JSON serialization
 */
export function formatDecimal(value: any): string | null {
  if (value === null || value === undefined) return null
  return value.toString()
}
