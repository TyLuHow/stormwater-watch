/**
 * Subscription Matcher - Determines which subscriptions should receive alerts for violations
 * Implements spatial matching for POLYGON, BUFFER, and JURISDICTION modes
 */

import type { Subscription, Facility, ViolationEvent } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"
import { isWithinBuffer, isWithinPolygon } from "@/lib/enrichment/spatial"

export interface MatchResult {
  subscription: Subscription
  matched: boolean
  reason?: string
}

export interface SubscriptionParams {
  // For POLYGON mode
  polygon?: any  // GeoJSON polygon

  // For BUFFER mode
  centerLat?: number
  centerLon?: number
  radiusKm?: number

  // For JURISDICTION mode
  counties?: string[]
  watersheds?: string[]  // HUC12 codes
  ms4s?: string[]
}

/**
 * Check if a violation matches a subscription's criteria
 */
export function matchesSubscription(
  subscription: Subscription,
  violation: ViolationEvent & { facility: Facility }
): MatchResult {
  const result: MatchResult = {
    subscription,
    matched: false,
  }

  // Parse subscription params
  const params = subscription.params as SubscriptionParams

  // Check spatial criteria based on mode
  let spatialMatch = false
  
  switch (subscription.mode) {
    case "POLYGON":
      if (!params.polygon) {
        result.reason = "No polygon defined in subscription params"
        return result
      }
      spatialMatch = isWithinPolygon(
        Number(violation.facility.lat),
        Number(violation.facility.lon),
        params.polygon
      )
      if (!spatialMatch) {
        result.reason = "Facility outside polygon boundary"
        return result
      }
      break

    case "BUFFER":
      if (!params.centerLat || !params.centerLon || !params.radiusKm) {
        result.reason = "Invalid buffer params (need centerLat, centerLon, radiusKm)"
        return result
      }
      spatialMatch = isWithinBuffer(
        Number(violation.facility.lat),
        Number(violation.facility.lon),
        params.centerLat,
        params.centerLon,
        params.radiusKm
      )
      if (!spatialMatch) {
        result.reason = `Facility outside ${params.radiusKm}km buffer`
        return result
      }
      break

    case "JURISDICTION":
      // Match by county, watershed, or MS4
      const countyMatch = params.counties?.includes(violation.facility.county || "")
      const watershedMatch = params.watersheds?.includes(violation.facility.watershedHuc12 || "")
      const ms4Match = params.ms4s?.includes(violation.facility.ms4 || "")
      
      spatialMatch = Boolean(countyMatch || watershedMatch || ms4Match)
      
      if (!spatialMatch) {
        result.reason = "Facility not in specified jurisdiction (county/watershed/MS4)"
        return result
      }
      break

    default:
      result.reason = `Unknown subscription mode: ${subscription.mode}`
      return result
  }

  // Check minRatio threshold
  if (Number(violation.maxRatio) < Number(subscription.minRatio)) {
    result.reason = `Exceedance ratio ${Number(violation.maxRatio).toFixed(2)} below threshold ${Number(subscription.minRatio)}`
    return result
  }

  // Check impairedOnly filter
  if (subscription.impairedOnly && !violation.impairedWater) {
    result.reason = "Subscription requires impaired water but facility doesn't discharge to one"
    return result
  }

  // Check repeat offender threshold
  if (subscription.repeatOffenderThreshold > 1 && violation.count < subscription.repeatOffenderThreshold) {
    result.reason = `Violation count ${violation.count} below repeat offender threshold ${subscription.repeatOffenderThreshold}`
    return result
  }

  // All checks passed!
  result.matched = true
  result.reason = "All criteria matched"
  return result
}

/**
 * Find all subscriptions that match a given violation
 */
export async function findMatchingSubscriptions(
  violation: ViolationEvent & { facility: Facility },
  allSubscriptions?: Subscription[]
): Promise<Subscription[]> {
  // Get active subscriptions if not provided
  if (!allSubscriptions) {
    const { prisma } = await import("@/lib/prisma")
    allSubscriptions = await prisma.subscription.findMany({
      where: { active: true },
    })
  }

  const matches: Subscription[] = []

  for (const subscription of allSubscriptions) {
    const result = matchesSubscription(subscription, violation)
    if (result.matched) {
      matches.push(subscription)
    }
  }

  return matches
}

/**
 * Batch matching - find all subscriptions that match any of the given violations
 * Returns a map of violationId -> matching subscriptions
 */
export async function batchMatchViolations(
  violations: Array<ViolationEvent & { facility: Facility }>
): Promise<Map<string, Subscription[]>> {
  const { prisma } = await import("@/lib/prisma")
  
  // Get all active subscriptions once
  const allSubscriptions = await prisma.subscription.findMany({
    where: { active: true },
  })

  const matchMap = new Map<string, Subscription[]>()

  for (const violation of violations) {
    const matches = allSubscriptions.filter((sub) => {
      const result = matchesSubscription(sub, violation)
      return result.matched
    })
    matchMap.set(violation.id, matches)
  }

  return matchMap
}

/**
 * Test if a facility would match a subscription's criteria
 * Useful for UI preview before creating subscription
 */
export async function testSubscriptionMatch(
  params: SubscriptionParams,
  mode: "POLYGON" | "BUFFER" | "JURISDICTION",
  facilityId: string
): Promise<{ matches: boolean; reason: string }> {
  const { prisma } = await import("@/lib/prisma")
  
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
  })

  if (!facility) {
    return { matches: false, reason: "Facility not found" }
  }

  // Create mock subscription for testing
  const mockSubscription: Subscription = {
    id: "test",
    userId: "test",
    name: "Test",
    mode,
    params: params as any,
    minRatio: new Decimal(1.0),
    repeatOffenderThreshold: 1,
    impairedOnly: false,
    schedule: "DAILY",
    delivery: "EMAIL",
    active: true,
    createdAt: new Date(),
    lastRunAt: null,
  }

  // Create mock violation
  const mockViolation = {
    id: "test",
    facilityId: facility.id,
    pollutant: "test",
    firstDate: new Date(),
    lastDate: new Date(),
    count: 1,
    maxRatio: new Decimal(2.0),
    reportingYear: "2024",
    impairedWater: false,
    dismissed: false,
    notes: null,
    createdAt: new Date(),
    facility,
  }

  const result = matchesSubscription(mockSubscription, mockViolation)
  return {
    matches: result.matched,
    reason: result.reason || "No reason provided",
  }
}

