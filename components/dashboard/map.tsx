"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle } from "lucide-react"
import type { Facility, ViolationEvent } from "@prisma/client"
import type { Decimal } from "@prisma/client/runtime/library"

// Allow both mock data (number) and Prisma data (Decimal) for coordinates and maxRatio
type FlexibleFacility = Omit<Facility, 'lat' | 'lon'> & {
  lat: Decimal | number
  lon: Decimal | number
  [key: string]: any
}

type FlexibleViolation = Omit<ViolationEvent, 'maxRatio'> & {
  maxRatio: Decimal | number
  facility: FlexibleFacility
  [key: string]: any
}

interface DashboardMapProps {
  facilities: FlexibleFacility[]
  violations: FlexibleViolation[]
}

export function DashboardMap({ facilities, violations }: DashboardMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any | null>(null)
  const [mapboxToken, setMapboxToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch token from server endpoint
    fetch("/api/mapbox-token")
      .then((r) => r.json())
      .then((data) => {
        setMapboxToken(data.token || null)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || loading) return

    // Dynamically import mapbox-gl
    import("mapbox-gl")
      .then((mapboxgl) => {
        ;(mapboxgl as any).accessToken = mapboxToken

        // Use dark style for better mission control aesthetic
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/dark-v11",
          center: [-119.4179, 36.7783], // Center of California
          zoom: 6,
          attributionControl: false,
        })

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

        // Add facility markers with enhanced styling
        facilities.forEach((facility) => {
          const violations_ = violations.filter((v) => v.facilityId === facility.id)

          // Determine color and size based on severity (high ratio or impaired water)
          const hasCritical = violations_.some((v) => Number(v.maxRatio) >= 2.0 || v.impairedWater)
          const color = hasCritical ? "#dc2626" : "#ea580c"
          const scale = hasCritical ? 1.2 : 1

          const lat = facility.lat || facility.latitude
          const lon = facility.lon || facility.longitude

          // Create custom marker element for better styling
          const el = document.createElement('div')
          el.className = 'custom-marker'
          el.style.cssText = `
            width: ${24 * scale}px;
            height: ${24 * scale}px;
            background-color: ${color};
            border: 3px solid rgba(255, 255, 255, 0.9);
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 4px ${color}20;
            transition: all 0.2s ease;
          `

          // Add hover effect
          el.addEventListener('mouseenter', () => {
            el.style.transform = 'scale(1.3)'
            el.style.boxShadow = `0 6px 20px rgba(0, 0, 0, 0.6), 0 0 0 6px ${color}40`
          })
          el.addEventListener('mouseleave', () => {
            el.style.transform = 'scale(1)'
            el.style.boxShadow = `0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 4px ${color}20`
          })

          // Enhanced popup with mission control styling
          const popupContent = `
            <div class="p-4 min-w-[240px]">
              <div class="flex items-start justify-between mb-2">
                <h3 class="font-bold text-base">${facility.name}</h3>
                ${hasCritical ? '<span class="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">CRITICAL</span>' : ''}
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-400">Violations:</span>
                  <span class="font-semibold">${violations_.length}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">County:</span>
                  <span class="font-medium">${facility.county || 'Unknown'}</span>
                </div>
                ${facility.receivingWater ? `
                  <div class="flex justify-between">
                    <span class="text-gray-400">Watershed:</span>
                    <span class="font-medium text-xs">${facility.receivingWater}</span>
                  </div>
                ` : ''}
              </div>
              <a href="/facilities/${facility.id}" class="block mt-3 text-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors">
                View Details →
              </a>
            </div>
          `

          new mapboxgl.Marker({ element: el })
            .setLngLat([Number(lon), Number(lat)])
            .setPopup(
              new mapboxgl.Popup({
                offset: 25,
                className: 'mission-control-popup',
                maxWidth: '300px'
              }).setHTML(popupContent)
            )
            .addTo(map.current!)
        })

        // Fit map to show all markers
        if (facilities.length > 0) {
          const bounds = new mapboxgl.LngLatBounds()
          facilities.forEach((facility) => {
            const lat = facility.lat || facility.latitude
            const lon = facility.lon || facility.longitude
            bounds.extend([Number(lon), Number(lat)])
          })
          map.current.fitBounds(bounds, { padding: 50, maxZoom: 12 })
        }
      })
      .catch(() => {
        console.error("Failed to load Mapbox")
      })

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [facilities, violations, mapboxToken, loading])

  if (loading) {
    return (
      <div className="h-[500px] rounded-lg bg-muted flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="shimmer w-16 h-16 rounded-full bg-primary/20 mx-auto" />
          <p className="text-muted-foreground font-medium">Loading California Water Network...</p>
        </div>
      </div>
    )
  }

  if (!mapboxToken) {
    return (
      <div className="h-[500px] rounded-lg bg-muted/50 border-2 border-dashed border-border flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-semibold mb-1">Map Unavailable</p>
          <p className="text-xs text-muted-foreground">
            Configure <code className="bg-muted px-1 py-0.5 rounded">MAPBOX_TOKEN</code> environment variable to enable interactive mapping
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        .mapboxgl-popup-content {
          background-color: #1a1a1a !important;
          border: 1px solid #333 !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6) !important;
          padding: 0 !important;
          color: #fff !important;
        }
        .mapboxgl-popup-close-button {
          color: #fff !important;
          font-size: 20px !important;
          padding: 8px !important;
        }
        .mapboxgl-popup-close-button:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
        .mapboxgl-popup-anchor-top .mapboxgl-popup-tip,
        .mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip,
        .mapboxgl-popup-anchor-left .mapboxgl-popup-tip,
        .mapboxgl-popup-anchor-right .mapboxgl-popup-tip {
          border-color: #1a1a1a transparent transparent transparent !important;
        }
      `}</style>
      <div ref={mapContainer} className="h-[500px] w-full rounded-lg overflow-hidden" />
    </>
  )
}
