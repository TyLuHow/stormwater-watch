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

const SEVERITY_LEVELS = [
  { value: "LOW", label: "Low", color: "secondary" },
  { value: "MODERATE", label: "Moderate", color: "default" },
  { value: "HIGH", label: "High", color: "warning" },
  { value: "CRITICAL", label: "Critical", color: "destructive" },
] as const

interface SeverityFilterProps {
  value?: string
  onChange: (value: string) => void
  label?: string
  className?: string
  showAll?: boolean
}

export function SeverityFilter({
  value,
  onChange,
  label = "Severity",
  className,
  showAll = true,
}: SeverityFilterProps) {
  const selectedSeverity = SEVERITY_LEVELS.find((s) => s.value === value)

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="All severity levels">
            {selectedSeverity && (
              <Badge
                variant={
                  selectedSeverity.color === "warning"
                    ? "default"
                    : (selectedSeverity.color as any)
                }
                className={cn(
                  selectedSeverity.color === "warning" &&
                    "bg-orange-500 hover:bg-orange-600"
                )}
              >
                {selectedSeverity.label}
              </Badge>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {showAll && <SelectItem value="">All severity levels</SelectItem>}
          {SEVERITY_LEVELS.map((severity) => (
            <SelectItem key={severity.value} value={severity.value}>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    severity.color === "warning"
                      ? "default"
                      : (severity.color as any)
                  }
                  className={cn(
                    "text-xs",
                    severity.color === "warning" &&
                      "bg-orange-500 hover:bg-orange-600"
                  )}
                >
                  {severity.label}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export { SEVERITY_LEVELS }
