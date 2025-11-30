<objective>
Fix the runtime 404 errors on the deployed Vercel site. The build succeeded but the site returns 404 when accessed.

Two issues need to be resolved:
1. @react-email/render@2.0.0 requires Node 22+ but we're pinned to Node 20.x
2. NextAuth is likely redirecting to a /signin page that doesn't exist
</objective>

<context>
The Vercel build completed successfully with this route table:
- / (Static)
- /dashboard (Dynamic)
- /api/auth/[...nextauth] (Dynamic)
- No /signin route exists

Error from browser:
- `signin:1 Failed to load resource: the server responded with a status of 404 ()`

Warning from build:
- `@react-email/render@2.0.0` requires Node >=22.0.0, current is v20.19.4

@package.json
@auth.config.ts
@auth.ts
@app/page.tsx
@middleware.ts (if exists)
</context>

<research>
Before fixing, investigate:

1. **Home page behavior**: What does `/` (app/page.tsx) do? Does it redirect?
2. **Middleware**: Is there middleware.ts that's blocking/redirecting requests?
3. **NextAuth config**: What pages are configured in auth.config.ts or auth.ts?
4. **Auth protection**: Which routes require authentication?
</research>

<fixes_required>

<fix id="1" priority="critical">
<title>Fix @react-email/render Version</title>
<problem>
@react-email/render@2.0.0 requires Node 22+ but the project is pinned to Node 20.x for stability.
</problem>
<solution>
Pin @react-email/render to a version compatible with Node 20:
```json
"@react-email/render": "^1.0.0"
```
Version 1.x works with Node 18+.
</solution>
</fix>

<fix id="2" priority="critical">
<title>Fix NextAuth Pages Configuration</title>
<problem>
NextAuth is trying to redirect to /signin but no such page exists in the app.
</problem>
<solution>
Options (choose based on app requirements):

**Option A - Disable auth redirects** (if app should be public):
In auth.config.ts, ensure pages don't redirect:
```typescript
pages: {
  signIn: '/api/auth/signin', // Use built-in NextAuth pages
}
```

**Option B - Create signin page** (if app needs auth):
Create `app/signin/page.tsx` with a sign-in form

**Option C - Remove auth requirement** (if app is public-first):
Remove or adjust middleware that enforces authentication
</solution>
</fix>

<fix id="3" priority="high">
<title>Review Middleware Configuration</title>
<problem>
Middleware may be blocking all routes and redirecting to non-existent auth pages.
</problem>
<solution>
Check if middleware.ts exists and review its matcher config.
Ensure public routes (/, /dashboard, /api/health) are accessible.
</solution>
</fix>

</fixes_required>

<implementation_steps>
1. Read auth.config.ts and auth.ts to understand current auth setup
2. Check if middleware.ts exists and what it does
3. Read app/page.tsx to see home page behavior
4. Pin @react-email/render to ^1.0.0 in package.json
5. Fix NextAuth pages configuration OR create missing pages OR adjust middleware
6. Run `npm install` to update lockfile
7. Test locally if possible, or verify changes look correct
</implementation_steps>

<verification>
After fixes:
1. `npm install` completes without Node version warnings
2. Auth configuration points to valid pages
3. Middleware (if exists) allows public access to main routes
4. No references to non-existent /signin page
</verification>

<success_criteria>
- @react-email/render pinned to Node 20-compatible version
- NextAuth configured with valid page routes
- No middleware blocking public routes
- Ready for redeployment
</success_criteria>
