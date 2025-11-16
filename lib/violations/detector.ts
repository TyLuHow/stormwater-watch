import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"

interface ViolationDetectionConfig {
  minRatio?: number
  repeatOffenderThreshold?: number
  impairedWaterBonus?: boolean
}

export async function recomputeViolations(
  reportingYear?: string,
  facilityId?: string,
  config: ViolationDetectionConfig = {},
) {
  const { minRatio = 1.0, repeatOffenderThreshold = 2, impairedWaterBonus = true } = config

  try {
    // Determine which reporting year(s) to process
    const currentYear = new Date().getFullYear()
    const yearsToProcess = reportingYear
      ? [reportingYear]
      : [`${currentYear - 1}-${currentYear}`, `${currentYear}-${currentYear + 1}`]

    let processedCount = 0

    for (const year of yearsToProcess) {
      // Query samples for this reporting year
      // Include samples with exceedanceRatio >= minRatio OR null (pH cases)
      const samples = await prisma.sample.findMany({
        where: {
          reportingYear: year,
          ...(facilityId && { facilityId }),
          OR: [
            { exceedanceRatio: { gte: new Decimal(minRatio.toString()) } },
            { exceedanceRatio: null, pollutant: "PH" }, // pH doesn't have ratio
          ],
        },
        include: { facility: true },
        orderBy: { sampleDate: "asc" },
      })

      // Group by facility + pollutant
      const grouped = new Map<string, typeof samples>()

      for (const sample of samples) {
        const key = `${sample.facilityId}-${sample.pollutant}`
        if (!grouped.has(key)) {
          grouped.set(key, [])
        }
        grouped.get(key)!.push(sample)
      }

      // Create/update ViolationEvents
      for (const [key, group] of grouped.entries()) {
        if (group.length < repeatOffenderThreshold) {
          continue
        }

        const [fId] = key.split("-")
        const facility = group[0].facility

        // Check if receiving water is impaired (stub for now)
        const impairedWater = facility.receivingWater?.toLowerCase().includes("bay") || false

        // Calculate maxRatio (handle pH which doesn't have exceedanceRatio)
        const maxRatio = group.reduce((max, s) => {
          if (!s.exceedanceRatio) {
            // pH case - check if outside 6.0-9.0 range
            const phValue = Number(s.value)
            if (phValue < 6.0 || phValue > 9.0) {
              return Math.max(max, 1.0) // Treat as violation
            }
            return max
          }
          const ratio = Number(s.exceedanceRatio)
          return ratio > max ? ratio : max
        }, 0)

        await prisma.violationEvent.upsert({
          where: {
            facilityId_pollutant_reportingYear: {
              facilityId: fId,
              pollutant: group[0].pollutant,
              reportingYear: year,
            },
          },
          update: {
            lastDate: group[group.length - 1].sampleDate,
            count: group.length,
            maxRatio: new Decimal(maxRatio.toFixed(2)),
            impairedWater,
          },
          create: {
            facilityId: fId,
            pollutant: group[0].pollutant,
            firstDate: group[0].sampleDate,
            lastDate: group[group.length - 1].sampleDate,
            count: group.length,
            maxRatio: new Decimal(maxRatio.toFixed(2)),
            reportingYear: year,
            impairedWater,
          },
        })

        processedCount++
      }
    }

    return { success: true, processedCount }
  } catch (error) {
    console.error("Violation detection failed:", error)
    throw error
  }
}

export async function dismissViolation(violationEventId: string, notes?: string) {
  return prisma.violationEvent.update({
    where: { id: violationEventId },
    data: {
      dismissed: true,
      notes: notes || "Manually dismissed",
    },
  })
}

export async function undismissViolation(violationEventId: string) {
  return prisma.violationEvent.update({
    where: { id: violationEventId },
    data: {
      dismissed: false,
      notes: null,
    },
  })
}

export async function getViolationStats() {
  const events = await prisma.violationEvent.findMany({
    where: { dismissed: false },
    include: {
      facility: {
        select: {
          county: true,
          receivingWater: true,
        },
      },
    },
  })

  return {
    total: events.length,
    impairedWater: events.filter((e) => e.impairedWater).length,
    byCounty: [...new Set(events.map((e) => e.facility.county))]
      .map((county) => ({
        county,
        count: events.filter((e) => e.facility.county === county).length,
      }))
      .sort((a, b) => b.count - a.count),
    byPollutant: [...new Set(events.map((e) => e.pollutant))]
      .map((pollutant) => ({
        pollutant,
        count: events.filter((e) => e.pollutant === pollutant).length,
      }))
      .sort((a, b) => b.count - a.count),
  }
}
