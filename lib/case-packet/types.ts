/**
 * Type definitions for case packet generation
 */

import type { Facility, ViolationEvent, Sample } from "@prisma/client"

export interface CasePacketData {
  facility: Facility
  violation: ViolationEvent
  samples: Sample[]
  precipitation?: PrecipitationData[]
  generatedAt: Date
  generatedBy?: string
}

export interface PrecipitationData {
  date: Date
  precipitationMM: number | null
  source: string
}

export interface CasePacketOptions {
  includeMap?: boolean
  includeChart?: boolean
  includePrecipitation?: boolean
}




