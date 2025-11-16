/**
 * Spatial Enrichment Pipeline
 * Enriches facilities with geographic context: HUC12 watershed, county, DAC status, MS4 jurisdiction
 */

import * as turf from "@turf/turf"
import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon"
import type { Point } from "geojson"
import { prisma } from "@/lib/prisma"
import type {
  EnrichmentResult,
  EnrichmentStats,
  GeoDataset,
  CountyFeature,
  HUC12Feature,
  DACFeature,
  MS4Feature,
  SpatialEnrichmentOptions,
} from "./types"
import { DEV_MODE } from "@/lib/dev-mode"

// In-memory cache for geodata to avoid repeated file loads
let geodataCache: Map<string, GeoDataset> = new Map()

/**
 * Load geodata from public directory or return from cache
 */
async function loadGeodata(type: "county" | "huc12" | "dac" | "ms4"): Promise<GeoDataset> {
  // Check cache first
  const cached = geodataCache.get(type)
  if (cached?.loaded) {
    return cached
  }

  // In dev mode, return mock data
  if (DEV_MODE) {
    console.log(`[DEV] Using mock ${type} geodata`)
    return {
      name: type,
      type,
      data: { type: "FeatureCollection", features: [] },
      loaded: true,
    }
  }

  const dataset: GeoDataset = {
    name: type,
    type,
    data: { type: "FeatureCollection", features: [] },
    loaded: false,
  }

  try {
    // Try to load from public directory
    const filePaths: Record<string, string> = {
      county: "/geodata/california-counties.geojson",
      huc12: "/geodata/huc12-california.geojson",
      dac: "/geodata/calenviroscreen-dacs.geojson",
      ms4: "/geodata/ms4-boundaries.geojson",
    }

    const filePath = filePaths[type]
    const response = await fetch(`http://localhost:3000${filePath}`)
    
    if (!response.ok) {
      throw new Error(`Failed to load ${type} geodata: ${response.statusText}`)
    }

    const data = await response.json()
    dataset.data = data
    dataset.loaded = true

    // Cache it
    geodataCache.set(type, dataset)
    console.log(`✅ Loaded ${type} geodata: ${data.features.length} features`)
  } catch (error) {
    dataset.error = error instanceof Error ? error.message : "Unknown error"
    console.warn(`⚠️  Failed to load ${type} geodata:`, dataset.error)
  }

  return dataset
}

/**
 * Find which polygon contains a point
 */
function findContainingPolygon<T extends CountyFeature | HUC12Feature | DACFeature | MS4Feature>(
  point: Point,
  features: T[]
): T | null {
  for (const feature of features) {
    try {
      if (booleanPointInPolygon(point, feature)) {
        return feature
      }
    } catch (error) {
      // Skip invalid geometries
      continue
    }
  }
  return null
}

/**
 * Enrich a single facility with spatial data
 */
export async function enrichFacility(
  facilityId: string,
  datasets: {
    county?: GeoDataset
    huc12?: GeoDataset
    dac?: GeoDataset
    ms4?: GeoDataset
  }
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    facilityId,
    enriched: false,
    fields: {},
  }

  try {
    // Get facility coordinates
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: { id: true, lat: true, lon: true, county: true, watershedHuc12: true, ms4: true, isInDAC: true },
    })

    if (!facility) {
      result.error = "Facility not found"
      return result
    }

    const point: Point = {
      type: "Point",
      coordinates: [facility.lon, facility.lat],
    }

    // County lookup
    if (datasets.county?.loaded && !facility.county) {
      const countyFeature = findContainingPolygon<CountyFeature>(
        point,
        datasets.county.data.features as CountyFeature[]
      )
      if (countyFeature) {
        result.fields.county = countyFeature.properties.NAME || countyFeature.properties.NAMELSAD
      }
    }

    // HUC12 watershed lookup
    if (datasets.huc12?.loaded && !facility.watershedHuc12) {
      const huc12Feature = findContainingPolygon<HUC12Feature>(
        point,
        datasets.huc12.data.features as HUC12Feature[]
      )
      if (huc12Feature) {
        result.fields.watershedHuc12 = huc12Feature.properties.HUC12
      }
    }

    // MS4 jurisdiction lookup
    if (datasets.ms4?.loaded && !facility.ms4) {
      const ms4Feature = findContainingPolygon<MS4Feature>(
        point,
        datasets.ms4.data.features as MS4Feature[]
      )
      if (ms4Feature) {
        result.fields.ms4 = ms4Feature.properties.NAME || ms4Feature.properties.AGENCY
      }
    }

    // CalEnviroScreen DAC lookup (≥75th percentile)
    if (datasets.dac?.loaded) {
      const dacFeature = findContainingPolygon<DACFeature>(
        point,
        datasets.dac.data.features as DACFeature[]
      )
      if (dacFeature) {
        // CalEnviroScreen score ≥ 75 means disadvantaged community
        const score = dacFeature.properties.CIscorP || dacFeature.properties.CIscore || 0
        result.fields.isInDAC = score >= 75
      } else {
        result.fields.isInDAC = false
      }
    }

    // Update facility if we found any new data
    if (Object.keys(result.fields).length > 0) {
      await prisma.facility.update({
        where: { id: facilityId },
        data: {
          ...result.fields,
          enrichedAt: new Date(),
        },
      })
      result.enriched = true
    }

    return result
  } catch (error) {
    result.error = error instanceof Error ? error.message : "Unknown error"
    console.error(`Error enriching facility ${facilityId}:`, error)
    return result
  }
}

/**
 * Main enrichment function - enrich multiple facilities
 */
export async function enrichFacilities(
  options: SpatialEnrichmentOptions = {}
): Promise<EnrichmentStats> {
  const startTime = Date.now()
  console.log("🌍 Starting spatial enrichment...")

  const stats: EnrichmentStats = {
    total: 0,
    enriched: 0,
    skipped: 0,
    errors: [],
  }

  try {
    // Load geodata
    const datasetsToLoad = options.datasets || ["county", "huc12", "dac", "ms4"]
    const datasets: {
      county?: GeoDataset
      huc12?: GeoDataset
      dac?: GeoDataset
      ms4?: GeoDataset
    } = {}

    for (const type of datasetsToLoad) {
      datasets[type] = await loadGeodata(type)
    }

    // Get facilities to enrich
    const where = options.facilityIds
      ? { id: { in: options.facilityIds } }
      : options.forceUpdate
      ? {}
      : { enrichedAt: null }

    const facilities = await prisma.facility.findMany({
      where,
      select: { id: true },
    })

    stats.total = facilities.length
    console.log(`📍 Processing ${stats.total} facilities...`)

    // Process in batches to avoid overwhelming the system
    const BATCH_SIZE = 50
    for (let i = 0; i < facilities.length; i += BATCH_SIZE) {
      const batch = facilities.slice(i, i + BATCH_SIZE)
      const results = await Promise.all(
        batch.map((f) => enrichFacility(f.id, datasets))
      )

      for (const result of results) {
        if (result.enriched) {
          stats.enriched++
        } else if (result.error) {
          stats.errors.push(`${result.facilityId}: ${result.error}`)
        } else {
          stats.skipped++
        }
      }

      console.log(`  Progress: ${Math.min(i + BATCH_SIZE, facilities.length)}/${facilities.length}`)
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`✅ Enrichment complete in ${duration}s`)
    console.log(`   Enriched: ${stats.enriched}, Skipped: ${stats.skipped}, Errors: ${stats.errors.length}`)

    return stats
  } catch (error) {
    console.error("❌ Enrichment failed:", error)
    stats.errors.push(error instanceof Error ? error.message : "Unknown error")
    return stats
  }
}

/**
 * Check if a point is within a given distance (in km) of coordinates
 * Used for BUFFER subscription mode
 */
export function isWithinBuffer(
  facilityLat: number,
  facilityLon: number,
  centerLat: number,
  centerLon: number,
  radiusKm: number
): boolean {
  const from = turf.point([centerLon, centerLat])
  const to = turf.point([facilityLon, facilityLat])
  const distance = turf.distance(from, to, { units: "kilometers" })
  return distance <= radiusKm
}

/**
 * Check if a point is within a polygon
 * Used for POLYGON subscription mode
 */
export function isWithinPolygon(
  facilityLat: number,
  facilityLon: number,
  polygonGeoJSON: any
): boolean {
  try {
    const point: Point = {
      type: "Point",
      coordinates: [facilityLon, facilityLat],
    }
    return booleanPointInPolygon(point, polygonGeoJSON)
  } catch (error) {
    console.error("Error checking point in polygon:", error)
    return false
  }
}

/**
 * Clear geodata cache (useful for testing or reloading)
 */
export function clearGeodataCache(): void {
  geodataCache.clear()
  console.log("🗑️  Geodata cache cleared")
}




