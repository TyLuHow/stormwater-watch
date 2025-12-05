<objective>
Add back buttons to key navigation pages throughout the application to improve user experience and navigation flow. Users should be able to easily return to previous pages from detail views, admin pages, and setup workflows.
</objective>

<context>
This is a Next.js application for monitoring stormwater permit violations. The app has various page types including:
- Detail pages (facility details)
- Admin pages (facility linking, management tools)
- Setup/configuration pages
- Dashboard and list views

Currently, some pages lack clear navigation back to parent pages, forcing users to use browser back buttons or navigate via the main menu.
</context>

<requirements>
1. Identify all pages that would benefit from back buttons (detail pages, admin pages, setup pages)
2. Add back button components to these pages in appropriate locations
3. Ensure back buttons use Next.js router for proper navigation (not browser back)
4. Use consistent styling that matches the existing design system (check existing components for patterns)
5. Position back buttons logically (typically top-left of page content)
6. Include proper aria labels for accessibility
</requirements>

<research>
Before implementing, examine:
- Existing navigation patterns: Check if there's already a back button component
- Design system: Look at components/ directory for UI patterns and button styles
- Page layouts: Review app/facilities/[id]/page.tsx, app/admin/facility-linking/page.tsx, app/setup/page.tsx
- Routing patterns: Understand the navigation hierarchy
</research>

<implementation>
1. Check if a back button component already exists in components/
2. If not, create a reusable BackButton component using:
   - Next.js useRouter hook for navigation
   - Lucide-react icons (ArrowLeft or ChevronLeft)
   - Tailwind CSS for styling consistent with the design system
   - Optional label prop (e.g., "Back to Facilities")
3. Add the BackButton to identified pages:
   - Detail pages: app/facilities/[id]/page.tsx
   - Admin pages: app/admin/facility-linking/page.tsx
   - Setup pages: app/setup/page.tsx
   - Any other pages that would benefit from easier navigation
4. Position consistently (typically at the top of the page content area)
5. Ensure proper TypeScript typing

Avoid:
- Using browser history.back() - use Next.js router.push() to specific routes instead for more predictable navigation
- Hardcoding routes - derive parent routes from current path when possible
- Breaking existing layout or styling
</implementation>

<output>
Create or modify:
- `./components/ui/BackButton.tsx` - Reusable back button component (if it doesn't exist)
- `./app/facilities/[id]/page.tsx` - Add back button to facility detail page
- `./app/admin/facility-linking/page.tsx` - Add back button to admin page
- `./app/setup/page.tsx` - Add back button to setup page
- Any other pages identified during research
</output>

<verification>
Before completing:
1. Run type-check: `npm run type-check`
2. Verify back buttons appear on the identified pages
3. Test that clicking back buttons navigates to the expected parent pages
4. Confirm styling is consistent with the design system
5. Ensure no TypeScript errors
</verification>

<success_criteria>
- Back button component created (or existing one reused)
- Back buttons added to all identified pages
- Navigation works correctly without TypeScript errors
- UI is consistent with existing design patterns
- Accessibility labels are present
</success_criteria>
