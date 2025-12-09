<objective>
Research and design integration of California Streams shapefile from CNRA Open Data Portal as an optional map enhancement. This would provide geographic context for discharge points and receiving waters.

"Integrating a shapefile like https://data.cnra.ca.gov/dataset/california-streams could be a cool addition" - domain expert suggestion
</objective>

<context>
**Data Source:**
California Streams dataset: https://data.cnra.ca.gov/dataset/california-streams

**Purpose:**
- Overlay streams/rivers on violations map
- Show proximity of discharge points to receiving waters
- Provide geographic context for water quality impacts
- Visualize downstream flow from violation sites

**Priority:**
This is an enhancement, not critical functionality. Implement only if:
1. Data accuracy issues are fixed (Prompt 001)
2. Navigation redesign is complete (Prompt 002)
3. Filtering features are implemented (Prompt 003)
4. Core UX issues are resolved

**Current State:**
Check if map implementation already exists and what mapping library is used.
Read map components to understand current architecture.
</context>

<research>
**Phase 1 - Data Source Investigation:**

1. **Fetch California Streams Data:**
   - Use WebFetch to examine https://data.cnra.ca.gov/dataset/california-streams
   - Identify data format (likely GeoJSON or Shapefile)
   - Check file size and complexity
   - Review license and usage terms
   - Determine update frequency

2. **Assess Data Characteristics:**
   - What's included? (stream names, flow direction, watershed boundaries?)
   - Coordinate system (should be WGS84 for web mapping)
   - Level of detail (all streams or major rivers only?)
   - File size (can it be loaded client-side or needs tile server?)

3. **Download and Examine:**
   - Download sample data
   - Validate format and structure
   - Test loading in mapping library
   - Assess performance implications

**Phase 2 - Technical Approach:**

1. **Map Library Assessment:**
   - Current map: likely using mapbox-gl (see package.json) or react-map-gl
   - Confirm library supports GeoJSON layers
   - Check layer styling capabilities

2. **Integration Strategy Options:**

   Option A: **Client-side GeoJSON**
   - Convert shapefile to GeoJSON
   - Host static GeoJSON file
   - Load layer client-side
   - Pros: Simple, no backend needed
   - Cons: Large file size may impact performance

   Option B: **Tile Server**
   - Set up vector tile server (Tippecanoe + tile server)
   - Serve streams as vector tiles
   - Load tiles progressively based on zoom/viewport
   - Pros: High performance, scalable
   - Cons: More complex infrastructure

   Option C: **Third-party Service**
   - Use Mapbox datasets or similar
   - Upload California streams data
   - Reference as tileset
   - Pros: Managed infrastructure
   - Cons: May incur costs, vendor lock-in

   Recommend best approach based on file size and performance needs.

3. **Feature Design:**
   - Layer toggle: "Show California Streams" checkbox
   - Style: Blue lines, varying width by stream order
   - Interactive: Click stream to see name and watershed info
   - Zoom-dependent: Only show at appropriate zoom levels
   - Label major rivers

**Phase 3 - User Experience Design:**

1. **Visual Design:**
   - Stream color: Light blue (#4A90E2) to not overwhelm other data
   - Width: Vary by stream order (smaller = 1px, larger = 3px)
   - Opacity: 50-70% to allow underlying data to show through
   - Z-index: Below facility markers, above base map

2. **Interaction Design:**
   - Toggle in map controls: "Layers" panel
   - Hover: Highlight stream and show name in tooltip
   - Click: Show stream details panel (name, watershed, flow direction)
   - Mobile: Tap to select, tap again for details

3. **Performance Considerations:**
   - Lazy load: Don't load until user enables layer
   - Zoom threshold: Only show at zoom level 8+ (regional view)
   - Simplification: Use simplified geometry for distant zoom levels
   - Caching: Cache tile requests
</research>

<requirements>
**This is a RESEARCH and DESIGN prompt, NOT implementation.**

Your deliverables:

**1. Feasibility Assessment:**
- Can California Streams data be integrated?
- What's the best technical approach?
- What are the performance implications?
- Are there any licensing or usage restrictions?

**2. Technical Specification:**
Document:
- Data format and size
- Recommended integration approach (A, B, or C above)
- Required infrastructure changes
- Estimated development effort
- Performance optimization strategies

**3. UX Design:**
Create detailed description of:
- How layer toggle should work
- Visual styling (colors, widths, labels)
- Interactive behaviors (hover, click)
- Mobile experience
- Examples of good stream layer implementations

**4. Implementation Plan:**
If deemed feasible, outline steps:
1. Data acquisition and conversion
2. Infrastructure setup (if needed)
3. Map component modifications
4. Layer controls implementation
5. Testing and optimization

**5. Risk Assessment:**
Identify potential issues:
- File size and loading time
- Browser performance with complex geometry
- Mobile device limitations
- Data update maintenance
- Alignment with facility/violation data

**6. Alternative Approaches:**
If California Streams integration is too complex, suggest alternatives:
- Use simpler basemap with rivers already included
- Integrate only major rivers (not all streams)
- Link to external map viewers instead of embedding
- Wait for better data formats or services
</requirements>

<constraints>
- This is NOT critical functionality - it's a "nice to have"
- Don't implement if it significantly impacts map performance
- WHY: Core function is violations data; streams are supplementary context
- Must work on mobile devices without performance degradation
- Should be toggleable (off by default to reduce initial load time)
- Consider maintenance burden (data updates, hosting costs)
</constraints>

<output>
Create a research document at: `./docs/california-streams-integration-research.md`

Structure:
```markdown
# California Streams Integration Research

## Executive Summary
[1-paragraph feasibility assessment]

## Data Source Analysis
- Dataset: [name, URL, description]
- Format: [GeoJSON, Shapefile, etc.]
- Size: [MB, number of features]
- License: [usage terms]
- Update frequency: [how often data is updated]

## Technical Recommendation
**Recommended Approach**: [Option A/B/C]

**Rationale**: [Why this approach is best for this project]

**Infrastructure Requirements**: [What's needed]

**Performance Impact**: [Expected load time, memory usage]

## UX Design Specification
[Detailed mockup description or ASCII art of layer toggle and display]

### Visual Styling
- Colors: ...
- Line widths: ...
- Labels: ...
- Z-index: ...

### Interactions
- Toggle behavior: ...
- Hover states: ...
- Click actions: ...
- Mobile gestures: ...

## Implementation Plan
1. [Step 1]
2. [Step 2]
...

Estimated effort: [hours or story points]

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| ...  | ...    | ...        |

## Alternatives Considered
[Other approaches and why they were not selected]

## Recommendation
[Go / No-Go / Wait decision with justification]
```

Optionally, create a proof-of-concept branch to test loading the data.
</output>

<verification>
Before completing, verify you have:
- [ ] Examined the California Streams dataset
- [ ] Assessed file size and format
- [ ] Tested loading sample data in mapping library
- [ ] Evaluated all three integration approaches
- [ ] Made a clear recommendation
- [ ] Designed UX for layer toggle and display
- [ ] Identified risks and mitigations
- [ ] Estimated implementation effort
- [ ] Provided Go/No-Go recommendation
</verification>

<success_criteria>
- Clear understanding of California Streams dataset characteristics
- Concrete recommendation on integration approach or decision not to integrate
- If recommended: detailed technical and UX specifications ready for implementation
- If not recommended: clear rationale and alternatives suggested
- User (Tyler) can make informed decision on whether to proceed
- Expert suggestion evaluated thoroughly
</success_criteria>
