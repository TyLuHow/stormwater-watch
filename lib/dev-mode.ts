// Development mode utilities for displaying the app without environment variables
export const DEV_MODE = process.env.DEV_MODE === "true" || !process.env.SUPABASE_URL

export const mockFacilities = [
  {
    id: "fac-001",
    name: "Acme Industrial Park",
    county: "Los Angeles",
    latitude: 34.0522,
    longitude: -118.2437,
    permitType: "General",
    status: "ACTIVE",
    sampleCount: 15,
    violationCount: 3,
  },
  {
    id: "fac-002",
    name: "Bay Area Manufacturing",
    county: "Alameda",
    latitude: 37.8044,
    longitude: -122.2712,
    permitType: "Large",
    status: "ACTIVE",
    sampleCount: 8,
    violationCount: 1,
  },
  {
    id: "fac-003",
    name: "Central Valley Processing",
    county: "Kern",
    latitude: 35.3733,
    longitude: -119.0187,
    permitType: "General",
    status: "ACTIVE",
    sampleCount: 12,
    violationCount: 4,
  },
]

export const mockViolations = [
  {
    id: "vio-001",
    facilityId: "fac-001",
    facilityName: "Acme Industrial Park",
    pollutant: "Total Nitrogen",
    exceedanceCount: 3,
    threshold: 10,
    severity: "HIGH",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: "vio-002",
    facilityId: "fac-001",
    facilityName: "Acme Industrial Park",
    pollutant: "Phosphorus",
    exceedanceCount: 2,
    threshold: 5,
    severity: "MEDIUM",
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: "vio-003",
    facilityId: "fac-002",
    facilityName: "Bay Area Manufacturing",
    pollutant: "Total Suspended Solids",
    exceedanceCount: 1,
    threshold: 15,
    severity: "LOW",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "vio-004",
    facilityId: "fac-003",
    facilityName: "Central Valley Processing",
    pollutant: "Total Nitrogen",
    exceedanceCount: 4,
    threshold: 10,
    severity: "HIGH",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
]

export const mockStats = {
  totalFacilities: mockFacilities.length,
  totalSamples: mockFacilities.reduce((sum, f) => sum + f.sampleCount, 0),
  totalViolations: mockViolations.length,
  activeAlerts: 3,
}
