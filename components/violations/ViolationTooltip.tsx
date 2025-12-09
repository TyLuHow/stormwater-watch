"use client"

import { Info, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ViolationTooltipProps {
  type: "count" | "repeat" | "days" | "exceedance" | "severity" | "period"
  className?: string
  iconClassName?: string
  children?: React.ReactNode
}

const tooltipContent = {
  count: {
    title: "Violation Count",
    description: "Each day with an exceedance counts as a separate enforceable violation under California stormwater regulations. This count represents the total number of days within the violation period where measured values exceeded permit limits or screening standards."
  },
  repeat: {
    title: "Repeat Violation",
    description: "A 'Repeat Violation' means this parameter exceeded limits at this facility within the past 180 days of a previous violation. Repeat violations may carry increased penalties and require enhanced enforcement actions."
  },
  days: {
    title: "Days in Violation",
    description: "The total number of calendar days between the first and last detected exceedance. Each day in this period is counted as an individual violation for enforcement purposes, even if samples were not collected every day."
  },
  exceedance: {
    title: "Exceedance Ratio",
    description: "The measured value divided by the permit limit or screening standard. For example, 3.65× means the measured concentration was 3.65 times higher than the allowed limit. Higher ratios indicate more severe violations."
  },
  severity: {
    title: "Violation Severity",
    description: "Severity is calculated based on the exceedance ratio: CRITICAL (≥10×), HIGH (≥5×), MODERATE (≥2×), LOW (<2×). Higher severity violations require more urgent enforcement action and may result in higher penalties."
  },
  period: {
    title: "Violation Period",
    description: "The time span from the first detected exceedance to the last detected exceedance for this parameter at this facility. Continuous monitoring may show multiple samples throughout this period, each contributing to the total violation count."
  }
}

export function ViolationTooltip({
  type,
  className,
  iconClassName,
  children
}: ViolationTooltipProps) {
  const content = tooltipContent[type]

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn("inline-flex items-center cursor-help", className)}
          type="button"
          aria-label={`More information about ${content.title}`}
        >
          {children || (
            <HelpCircle className={cn("h-4 w-4 text-muted-foreground hover:text-foreground transition-colors", iconClassName)} />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent
        className="max-w-sm p-4 bg-popover text-popover-foreground border shadow-md"
        sideOffset={5}
      >
        <div className="space-y-2">
          <p className="font-semibold text-sm">{content.title}</p>
          <p className="text-xs leading-relaxed">{content.description}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * InfoIcon - A simple info icon wrapper for inline help
 */
export function InfoIcon({ className }: { className?: string }) {
  return <Info className={cn("h-3.5 w-3.5 text-muted-foreground", className)} />
}

/**
 * ViolationTerminologyCard - A comprehensive explanation card for help pages
 */
export function ViolationTerminologyCard() {
  return (
    <div className="space-y-6 p-6 border rounded-lg bg-card">
      <div>
        <h3 className="text-lg font-semibold mb-2">Understanding Violation Counts</h3>
        <p className="text-sm text-muted-foreground">
          How violations are counted and what the numbers mean
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            Violation Event
          </h4>
          <p className="text-sm text-muted-foreground">
            A period when monitoring results exceeded permit limits or screening standards.
            Each violation event is tracked from the first exceedance date to the last exceedance date.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            Days in Violation
          </h4>
          <p className="text-sm text-muted-foreground">
            <strong>Each day with an exceedance is counted as a separate violation</strong> under
            California water quality regulations. For enforcement purposes, a 28-day violation
            period may result in 28 enforceable violations, even if only a few samples were collected.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            Repeat Violations
          </h4>
          <p className="text-sm text-muted-foreground">
            If a facility violates the same parameter within 180 days of a previous violation,
            it's designated as a "Repeat Violation," which may carry increased penalties
            (up to $25,000 per violation per day under California law).
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            Continuous Exceedances
          </h4>
          <p className="text-sm text-muted-foreground">
            If multiple consecutive samples exceed limits, the violation period extends from
            first to last exceedance date. The count represents total days in this period,
            recognizing that the facility was in continuous non-compliance.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            Exceedance Ratio
          </h4>
          <p className="text-sm text-muted-foreground">
            The measured concentration divided by the permit limit. A ratio of 3.65× means
            the measured value was 3.65 times higher than allowed. Higher ratios indicate
            more severe violations and potential environmental harm.
          </p>
        </div>
      </div>

      <div className="pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> Violation counting methodology follows California State Water
          Resources Control Board enforcement policies and federal Clean Water Act guidelines.
          Each violation is subject to civil penalties of up to $10,000 per day (routine) or
          $25,000 per day (serious violations).
        </p>
      </div>
    </div>
  )
}
