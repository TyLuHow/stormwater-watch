<objective>
Redesign the dashboard filter bar to be more compact and visually sleek while ensuring the filtering functionality works correctly. The goal is to reduce vertical space usage, improve the visual design, and fix any broken filtering logic so users can efficiently filter facility data.
</objective>

<context>
This is the main dashboard page of the Stormwater Watch application where users view and filter facilities. The current filter bar has the following issues:
- Takes up too much vertical space, pushing important content down
- Visual design looks cluttered and could be more refined
- May have performance or functionality issues with the filtering logic

The dashboard is a critical user-facing page where environmental organizations need to quickly find and filter stormwater facilities by various criteria.
</context>

<research>
Before implementing, examine:
- Dashboard page structure: `app/dashboard/page.tsx`
- Filter components: Check `components/` directory for any existing filter components
- Current filter state management: Understand how filters are applied (client-side state, URL params, etc.)
- Data structure: Review what fields are available for filtering
- Design system: Check existing UI components for consistent styling patterns
</research>

<requirements>
1. **Reduce vertical space**: Redesign the filter bar to use 30-50% less vertical space
2. **Improve visual design**: Make the filter bar more sleek and less cluttered
3. **Fix filtering logic**: Ensure all filters work correctly and apply to the data
4. **Maintain functionality**: Preserve all existing filter capabilities
5. **Responsive design**: Ensure the compact design works on mobile devices
6. **Performance**: Optimize filtering logic if needed to improve speed
</requirements>

<implementation>
Consider these approaches for a more compact design:

**Layout options:**
- Horizontal inline layout instead of stacked fields
- Collapsible/expandable filter section (starts collapsed)
- Popover or dropdown filters instead of always-visible inputs
- Use icons with tooltips to save space
- Multi-column grid for filters instead of single column

**Visual improvements:**
- Reduce padding and margins
- Use smaller input sizes where appropriate
- Consistent spacing and alignment
- Use badges or chips for selected filters
- Clear visual hierarchy

**Functionality fixes:**
- Verify filter state is properly connected to data display
- Ensure filters update the displayed results correctly
- Add proper debouncing for text inputs
- Clear/reset filters functionality
- Show active filter count or indicators

**What to avoid:**
- Don't remove useful filter options to save space - instead, organize them better
- Don't make filters so compact that they become hard to use
- Avoid breaking existing filter functionality - fix and enhance, don't rebuild from scratch unless necessary
</implementation>

<output>
Modify these files:
- `./app/dashboard/page.tsx` - Update dashboard page with improved filters
- Any filter-related components in `./components/` - Refactor for compact, sleek design
- Create new components if needed for better organization

Consider creating:
- `./components/dashboard/FilterBar.tsx` - Dedicated filter bar component (if it doesn't exist)
- `./components/dashboard/FilterChip.tsx` - For showing active filters (optional)
</output>

<verification>
Before completing:
1. Run type-check: `npm run type-check`
2. Test all filter combinations work correctly
3. Verify the filter bar uses significantly less vertical space
4. Confirm responsive behavior on mobile
5. Check that filter state persists appropriately
6. Ensure no TypeScript errors
</verification>

<success_criteria>
- Filter bar uses at least 30% less vertical space than before
- Visual design is cleaner and more refined
- All filters work correctly and update the displayed data
- No TypeScript errors
- Responsive design works on mobile devices
- Performance is maintained or improved
</success_criteria>
