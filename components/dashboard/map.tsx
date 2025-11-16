"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import type { Facility, ViolationEvent } from "@prisma/client"

interface DashboardMapProps {
  facilities: (Facility & { [key: string]: any })[]
  violations: (ViolationEvent & { facility: Facility & { [key: string]: any } })[]
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
        mapboxgl.accessToken = mapboxToken

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/light-v11",
          center: [-121.5, 37.8],
          zoom: 8,
        })

        // Add facility markers
        facilities.forEach((facility) => {
          const violations_ = violations.filter((v) => v.facilityId === facility.id)
          const color = violations_.some((v) => v.severity === "HIGH") ? "#dc2626" : "#ea580c"

          const lat = facility.lat || facility.latitude
          const lon = facility.lon || facility.longitude

          new mapboxgl.Marker({ color })
            .setLngLat([Number(lon), Number(lat)])
            .setPopup(
              new mapboxgl.Popup().setHTML(
                `<div class="p-2">
                <h3 class="font-bold">${facility.name}</h3>
                <p class="text-sm">${violations_.length} violations</p>
              </div>`,
              ),
            )
            .addTo(map.current!)
        })
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
      <Card className="h-96 rounded-lg bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </Card>
    )
  }

  if (!mapboxToken) {
    return (
      <Card className="h-96 rounded-lg bg-muted flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Map unavailable</p>
          <p className="text-xs text-muted-foreground mt-1">Set MAPBOX_TOKEN environment variable to enable</p>
        </div>
      </Card>
    )
  }

  return <div ref={mapContainer} className="h-96 rounded-lg" />
}
