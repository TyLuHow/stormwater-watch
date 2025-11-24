/**
 * Case Packet Generator
 * Generates attorney-ready PDFs for violation events
 */

import { renderToBuffer } from "@react-pdf/renderer"
import { prisma } from "@/lib/prisma"
import { CasePacketDocument } from "./template"
import type { CasePacketData, CasePacketOptions } from "./types"

/**
 * Generate a case packet PDF for a violation event
 */
export async function generateCasePacket(
  violationEventId: string,
  options: CasePacketOptions = {}
): Promise<Buffer> {
  console.log(`📄 Generating case packet for violation ${violationEventId}`)

  try {
    // Fetch violation data
    const violation = await prisma.violationEvent.findUnique({
      where: { id: violationEventId },
      include: {
        facility: true,
      },
    })

    if (!violation) {
      throw new Error(`Violation event ${violationEventId} not found`)
    }

    // Fetch related samples
    const samples = await prisma.sample.findMany({
      where: {
        facilityId: violation.facilityId,
        pollutant: violation.pollutant,
        reportingYear: violation.reportingYear,
        sampleDate: {
          gte: violation.firstDate,
          lte: violation.lastDate,
        },
        exceedanceRatio: {
          gte: 1.0,
        },
      },
      orderBy: {
        sampleDate: "asc",
      },
    })

    // Optionally fetch precipitation data
    let precipitation = undefined
    if (options.includePrecipitation) {
      try {
        const { getPrecipitationForSamples } = await import("@/lib/providers/precipitation")
        precipitation = await getPrecipitationForSamples(
          samples.map((s) => ({ sampleDate: s.sampleDate, facilityId: s.facilityId })),
          { lat: Number(violation.facility.lat), lon: Number(violation.facility.lon) }
        )
      } catch (error) {
        console.warn("Failed to fetch precipitation data for case packet:", error)
      }
    }

    // Prepare case packet data
    const data: CasePacketData = {
      facility: violation.facility,
      violation,
      samples,
      precipitation,
      generatedAt: new Date(),
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(<CasePacketDocument data={data} />)
    
    console.log(`✅ Case packet generated: ${pdfBuffer.length} bytes`)
    return Buffer.from(pdfBuffer)
  } catch (error) {
    console.error("Error generating case packet:", error)
    throw error
  }
}

/**
 * Generate filename for case packet
 */
export function getCasePacketFilename(
  facility: { name: string; permitId: string },
  violation: { pollutant: string; reportingYear: string }
): string {
  const facilityName = facility.name
    .replace(/[^a-z0-9]/gi, "_")
    .substring(0, 30)
  const pollutant = violation.pollutant.replace(/[^a-z0-9]/gi, "_")
  const date = new Date().toISOString().split("T")[0]

  return `case-packet_${facilityName}_${pollutant}_${violation.reportingYear}_${date}.pdf`
}

