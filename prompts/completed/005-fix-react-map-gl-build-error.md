<research_objective>
Investigate and resolve the Vercel build failure caused by the `react-map-gl` module not being found during Next.js 16 Turbopack compilation. This is blocking deployment to production.

The error occurs at:
- File: `./components/subscriptions/map-with-draw.tsx:4:1`
- Error: `Module not found: Can't resolve 'react-map-gl'`
- Build context: Vercel deployment with Next.js 16.0.0 (Turbopack), npm install with --legacy-peer-deps

This is part of an ongoing deployment fix sequence where we've already resolved:
1. pnpm lockfile conflicts
2. @upstash/ratelimit version mismatch
3. Prisma 7.0.0 breaking changes
4. Module import path errors (precipitation.ts, auth.config.ts)

Now react-map-gl is the final blocking issue.
</research_objective>

<context>
Project: Stormwater Watch (Next.js 16, TypeScript, Prisma, Vercel deployment)
Build Environment: Vercel with npm install --legacy-peer-deps
Previous fixes: Module resolution errors in precipitation.ts and auth.config.ts were just fixed in commit d2f0e24

Key facts:
- package.json shows: `"react-map-gl": "^8.1.0"` on line 104
- npm install succeeds: "added 658 packages, and audited 659 packages in 1m"
- Prisma generate succeeds: "Generated Prisma Client (v6.19.0)"
- Build fails during Next.js Turbopack compilation phase
- The package is listed in dependencies, so it SHOULD be installed
</context>

<investigation_steps>
Thoroughly investigate the following possibilities in this order:

1. **Verify package installation**:
   - Check if react-map-gl actually exists in node_modules: `ls node_modules/ | grep react-map-gl`
   - Check npm list for react-map-gl: `npm ls react-map-gl`
   - Investigate if there's a peer dependency issue preventing installation

2. **Research react-map-gl compatibility**:
   - Check react-map-gl documentation for Next.js 16 / React 19 compatibility
   - Search for known issues with react-map-gl v8.1.0 and Next.js 16 Turbopack
   - Investigate if react-map-gl requires specific configuration for Turbopack
   - Check if mapbox-gl (the underlying dependency) has compatibility issues

3. **Examine the import chain**:
   - Review how map-with-draw.tsx is imported (the error shows it goes through create-form.tsx → subscriptions page)
   - Check if the component should be dynamically imported instead (common for map libraries to avoid SSR issues)
   - Look for "use client" directive presence

4. **Check for alternative solutions**:
   - Research if react-map-gl should be replaced with a different library for Next.js 16
   - Investigate dynamic imports with ssr: false for Mapbox components
   - Look for Next.js 16-specific map component patterns

5. **Review package.json configuration**:
   - Check if optionalDependencies or peerDependencies are causing issues
   - Verify React version compatibility (package.json shows React 19.2.0)
   - Check if there are conflicts with other mapping libraries (@mapbox/mapbox-gl-draw is also imported)
</investigation_steps>

<file_references>
Examine these files to understand the full context:
- @package.json - Check react-map-gl version and all map-related dependencies
- @components/subscriptions/map-with-draw.tsx - The failing component
- @components/subscriptions/create-form.tsx - How map-with-draw is imported
- @app/subscriptions/page.tsx - The page that uses the component
- @.npmrc - Check npm configuration (legacy-peer-deps=true is set)
</file_references>

<solution_requirements>
Your solution must:

1. **Fix the build error** - Vercel build must complete successfully
2. **Maintain functionality** - Map drawing features must work in production
3. **Be compatible with**:
   - Next.js 16.0.0 with Turbopack
   - React 19.2.0
   - Vercel deployment environment
   - Existing Mapbox token setup (NEXT_PUBLIC_MAPBOX_TOKEN)

4. **Consider these approaches** (in order of preference):
   - Fix dependency resolution issue (if react-map-gl can work)
   - Update to compatible version of react-map-gl
   - Implement dynamic import with SSR disabled
   - Replace with alternative library only if absolutely necessary

5. **Document your findings**: Explain WHY the error occurred and HOW your fix resolves it
</solution_requirements>

<constraints>
- Do not remove map functionality - it's used in production features
- Maintain backward compatibility with existing NEXT_PUBLIC_MAPBOX_TOKEN environment variable
- Keep the same component API if possible (MapWithDrawControls props)
- Ensure fix works on Vercel specifically (not just local development)
- Do not introduce new breaking changes or require schema changes
</constraints>

<output>
After thorough research and testing, provide:

1. **Root cause analysis** - Why did this specific error occur?

2. **Solution implementation**:
   - Modify necessary files (package.json, components, etc.)
   - Include any required configuration changes
   - Add comments explaining Turbopack-specific requirements

3. **Verification steps**:
   - Commands to test locally: `npm run build`
   - What to check in Vercel logs after deployment
   - How to verify map functionality works in production

4. **Git commit** with clear message explaining the fix

5. **Documentation update** - If the fix requires special configuration, document it
</output>

<success_criteria>
- [ ] Vercel build completes without module resolution errors
- [ ] Map component renders correctly in production
- [ ] Draw controls function as expected
- [ ] No console errors related to mapbox-gl or react-map-gl
- [ ] Solution is documented and maintainable
</success_criteria>

<research_guidance>
Be thorough - this is the 5th build failure in a row. We need a definitive fix that:
- Addresses the root cause, not just symptoms
- Won't break on future deployments
- Considers Vercel's specific build environment

Use web search to find:
- Recent issues with react-map-gl + Next.js 16
- Turbopack-specific module resolution patterns
- Vercel deployment best practices for map libraries

Remember: npm install succeeded, but the module still can't be resolved during Turbopack compilation. This suggests a bundling/compilation issue, not a simple missing dependency.
</research_guidance>
