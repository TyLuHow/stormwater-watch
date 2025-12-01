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

// Year-specific resource IDs for eSMR data (zipped CSV doesn't support SQL API)
const ESMR_RESOURCE_IDS: Record<number, string> = {
  2025: "176a58bf-6f5d-4e3f-9ed9-592a509870eb",
  2024: "7adb8aea-62fb-412f-9e67-d13b0729222f",
  2023: "65eb7023-86b6-4960-b714-5f6574d43556",
}

// Get resource ID for current year, fallback to 2025
function getResourceId(): string {
  const currentYear = new Date().getFullYear()
  return ESMR_RESOURCE_IDS[currentYear] || ESMR_RESOURCE_IDS[2025]
}

interface ESMRAPIRecord {
  facility_place_id: string
  facility_name: string
  region: string  // e.g. "Region 2 - San Francisco Bay"
  location_place_id: string
  location: string  // location code
  location_place_type: string  // e.g. "Effluent Monitoring"
  location_desc: string
  latitude: string
  longitude: string
  parameter: string  // parameter name
  analytical_method_code: string
  analytical_method: string
  calculated_method: string
  sampling_date: string
  sampling_time: string
  analysis_date: string
  analysis_time: string
  qualifier: string
  result: string
  units: string
  mdl: string
  ml: string
  rl: string
  review_priority_indicator: string
  qa_codes: string
  comments: string
  report_name: string
  receiving_water_body: string
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
    const resourceId = getResourceId()
    const sql = `
      SELECT * FROM "${resourceId}"
      WHERE sampling_date >= '${sinceDateStr}'
      ORDER BY sampling_date DESC
      LIMIT 5000
    `

    const apiUrl = `${CKAN_API_URL}?sql=${encodeURIComponent(sql)}`

    console.log(`📡 Querying data.ca.gov API (resource: ${resourceId})...`)
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
        // Parse region code from "Region 2 - San Francisco Bay" -> "R2"
        // Match patterns like "Region 2", "Region 5F", "Region 6V"
        const regionMatch = record.region?.match(/Region\s+(\d+[A-Z]?)/)
        const regionNum = regionMatch ? regionMatch[1] : "0"
        const regionCode = `R${regionNum}` // Format as R2, R5F, etc.
        const regionName = record.region || `Region ${regionNum}`

        if (regionCode && !existingRegions.has(regionCode)) {
          try {
            await prisma.eSMRRegion.upsert({
              where: { code: regionCode },
              update: {},
              create: {
                code: regionCode,
                name: regionName,
              },
            })
            results.regionsCreated++
          } catch (e: any) {
            // Region already exists (unique constraint on name), that's fine
            if (e.code !== "P2002") throw e
          }
          existingRegions.add(regionCode)
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
              receivingWaterBody: record.receiving_water_body !== "NA" ? record.receiving_water_body : null,
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
          const lt = (record.location_place_type || "").toUpperCase()
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
              locationCode: record.location || `LOC-${locationPlaceId}`,
              locationType,
              latitude: isNaN(lat) ? null : lat,
              longitude: isNaN(lon) ? null : lon,
              locationDesc: record.location_desc !== "NA" ? record.location_desc : null,
            },
          })
          existingLocations.add(locationPlaceId)
          results.locationsCreated++
        }

        // Ensure parameter exists (field is "parameter" not "parameter_name")
        const parameterName = record.parameter
        let parameterId = existingParameters.get(parameterName)
        if (!parameterId && parameterName) {
          const parameter = await prisma.eSMRParameter.upsert({
            where: { parameterName },
            update: {},
            create: {
              parameterName,
              category: null, // API doesn't have separate category field
            },
          })
          parameterId = parameter.id
          existingParameters.set(parameterName, parameterId)
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

        // Skip if missing required fields (handle "NA" as missing)
        const units = record.units && record.units !== "NA" ? record.units : null
        if (!units || !record.report_name || !record.smr_document_id) continue

        const smrDocumentId = parseInt(record.smr_document_id)
        if (isNaN(smrDocumentId)) continue

        // Helper to parse numeric values - handles "NaN" string from API
        const parseNum = (val: string | undefined | null): number | null => {
          if (!val || val === "NaN" || val === "NA") return null
          const num = parseFloat(val)
          return isNaN(num) ? null : num
        }

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
              result: parseNum(record.result),
              units,
              mdl: parseNum(record.mdl),
              ml: parseNum(record.ml),
              rl: parseNum(record.rl),
              reportName: record.report_name,
              smrDocumentId,
              reviewPriorityIndicator: record.review_priority_indicator === "Y",
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
