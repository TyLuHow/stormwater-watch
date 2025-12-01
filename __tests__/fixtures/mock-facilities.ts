/**
 * Mock facilities for TESTING ONLY
 *
 * ⚠️  WARNING: This file is for unit/integration tests only.
 * Do NOT use this data in production or seed files.
 *
 * The application should use real eSMR facility data imported via:
 *   npm run import:esmr
 *
 * These mock facilities are intentionally fake and should never appear
 * in the production database.
 */

import { Decimal } from "@prisma/client/runtime/library"

export const mockFacilities = [
  {
    id: "fac-001",
    name: "Acme Industrial Park",
    permitId: "CA0001234",
    naics: "332710",
    lat: new Decimal("34.0522"),
    lon: new Decimal("-118.2437"),
    county: "Los Angeles",
    watershedHuc12: "180701020304",
    ms4: "Los Angeles County",
    receivingWater: "Los Angeles River",
    isInDAC: false,
    enrichedAt: new Date(),
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    lastSeenAt: new Date(),
  },
  {
    id: "fac-002",
    name: "Bay Area Manufacturing",
    permitId: "CA0005678",
    naics: "336411",
    lat: new Decimal("37.8044"),
    lon: new Decimal("-122.2712"),
    county: "Alameda",
    watershedHuc12: "180500020401",
    ms4: "Alameda County",
    receivingWater: "San Francisco Bay",
    isInDAC: true,
    enrichedAt: new Date(),
    createdAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
    lastSeenAt: new Date(),
  },
  {
    id: "fac-003",
    name: "Central Valley Processing",
    permitId: "CA0009012",
    naics: "311615",
    lat: new Decimal("35.3733"),
    lon: new Decimal("-119.0187"),
    county: "Kern",
    watershedHuc12: "180300030102",
    ms4: null,
    receivingWater: "Kern River",
    isInDAC: true,
    enrichedAt: new Date(),
    createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
    lastSeenAt: new Date(),
  },
]

export const mockStats = {
  totalFacilities: mockFacilities.length,
  totalSamples: 0, // Will be calculated from violations
  totalViolations: 0, // Will be calculated from violations
  activeAlerts: 3,
}
