/**
 * Spatial utilities using Turf.js
 */

import * as turf from "@turf/turf"
import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon"
import type { Point, Polygon, MultiPolygon } from "geojson"

/**
 * Check if a point is within a polygon
 */
export function pointInPolygon(
  point: { lat: number; lon: number },
  polygon: Polygon | MultiPolygon
): boolean {
  const geoPoint: Point = {
    type: "Point",
    coordinates: [point.lon, point.lat],
  }

  return booleanPointInPolygon(geoPoint, polygon)
}

/**
 * Calculate distance between two points in kilometers
 */
export function distance(
  point1: { lat: number; lon: number },
  point2: { lat: number; lon: number }
): number {
  const from = turf.point([point1.lon, point1.lat])
  const to = turf.point([point2.lon, point2.lat])
  return turf.distance(from, to, { units: "kilometers" })
}

/**
 * Check if point is within buffer radius
 */
export function pointInBuffer(
  point: { lat: number; lon: number },
  center: { lat: number; lon: number },
  radiusKm: number
): boolean {
  return distance(point, center) <= radiusKm
}




