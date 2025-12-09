# Violation Display Examples - Before & After

## Overview
This document shows how violation information is displayed before and after the clarifications were added.

---

## Example 1: Violation Card Display

### BEFORE
```
┌─────────────────────────────────────────┐
│ Point Loma WWTP                         │
│ Oil & Grease (O&G)              [Badge] │
│                                Impaired  │
├─────────────────────────────────────────┤
│ Exceedances     Max Ratio      Period   │
│     28            3.65x      9/3 to 9/30│
└─────────────────────────────────────────┘
```

**Confusion:**
- What does "28" mean? 28 samples? 28 events? 28 days?
- No indication this is 28 days
- No explanation of what the period means
- Missing context about repeat violations

### AFTER
```
┌─────────────────────────────────────────┐
│ Point Loma WWTP                         │
│ Oil & Grease (O&G)              [Badge] │
│                    [Repeat Violation ℹ️] │
├─────────────────────────────────────────┤
│ Violation Count ℹ️  Max Exceedance ℹ️   │
│       28               3.65×            │
│ days in violation    times limit        │
│                                          │
│ Violation Period ℹ️                     │
│ 9/3/2025                                │
│ → 9/30/2025                             │
│ (28 days)                               │
└─────────────────────────────────────────┘
```

**Clarity:**
- "28 days in violation" - explicit meaning
- "Max Exceedance: 3.65× times limit" - clear context
- "(28 days)" confirmation below period
- Tooltips (ℹ️) provide regulatory context
- "Repeat Violation" badge with explanation

---

## Example 2: Violations Table Display

### BEFORE
```
┌──────────────────┬──────────┬───────┬──────────┬────────┐
│ Facility         │ Pollutant│ Count │ Severity │ County │
├──────────────────┼──────────┼───────┼──────────┼────────┤
│ Point Loma WWTP  │ O&G      │  28   │  MEDIUM  │ San    │
│ Hyperion Plant   │ Copper   │  15   │  HIGH    │ Los    │
│ San Jose Creek   │ Zinc     │   1   │  LOW     │ Orange │
└──────────────────┴──────────┴───────┴──────────┴────────┘
```

**Confusion:**
- "Count" is ambiguous
- No indication of repeat violations
- No context for what numbers represent

### AFTER
```
┌──────────────────┬──────────┬────────────────┬────────────┬────────┐
│ Facility         │ Pollutant│ Violation Days │ Severity ℹ️│ County │
│                  │          │      ℹ️        │            │        │
├──────────────────┼──────────┼────────────────┼────────────┼────────┤
│ Point Loma WWTP  │ O&G      │  28  [Repeat]  │  MEDIUM    │ San    │
│ Hyperion Plant   │ Copper   │  15  [Repeat]  │   HIGH     │ Los    │
│ San Jose Creek   │ Zinc     │   1            │   LOW      │ Orange │
└──────────────────┴──────────┴────────────────┴────────────┴────────┘
```

**Clarity:**
- "Violation Days" - explicit label with tooltip
- [Repeat] badge indicates repeat violations
- Tooltips explain counting methodology and severity
- Monospaced font for numbers improves readability

---

## Example 3: Enhanced Violations Table

### BEFORE
```
┌────────────┬──────┬────────────┬─────────┬─────┬──────────┐
│ Facility   │ Poll │ First Viol │ Days    │Count│ Max Ratio│
│            │      │            │ Active  │     │          │
├────────────┼──────┼────────────┼─────────┼─────┼──────────┤
│ Point Loma │ O&G  │ 2025-09-03 │   28    │ 28  │   3.65x  │
└────────────┴──────┴────────────┴─────────┴─────┴──────────┘
```

**Confusion:**
- "Days Active" vs "Count" - what's the difference?
- Why are they the same number (28)?
- No indication this is per-day counting
- No repeat violation indicator

### AFTER
```
┌────────────┬──────┬────────────┬─────────────────┬────────────────┬────────────────┐
│ Facility   │ Poll │ First Viol │ Days in Viol ℹ️│ Violation Ct ℹ️│ Max Exceed ℹ️ │
├────────────┼──────┼────────────┼─────────────────┼────────────────┼────────────────┤
│ Point Loma │ O&G  │ 2025-09-03 │   28 days       │ 28 [Repeat ℹ️] │   3.65x        │
└────────────┴──────┴────────────┴─────────────────┴────────────────┴────────────────┘
```

**Clarity:**
- "Days in Violation" with explicit "days" label
- "Violation Count" shows same number - clarified via tooltips
- [Repeat] badge with inline tooltip explaining 180-day window
- Tooltips explain why count equals days (per-day methodology)
- "Max Exceedance" instead of "Max Ratio"

---

## Example 4: Facility Page - Active Violations Table

### BEFORE
```
Active Violations
Exceedances requiring investigation and enforcement action

┌──────────┬───────┬──────────┬────────────────────┬───────────────┐
│ Pollutant│ Count │ Max Ratio│ Period             │ Reporting Year│
├──────────┼───────┼──────────┼────────────────────┼───────────────┤
│ O&G      │ 28    │  3.65×   │ 9/3/2025 → 9/30/25 │     2025      │
│          │(Repeat)│          │                    │               │
└──────────┴───────┴──────────┴────────────────────┴───────────────┘
```

**Confusion:**
- "(Repeat)" in count column - what does this mean?
- No day count confirmation for period
- No tooltips to explain methodology

### AFTER
```
Active Violations
Exceedances requiring investigation and enforcement action.
Each day in violation counts as a separate enforceable violation.

┌──────────┬──────────────────┬──────────────────┬───────────────────┬───────────────┐
│ Pollutant│ Violation Days ℹ️│ Max Exceedance ℹ️│ Period ℹ️         │ Reporting Year│
├──────────┼──────────────────┼──────────────────┼───────────────────┼───────────────┤
│ O&G      │   28             │ 3.65× limit      │ 9/3/2025 →        │     2025      │
│          │ [Repeat ℹ️]      │                  │ 9/30/2025         │               │
│          │                  │                  │ (28 days)         │               │
└──────────┴──────────────────┴──────────────────┴───────────────────┴───────────────┘
```

**Clarity:**
- Card description explains per-day counting upfront
- "Violation Days" with tooltip
- [Repeat] badge separate from count, with own tooltip
- "(28 days)" explicitly confirms period length
- "3.65× limit" adds context
- Tooltips explain all terminology

---

## Example 5: Dashboard Card Title

### BEFORE
```
┌─────────────────────────────────────────┐
│ Active Violation Events                 │
│ Exceedances requiring investigation and │
│ enforcement action                      │
├─────────────────────────────────────────┤
│ [violations table]                      │
└─────────────────────────────────────────┘
```

**Missing:**
- No link to detailed help
- No upfront explanation of counting
- No way to learn more

### AFTER
```
┌─────────────────────────────────────────┐
│ Active Violation Events            [?]  │ ← Help link to /help/violations
│ Exceedances requiring investigation and │
│ enforcement action. Each day in         │
│ violation counts as a separate          │
│ enforceable violation.                  │
├─────────────────────────────────────────┤
│ [violations table with tooltips]        │
└─────────────────────────────────────────┘
```

**Clarity:**
- Help icon [?] links to comprehensive help page
- Description includes key clarification about daily counting
- Sets context before user sees the table

---

## Example 6: Tooltip Content Examples

### Violation Count Tooltip
```
┌─────────────────────────────────────┐
│ Violation Count                     │
│                                     │
│ Each day with an exceedance counts  │
│ as a separate enforceable violation │
│ under California stormwater         │
│ regulations. This count represents  │
│ the total number of days within the │
│ violation period where measured     │
│ values exceeded permit limits or    │
│ screening standards.                │
└─────────────────────────────────────┘
```

### Repeat Violation Tooltip
```
┌─────────────────────────────────────┐
│ Repeat Violation                    │
│                                     │
│ A 'Repeat Violation' means this     │
│ parameter exceeded limits at this   │
│ facility within the past 180 days   │
│ of a previous violation. Repeat     │
│ violations may carry increased      │
│ penalties and require enhanced      │
│ enforcement actions.                │
└─────────────────────────────────────┘
```

### Days in Violation Tooltip
```
┌─────────────────────────────────────┐
│ Days in Violation                   │
│                                     │
│ The total number of calendar days   │
│ between the first and last detected │
│ exceedance. Each day in this period │
│ is counted as an individual         │
│ violation for enforcement purposes, │
│ even if samples were not collected  │
│ every day.                          │
└─────────────────────────────────────┘
```

---

## Example 7: Help Page Structure

```
Understanding Violation Counts
═══════════════════════════════════════════

[Understanding Violation Counts Card]
┌──────────────────────────────────────────┐
│ Violation Event                          │
│ • Definition and explanation             │
│                                          │
│ Days in Violation                        │
│ • Daily counting methodology             │
│ • Example: 28-day period = 28 violations │
│                                          │
│ Repeat Violations                        │
│ • 180-day window                         │
│ • Enhanced penalties ($25,000/day)       │
│                                          │
│ [... more terms ...]                     │
└──────────────────────────────────────────┘

[Why It Matters]
┌──────────────────────────────────────────┐
│ Enforcement Actions                      │
│ • $10,000/day routine violations         │
│ • $25,000/day serious/repeat violations  │
│                                          │
│ [... more sections ...]                  │
└──────────────────────────────────────────┘

[Example Scenarios]
┌──────────────────────────────────────────┐
│ Scenario 1: Single-Day Violation        │
│ • Situation description                  │
│ • Counting: 1 day = 1 violation         │
│                                          │
│ Scenario 2: Continuous Violation        │
│ • 28-day period = 28 violations         │
│ • Continuous non-compliance assumed     │
│                                          │
│ Scenario 3: Repeat Violation            │
│ • Within 180 days of previous           │
│ • Enhanced penalties apply              │
└──────────────────────────────────────────┘

[Additional sections...]
- How Count is Calculated
- Understanding Exceedance Ratios
- Legal References
- Resources
```

---

## Example 8: Severity Display with Context

### BEFORE
```
Severity: MEDIUM
```

### AFTER
```
Severity: MEDIUM ℹ️

[Tooltip]
┌─────────────────────────────────────┐
│ Violation Severity                  │
│                                     │
│ Severity is calculated based on the │
│ exceedance ratio:                   │
│ • CRITICAL (≥10×)                   │
│ • HIGH (≥5×)                        │
│ • MODERATE (≥2×)                    │
│ • LOW (<2×)                         │
│                                     │
│ Higher severity violations require  │
│ more urgent enforcement action and  │
│ may result in higher penalties.     │
└─────────────────────────────────────┘
```

---

## Example 9: Complete Violation Card (Enhanced)

### AFTER - Full Example
```
┌──────────────────────────────────────────────────────────┐
│ ACTIVE VIOLATION EVENT                                   │
│                                                          │
│ Facility: Point Loma WWTP                               │
│ Parameter: Oil & Grease (O&G)                           │
│ Location: Effluent Monitoring (EFF-001)                 │
│                                                          │
│ Violation Period:                                        │
│   Sep 3, 2025 → Sep 30, 2025                           │
│   28 days in violation ℹ️                               │
│                                                          │
│ Severity: MEDIUM ℹ️                                     │
│ Max Exceedance: 3.65× limit ℹ️                          │
│ Enforceable Violations: 28 ℹ️                           │
│                                                          │
│ Status: 🔴 Repeat Violation ℹ️                          │
│                                                          │
│ [San Diego County]                                       │
└──────────────────────────────────────────────────────────┘

All ℹ️ icons have tooltips with detailed explanations
```

---

## Summary of Improvements

### Terminology Changes
| Before              | After                          |
|---------------------|--------------------------------|
| Count               | Violation Days / Violation Count|
| Exceedances         | Violation Count                |
| Max Ratio           | Max Exceedance                 |
| Days Active         | Days in Violation              |
| (Repeat)            | Repeat Violation badge         |
| Period              | Violation Period with day count|

### Context Added
1. "days in violation" subtitle
2. "times limit" after exceedance ratios
3. "(28 days)" confirmation in periods
4. Help icons (ℹ️) with detailed tooltips
5. Card descriptions explaining methodology
6. Help page link from dashboard

### Information Architecture
```
Primary Display (at-a-glance)
    ↓
Tooltips (on-demand detail)
    ↓
Help Page (comprehensive learning)
    ↓
External Resources (regulatory documents)
```

This progressive disclosure pattern ensures:
- Clarity without overwhelming
- Context available when needed
- Deep learning path for interested users
