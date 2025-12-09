"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Open", color: "destructive" },
  { value: "UNDER_REVIEW", label: "Under Review", color: "default" },
  { value: "RESOLVED", label: "Resolved", color: "secondary" },
  { value: "DISMISSED", label: "Dismissed", color: "outline" },
] as const

interface StatusFilterProps {
  value?: string
  onChange: (value: string) => void
  label?: string
  className?: string
  showAll?: boolean
}

export function StatusFilter({
  value,
  onChange,
  label = "Status",
  className,
  showAll = true,
}: StatusFilterProps) {
  const selectedStatus = STATUS_OPTIONS.find((s) => s.value === value)

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="All statuses">
            {selectedStatus && (
              <Badge variant={selectedStatus.color as any}>
                {selectedStatus.label}
              </Badge>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {showAll && <SelectItem value="">All statuses</SelectItem>}
          {STATUS_OPTIONS.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              <Badge variant={status.color as any} className="text-xs">
                {status.label}
              </Badge>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export { STATUS_OPTIONS }
