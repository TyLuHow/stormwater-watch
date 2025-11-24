# Environment Setup Status & Next Steps

This document provides a checklist for setting up environment variables and getting the Stormwater Watch platform running.

## Current Status

Before proceeding, verify:
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm/pnpm installed (`npm --version`)
- [ ] Git repository cloned
- [ ] All dependencies installed (`npm install`)
- [ ] PostgreSQL/Supabase knowledge available

## Setup Checklist

### Phase 1: Account Creation (30 minutes)

Create accounts with the following services if you don't have them:

#### 1. Supabase (Database & Authentication)
- [ ] Go to [Supabase](https://app.supabase.com)
- [ ] Sign up with GitHub or email
- [ ] Create a new project
  - [ ] Organization: Create one or select existing
  - [ ] Project name: Enter a project name
  - [ ] Database password: Create a strong password
  - [ ] Region: Select closest to your users
- [ ] Note project ID from project URL
- **Time estimate**: 5 minutes
- **Status**: ___________

#### 2. Resend (Email Service)
- [ ] Go to [Resend](https://resend.com)
- [ ] Sign up with email and verify
- [ ] Verify a domain for sending emails
  - [ ] Add domain: Click "Add Domain"
  - [ ] Verify DNS records: Follow Resend instructions
  - [ ] Create sending address (e.g., alerts@yourdomain.org)
- [ ] Generate API key
  - [ ] Navigate to API Keys
  - [ ] Click "Create API Key"
  - [ ] Copy and save the key
- **Time estimate**: 10-15 minutes (DNS propagation may take time)
- **Status**: ___________

#### 3. Mapbox (Mapping Service)
- [ ] Go to [Mapbox Account](https://account.mapbox.com)
- [ ] Sign up or log in
- [ ] Navigate to "Tokens"
- [ ] Create a new token
  - [ ] Token name: "Stormwater Watch Public"
  - [ ] Scopes: styles:read, fonts:read, datasets:read
  - [ ] Default token: Yes
  - [ ] Copy token (starts with pk.)
- [ ] Optionally create a private token for server operations
- **Time estimate**: 3 minutes
- **Status**: ___________

#### 4. Upstash (Redis Queue & Caching)
- [ ] Go to [Upstash Console](https://console.upstash.com)
- [ ] Sign up or log in
- [ ] Create a new Redis database
  - [ ] Database name: "stormwater-watch"
  - [ ] Region: Select closest to deployment
  - [ ] TLS: Enable
  - [ ] Eviction: LRU
- [ ] Navigate to "REST API" tab
- [ ] Copy:
  - [ ] REST URL (endpoint)
  - [ ] REST Token
- **Time estimate**: 5 minutes
- **Status**: ___________

#### 5. Slack (Optional - Monitoring)
- [ ] Go to [Slack API](https://api.slack.com/apps)
- [ ] If not already in Slack workspace, create one
- [ ] Create New App from scratch
- [ ] Enable Incoming Webhooks
- [ ] Add New Webhook to Workspace
  - [ ] Select channel: #general or create #stormwater-alerts
  - [ ] Authorize
- [ ] Copy webhook URL
- **Time estimate**: 5 minutes (optional)
- **Status**: ___________

### Phase 2: Environment Configuration (15 minutes)

#### 1. Create .env.local File
```bash
cp .env.example .env.local
```
- [ ] File created successfully
- **Status**: ___________

#### 2. Generate Required Secrets
Generate secure values for required fields:

```bash
# NextAuth Secret (copy the output)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# CRON_SECRET (copy the output)
openssl rand -hex 16
```

- [ ] NEXTAUTH_SECRET generated and saved
- [ ] CRON_SECRET generated and saved
- **Status**: ___________

#### 3. Fill Database Variables

From Supabase:
- [ ] `SUPABASE_URL` - From Settings > API > Project URL
- [ ] `SUPABASE_ANON_KEY` - From Settings > API > anon public
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - From Settings > API > service_role secret
- [ ] `DATABASE_URL` - From Settings > Database > Connection String (Postgres pooler)

```bash
# Verify Supabase connection
npm run validate:setup
```

- [ ] All database variables filled
- [ ] Database connection verified
- **Status**: ___________

#### 4. Fill Authentication Variables

From configuration:
- [ ] `NEXTAUTH_URL` - Set to http://localhost:3000 for development
- [ ] `NEXTAUTH_SECRET` - Use generated value from step 2
- **Status**: ___________

#### 5. Fill Email Variables

From Resend:
- [ ] `RESEND_API_KEY` - From Resend > API Keys
- [ ] `RESEND_FROM_EMAIL` - Set to your verified sender email

```bash
# Example
RESEND_FROM_EMAIL="Stormwater Watch <alerts@yourdomain.org>"
```

- [ ] Email variables configured
- **Status**: ___________

#### 6. Fill Mapping Variables

From Mapbox:
- [ ] `NEXT_PUBLIC_MAPBOX_TOKEN` - Your public token (pk....)
- [ ] `MAPBOX_TOKEN` - Your private token (can be same as public for development)

- [ ] Mapbox tokens configured
- **Status**: ___________

#### 7. Fill Queue Variables

From Upstash:
- [ ] `UPSTASH_REDIS_REST_URL` - From REST API > Endpoint
- [ ] `UPSTASH_REDIS_REST_TOKEN` - From REST API > Token

- [ ] Queue variables configured
- **Status**: ___________

#### 8. Fill Job Variables

Generate or set:
- [ ] `CRON_SECRET` - Use generated value from step 2
- **Status**: ___________

#### 9. Fill External API Variables

Set your contact information:
- [ ] `NWS_USER_AGENT` - Format: "stormwater-watch.org (your-email@domain.org)"
- **Status**: ___________

#### 10. Optional: Slack Variables

If monitoring enabled:
- [ ] `SLACK_WEBHOOK_URL` - From Slack API (leave empty to disable)
- [ ] `SLACK_CHANNEL` - Set to "#stormwater-alerts" or your channel
- **Status**: ___________

#### 11. Optional: AI Variables

For advanced features:
- [ ] `INTERNVL_ENABLED` - Set to false by default (unless you have access)
- [ ] `INTERNVL_BASE_URL` - Leave empty unless using AI features
- **Status**: ___________

#### 12. Application Variables

Set application-specific values:
- [ ] `NODE_ENV` - Set to "development"
- [ ] `NEXT_PUBLIC_APP_URL` - Set to "http://localhost:3000" for development
- **Status**: ___________

### Phase 3: Database Initialization (10 minutes)

#### 1. Run Database Setup
```bash
npm run init:db
```
This will:
- [ ] Create database tables from schema
- [ ] Run seed data (if any)
- [ ] Create necessary views/functions

**Status**: ___________

#### 2. Verify Database
```bash
npm run validate:setup
```
This will:
- [ ] Check all environment variables
- [ ] Verify database connectivity
- [ ] Verify external service connectivity

**Status**: ___________

### Phase 4: Local Development (5 minutes)

#### 1. Start Development Server
```bash
npm run dev
```

Server should start on http://localhost:3000

- [ ] Server starts without errors
- [ ] No missing variable warnings
- [ ] Port 3000 is accessible

**Status**: ___________

#### 2. Test Basic Functionality

In your browser at http://localhost:3000:
- [ ] Page loads without console errors
- [ ] Maps display correctly (if map feature is present)
- [ ] Can navigate between pages
- [ ] Database connectivity appears normal (check logs)

**Status**: ___________

#### 3. Test Email (if configured)

Run a test:
```bash
npm run test:email
```

- [ ] Test email sent successfully
- [ ] Email received in inbox (check spam folder)
- [ ] Email template renders correctly

**Status**: ___________

#### 4. Test Jobs (if configured)

```bash
npm run test:jobs
```

- [ ] Jobs can be triggered
- [ ] Job logs appear in console
- [ ] Redis connection works

**Status**: ___________

## Environment Variable Verification

Once all variables are set, verify they're correct:

```bash
# Check all variables are loaded
npm run validate:setup

# Check specific service connections
npm run health:check
```

**All checks passing**: [ ]

## Common Setup Issues & Solutions

### Issue: "Cannot find module"
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Database connection timeout
**Solution**:
- Verify DATABASE_URL is correct (check password encoding)
- Ensure IP is whitelisted in Supabase (or use 0.0.0.0 for all)
- Check network connectivity to Supabase servers

### Issue: Email service error
**Solution**:
- Verify RESEND_API_KEY is correct
- Check that RESEND_FROM_EMAIL domain is verified in Resend
- Verify email format is correct: "Name <email@domain>"

### Issue: Maps not loading
**Solution**:
- Check NEXT_PUBLIC_MAPBOX_TOKEN is set
- Verify token hasn't exceeded rate limits
- Ensure token scopes include styles:read
- Check browser console for detailed errors

### Issue: Authentication loops
**Solution**:
- Verify NEXTAUTH_URL matches deployment URL exactly
- Check NEXTAUTH_SECRET is the same across deploys
- Clear browser cookies
- Check localhost is not blocked by firewall

### Issue: Cron jobs not triggering
**Solution**:
- Verify CRON_SECRET is sent in request headers
- Check Upstash Redis connection with UPSTASH_REDIS_REST_TOKEN
- Check cron job service has access to your endpoint
- Monitor job execution logs

## Post-Setup Checklist

After completing all phases:

- [ ] All environment variables configured
- [ ] Database initialized with tables
- [ ] Development server running
- [ ] Maps displaying correctly
- [ ] Email service working (optional test)
- [ ] Slack integration working (if enabled)
- [ ] Database backups configured (production)
- [ ] Monitoring configured (production)
- [ ] Security scans run (`npm audit`)

## Next Steps

### For Development
1. Start the development server: `npm run dev`
2. Open http://localhost:3000
3. Begin development work
4. Refer to README.md for architecture overview

### For Staging/Production
1. Create new accounts and projects in each service
2. Generate new API keys for production
3. Set up environment variables in CI/CD pipeline
4. Configure automated deployments
5. Set up monitoring and alerts
6. Enable database backups and replication
7. Test disaster recovery procedures

### Documentation
- [ ] Read DEPLOYMENT.md for deployment instructions
- [ ] Read ENV_VARIABLES.md for complete variable reference
- [ ] Review API documentation at `/api/docs`
- [ ] Check README.md for development guidelines

## Getting Help

If you encounter issues:

1. **Check logs**: Review console output for specific errors
2. **Verify configuration**: Run `npm run validate:setup`
3. **Check documentation**:
   - ENV_VARIABLES.md - Complete variable reference
   - DEPLOYMENT.md - Deployment guide
   - .env.example - Configuration template
4. **Check service status**:
   - [Supabase Status](https://status.supabase.com)
   - [Resend Status](https://status.resend.com)
   - [Mapbox Status](https://status.mapbox.com)
   - [Upstash Status](https://status.upstash.com)

## Timeline

Estimated total setup time: **1.5-2 hours**

- Phase 1 (Accounts): 30 minutes
- Phase 2 (Configuration): 15 minutes
- Phase 3 (Database): 10 minutes
- Phase 4 (Testing): 5-10 minutes
- Troubleshooting buffer: 20 minutes

---

**Last Updated**: 2025-11-23
**Version**: 1.0
**Status**: [In Progress] → [Complete]
