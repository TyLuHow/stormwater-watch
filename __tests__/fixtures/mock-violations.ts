/**
 * Mock violations for TESTING ONLY
 *
 * ⚠️  WARNING: This file is for unit/integration tests only.
 * Do NOT use this data in production or seed files.
 *
 * The application should use real violation data computed from
 * actual eSMR sample data.
 *
 * These mock violations are intentionally fake and should never appear
 * in the production database.
 */

import { Decimal } from "@prisma/client/runtime/library"

export const mockViolations = [
  {
    id: "vio-001",
    facilityId: "fac-001",
    pollutant: "Total Nitrogen",
    count: 3,
    exceedanceCount: 3,
    maxRatio: new Decimal("2.5"),
    severity: "HIGH",
    firstDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    lastDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    reportingYear: "2024",
    impairedWater: true,
    dismissed: false,
    notes: null,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: "vio-002",
    facilityId: "fac-001",
    pollutant: "Phosphorus",
    count: 2,
    exceedanceCount: 2,
    maxRatio: new Decimal("1.8"),
    severity: "MEDIUM",
    firstDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    lastDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    reportingYear: "2024",
    impairedWater: false,
    dismissed: false,
    notes: null,
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
  },
  {
    id: "vio-003",
    facilityId: "fac-002",
    pollutant: "Total Suspended Solids",
    count: 1,
    exceedanceCount: 1,
    maxRatio: new Decimal("1.3"),
    severity: "LOW",
    firstDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    lastDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    reportingYear: "2024",
    impairedWater: false,
    dismissed: false,
    notes: null,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "vio-004",
    facilityId: "fac-003",
    pollutant: "Total Nitrogen",
    count: 4,
    exceedanceCount: 4,
    maxRatio: new Decimal("3.2"),
    severity: "HIGH",
    firstDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    lastDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    reportingYear: "2024",
    impairedWater: true,
    dismissed: false,
    notes: null,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
]
