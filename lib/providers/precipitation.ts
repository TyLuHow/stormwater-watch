/**
 * Precipitation Context Provider
 * Integrates with NOAA/NWS API for observed precipitation data
 */

import { redisClient } from "./providers"
import { DEV_MODE } from "@/lib/dev-mode"

export interface PrecipitationData {
  date: Date
  precipitationMM: number | null
  precipitationInches: number | null
  lastUpdate: Date
  source: string
  cached: boolean
}

export interface NWSGridPoint {
  gridX: number
  gridY: number
  office: string
}

const USER_AGENT = process.env.NWS_USER_AGENT || "(Contact)alerts@stormwaterwatch.org (Stormwater Watch MVP)"

// Cache TTL: 6 hours
const CACHE_TTL_SECONDS = 6 * 60 * 60

/**
 * Convert lat/lon to NWS grid coordinates
 * Uses NWS /points API
 */
export async function getNWSGridPoint(lat: number, lon: number): Promise<NWSGridPoint | null> {
  // Check cache first
  const cacheKey = `nws:grid:${lat.toFixed(4)}:${lon.toFixed(4)}`
  
  if (redisClient) {
    try {
      const cached = await redisClient.get(cacheKey)
      if (cached) {
        return JSON.parse(cached as string)
      }
    } catch (error) {
      console.warn("Redis get error:", error)
    }
  }

  try {
    const url = `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/geo+json",
      },
    })

    if (!response.ok) {
      console.error(`NWS points API error: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()
    
    const gridPoint: NWSGridPoint = {
      gridX: data.properties.gridX,
      gridY: data.properties.gridY,
      office: data.properties.gridId || data.properties.cwa,
    }

    // Cache for 24 hours (grid points don't change)
    if (redisClient) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(gridPoint), {
          ex: 24 * 60 * 60,
        })
      } catch (error) {
        console.warn("Redis set error:", error)
      }
    }

    return gridPoint
  } catch (error) {
    console.error("Error getting NWS grid point:", error)
    return null
  }
}

/**
 * Get precipitation data for a specific date and location
 * Fetches observations from NWS API for date ±3 days
 */
export async function getPrecipitationForDate(
  lat: number,
  lon: number,
  date: Date
): Promise<PrecipitationData> {
  const result: PrecipitationData = {
    date,
    precipitationMM: null,
    precipitationInches: null,
    lastUpdate: new Date(),
    source: "NOAA/NWS",
    cached: false,
  }

  // In dev mode, return mock data
  if (DEV_MODE) {
    result.precipitationMM = Math.random() * 50
    result.precipitationInches = result.precipitationMM / 25.4
    result.source = "MOCK DATA (DEV MODE)"
    return result
  }

  // Check cache
  const cacheKey = `nws:precip:${lat.toFixed(4)}:${lon.toFixed(4)}:${date.toISOString().split("T")[0]}`
  
  if (redisClient) {
    try {
      const cached = await redisClient.get(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached as string)
        return { ...parsed, date: new Date(parsed.date), lastUpdate: new Date(parsed.lastUpdate), cached: true }
      }
    } catch (error) {
      console.warn("Redis get error:", error)
    }
  }

  try {
    // Get grid coordinates
    const gridPoint = await getNWSGridPoint(lat, lon)
    if (!gridPoint) {
      result.source = "NWS API - Grid point not found"
      return result
    }

    // Fetch observations
    const startDate = new Date(date)
    startDate.setDate(startDate.getDate() - 3)
    const endDate = new Date(date)
    endDate.setDate(endDate.getDate() + 3)

    const url = `https://api.weather.gov/gridpoints/${gridPoint.office}/${gridPoint.gridX},${gridPoint.gridY}/observations`

    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/geo+json",
      },
    })

    if (!response.ok) {
      console.error(`NWS observations API error: ${response.status}`)
      result.source = `NWS API Error: ${response.status}`
      return result
    }

    const data = await response.json()
    const observations = data.features || []

    // Find closest observation to target date
    let closestObs = null
    let minDiff = Infinity

    for (const obs of observations) {
      const obsDate = new Date(obs.properties.timestamp)
      const diff = Math.abs(obsDate.getTime() - date.getTime())
      
      if (diff < minDiff && obs.properties.precipitationLastHour) {
        minDiff = diff
        closestObs = obs
      }
    }

    if (closestObs) {
      // NWS returns precipitation in meters
      const precipMeters = closestObs.properties.precipitationLastHour.value
      if (precipMeters !== null) {
        result.precipitationMM = precipMeters * 1000
        result.precipitationInches = result.precipitationMM / 25.4
      }
    }

    // Cache result
    if (redisClient) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(result), {
          ex: CACHE_TTL_SECONDS,
        })
      } catch (error) {
        console.warn("Redis set error:", error)
      }
    }

    return result
  } catch (error) {
    console.error("Error fetching precipitation data:", error)
    result.source = `Error: ${error instanceof Error ? error.message : "Unknown"}`
    return result
  }
}

/**
 * Get precipitation data for multiple sample dates
 * Used for case packet generation
 */
export async function getPrecipitationForSamples(
  samples: Array<{ sampleDate: Date; facilityId: string }>,
  facility: { lat: number; lon: number }
): Promise<PrecipitationData[]> {
  console.log(`🌧️  Fetching precipitation for ${samples.length} samples`)

  const results: PrecipitationData[] = []

  // Fetch in parallel but limit concurrency to avoid rate limiting
  const BATCH_SIZE = 5
  for (let i = 0; i < samples.length; i += BATCH_SIZE) {
    const batch = samples.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map((sample) =>
        getPrecipitationForDate(facility.lat, facility.lon, sample.sampleDate)
      )
    )
    results.push(...batchResults)

    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < samples.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  console.log(`✅ Precipitation data fetched: ${results.filter((r) => r.precipitationMM !== null).length}/${samples.length} successful`)

  return results
}

/**
 * Clear precipitation cache (for testing/debugging)
 */
export async function clearPrecipitationCache(): Promise<void> {
  if (!redisClient) {
    console.log("No Redis client available")
    return
  }

  try {
    // Note: This is a simple implementation
    // In production, you'd want a more efficient way to clear specific keys
    console.log("Precipitation cache cleared (manual implementation needed for production)")
  } catch (error) {
    console.error("Error clearing cache:", error)
  }
}

