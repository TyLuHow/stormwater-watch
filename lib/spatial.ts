import type { Subscription, Facility } from "@prisma/client"
import { haversineDistance } from "@/lib/utils"

export async function matchSubscription(sub: Subscription, facility: Facility): Promise<boolean> {
  if (sub.mode === "BUFFER") {
    const { lat, lon, radiusMiles } = sub.params as any
    const distance = haversineDistance({ lat: facility.lat as any, lon: facility.lon as any }, { lat, lon })
    return distance <= radiusMiles
  }

  if (sub.mode === "POLYGON") {
    const polygon = (sub.params as any).geometry
    return pointInPolygon([Number(facility.lon), Number(facility.lat)], polygon)
  }

  if (sub.mode === "JURISDICTION") {
    const { county, huc12, ms4 } = sub.params as any
    return (
      (!county || facility.county === county) &&
      (!huc12 || facility.watershedHuc12 === huc12) &&
      (!ms4 || facility.ms4 === ms4)
    )
  }

  return false
}

// Simple point-in-polygon using ray casting
function pointInPolygon(point: [number, number], geometry: any): boolean {
  if (geometry.type !== "Polygon") return false

  const [lon, lat] = point
  const [exterior] = geometry.coordinates
  let inside = false

  for (let i = 0, j = exterior.length - 1; i < exterior.length; j = i++) {
    const [x1, y1] = exterior[i]
    const [x2, y2] = exterior[j]

    if (y1 > lat !== y2 > lat && lon < ((x2 - x1) * (lat - y1)) / (y2 - y1) + x1) {
      inside = !inside
    }
  }

  return inside
}
