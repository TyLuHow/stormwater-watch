"use client"

import { useRef, useEffect, useState } from "react"
import Map, { NavigationControl, MapRef } from "react-map-gl"
import MapboxDraw from "@mapbox/mapbox-gl-draw"
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css"
import type { FeatureCollection } from "geojson"
import "mapbox-gl/dist/mapbox-gl.css"

interface MapWithDrawControlsProps {
  onPolygonComplete: (geojson: FeatureCollection) => void
  initialViewState?: {
    latitude: number
    longitude: number
    zoom: number
  }
}

export function MapWithDrawControls({
  onPolygonComplete,
  initialViewState = {
    latitude: 37.7749, // San Francisco
    longitude: -122.4194,
    zoom: 9,
  },
}: MapWithDrawControlsProps) {
  const mapRef = useRef<MapRef | null>(null)
  const drawRef = useRef<MapboxDraw | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: "draw_polygon",
    })

    const map = mapRef.current.getMap()
    map.addControl(draw, "top-left")
    drawRef.current = draw

    const handleDrawCreate = () => {
      const data = draw.getAll()
      onPolygonComplete(data)
    }

    const handleDrawUpdate = () => {
      const data = draw.getAll()
      onPolygonComplete(data)
    }

    const handleDrawDelete = () => {
      onPolygonComplete({ type: "FeatureCollection", features: [] })
    }

    map.on("draw.create", handleDrawCreate)
    map.on("draw.update", handleDrawUpdate)
    map.on("draw.delete", handleDrawDelete)

    return () => {
      map.off("draw.create", handleDrawCreate)
      map.off("draw.update", handleDrawUpdate)
      map.off("draw.delete", handleDrawDelete)
      if (draw) {
        map.removeControl(draw)
      }
    }
  }, [mapLoaded, onPolygonComplete])

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (!mapboxToken) {
    return (
      <div className="h-[600px] flex items-center justify-center border rounded-lg bg-muted">
        <div className="text-center">
          <p className="text-muted-foreground">Map unavailable</p>
          <p className="text-xs text-muted-foreground mt-1">
            Set NEXT_PUBLIC_MAPBOX_TOKEN environment variable
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[600px] w-full border rounded-lg overflow-hidden">
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        initialViewState={initialViewState}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        onLoad={() => setMapLoaded(true)}
      >
        <NavigationControl position="top-right" />
      </Map>
    </div>
  )
}




