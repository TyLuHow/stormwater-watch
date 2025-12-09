import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/ui/back-button"
import { ViolationTerminologyCard } from "@/components/violations/ViolationTooltip"
import { AlertCircle, Scale, Calendar, TrendingUp } from "lucide-react"

export default function ViolationsHelpPage() {
  return (
    <div className="container mx-auto py-8 space-y-8 max-w-4xl">
      <div>
        <BackButton href="/dashboard" label="Back to Dashboard" />
        <h1 className="text-3xl font-bold mt-4">Understanding Violation Counts</h1>
        <p className="text-muted-foreground mt-2">
          How violations are counted, what the numbers mean, and why it matters for enforcement
        </p>
      </div>

      {/* Main Terminology Card */}
      <ViolationTerminologyCard />

      {/* Why It Matters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Why Violation Counts Matter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Enforcement Actions</h4>
            <p className="text-sm text-muted-foreground">
              Under California Water Code Section 13385, each day of violation constitutes a
              separate offense. This means a 28-day violation period can result in 28 separate
              penalties, each up to $10,000 per day for routine violations or $25,000 per day
              for serious violations.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Repeat Violations</h4>
            <p className="text-sm text-muted-foreground">
              Facilities with repeat violations (same parameter within 180 days) face enhanced
              scrutiny and higher penalties. Repeat violations demonstrate a pattern of
              non-compliance and may trigger mandatory minimum penalties.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Environmental Impact</h4>
            <p className="text-sm text-muted-foreground">
              Higher violation counts and exceedance ratios indicate more severe environmental
              harm. A 28-day Oil & Grease violation at 3.65× the limit represents continuous
              discharge of elevated pollutants into receiving waters, potentially harming aquatic life
              and water quality.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Example Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Example Scenarios
          </CardTitle>
          <CardDescription>Real-world examples to illustrate violation counting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scenario 1: Single Day Violation */}
          <div className="space-y-3 pb-4 border-b">
            <div className="flex items-start justify-between">
              <h4 className="font-semibold text-sm">Scenario 1: Single-Day Violation</h4>
              <Badge variant="secondary">Count: 1</Badge>
            </div>
            <div className="text-sm space-y-2">
              <p className="text-muted-foreground">
                <strong>Situation:</strong> Facility collects one sample on September 15, 2025.
                The result exceeds the screening standard.
              </p>
              <p className="text-muted-foreground">
                <strong>Counting:</strong> Period: Sep 15 → Sep 15 (1 day). Violation Count: 1 day.
              </p>
              <p className="text-muted-foreground">
                <strong>Explanation:</strong> A single exceedance on one day equals one enforceable violation.
              </p>
            </div>
          </div>

          {/* Scenario 2: Continuous Violation */}
          <div className="space-y-3 pb-4 border-b">
            <div className="flex items-start justify-between">
              <h4 className="font-semibold text-sm">Scenario 2: Continuous Violation</h4>
              <Badge variant="destructive">Count: 28</Badge>
            </div>
            <div className="text-sm space-y-2">
              <p className="text-muted-foreground">
                <strong>Situation:</strong> Facility samples Oil & Grease on Sep 3 (exceeds limit)
                and again on Sep 30 (still exceeds limit). No compliant samples in between.
              </p>
              <p className="text-muted-foreground">
                <strong>Counting:</strong> Period: Sep 3 → Sep 30 (28 days). Violation Count: 28 days.
              </p>
              <p className="text-muted-foreground">
                <strong>Explanation:</strong> Even with only 2 samples, the facility is presumed to be
                in continuous non-compliance for all 28 days between first and last exceedance.
                Each day counts as a separate violation.
              </p>
            </div>
          </div>

          {/* Scenario 3: Repeat Violation */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h4 className="font-semibold text-sm">Scenario 3: Repeat Violation</h4>
              <div className="flex gap-2">
                <Badge variant="destructive">Count: 15</Badge>
                <Badge variant="outline">Repeat</Badge>
              </div>
            </div>
            <div className="text-sm space-y-2">
              <p className="text-muted-foreground">
                <strong>Situation:</strong> Facility had a 10-day copper violation in March 2025.
                Now in September 2025 (within 180 days), copper exceeds limits again for 15 days.
              </p>
              <p className="text-muted-foreground">
                <strong>Counting:</strong> Period: Sep 1 → Sep 15 (15 days). Violation Count: 15 days.
                Status: Repeat Violation.
              </p>
              <p className="text-muted-foreground">
                <strong>Explanation:</strong> Because the same parameter (copper) violated within 180
                days of the previous violation, this is designated a "Repeat Violation" and may
                carry enhanced penalties (up to $25,000/day instead of $10,000/day).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How Count is Calculated */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            How Violation Count is Calculated
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Step 1: Identify Exceedances</h4>
            <p className="text-sm text-muted-foreground">
              The system compares each sample result against permit limits and screening standards
              (benchmarks). If measured value exceeds benchmark, it's flagged as an exceedance.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Step 2: Group by Parameter and Facility</h4>
            <p className="text-sm text-muted-foreground">
              Exceedances are grouped by facility and pollutant parameter. Each unique
              facility-parameter combination creates a separate violation event.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Step 3: Determine Violation Period</h4>
            <p className="text-sm text-muted-foreground">
              The violation period spans from the first detected exceedance to the last detected
              exceedance for that parameter at that facility. This creates a continuous period
              of non-compliance.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Step 4: Count Days in Violation</h4>
            <p className="text-sm text-muted-foreground">
              The violation count equals the number of calendar days in the violation period
              (last date - first date + 1). This follows California enforcement policy that
              treats each day of non-compliance as a separate violation.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Step 5: Check for Repeat Status</h4>
            <p className="text-sm text-muted-foreground">
              If the same parameter violated within the previous 180 days, the violation is
              flagged as "Repeat" which may trigger higher penalties.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Exceedance Ratio Explained */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Understanding Exceedance Ratios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              The exceedance ratio shows how much the measured value exceeded the limit:
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium text-sm">1.5× - 2× limit</p>
                  <p className="text-xs text-muted-foreground">Minor exceedance</p>
                </div>
                <Badge variant="secondary">LOW</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium text-sm">2× - 5× limit</p>
                  <p className="text-xs text-muted-foreground">Moderate exceedance</p>
                </div>
                <Badge>MODERATE</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium text-sm">5× - 10× limit</p>
                  <p className="text-xs text-muted-foreground">Significant exceedance</p>
                </div>
                <Badge variant="destructive">HIGH</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium text-sm">10×+ limit</p>
                  <p className="text-xs text-muted-foreground">Severe exceedance</p>
                </div>
                <Badge variant="destructive" className="bg-red-700">CRITICAL</Badge>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Example:</strong> If the Oil & Grease limit is 10 mg/L and a sample
              measures 36.5 mg/L, the exceedance ratio is 36.5 ÷ 10 = 3.65×. This indicates
              the concentration was 3.65 times higher than allowed, classified as MODERATE severity.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Legal References */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legal and Regulatory References</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">California Water Code Section 13385</p>
              <p>
                Establishes that each day of violation constitutes a separate offense, with
                civil penalties up to $10,000 per day for administrative civil liability or
                $25,000 per day for serious violations.
              </p>
            </div>

            <div>
              <p className="font-medium text-foreground">State Water Resources Control Board Enforcement Policy</p>
              <p>
                Provides guidance on calculating violations, including per-day counting methodology
                and enhanced penalties for repeat violations.
              </p>
            </div>

            <div>
              <p className="font-medium text-foreground">Clean Water Act (33 U.S.C. § 1251 et seq.)</p>
              <p>
                Federal law establishing water quality standards and enforcement mechanisms for
                point source discharges, including municipal and industrial stormwater.
              </p>
            </div>

            <div>
              <p className="font-medium text-foreground">Industrial General Permit (Order 2014-0057-DWQ)</p>
              <p>
                California's statewide permit for industrial stormwater discharges, establishing
                Numeric Action Levels (NALs) used as screening standards for violation detection.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Additional Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              For more information about California stormwater enforcement and violation policies:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>
                <a
                  href="https://www.waterboards.ca.gov/water_issues/programs/enforcement/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  State Water Board Enforcement Program
                </a>
              </li>
              <li>
                <a
                  href="https://www.waterboards.ca.gov/board_decisions/adopted_orders/water_quality/2014/wqo2014_0057_dwq.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Industrial General Permit (2014-0057-DWQ)
                </a>
              </li>
              <li>
                <a
                  href="https://www.waterboards.ca.gov/laws_regulations/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  California Water Code and Regulations
                </a>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
