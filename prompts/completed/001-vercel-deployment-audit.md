<objective>
Conduct a comprehensive Vercel deployment audit for the Stormwater Watch Next.js application. Thoroughly analyze the codebase to identify and fix ALL deployment-blocking issues, warnings, and potential future problems.

The immediate goal is to achieve a successful Vercel deployment. The broader goal is to make this codebase deployment-resilient so future builds don't encounter similar issues.
</objective>

<context>
This is a Next.js 16 application with:
- Prisma ORM connecting to Supabase PostgreSQL
- App Router architecture
- TypeScript
- The build is failing on Vercel with database access errors during static page generation

Recent build log showed these issues:
1. CRITICAL: `/dashboard` page fails prerendering - attempts database query during build
2. WARNING: Node engine `>=20.9.0` causes auto-upgrade to Node 24.x instead of configured 22.x
3. WARNING: pnpm-lock.yaml detected but Vercel runs `npm install --legacy-peer-deps`
4. WARNING: Deprecated `crypto@1.0.1` package dependency

@package.json
@next.config.mjs
@prisma/schema.prisma
@app/dashboard/page.tsx
@vercel.json
</context>

<research>
Before making any changes, thoroughly explore the codebase to understand:

1. **All pages that might access the database at build time**:
   - Search for Prisma client usage in page components
   - Identify which pages use `generateStaticParams`, `generateMetadata`, or top-level data fetching
   - Check for any server components that fetch data without proper dynamic markers

2. **Current rendering strategies**:
   - Which pages are statically generated vs server-rendered?
   - Are there any `export const dynamic` or `export const revalidate` declarations?
   - Check for `use client` vs server component boundaries

3. **Environment variable usage**:
   - How is DATABASE_URL accessed?
   - Are there build-time vs runtime env var distinctions?
   - Check `.env.example` for expected variables

4. **Package manager state**:
   - What lockfiles exist? (package-lock.json, pnpm-lock.yaml, yarn.lock)
   - What does `packageManager` field say in package.json?
   - Any `.npmrc` or `.nvmrc` configurations?
</research>

<fixes_required>

<fix id="1" priority="critical">
<title>Fix Static Generation Database Access</title>
<problem>
Pages like `/dashboard` are being statically generated at build time, triggering Prisma database queries when no database connection exists during Vercel build.
</problem>
<solution>
For each page that accesses the database, determine the appropriate strategy:

**Option A - Force Dynamic Rendering** (for pages needing live data):
```typescript
export const dynamic = 'force-dynamic'
```

**Option B - Client-Side Data Fetching** (for pages that can show loading state):
- Move data fetching to client components with `useEffect` or React Query
- Keep page component as static shell

**Option C - Graceful Fallback** (for pages that can work without data):
- Wrap database calls in try-catch
- Return empty/placeholder data during build
- Use `unstable_noStore()` from next/cache

Analyze each affected page and choose the most appropriate strategy based on:
- Does the page need SEO (static better)?
- Does data change frequently (dynamic better)?
- Is there meaningful content without data (fallback possible)?
</solution>
</fix>

<fix id="2" priority="high">
<title>Pin Node.js Version</title>
<problem>
`engines: { "node": ">=20.9.0" }` allows automatic upgrades to Node 24.x, causing potential compatibility issues.
</problem>
<solution>
Update package.json to pin a specific Node.js LTS version:
```json
"engines": {
  "node": "20.x"
}
```
Also ensure `.nvmrc` matches this version.
</solution>
</fix>

<fix id="3" priority="high">
<title>Resolve Package Manager Mismatch</title>
<problem>
pnpm-lock.yaml exists but Vercel is running npm install, causing potential dependency resolution differences.
</problem>
<solution>
Choose ONE package manager and commit to it:

**If keeping pnpm:**
1. Add to package.json: `"packageManager": "pnpm@9.x"`
2. Delete package-lock.json if it exists
3. Update vercel.json with install command override if needed

**If switching to npm:**
1. Delete pnpm-lock.yaml
2. Run `npm install` to generate fresh package-lock.json
3. Remove packageManager field if present

Verify Vercel project settings match the chosen package manager.
</solution>
</fix>

<fix id="4" priority="medium">
<title>Remove Deprecated crypto Package</title>
<problem>
Direct dependency on `crypto@1.0.1` which is deprecated - crypto is now built into Node.js.
</problem>
<solution>
1. Check if crypto is a direct dependency in package.json
2. If direct: remove it, Node's built-in crypto module is available
3. If transitive: identify which package depends on it and consider updating that package
</solution>
</fix>

<fix id="5" priority="medium">
<title>Audit All Pages for Build-Time Safety</title>
<problem>
Other pages may have similar issues that will surface later.
</problem>
<solution>
Scan ALL pages in the app directory:
1. List every page.tsx file
2. Check each for:
   - Direct Prisma imports/usage
   - Async components fetching data
   - generateStaticParams or generateMetadata with database calls
3. Apply appropriate fixes to each affected page
</solution>
</fix>

<fix id="6" priority="low">
<title>Optimize Vercel Configuration</title>
<problem>
vercel.json may need optimization for this project's needs.
</problem>
<solution>
Review and potentially add:
- Build command overrides if needed
- Environment variable configuration guidance
- Region settings for database proximity
- Function configuration for API routes
</solution>
</fix>

</fixes_required>

<implementation_steps>
1. Read and understand the current state of all relevant files
2. Create a checklist of every page that needs modification
3. Apply Fix #1 (critical database access issue) to ALL affected pages
4. Apply Fix #2 (Node version pinning)
5. Apply Fix #3 (package manager resolution)
6. Apply Fix #4 (crypto deprecation)
7. Review and update vercel.json if needed
8. Test the build locally with `npm run build` or `pnpm build`
9. Document all changes made
</implementation_steps>

<verification>
Before declaring complete, verify:

1. **Local Build Test**: Run `npm run build` (or pnpm build) - it MUST complete without errors
2. **Page Audit Complete**: Confirm every page.tsx was checked for database access
3. **No Build-Time DB Calls**: Grep for Prisma usage and verify each instance is in a safe context
4. **Version Files Aligned**: .nvmrc, package.json engines, and Vercel settings all match
5. **Single Lockfile**: Only one lockfile exists (either package-lock.json OR pnpm-lock.yaml)
6. **TypeScript Clean**: `npx tsc --noEmit` passes without errors
</verification>

<output>
After completing all fixes:

1. Provide a summary of all changes made, organized by file
2. List any pages that were modified and what rendering strategy was chosen for each
3. Note any recommendations for Vercel project settings that need manual configuration
4. Save a deployment checklist to `./VERCEL_DEPLOYMENT_FIXES.md` documenting:
   - What was fixed
   - Why each fix was necessary
   - Any manual steps required in Vercel dashboard
</output>

<success_criteria>
- `npm run build` (or `pnpm build`) completes successfully with no errors
- No warnings about Node version auto-upgrades
- Single consistent package manager in use
- All pages either statically generate safely OR are marked as dynamic
- Documentation of changes saved for future reference
</success_criteria>
