"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { MapWithDrawControls } from "./map-with-draw"
import type { FeatureCollection } from "geojson"
import { useRouter } from "next/navigation"

type SubscriptionMode = "POLYGON" | "BUFFER" | "JURISDICTION"

export function CreateSubscriptionForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<SubscriptionMode>("POLYGON")
  const [polygon, setPolygon] = useState<FeatureCollection | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    centerLat: "",
    centerLon: "",
    radiusKm: "10",
    county: "",
    huc12: "",
    ms4: "",
    minRatio: [1.5] as number[],
    repeatOffenderThreshold: 2,
    impairedOnly: false,
    schedule: "DAILY",
    delivery: "EMAIL",
  })

  // Load available counties, HUC12s, MS4s from API
  const [availableCounties, setAvailableCounties] = useState<string[]>([])
  const [availableHuc12s, setAvailableHuc12s] = useState<string[]>([])
  const [availableMs4s, setAvailableMs4s] = useState<string[]>([])

  useEffect(() => {
    // Fetch available filter options
    fetch("/api/violations?limit=1")
      .then((res) => res.json())
      .then((data) => {
        if (data.filters) {
          setAvailableCounties(data.filters.counties || [])
          setAvailableHuc12s(data.filters.huc12s || [])
          setAvailableMs4s(data.filters.ms4s || [])
        }
      })
      .catch(console.error)
  }, [])

  const handlePolygonComplete = (geojson: FeatureCollection) => {
    setPolygon(geojson)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Build params based on mode
      let params: any = {}

      if (mode === "POLYGON") {
        if (!polygon || polygon.features.length === 0) {
          toast({
            title: "Error",
            description: "Please draw a polygon on the map",
            variant: "destructive",
          })
          setLoading(false)
          return
        }
        params.polygon = polygon.features[0].geometry
      } else if (mode === "BUFFER") {
        if (!formData.centerLat || !formData.centerLon || !formData.radiusKm) {
          toast({
            title: "Error",
            description: "Please provide center coordinates and radius",
            variant: "destructive",
          })
          setLoading(false)
          return
        }
        params.centerLat = parseFloat(formData.centerLat)
        params.centerLon = parseFloat(formData.centerLon)
        params.radiusKm = parseFloat(formData.radiusKm)
      } else if (mode === "JURISDICTION") {
        const filters: string[] = []
        if (formData.county) filters.push("county")
        if (formData.huc12) filters.push("huc12")
        if (formData.ms4) filters.push("ms4")

        if (filters.length === 0) {
          toast({
            title: "Error",
            description: "Please select at least one jurisdiction filter",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        if (formData.county) params.counties = [formData.county]
        if (formData.huc12) params.watersheds = [formData.huc12]
        if (formData.ms4) params.ms4s = [formData.ms4]
      }

      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          mode,
          params,
          minRatio: formData.minRatio[0],
          repeatOffenderThreshold: formData.repeatOffenderThreshold,
          impairedOnly: formData.impairedOnly,
          schedule: formData.schedule,
          delivery: formData.delivery,
        }),
      })

      if (res.ok) {
        toast({
          title: "Success",
          description: "Subscription created successfully",
        })
        router.refresh()
        // Reset form
        setFormData({
          name: "",
          centerLat: "",
          centerLon: "",
          radiusKm: "10",
          county: "",
          huc12: "",
          ms4: "",
          minRatio: [1.5],
          repeatOffenderThreshold: 2,
          impairedOnly: false,
          schedule: "DAILY",
          delivery: "EMAIL",
        })
        setPolygon(null)
      } else {
        const error = await res.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create subscription",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Create subscription error:", error)
      toast({
        title: "Error",
        description: "Request failed",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestSend = async () => {
    // Test send functionality - will be implemented with subscription ID
    toast({
      title: "Info",
      description: "Test send will be available after creating the subscription",
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-2">
        <Label htmlFor="name">Subscription Name *</Label>
        <Input
          id="name"
          placeholder="e.g., San Francisco Bay Area Monitoring"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      {/* Mode Selection */}
      <div className="space-y-3">
        <Label>Monitoring Mode *</Label>
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as SubscriptionMode)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="POLYGON" id="polygon" />
            <Label htmlFor="polygon" className="font-normal cursor-pointer">
              Draw Polygon (custom boundary)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="BUFFER" id="buffer" />
            <Label htmlFor="buffer" className="font-normal cursor-pointer">
              Radius Buffer (distance from point)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="JURISDICTION" id="jurisdiction" />
            <Label htmlFor="jurisdiction" className="font-normal cursor-pointer">
              Jurisdiction (County/HUC12/MS4)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Mode-Specific Inputs */}
      {mode === "POLYGON" && (
        <div className="space-y-2">
          <Label>Draw Polygon on Map</Label>
          <MapWithDrawControls onPolygonComplete={handlePolygonComplete} />
          {polygon && polygon.features.length > 0 && (
            <p className="text-sm text-green-600">✓ Polygon drawn ({polygon.features.length} feature)</p>
          )}
        </div>
      )}

      {mode === "BUFFER" && (
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="centerLat">Center Latitude *</Label>
            <Input
              id="centerLat"
              type="number"
              step="0.0001"
              placeholder="37.7749"
              value={formData.centerLat}
              onChange={(e) => setFormData({ ...formData, centerLat: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="centerLon">Center Longitude *</Label>
            <Input
              id="centerLon"
              type="number"
              step="0.0001"
              placeholder="-122.4194"
              value={formData.centerLon}
              onChange={(e) => setFormData({ ...formData, centerLon: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="radiusKm">Radius (km) *</Label>
            <Input
              id="radiusKm"
              type="number"
              min="1"
              max="100"
              step="1"
              value={formData.radiusKm}
              onChange={(e) => setFormData({ ...formData, radiusKm: e.target.value })}
              required
            />
          </div>
        </div>
      )}

      {mode === "JURISDICTION" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="county">County</Label>
            <Select
              value={formData.county}
              onValueChange={(value) => setFormData({ ...formData, county: value, huc12: "", ms4: "" })}
            >
              <SelectTrigger id="county">
                <SelectValue placeholder="Select county" />
              </SelectTrigger>
              <SelectContent>
                {availableCounties.map((county) => (
                  <SelectItem key={county} value={county}>
                    {county}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="huc12">Watershed (HUC12)</Label>
            <Select
              value={formData.huc12}
              onValueChange={(value) => setFormData({ ...formData, huc12: value, county: "", ms4: "" })}
            >
              <SelectTrigger id="huc12">
                <SelectValue placeholder="Select HUC12" />
              </SelectTrigger>
              <SelectContent>
                {availableHuc12s.map((huc12) => (
                  <SelectItem key={huc12} value={huc12}>
                    {huc12}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ms4">MS4 Jurisdiction</Label>
            <Select
              value={formData.ms4}
              onValueChange={(value) => setFormData({ ...formData, ms4: value, county: "", huc12: "" })}
            >
              <SelectTrigger id="ms4">
                <SelectValue placeholder="Select MS4" />
              </SelectTrigger>
              <SelectContent>
                {availableMs4s.map((ms4) => (
                  <SelectItem key={ms4} value={ms4}>
                    {ms4}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Thresholds */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>
            Min Exceedance Ratio: {formData.minRatio[0].toFixed(1)}×
          </Label>
          <Slider
            value={formData.minRatio}
            onValueChange={(value) => setFormData({ ...formData, minRatio: value })}
            min={1.0}
            max={10.0}
            step={0.5}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="repeatOffender">Repeat Offender Threshold</Label>
          <Input
            id="repeatOffender"
            type="number"
            min={1}
            value={formData.repeatOffenderThreshold}
            onChange={(e) => setFormData({ ...formData, repeatOffenderThreshold: parseInt(e.target.value) || 2 })}
          />
          <p className="text-xs text-muted-foreground">
            Minimum number of exceedances to trigger alert
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="impairedOnly"
            checked={formData.impairedOnly}
            onCheckedChange={(checked) => setFormData({ ...formData, impairedOnly: checked })}
          />
          <Label htmlFor="impairedOnly" className="font-normal cursor-pointer">
            Impaired Waters Only
          </Label>
        </div>
      </div>

      {/* Delivery Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="schedule">Schedule</Label>
          <Select
            value={formData.schedule}
            onValueChange={(value) => setFormData({ ...formData, schedule: value })}
          >
            <SelectTrigger id="schedule">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily (2:15 AM PT)</SelectItem>
              <SelectItem value="WEEKLY">Weekly (Mon 2:30 AM PT)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="delivery">Delivery Method</Label>
          <Select
            value={formData.delivery}
            onValueChange={(value) => setFormData({ ...formData, delivery: value })}
          >
            <SelectTrigger id="delivery">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EMAIL">Email Only</SelectItem>
              <SelectItem value="SLACK">Slack Only</SelectItem>
              <SelectItem value="BOTH">Email + Slack</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Creating..." : "Create Subscription"}
        </Button>
        <Button type="button" variant="outline" onClick={handleTestSend} disabled>
          Test Send
        </Button>
      </div>
    </form>
  )
}
