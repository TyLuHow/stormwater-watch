<objective>
Improve monitoring location display throughout the application to show human-readable descriptions instead of cryptic IDs like "EFF-001". Make it immediately clear what each monitoring location represents without requiring site plans.

"EFF-001 corresponds to a specific pipe that no one will know without looking at a site plan" - domain expert feedback
</objective>

<context>
**Problem:**
Currently displays: "EFF-001" or "R-001D"
Users need to look at site plans to understand what these mean.

**Domain Knowledge:**
- EFF-001 = Effluent monitoring location (outfall pipe #1)
- R-001D = Receiving water monitoring location
- INF-001 = Influent monitoring location
- M-001 = Various monitoring points

**Expert Recommendation:**
"Switch EFF-001 and Effluent monitoring here"

Display format should be:
**Primary:** "Effluent Monitoring" (human-readable description)
**Secondary:** "EFF-001" (technical ID, smaller or grayed out)

Read @prisma/schema.prisma to understand MonitoringLocation model.
Examine how monitoring locations are currently displayed across the app.
</context>

<research>
**Phase 1 - Understand Current Implementation:**
1. Find MonitoringLocation schema definition
2. Determine if descriptions exist in database
3. Locate all components that display monitoring locations
4. Check if location type (effluent/receiving/influent) is stored

**Phase 2 - Identify Display Patterns:**
Find all places monitoring locations appear:
- Facility detail pages
- Sample data tables
- Case packets
- Violation details
- Monitoring data downloads
- Charts and graphs

**Phase 3 - Design Label Strategy:**
Create a consistent labeling system:
- Parse location ID to extract type and number
- Generate human-readable descriptions
- Handle edge cases (unknown types, custom locations)
</research>

<requirements>
**1. Database Enhancement (if needed):**

Check if MonitoringLocation table has a description field.

If not, add:
```prisma
model MonitoringLocation {
  id          String   @id
  locationId  String   // e.g., "EFF-001"
  name        String   // human-readable name
  type        String   // "effluent", "receiving", "influent", "other"
  description String?  // optional detailed description
  ...
}
```

**2. Location Type Parser:**

Create `./lib/monitoring/location-parser.ts`:

```typescript
export type LocationType = 'effluent' | 'receiving' | 'influent' | 'other';

export function parseLocationId(locationId: string): {
  type: LocationType;
  number: string;
  description: string;
} {
  // Parse EFF-001 -> {type: 'effluent', number: '001', description: 'Effluent Monitoring'}
  // Parse R-001D -> {type: 'receiving', number: '001D', description: 'Receiving Water Monitoring'}
  // etc.
}

export function formatLocationDisplay(locationId: string, format?: 'full' | 'compact'): string {
  // 'full': "Effluent Monitoring (EFF-001)"
  // 'compact': "Effluent Monitoring"
}
```

**3. Update Display Components:**

Create reusable component: `./components/monitoring/LocationLabel.tsx`

```tsx
<LocationLabel
  locationId="EFF-001"
  format="full" // or "compact"
  showTooltip={true} // optional: show detailed description on hover
/>
```

Display variations:
- **Table cells**: Primary = description, secondary = ID in smaller text
- **Headers**: "Effluent Monitoring (EFF-001)"
- **Mobile**: Description only, ID in tooltip
- **Exports**: Include both description and ID

**4. Update All Usage Sites:**

Find and update every place that displays monitoring locations:
- Facility detail pages (monitoring sections)
- Sample data tables
- Violation event details
- Case packet generation
- Charts/graphs with location labels
- Filter dropdowns (show description, filter by ID)
- API responses (include description field)

**5. Backwards Compatibility:**

Ensure existing data with only IDs still works:
- Parser should handle any location ID format gracefully
- Unknown IDs should display as-is with generic description
- Add fallback: "Monitoring Location (UNKNOWN-123)"
</requirements>

<implementation>
**Step 1 - Enhance Data Model:**
- Update schema if needed to include location descriptions
- Create migration if database changes needed
- Seed existing locations with proper descriptions

**Step 2 - Build Parser Utility:**
- Implement location ID parser with comprehensive patterns
- Handle all known location types (EFF, R, INF, M, etc.)
- Add tests for edge cases

**Step 3 - Create Display Component:**
- Build reusable LocationLabel component
- Support multiple display formats
- Include tooltip with full details
- Make it accessible (aria-labels)

**Step 4 - Update All Display Sites:**
Search codebase for location ID displays:
```bash
grep -r "EFF-001\|locationId\|monitoringLocation" --include="*.tsx" --include="*.ts"
```

Replace raw ID displays with LocationLabel component or formatLocationDisplay utility.

**Step 5 - Update API Responses:**
Modify API routes to include location descriptions in responses:
```typescript
{
  locationId: "EFF-001",
  locationName: "Effluent Monitoring",
  locationType: "effluent",
  description: "Primary effluent discharge point"
}
```

**Step 6 - Update Filters:**
In filter dropdowns, show descriptions but filter by IDs:
```
[Dropdown Options]
☐ Effluent Monitoring (EFF-001)
☐ Receiving Water (R-001D)
☐ Influent Monitoring (INF-001)
```
</implementation>

<constraints>
- Preserve original location IDs in database - don't change data
- WHY: IDs are official designations from eSMR, changing them would break compliance
- Ensure exports include both description and ID for official records
- Make descriptions consistent across the entire application
- Handle locations from multiple facilities (same ID, different facility)
</constraints>

<output>
Create/modify:
- `./lib/monitoring/location-parser.ts` - Parser and formatter utilities
- `./components/monitoring/LocationLabel.tsx` - Reusable display component
- Schema migration if needed
- All pages/components that display monitoring locations
- API routes to include location metadata

Document:
- Location ID format patterns
- How to add new location types
- Display format guidelines
</output>

<verification>
Before completing, verify:
- [ ] All monitoring locations show human-readable descriptions
- [ ] Technical IDs still visible but secondary
- [ ] Parser handles all common location ID formats
- [ ] Unknown IDs fail gracefully with sensible defaults
- [ ] Mobile display is readable
- [ ] Exports include both description and ID
- [ ] Filter dropdowns show descriptions
- [ ] Tooltips provide additional context
- [ ] No site plans needed to understand locations
</verification>

<success_criteria>
- Users can immediately understand what each monitoring location represents
- "EFF-001" displays as "Effluent Monitoring (EFF-001)" or similar
- No need to reference site plans to understand location meanings
- Consistent labeling across entire application
- Expert feedback addressed: monitoring locations are now self-explanatory
</success_criteria>
