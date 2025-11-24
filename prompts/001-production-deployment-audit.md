<objective>
Perform a comprehensive, production-grade audit of the entire codebase to achieve deployment readiness. This is a critical overnight session to scan deeply and extensively for ALL errors, issues, and deployment blockers that have accumulated during troubleshooting. The end goal is pristine, production-ready code that deploys successfully to Vercel without any build failures, type errors, security vulnerabilities, or performance issues.

**Current Critical Issue**: Build is failing with `prisma generate && next build` exited with 1. This must be resolved along with a full codebase health check.

**Why this matters**: The application has been through multiple troubleshooting cycles focusing on individual errors. Now we need a holistic, systematic approach to catch everything and deliver deployment-ready code.
</objective>

<context>
- **Project**: Next.js 16.0.0 with React 19.2.0, Turbopack, Prisma 6.0.0
- **Environment**: Vercel deployment (production)
- **Tech stack**: TypeScript 5, TailwindCSS 4, Prisma, Supabase, Mapbox, React Query
- **Recent issues**: Multiple type compatibility issues with Prisma Decimal types, build failures
- **Current state**: Working tree has recent commits fixing Decimal type compatibility
- **Priority**: Deployment readiness - must pass Vercel build without errors

Examine the following to understand the project:
@package.json
@tsconfig.json
@prisma/schema.prisma
@next.config.js
@.env.example
</context>

<audit_strategy>
This audit must be **systematic, thorough, and comprehensive**. Do not rush. Deeply consider each layer of the application. Use parallel tool calls for maximum efficiency when gathering independent diagnostic information.

## Phase 1: Critical Build Resolution (PRIORITY)

1. **Diagnose the build failure**:
   - Run `npm run db:generate` (prisma generate) and capture full output
   - Run `npm run build` (next build) and capture full output
   - Identify the exact error causing build failure
   - Check for any Prisma schema issues, missing environment variables, or type generation problems

2. **Fix the root cause**:
   - Address the specific error blocking the build
   - Verify Prisma client generation completes successfully
   - Ensure all Prisma types are properly imported and used
   - Test the fix by running the full build command again

## Phase 2: Comprehensive TypeScript Analysis

1. **Full type check** (run in parallel with other diagnostics):
   - Execute `npm run type-check` and capture ALL TypeScript errors
   - Categorize errors by severity: critical (build-breaking) vs warnings
   - Identify patterns: Are there systemic issues or isolated problems?

2. **Prisma type compatibility deep dive**:
   - Search for ALL uses of Prisma Decimal type across codebase
   - Verify mock data in lib/dev-mode.ts uses Decimal consistently
   - Check all components accepting Decimal values have proper types
   - Scan for Number() conversions that might cause precision loss
   - Look for any remaining number | Decimal type mismatches

3. **Import and dependency validation**:
   - Verify all imports resolve correctly
   - Check for circular dependencies
   - Ensure all @prisma/client imports use correct paths
   - Validate React 19 and Next.js 16 compatibility

## Phase 3: Security Audit

1. **Secret detection**:
   - Scan all files for exposed API keys, tokens, passwords
   - Check .env files are properly gitignored
   - Verify sensitive data is not hardcoded in source files
   - Look for console.log statements that might leak sensitive info

2. **Vulnerability scan**:
   - Run `npm audit` and capture results
   - Identify critical and high-severity vulnerabilities
   - Check for outdated packages with known security issues
   - Verify authentication and authorization patterns are secure

3. **Input validation**:
   - Check API routes for proper input sanitization
   - Verify SQL injection prevention (Prisma parameterization)
   - Look for XSS vulnerabilities in user-facing components
   - Ensure file upload handling is secure (if applicable)

## Phase 4: Performance Audit

1. **Bundle analysis**:
   - Check for large dependencies that could be code-split
   - Identify any unnecessary imports or unused code
   - Verify dynamic imports are used for heavy components
   - Look for opportunities to reduce bundle size

2. **Database queries**:
   - Review Prisma queries for N+1 problems
   - Check for missing indexes on frequently queried fields
   - Verify pagination is implemented for large datasets
   - Look for inefficient data fetching patterns

3. **Memory and resource usage**:
   - Check for potential memory leaks (event listeners, timers)
   - Verify proper cleanup in useEffect hooks
   - Look for unnecessary re-renders in React components
   - Check for heavy computations that should be memoized

## Phase 5: Dependency Audit

1. **Package health check**:
   - Run `npm outdated` to identify outdated packages
   - Check for deprecated packages that need replacement
   - Verify all dependencies are actively maintained
   - Look for duplicate dependencies that could be deduplicated

2. **Unused dependencies**:
   - Scan package.json for packages not actually used in code
   - Check for devDependencies that should be dependencies (or vice versa)
   - Verify peer dependencies are satisfied

## Phase 6: Code Quality and Best Practices

1. **Linting**:
   - Run `npm run lint` and capture all warnings/errors
   - Fix or document any ESLint violations
   - Ensure consistent code style across the codebase

2. **React and Next.js best practices**:
   - Verify proper use of Server Components vs Client Components
   - Check for missing "use client" directives where needed
   - Ensure proper data fetching patterns (no client-side fetches in SSR)
   - Verify proper error boundaries are in place

3. **Error handling**:
   - Check API routes have proper try/catch blocks
   - Verify user-facing errors are meaningful
   - Ensure failed operations don't crash the application
   - Look for unhandled promise rejections

## Phase 7: Production Configuration

1. **Environment variables**:
   - Verify all required env vars are documented in .env.example
   - Check for env vars used in code but not documented
   - Ensure proper validation of environment configuration
   - Verify production vs development environment handling

2. **Build configuration**:
   - Review next.config.js for production optimizations
   - Verify proper image optimization settings
   - Check for any development-only code that should be excluded
   - Ensure proper caching strategies are configured

## Phase 8: Testing and Validation

1. **Critical path verification**:
   - Identify core user flows (authentication, data display, form submission)
   - Verify these paths work in both DEV_MODE and production mode
   - Check for any console errors during normal operation
   - Test error scenarios return appropriate responses

2. **Build verification**:
   - Run full build: `npm run db:generate && npm run build`
   - Verify build completes with 0 errors
   - Check build output for any warnings
   - Confirm all routes are properly generated
</audit_strategy>

<execution_requirements>

**For maximum efficiency**: Whenever you need to perform multiple independent operations (running different commands, reading different file groups, checking different aspects), invoke all relevant tools simultaneously in a single message rather than sequentially. This dramatically reduces execution time.

**After receiving tool results**: Carefully reflect on their quality and completeness. If a tool result shows errors or issues, determine the root cause before proceeding to fixes.

**Be systematic**: Complete each phase thoroughly before moving to the next. Document findings as you go.

**Prioritize ruthlessly**: Critical issues (deployment blockers) must be fixed first. Lower-priority issues should be documented for future work.

**Test your fixes**: After fixing any issue, verify the fix actually works by re-running relevant checks.
</execution_requirements>

<output_requirements>

1. **Create comprehensive audit report**: `./audit-reports/deployment-audit-$(date +%Y%m%d).md`

   Structure:
   ```markdown
   # Production Deployment Audit Report
   Date: [timestamp]

   ## Executive Summary
   - Build status: [PASS/FAIL]
   - Critical issues found: [number]
   - Critical issues fixed: [number]
   - Warnings: [number]
   - Production readiness: [READY/BLOCKED]

   ## Phase 1: Build Resolution
   [findings and fixes]

   ## Phase 2: TypeScript Analysis
   [findings and fixes]

   ## Phase 3: Security Audit
   [findings and fixes]

   ## Phase 4: Performance Audit
   [findings and fixes]

   ## Phase 5: Dependency Audit
   [findings and fixes]

   ## Phase 6: Code Quality
   [findings and fixes]

   ## Phase 7: Production Configuration
   [findings and fixes]

   ## Phase 8: Testing and Validation
   [findings and fixes]

   ## Remaining Issues
   [issues not fixed, with justification]

   ## Deployment Checklist
   - [ ] Build passes without errors
   - [ ] No critical type errors
   - [ ] No high-severity security vulnerabilities
   - [ ] No build warnings
   - [ ] Environment variables documented
   - [ ] Performance acceptable
   - [ ] Critical paths verified

   ## Next Steps
   [recommended actions]
   ```

2. **Fix all critical issues**: Modify files as needed to resolve deployment blockers

3. **Create issue log for non-critical items**: `./audit-reports/deferred-issues.md`
   - Document issues that don't block deployment but should be addressed
   - Include severity, location, and recommended fix for each

4. **Commit changes**: After fixes are complete and verified, create a comprehensive commit
</output_requirements>

<constraints>

**DO NOT**:
- Make changes that break existing functionality to fix warnings
- Skip phases - all phases must be thoroughly completed
- Assume previous fixes are correct - verify everything
- Make cosmetic changes that don't improve deployment readiness
- Add new features or functionality - only fix issues
- Rush through the audit - thoroughness is critical

**DO**:
- Fix critical deployment blockers immediately
- Document all findings, even minor ones
- Verify each fix with appropriate tests
- Use parallel tool execution for efficiency
- Provide clear explanations for any issues left unfixed
- Test the final build passes before completing
</constraints>

<success_criteria>

**Critical (Must achieve)**:
- [ ] `npm run db:generate && npm run build` completes with exit code 0
- [ ] Zero TypeScript errors that would block production build
- [ ] No critical or high-severity security vulnerabilities
- [ ] All environment variables properly documented
- [ ] Build output shows no errors

**Important (Should achieve)**:
- [ ] All TypeScript warnings resolved or documented
- [ ] No ESLint errors
- [ ] No outdated dependencies with security issues
- [ ] Performance audit shows no critical bottlenecks
- [ ] All mock data uses proper Prisma types

**Nice-to-have**:
- [ ] All ESLint warnings resolved
- [ ] Bundle size optimized
- [ ] All dependencies up-to-date
- [ ] Code quality improvements implemented
</success_criteria>

<final_verification>

Before declaring the audit complete, you MUST:

1. Run the full build command: `npm run db:generate && npm run build`
2. Verify it completes successfully with exit code 0
3. Run `npm run type-check` and confirm zero errors
4. Review the audit report for completeness
5. Confirm all critical issues are resolved
6. Document any remaining issues with clear justification

If the build still fails, the audit is NOT complete. Investigate further until the build passes.
</final_verification>

<meta_note>
This is an overnight session. Take your time. Be thorough. The goal is pristine, production-ready code that deploys successfully. Quality and completeness are more important than speed.
</meta_note>
