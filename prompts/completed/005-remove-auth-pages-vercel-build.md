<objective>
Fix Vercel Build #25 prerender failure by removing unused authentication pages that are causing "Invalid URL" errors during static page generation.

**Critical Issue**: Build is failing at the "Generating static pages" step with:
```
Error occurred prerendering page "/auth/signin"
TypeError: Invalid URL
code: 'ERR_INVALID_URL',
input: '',
```

**Root Cause**: The auth/signin and auth/verify pages import `signIn` from next-auth/react, which attempts to construct URLs during module evaluation. Since NEXTAUTH_URL is not set (user stated "I don't need a sign in page yet"), this causes an "Invalid URL" error during Vercel's build process.

**Previous Failed Fix**: Adding `export const dynamic = 'force-dynamic'` did NOT prevent Next.js from evaluating the module during build.

**Correct Solution**: Completely remove the auth pages from the build since they are not needed yet.
</objective>

<context>
- **Project**: Next.js 16.0.0 with Turbopack on Vercel
- **Build Environment**: Node.js 24.x (Vercel auto-selected)
- **Commit**: 8577bf3 - "Fix auth prerender error and complete production deployment audit"
- **User Requirement**: "I don't need a sign in page yet"
- **Current State**:
  - TypeScript: 0 errors (CLEAN)
  - Security: 0 vulnerabilities
  - Auth pages exist but are unused and blocking deployment

Files to modify:
@app/auth/signin/page.tsx
@app/auth/verify/page.tsx
</context>

<requirements>
1. **Remove auth pages completely** - Delete or rename to prevent inclusion in build
2. **Preserve auth infrastructure** - Keep auth.config.ts and API routes (they work in DEV_MODE)
3. **Document the removal** - Add comment explaining why pages were removed
4. **Verify TypeScript still clean** - Ensure no broken imports after removal
</requirements>

<implementation>
Choose ONE of these approaches (recommend #1 for cleanest solution):

## Approach 1: Delete Auth Page Files (RECOMMENDED)
Simply delete the problematic page files:
- Delete `app/auth/signin/page.tsx`
- Delete `app/auth/verify/page.tsx`
- Keep `app/auth/` directory structure if needed for future use
- Add a README.md in `app/auth/` explaining pages were removed temporarily

**Why this works**: Next.js only builds pages that exist. No file = no build error.

## Approach 2: Move to Disabled Directory
Move pages out of app router:
- Create `app/_disabled-auth/` directory
- Move `app/auth/signin/page.tsx` → `app/_disabled-auth/signin-page.tsx.txt`
- Move `app/auth/verify/page.tsx` → `app/_disabled-auth/verify-page.tsx.txt`
- Add README explaining they can be restored when auth is needed

**Why this works**: Directories starting with `_` are ignored by Next.js App Router.

## Approach 3: Gitignore Pattern (NOT RECOMMENDED - won't help Vercel)
This won't work because Vercel clones from git where the files exist.
</implementation>

<steps>
1. Read both auth page files to understand current state
2. Choose Approach 1 (delete files) for cleanest solution
3. Delete `app/auth/signin/page.tsx`
4. Delete `app/auth/verify/page.tsx`
5. Create `app/auth/README.md` documenting why pages were removed:
   ```markdown
   # Authentication Pages - Temporarily Removed

   The signin and verify pages have been temporarily removed to allow Vercel builds to succeed.

   **Reason**: These pages import next-auth/react which requires NEXTAUTH_URL to be set.
   Since authentication is not yet configured for production, the pages caused build failures.

   **When to restore**:
   - Set NEXTAUTH_URL in Vercel environment variables
   - Configure email provider (Resend) with valid API key
   - Restore page files from git history (commit 8577bf3)

   **Files removed**:
   - app/auth/signin/page.tsx
   - app/auth/verify/page.tsx

   **Preserved infrastructure**:
   - auth.config.ts (NextAuth configuration)
   - app/api/auth/[...nextauth]/route.ts (API handler with DEV_MODE fallback)
   ```
6. Run `npm run type-check` to verify no broken imports
7. Verify git status shows the deletions
</steps>

<verification>
Before declaring complete, verify:

1. **Files deleted**: Confirm `app/auth/signin/page.tsx` and `app/auth/verify/page.tsx` no longer exist
2. **README created**: `app/auth/README.md` exists with clear explanation
3. **TypeScript clean**: Run `npm run type-check` - should still return 0 errors
4. **Git status**: Verify deletions are staged and ready to commit
5. **No broken references**: Search codebase for imports from deleted files

DO NOT attempt to run `npm run build` locally - Node.js 18 incompatibility will block it. Vercel will validate when deployed.
</verification>

<output>
**Files to delete**:
- `app/auth/signin/page.tsx`
- `app/auth/verify/page.tsx`

**File to create**:
- `app/auth/README.md` (with explanation of why pages were removed)

**Commit message**:
```
fix: remove unused auth pages blocking Vercel build

CRITICAL FIX for Build #25:
- Deleted app/auth/signin/page.tsx (caused Invalid URL prerender error)
- Deleted app/auth/verify/page.tsx (same issue)
- Added app/auth/README.md explaining temporary removal

ROOT CAUSE:
Auth pages import next-auth/react which constructs URLs during module
evaluation. Without NEXTAUTH_URL set, this causes build-time errors.

SOLUTION:
Remove pages completely since user stated "I don't need a sign in page yet"
Auth infrastructure (auth.config.ts, API routes) preserved for future use.

VERIFICATION:
- TypeScript: 0 errors (verified)
- Pages restored from git when auth is configured

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```
</output>

<success_criteria>
- [x] Auth page files completely removed from app/auth/
- [x] README.md created in app/auth/ with clear explanation
- [x] TypeScript type-check passes with 0 errors
- [x] Git shows deletions staged for commit
- [x] No broken imports in codebase
- [x] Comprehensive commit created with explanation
- [x] Ready to push to Vercel for Build #26
</success_criteria>

<constraints>
**DO NOT**:
- Delete auth.config.ts or app/api/auth/ - these have DEV_MODE fallbacks and work correctly
- Try to "fix" the pages - they cannot be fixed without NEXTAUTH_URL environment variable
- Run npm run build locally - Node 18 incompatibility will fail (Vercel uses Node 24)
- Leave the pages in place with more configuration - user explicitly doesn't need them yet

**DO**:
- Remove pages cleanly and document why
- Preserve ability to restore from git history
- Verify TypeScript remains clean
- Create clear commit explaining the fix
</constraints>
