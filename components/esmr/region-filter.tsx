"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface RegionFilterProps {
  regions: { code: string; name: string }[]
  value: string
  onChange: (value: string) => void
}

export function RegionFilter({ regions, value, onChange }: RegionFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Filter by region" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Regions</SelectItem>
        {regions.map((region) => (
          <SelectItem key={region.code} value={region.code}>
            {region.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
