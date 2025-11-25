<objective>
Fix ALL TypeScript errors and deployment blockers preventing successful Vercel builds. The immediate error is in `lib/enrichment/spatial.ts:93:40` where `DACFeature` type is incompatible with `booleanPointInPolygon`, but you must scan the ENTIRE codebase to find and fix ALL other potential deployment errors in a single comprehensive pass.

**Critical Context**: This codebase has been through 20+ failed builds with incremental fixes. The user needs a comprehensive solution that fixes everything at once, not just the visible error.

**Current Build Error** (Build #22):
```
./lib/enrichment/spatial.ts:93:40
Type error: Argument of type 'CountyFeature | HUC12Feature | DACFeature | MS4Feature' is not assignable to parameter of type 'Polygon | MultiPolygon | Feature<Polygon | MultiPolygon, { [key: string]: any; NAME: string; NAMELSAD?: string | undefined; COUNTYFP?: string | undefined; }>'.
  Type 'DACFeature' is not assignable...
    Property 'NAME' is missing in type '{ [key: string]: any; CIscore?: number | undefined; CIscorP?: number | undefined; Tract?: string | undefined; }' but required...
```
</objective>

<context>
- **Project**: Next.js 16.0.0 + React 19.2.0 + Prisma 6.19.0 + TypeScript 5
- **Deployment**: Vercel (production)
- **Recent fixes**: Auth.js v4 compatibility issues resolved in commits 8e6a479, 89a5cfc, e9e8396, d625bfd
- **Current issue**: TypeScript compilation failing during `next build`
- **Pattern**: Multiple builds have revealed type errors one at a time - need to find ALL errors now

Examine these files to understand the type system:
@lib/enrichment/types.ts
@lib/enrichment/spatial.ts
@tsconfig.json
@package.json
</context>

<strategy>
This requires a methodical, comprehensive approach. Deeply analyze the entire codebase to find not just the visible error, but ALL potential TypeScript errors that would block deployment.

## Phase 1: Diagnose Current Error (IMMEDIATE)

1. **Read the spatial enrichment code**:
   - Examine `lib/enrichment/spatial.ts` line 93 and surrounding context
   - Read `lib/enrichment/types.ts` to understand `DACFeature`, `CountyFeature`, `HUC12Feature`, `MS4Feature` type definitions
   - Identify why `booleanPointInPolygon` expects different properties

2. **Root cause analysis**:
   - The `@turf/boolean-point-in-polygon` function expects features with specific property shapes
   - `DACFeature` has `{ CIscore, CIscorP, Tract }` properties
   - Other features expect `{ NAME, NAMELSAD?, COUNTYFP? }` properties
   - These are incompatible union types being passed to a function expecting a specific shape

3. **Fix the immediate error**:
   - Option A: Type narrowing/guards before calling `booleanPointInPolygon`
   - Option B: Type assertion with proper runtime validation
   - Option C: Refactor the feature union type to have compatible base properties
   - **Choose the solution that's type-safe AND maintainable**

## Phase 2: Comprehensive TypeScript Scan (CRITICAL)

After fixing the immediate error, thoroughly scan for ALL other TypeScript issues:

1. **Run comprehensive type check**:
   - Execute: `npm run type-check`
   - Capture ALL TypeScript errors (not just the first one)
   - Categorize by severity: build-breaking vs warnings

2. **Systematic file review** - check these common problem areas:
   - **API routes** (`app/api/**/*.ts`): Request/response types, error handling
   - **Component props** (`app/**/*.tsx`, `components/**/*.tsx`): Missing required props, type mismatches
   - **Prisma integration** (`lib/**/*.ts`): Decimal types, model types, client usage
   - **Library integrations**: next-auth types, mapbox types, turf types
   - **Configuration files**: auth.config.ts, middleware, providers

3. **Pattern-based scanning** - look for these common issues:
   - `any` types that should be specific types
   - Missing type imports from `@prisma/client` or `@prisma/client/runtime/library`
   - Incompatible React 19 / Next.js 16 patterns
   - Async/await type mismatches
   - Union type exhaustiveness issues

## Phase 3: Fix ALL Identified Issues

For each error found:
1. **Understand the root cause** - don't just suppress with `any`
2. **Apply the correct fix**:
   - Type narrowing with guards for union types
   - Proper generic constraints for reusable components
   - Correct Prisma type imports (Decimal from runtime/library)
   - Proper async function return types
3. **Verify the fix compiles** before moving to next error

## Phase 4: Build Verification

After all fixes:
1. **Local type check**: Run `npm run type-check` - must show 0 errors
2. **Local build test**: Run `npm run build` if possible - verify it completes
3. **Review changes**: Ensure no functionality was broken, only types were fixed
</strategy>

<implementation_rules>

**Type Safety Principles**:
- Prefer type narrowing/guards over type assertions (`as`)
- Use proper discriminated unions when handling multiple feature types
- Keep Prisma Decimal types as-is - don't convert to number unless necessary
- Maintain existing flexible type patterns (e.g., `Decimal | number` for mock data compatibility)

**What to Fix**:
- All TypeScript errors that would cause build failure
- Missing type imports
- Incompatible type assignments
- Union type handling without proper narrowing

**What NOT to Change**:
- Runtime logic (unless type fix requires it)
- Existing working patterns for Decimal compatibility
- Auth configuration (recently fixed, don't touch unless TypeScript error)
- Mock data structures in `lib/dev-mode.ts`

**Why These Rules Matter**:
- Type assertions hide errors, type narrowing catches them at runtime
- Prisma Decimal is required for precision in scientific/financial data
- The codebase supports both DEV_MODE (mocks) and production (Prisma) - maintain this flexibility
- Auth config was recently debugged through multiple builds - don't create regression
</implementation_rules>

<output>

**Required Actions**:

1. **Fix files** - modify any files with TypeScript errors:
   - `lib/enrichment/spatial.ts` - Fix the DACFeature incompatibility (PRIORITY)
   - Any other files discovered during comprehensive scan
   - Use Edit tool for each fix with clear before/after

2. **Document changes** - create `./TYPESCRIPT-FIXES.md`:
   ```markdown
   # TypeScript Deployment Fixes

   ## Build #22 Errors Fixed

   ### 1. lib/enrichment/spatial.ts:93
   **Error**: DACFeature incompatible with booleanPointInPolygon
   **Fix**: [describe solution]
   **Reasoning**: [why this approach]

   ### 2. [Next error]
   **Error**: [description]
   **Fix**: [solution]
   **Reasoning**: [explanation]

   [... all errors found and fixed ...]

   ## Verification
   - Local type-check: [PASS/FAIL]
   - Build test: [PASS/FAIL/NOT RUN]
   - Files modified: [count]
   - Total errors fixed: [count]
   ```

3. **Commit changes**:
   - After ALL fixes are complete and verified
   - Commit message: "fix: resolve all TypeScript deployment errors for Build #23"
   - DO NOT push - let user push manually
</output>

<verification>

**Before declaring this task complete**, you MUST verify:

1. ✓ Immediate `spatial.ts:93` error is fixed
2. ✓ Comprehensive scan executed (npm run type-check)
3. ✓ ALL discovered TypeScript errors are fixed
4. ✓ Local type-check shows 0 errors
5. ✓ Documentation created explaining each fix
6. ✓ Changes committed with clear message

**If type-check still shows errors**: The task is NOT complete. Continue fixing until clean.

**Success means**: The codebase will compile successfully in Vercel Build #23 with ZERO TypeScript errors.
</verification>

<success_criteria>

**Critical (Must Achieve)**:
- [x] `npm run type-check` returns 0 errors
- [x] All files compile without TypeScript errors
- [x] Build-blocking errors are eliminated
- [x] No `any` type suppressions added (proper fixes only)

**Important (Should Achieve)**:
- [x] All fixes are type-safe, not just type-silencing
- [x] Existing functionality preserved
- [x] Clear documentation of what was fixed and why

**Verification Command**:
```bash
npm run type-check && echo "SUCCESS: Ready for deployment"
```

If this command fails, the task is incomplete.
</success_criteria>

<meta_note>
The user has been through 20+ incremental build failures. They need confidence that THIS fix will work. Be thorough. Find everything. Fix everything. Verify everything. No more surprises in Build #23.
</meta_note>
