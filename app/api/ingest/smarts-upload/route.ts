import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { supabaseClient } from "@/lib/providers"
import { parseCSV } from "@/lib/ingest/parser"
import { normalizeSamples, computeExceedanceRatio } from "@/lib/ingest/normalize"
import { isDuplicate } from "@/lib/utils"
import { isSameDay } from "@/lib/utils/dates"
import { Decimal } from "@prisma/client/runtime/library"

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const sourceUrl = formData.get("sourceUrl") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Parse CSV
    const buffer = await file.arrayBuffer()
    const parseResult = await parseCSV(Buffer.from(buffer))

    if (parseResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid rows in file",
          warnings: parseResult.warnings,
        },
        { status: 400 },
      )
    }

    // Normalize samples
    const { samples, warnings: normWarnings } = await normalizeSamples(parseResult.rows, sourceUrl)

    // Upload file to Supabase Storage
    let fileKey: string | null = null
    if (supabaseClient) {
      const timestamp = Date.now()
      fileKey = `uploads/${file.name.replace(/\s/g, "_")}-${timestamp}`
      await supabaseClient.storage.from("imports").upload(fileKey, buffer, { contentType: file.type })
    }

    // Store provenance
    await prisma.provenance.create({
      data: {
        source: "CIWQS",
        url: sourceUrl,
        fileKey,
        checksum: parseResult.checksum,
        fetchedAt: new Date(),
        notes: `Ingested ${samples.length} samples`,
      },
    })

    // Upsert facilities and samples
    let facilitiesCreated = 0
    let samplesInserted = 0
    let duplicatesSkipped = 0

    for (const sample of samples) {
      // Upsert facility
      const facility = await prisma.facility.upsert({
        where: { permitId: sample.permitId },
        update: { lastSeenAt: new Date() },
        create: {
          name: sample.facilityName,
          permitId: sample.permitId,
          county: sample.county,
          lat: new Decimal(sample.lat || 0),
          lon: new Decimal(sample.lon || 0),
        },
      })

      if (!facility.id) {
        continue
      }

      // Check for duplicates
      const existing = await prisma.sample.findFirst({
        where: {
          facilityId: facility.id,
          pollutant: sample.pollutant,
          sampleDate: sample.sampleDate,
        },
      })

      if (existing && isDuplicate({ ...existing, value: Number(existing.value) }, { ...sample, value: sample.value })) {
        duplicatesSkipped++
        continue
      }

      // Compute exceedance ratio
      const exceedanceRatio = computeExceedanceRatio(sample.value, sample.benchmark, sample.pollutant)

      // Insert sample
      await prisma.sample.create({
        data: {
          facilityId: facility.id,
          sampleDate: sample.sampleDate,
          pollutant: sample.pollutant,
          value: new Decimal(sample.value.toString()),
          unit: sample.unit,
          benchmark: new Decimal(sample.benchmark.toString()),
          benchmarkUnit: sample.benchmarkUnit,
          exceedanceRatio: exceedanceRatio ? new Decimal(exceedanceRatio.toString()) : null,
          reportingYear: sample.reportingYear,
          source: sample.sourceDocUrl || "CIWQS",
          sourceDocUrl: sample.sourceDocUrl,
        },
      })

      samplesInserted++
      if (facility.createdAt.getTime() === new Date().getTime()) {
        facilitiesCreated++
      }
    }

    return NextResponse.json({
      success: true,
      counts: {
        facilitiesCreated,
        samplesInserted,
        duplicatesSkipped,
        rowsParsed: parseResult.rows.length,
      },
      warnings: [...parseResult.warnings, ...normWarnings],
      fileKey,
    })
  } catch (error) {
    console.error("Ingestion error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ingestion failed" }, { status: 500 })
  }
}
