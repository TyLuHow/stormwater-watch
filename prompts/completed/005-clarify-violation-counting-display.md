<objective>
Add clarification to violation counting and display throughout the application. Make it clear how violations are counted (per day vs per event), what "Repeat" means, and how violation periods are interpreted.

"Every day is considered an individual violation: clarification might be helpful" - domain expert feedback
</objective>

<context>
**Current Confusion:**
- Screenshot shows "28 (Repeat)" but period is "9/3/2025 → 9/30/2025" (28 days)
- Unclear if 28 means 28 separate violation events, 28 days in violation, or 28 samples
- "Repeat" designation needs explanation
- Another screenshot shows "Count: 1" for a single-day violation period

**Domain Knowledge:**
In stormwater compliance:
- Each day with an exceedance can be counted as a separate violation for enforcement
- "Repeat violation" typically means violation of same parameter at same facility within a certain timeframe
- Continuous exceedances are often reported as start date → end date
- Count could represent days, samples, or events depending on context

**Expert Feedback:**
Users need clarification on:
- How violations are counted (per sample? per day? per event?)
- What "Repeat" designation means
- How to interpret violation periods
- Distinction between "violation event" (a period of non-compliance) and "violation count" (number of violations for enforcement)

Read violation detection and counting logic to understand current implementation.
</context>

<research>
**Phase 1 - Understand Current Logic:**
1. Find violation counting code - how is "Count" calculated?
2. Identify "Repeat" violation detection logic
3. Examine how violation periods (start → end dates) are determined
4. Check if distinction exists between "events" and "days in violation"

**Phase 2 - Clarify Domain Logic:**
Based on stormwater compliance standards:
- Define what constitutes a separate violation
- Clarify when a violation is considered "repeat"
- Determine how continuous exceedances should be counted
- Establish clear terminology

**Phase 3 - Design Clear Display:**
Create mockups/descriptions of how to display:
- Violation counts with explanatory tooltips
- Repeat designation with clear definition
- Violation periods with day count
- Enforcement context (why count matters)
</research>

<requirements>
**1. Add Violation Counting Explanation:**

On violation display tables/cards, add clarification:

Current display:
```
Count: 28 (Repeat)
Period: 9/3/2025 → 9/30/2025
```

Enhanced display:
```
Violation Count: 28 days
Period: 9/3/2025 → 9/30/2025 (28 days)
Status: Repeat Violation ⓘ
Exceedance: 3.65x limit

[Tooltip on ⓘ]: "Each day with an exceedance counts as a separate
violation under California stormwater regulations. A 'Repeat Violation'
means this parameter exceeded limits at this facility within the past
180 days."
```

**2. Create Violation Terminology Component:**

Build `./components/violations/ViolationTooltip.tsx` that provides definitions:

Terms to define:
- **Violation Event**: A period of non-compliance (start to end date)
- **Violation Count**: Number of enforceable violations (often = days in violation)
- **Repeat Violation**: Violation of same parameter within [X days] of previous violation
- **Exceedance Ratio**: Measured value divided by permit limit or screening standard
- **Days in Violation**: Total days between start and end of violation period

**3. Enhance Violation Display Cards:**

Update violation display components to show:

```
[Visual Card]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTIVE VIOLATION EVENT

Facility: Point Loma WWTP
Parameter: Oil & Grease (O&G)
Location: Effluent Monitoring (EFF-001)

Violation Period:
  Sep 3, 2025 → Sep 30, 2025
  28 days in violation ⓘ

Severity: MEDIUM
Max Exceedance: 3.65x limit
Enforceable Violations: 28 ⓘ

Status: 🔴 Repeat Violation ⓘ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Tooltips on ⓘ icons provide explanations]
```

**4. Add Explanatory Info Section:**

On violations page or in help section, add:

"Understanding Violation Counts" panel:
```markdown
### How Violations Are Counted

**Violation Event**: A period when monitoring results exceeded permit
limits or screening standards.

**Days in Violation**: Each day with an exceedance is counted as a
separate violation under California water quality regulations. For
enforcement purposes, a 28-day violation period may result in 28
enforceable violations.

**Repeat Violations**: If a facility violates the same parameter
within 180 days of a previous violation, it's designated as a "Repeat
Violation," which may carry increased penalties.

**Continuous Exceedances**: If multiple consecutive samples exceed
limits, the violation period extends from first to last exceedance
date. The count represents total days in this period.
```

**5. Update API Responses:**

Enhance violation data returned from APIs:

```typescript
{
  violationId: "...",
  parameter: "O&G",
  startDate: "2025-09-03",
  endDate: "2025-09-30",
  daysInViolation: 28,
  isRepeat: true,
  repeatWindow: 180, // days
  maxExceedanceRatio: 3.65,
  enforceableViolationCount: 28, // clarify this is per-day count
  samples: [...], // individual samples that constituted violation
  status: "active",
  metadata: {
    countingMethod: "per_day", // or "per_sample", "per_event"
    repeatCriteria: "Same parameter within 180 days"
  }
}
```

**6. Add Visual Indicators:**

Use visual design to clarify:
- Timeline view showing violation start → end with daily markers
- Color coding: green (compliant) → yellow (warning) → red (violation)
- Badge system: "REPEAT" badge with distinctive color
- Icons: 📅 for days in violation, 🔄 for repeat status
</requirements>

<implementation>
**Step 1 - Create Tooltip Components:**
- Build reusable ViolationTooltip component
- Add definitions for all key terms
- Make accessible (can be opened with keyboard)

**Step 2 - Update Violation Display:**
Find all places violations are displayed:
- Violation list tables
- Facility detail pages
- Active violation events dashboard
- Violation detail pages
- Case packets

Add clarifying language and tooltips to each.

**Step 3 - Enhance Data Model:**
If needed, add fields to clarify counting:
- `daysInViolation: Int`
- `countingMethod: String` (per_day, per_sample, per_event)
- `repeatDesignation: Boolean`
- `repeatWindowDays: Int`

**Step 4 - Update Counting Logic:**
Ensure violation counting is consistent:
- Document the algorithm used
- Add comments explaining why counting works this way
- Validate counts match displayed periods

**Step 5 - Add Help Section:**
Create or update help/FAQ page with violation counting explanation:
- `./app/help/violations/page.tsx`
- Clear, plain-language explanations
- Examples with real data
- Link from violation displays

**Step 6 - Update Charts/Visualizations:**
If violation trends or statistics are graphed:
- Label axes clearly (e.g., "Enforceable Violations (Days)")
- Add notes explaining counting method
- Show distinction between events and day counts
</implementation>

<constraints>
- Don't change actual counting logic - only clarify what's already happening
- WHY: Counting method likely follows regulatory standards; changing it could affect compliance
- Keep explanations concise - use tooltips for details, not wall of text
- Ensure mobile users can access tooltips/explanations
- Use plain language, not legal jargon
</constraints>

<output>
Create/modify:
- `./components/violations/ViolationTooltip.tsx` - Reusable tooltip component
- `./components/violations/ViolationCard.tsx` - Enhanced display with clarifications
- `./app/help/violations/page.tsx` - Help page explaining violation counting
- API routes to include counting metadata
- All violation display components

Document:
- Violation counting methodology
- Repeat violation criteria
- Display guidelines for violation data
</output>

<verification>
Before completing, verify:
- [ ] All violation displays include clarifying language
- [ ] "Days in violation" is explicitly labeled
- [ ] "Repeat" designation has tooltip explaining criteria
- [ ] Violation periods show day count: "28 days"
- [ ] Help section provides comprehensive explanation
- [ ] Tooltips are accessible and work on mobile
- [ ] Counting method is documented in code
- [ ] Examples use real data from the application
</verification>

<success_criteria>
- Users can understand how violations are counted without external resources
- "28 (Repeat)" is now "28 days in violation" with clear repeat explanation
- Distinction between violation events and enforceable violation counts is clear
- Tooltips provide context without cluttering interface
- Help section answers common questions about violation counting
- Expert feedback addressed: clarification provided for daily violation counting
</success_criteria>
