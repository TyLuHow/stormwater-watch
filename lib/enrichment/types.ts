/**
 * Type definitions for spatial enrichment system
 */

import type { Feature, FeatureCollection, Polygon, MultiPolygon, Point } from "geojson"

export interface EnrichmentResult {
  facilityId: string
  enriched: boolean
  fields: {
    county?: string
    watershedHuc12?: string
    ms4?: string
    isInDAC?: boolean
  }
  error?: string
}

export interface EnrichmentStats {
  total: number
  enriched: number
  skipped: number
  errors: string[]
}

export interface GeoDataset {
  name: string
  type: "county" | "huc12" | "dac" | "ms4"
  data: FeatureCollection<Polygon | MultiPolygon>
  loaded: boolean
  error?: string
}

export interface CountyFeature extends Feature<Polygon | MultiPolygon> {
  properties: {
    NAME: string
    NAMELSAD?: string
    COUNTYFP?: string
    [key: string]: any
  }
}

export interface HUC12Feature extends Feature<Polygon | MultiPolygon> {
  properties: {
    HUC12: string
    NAME?: string
    [key: string]: any
  }
}

export interface DACFeature extends Feature<Polygon | MultiPolygon> {
  properties: {
    CIscore?: number
    CIscorP?: number
    Tract?: string
    [key: string]: any
  }
}

export interface MS4Feature extends Feature<Polygon | MultiPolygon> {
  properties: {
    NAME: string
    AGENCY?: string
    MS4_PERMIT?: string
    [key: string]: any
  }
}

export interface SpatialEnrichmentOptions {
  facilityIds?: string[]  // If empty, enrich all facilities
  forceUpdate?: boolean   // Re-enrich even if already enriched
  datasets?: Array<"county" | "huc12" | "dac" | "ms4">  // Which datasets to use
}




