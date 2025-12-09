/**
 * LocationLabel Component
 *
 * Displays monitoring location information in a human-readable format.
 * Replaces cryptic IDs like "EFF-001" with "Effluent Monitoring (EFF-001)".
 *
 * This component addresses the domain expert feedback:
 * "EFF-001 corresponds to a specific pipe that no one will know without looking at a site plan"
 */

import { ESMRLocationType } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  parseLocationId,
  formatLocationDisplay,
  getLocationTypeShortLabel,
  getLocationTypeBadgeVariant,
  type LocationType,
} from "@/lib/monitoring/location-parser"

export interface LocationLabelProps {
  locationCode: string
  locationType?: ESMRLocationType
  format?: "full" | "compact" | "badge" | "stacked"
  showTooltip?: boolean
  description?: string | null
  className?: string
}

/**
 * LocationLabel - Primary component for displaying monitoring locations
 *
 * @param locationCode - The location code (e.g., "EFF-001")
 * @param locationType - Optional enum type from database
 * @param format - Display format:
 *   - "full": "Effluent Monitoring (EFF-001)" - default
 *   - "compact": "Effluent Monitoring" - no code
 *   - "badge": Badge with type label
 *   - "stacked": Two lines - description on top, code below
 * @param showTooltip - Show tooltip with additional details
 * @param description - Optional custom description from database
 * @param className - Additional CSS classes
 */
export function LocationLabel({
  locationCode,
  locationType,
  format = "full",
  showTooltip = false,
  description,
  className = "",
}: LocationLabelProps) {
  const parsed = parseLocationId(locationCode, locationType)

  // Badge format
  if (format === "badge") {
    const variant = getLocationTypeBadgeVariant(parsed.type)
    const label = getLocationTypeShortLabel(parsed.type)

    return (
      <Badge variant={variant} className={`text-xs ${className}`}>
        {label}
      </Badge>
    )
  }

  // Stacked format (for tables)
  if (format === "stacked") {
    const content = (
      <div className={className}>
        <div className="font-medium">{parsed.description}</div>
        <div className="text-sm text-muted-foreground">{locationCode}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-1">
            {description}
          </div>
        )}
      </div>
    )

    if (showTooltip && description) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return content
  }

  // Full or compact format
  const displayText = formatLocationDisplay(locationCode, locationType, format)

  const content = <span className={className}>{displayText}</span>

  // Add tooltip if requested
  if (showTooltip) {
    const tooltipText = description || `${parsed.description} - ${locationCode}`

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>
            <div className="max-w-xs">
              <p className="font-semibold">{parsed.description}</p>
              <p className="text-xs text-muted-foreground">Code: {locationCode}</p>
              {description && <p className="text-sm mt-1">{description}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}

/**
 * SimpleLocationLabel - Lightweight version without tooltips
 * Use when you don't need tooltips or just want the text
 */
export function SimpleLocationLabel({
  locationCode,
  locationType,
  format = "full",
  className = "",
}: Omit<LocationLabelProps, "showTooltip" | "description">) {
  // Convert format to the subset accepted by formatLocationDisplay
  const displayFormat = format === "badge" || format === "stacked" ? "full" : format
  const displayText = formatLocationDisplay(locationCode, locationType, displayFormat)
  return <span className={className}>{displayText}</span>
}

/**
 * LocationBadge - Badge-only version showing location type
 */
export function LocationBadge({
  locationCode,
  locationType,
  className = "",
}: Pick<LocationLabelProps, "locationCode" | "locationType" | "className">) {
  const parsed = parseLocationId(locationCode, locationType)
  const variant = getLocationTypeBadgeVariant(parsed.type)
  const label = getLocationTypeShortLabel(parsed.type)

  return (
    <Badge variant={variant} className={`text-xs ${className}`}>
      {label}
    </Badge>
  )
}
