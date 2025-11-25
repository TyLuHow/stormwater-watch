# Authentication Pages - Temporarily Removed

The signin and verify pages have been temporarily removed to allow Vercel builds to succeed.

## Reason for Removal

These pages import `next-auth/react` which requires `NEXTAUTH_URL` to be set. Since authentication is not yet configured for production, the pages caused build failures with:

```
Error occurred prerendering page "/auth/signin"
TypeError: Invalid URL
code: 'ERR_INVALID_URL',
input: '',
```

The error occurs because `signIn` from `next-auth/react` attempts to construct URLs during module evaluation, before runtime environment variables are available.

## When to Restore

Restore these pages when:
- `NEXTAUTH_URL` is set in Vercel environment variables
- Email provider (Resend) is configured with valid API key
- Authentication is ready for production use

To restore, retrieve files from git history (commit 8577bf3):
```bash
git show 8577bf3:app/auth/signin/page.tsx > app/auth/signin/page.tsx
git show 8577bf3:app/auth/verify/page.tsx > app/auth/verify/page.tsx
```

## Files Removed

- `app/auth/signin/page.tsx` - Magic link sign-in form
- `app/auth/verify/page.tsx` - Email verification confirmation page

## Preserved Infrastructure

The authentication infrastructure remains in place and works in DEV_MODE:
- `auth.config.ts` - NextAuth configuration with email provider
- `app/api/auth/[...nextauth]/route.ts` - API handler with DEV_MODE fallback
- All authentication logic is intact and ready to use

## User Requirement

User explicitly stated: "I don't need a sign in page yet"

This removal aligns with current requirements while preserving the ability to quickly restore authentication when needed.
