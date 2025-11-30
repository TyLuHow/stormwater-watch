import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/cron/esmr-sync
 * Weekly cron job to sync new eSMR samples from data.ca.gov
 * Uses the CKAN API to fetch only records newer than our latest sample
 * Protected with CRON_SECRET
 */

// data.ca.gov CKAN API endpoint
const CKAN_API_URL = "https://data.ca.gov/api/3/action/datastore_search_sql"
const ESMR_RESOURCE_ID = "5ebbd97a-ffa9-4b75-8904-80e71a5e92c3"

interface ESMRAPIRecord {
  facility_place_id: string
  facility_name: string
  region_code: string
  region_name: string
  location_place_id: string
  location_code: string
  location_name: string
  location_type: string
  latitude: string
  longitude: string
  parameter_name: string
  parameter_code: string
  parameter_category: string
  sampling_date: string
  sampling_time: string
  qualifier: string
  result: string
  units: string
  mdl: string
  ml: string
  rl: string
  analytical_method: string
  review_priority_indicator: string
  report_name: string
  smr_document_id: string
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("Authorization")
  const expectedSecret = `Bearer ${process.env.CRON_SECRET || "dev-secret"}`

  if (authHeader !== expectedSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()
  console.log("🔄 Starting eSMR sync job...")

  try {
    // Get the latest sampling date in our database
    const latestSample = await prisma.eSMRSample.findFirst({
      orderBy: { samplingDate: "desc" },
      select: { samplingDate: true },
    })

    // Default to 30 days ago if no samples exist
    const sinceDate = latestSample?.samplingDate
      ? new Date(latestSample.samplingDate.getTime() - 24 * 60 * 60 * 1000) // 1 day overlap for safety
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const sinceDateStr = sinceDate.toISOString().split("T")[0]
    console.log(`📅 Fetching samples since: ${sinceDateStr}`)

    // Query the CKAN API for new records
    // Note: CKAN SQL API has a limit, so we fetch in batches
    const sql = `
      SELECT * FROM "${ESMR_RESOURCE_ID}"
      WHERE sampling_date >= '${sinceDateStr}'
      ORDER BY sampling_date DESC
      LIMIT 5000
    `

    const apiUrl = `${CKAN_API_URL}?sql=${encodeURIComponent(sql)}`

    console.log("📡 Querying data.ca.gov API...")
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "StormwaterWatch/1.0 (tylerhow@gmail.com)",
      },
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(`API error: ${data.error?.message || "Unknown error"}`)
    }

    const records: ESMRAPIRecord[] = data.result?.records || []
    console.log(`📊 Received ${records.length} records from API`)

    if (records.length === 0) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      return NextResponse.json({
        success: true,
        message: "No new samples to sync",
        duration: `${duration}s`,
        sinceDate: sinceDateStr,
        recordsProcessed: 0,
      })
    }

    // Process records in batches
    const results = {
      regionsCreated: 0,
      facilitiesCreated: 0,
      locationsCreated: 0,
      parametersCreated: 0,
      samplesCreated: 0,
      samplesSkipped: 0,
      errors: [] as string[],
    }

    // Create lookup sets for existing entities
    const existingRegions = new Set<string>()
    const existingFacilities = new Set<number>()
    const existingLocations = new Set<number>()
    const existingParameters = new Map<string, string>()

    // Pre-load existing entities
    const [regions, facilities, locations, parameters] = await Promise.all([
      prisma.eSMRRegion.findMany({ select: { code: true } }),
      prisma.eSMRFacility.findMany({ select: { facilityPlaceId: true } }),
      prisma.eSMRLocation.findMany({ select: { locationPlaceId: true } }),
      prisma.eSMRParameter.findMany({ select: { id: true, parameterName: true } }),
    ])

    regions.forEach((r) => existingRegions.add(r.code))
    facilities.forEach((f) => existingFacilities.add(f.facilityPlaceId))
    locations.forEach((l) => existingLocations.add(l.locationPlaceId))
    parameters.forEach((p) => existingParameters.set(p.parameterName, p.id))

    // Process each record
    for (const record of records) {
      try {
        // Ensure region exists
        const regionCode = record.region_code
        if (regionCode && !existingRegions.has(regionCode)) {
          await prisma.eSMRRegion.upsert({
            where: { code: regionCode },
            update: {},
            create: {
              code: regionCode,
              name: record.region_name || regionCode,
            },
          })
          existingRegions.add(regionCode)
          results.regionsCreated++
        }

        // Ensure facility exists
        const facilityPlaceId = parseInt(record.facility_place_id)
        if (isNaN(facilityPlaceId)) continue

        if (!existingFacilities.has(facilityPlaceId)) {
          await prisma.eSMRFacility.upsert({
            where: { facilityPlaceId },
            update: { lastSeenAt: new Date() },
            create: {
              facilityPlaceId,
              facilityName: record.facility_name || `Facility ${facilityPlaceId}`,
              regionCode: regionCode || "0",
            },
          })
          existingFacilities.add(facilityPlaceId)
          results.facilitiesCreated++
        }

        // Ensure location exists
        const locationPlaceId = parseInt(record.location_place_id)
        if (isNaN(locationPlaceId)) continue

        if (!existingLocations.has(locationPlaceId)) {
          const lat = parseFloat(record.latitude)
          const lon = parseFloat(record.longitude)

          // Map location type to enum
          type LocationType = "EFFLUENT_MONITORING" | "INFLUENT_MONITORING" | "RECEIVING_WATER_MONITORING" | "RECYCLED_WATER_MONITORING" | "INTERNAL_MONITORING" | "GROUNDWATER_MONITORING"
          let locationType: LocationType = "EFFLUENT_MONITORING"
          const lt = (record.location_type || "").toUpperCase()
          if (lt.includes("EFFLUENT")) locationType = "EFFLUENT_MONITORING"
          else if (lt.includes("INFLUENT")) locationType = "INFLUENT_MONITORING"
          else if (lt.includes("RECEIVING")) locationType = "RECEIVING_WATER_MONITORING"
          else if (lt.includes("RECYCLED")) locationType = "RECYCLED_WATER_MONITORING"
          else if (lt.includes("INTERNAL")) locationType = "INTERNAL_MONITORING"
          else if (lt.includes("GROUND")) locationType = "GROUNDWATER_MONITORING"

          await prisma.eSMRLocation.upsert({
            where: { locationPlaceId },
            update: { lastSeenAt: new Date() },
            create: {
              locationPlaceId,
              facilityPlaceId,
              locationCode: record.location_code || `LOC-${locationPlaceId}`,
              locationType,
              latitude: isNaN(lat) ? null : lat,
              longitude: isNaN(lon) ? null : lon,
              locationDesc: record.location_name || null,
            },
          })
          existingLocations.add(locationPlaceId)
          results.locationsCreated++
        }

        // Ensure parameter exists
        let parameterId = existingParameters.get(record.parameter_name)
        if (!parameterId && record.parameter_name) {
          const parameter = await prisma.eSMRParameter.upsert({
            where: { parameterName: record.parameter_name },
            update: {},
            create: {
              parameterName: record.parameter_name,
              category: record.parameter_category || null,
            },
          })
          parameterId = parameter.id
          existingParameters.set(record.parameter_name, parameterId)
          results.parametersCreated++
        }

        if (!parameterId) continue

        // Parse sampling date and time
        const samplingDate = new Date(record.sampling_date)
        if (isNaN(samplingDate.getTime())) continue

        // Parse time - default to midnight
        const timeStr = record.sampling_time || "00:00:00"
        const samplingTime = new Date(`1970-01-01T${timeStr}`)
        if (isNaN(samplingTime.getTime())) continue

        // Map qualifier to enum
        type QualifierType = "DETECTED" | "LESS_THAN" | "GREATER_THAN" | "NOT_DETECTED" | "DETECTED_NOT_QUANTIFIED"
        let qualifier: QualifierType = "DETECTED"
        const q = (record.qualifier || "").toUpperCase()
        if (q.includes("ND") || q.includes("NOT DETECT")) qualifier = "NOT_DETECTED"
        else if (q.includes("DNQ") || q.includes("NOT QUANTIF")) qualifier = "DETECTED_NOT_QUANTIFIED"
        else if (q === "<" || q.includes("LESS") || q === "LT") qualifier = "LESS_THAN"
        else if (q === ">" || q.includes("GREATER") || q === "GT") qualifier = "GREATER_THAN"

        // Skip if missing required fields
        if (!record.units || !record.report_name || !record.smr_document_id) continue

        const smrDocumentId = parseInt(record.smr_document_id)
        if (isNaN(smrDocumentId)) continue

        // Create sample (skip if already exists - use unique constraint)
        try {
          await prisma.eSMRSample.create({
            data: {
              locationPlaceId,
              parameterId,
              samplingDate,
              samplingTime,
              analysisDate: samplingDate,
              analysisTime: samplingTime,
              qualifier,
              result: record.result ? parseFloat(record.result) : null,
              units: record.units,
              mdl: record.mdl ? parseFloat(record.mdl) : null,
              ml: record.ml ? parseFloat(record.ml) : null,
              rl: record.rl ? parseFloat(record.rl) : null,
              reportName: record.report_name,
              smrDocumentId,
              reviewPriorityIndicator: record.review_priority_indicator === "Y" || record.review_priority_indicator === "true",
            },
          })
          results.samplesCreated++
        } catch (e: any) {
          // Skip duplicates (unique constraint violation)
          if (e.code === "P2002") {
            results.samplesSkipped++
          } else {
            throw e
          }
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        if (!results.errors.includes(msg)) {
          results.errors.push(msg)
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`✅ eSMR sync completed in ${duration}s`)
    console.log(`   New samples: ${results.samplesCreated}`)
    console.log(`   Skipped (duplicates): ${results.samplesSkipped}`)
    console.log(`   Errors: ${results.errors.length}`)

    return NextResponse.json({
      success: true,
      duration: `${duration}s`,
      sinceDate: sinceDateStr,
      recordsReceived: records.length,
      ...results,
    })
  } catch (error) {
    console.error("❌ eSMR sync failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
