# Environment Variables Reference

Complete reference for all environment variables used in the Stormwater Watch platform.

## Quick Reference Table

| Variable | Required | Category | Purpose | Security |
|----------|----------|----------|---------|----------|
| `DATABASE_URL` | Yes | Database | PostgreSQL connection string | Critical |
| `SUPABASE_URL` | Yes | Database | Supabase project URL | Low |
| `SUPABASE_ANON_KEY` | Yes | Database | Public anonymous key | Medium |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Database | Private service role key | Critical |
| `NEXTAUTH_URL` | Yes | Auth | NextAuth application URL | Medium |
| `NEXTAUTH_SECRET` | Yes | Auth | Session encryption key | Critical |
| `RESEND_API_KEY` | Yes | Email | Email service API key | Critical |
| `RESEND_FROM_EMAIL` | Yes | Email | Sender email address | Low |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Yes | Maps | Public Mapbox token | Medium |
| `MAPBOX_TOKEN` | Yes | Maps | Private Mapbox token | Critical |
| `UPSTASH_REDIS_REST_URL` | Yes | Queue | Redis queue URL | Low |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Queue | Redis authentication token | Critical |
| `CRON_SECRET` | Yes | Jobs | Cron job authentication | Critical |
| `NWS_USER_AGENT` | Yes | API | National Weather Service User-Agent | Low |
| `SLACK_WEBHOOK_URL` | No | Monitoring | Slack notification webhook | Critical |
| `SLACK_CHANNEL` | No | Monitoring | Slack channel for alerts | Low |
| `INTERNVL_ENABLED` | No | AI | Enable vision model features | Low |
| `INTERNVL_BASE_URL` | No | AI | Vision model API endpoint | Low |
| `NODE_ENV` | No | App | Execution environment | Low |
| `NEXT_PUBLIC_APP_URL` | No | App | Public application URL | Low |

## Detailed Variable Descriptions

### Database Configuration

#### DATABASE_URL
- **Category**: Database
- **Required**: Yes
- **Description**: PostgreSQL connection string for the Supabase database
- **Format**: `postgresql://username:password@host:port/database?pgbouncer=true`
- **Example**: `postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.co:6543/postgres?pgbouncer=true`
- **How to Obtain**:
  1. Go to [Supabase Dashboard](https://app.supabase.com)
  2. Select your project
  3. Navigate to Settings > Database > Connection String
  4. Select "Postgres" from the dropdown
  5. Copy the connection string (includes pgbouncer for pooling)
  6. Update password if needed (shown when credentials are revealed)
- **Security Level**: Critical - Contains database password
- **Notes**:
  - Use the pooler connection string (port 6543) for better performance
  - The password is shown separately - never commit to version control
  - Required for all database operations

#### SUPABASE_URL
- **Category**: Database
- **Required**: Yes
- **Description**: Base URL for your Supabase project
- **Format**: `https://[PROJECT_ID].supabase.co`
- **Example**: `https://dhoyfkakvxjxzozlyksq.supabase.co`
- **How to Obtain**:
  1. Go to [Supabase Dashboard](https://app.supabase.com)
  2. Select your project
  3. Navigate to Settings > API
  4. Copy "Project URL"
- **Security Level**: Low - Project ID is visible in URL
- **Notes**: Used by client libraries to connect to Supabase services

#### SUPABASE_ANON_KEY
- **Category**: Database
- **Required**: Yes
- **Description**: Public anonymous key for client-side operations with Row Level Security (RLS)
- **Format**: JWT token starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRob3lma2FrdnhqeHpvemx5a3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNDY3NDgsImV4cCI6MjA3ODgyMjc0OH0.D5w11iOmUzkmvJerJhwtWGLtJoOGqdxoKIP2TxNz5fU`
- **How to Obtain**:
  1. Go to [Supabase Dashboard](https://app.supabase.com)
  2. Select your project
  3. Navigate to Settings > API
  4. Copy "anon public" key
- **Security Level**: Medium - Can be exposed to browser
- **Notes**:
  - Safe to expose in browser code
  - Limited by Row Level Security policies
  - Used in NEXT_PUBLIC_ prefixed variables when needed

#### SUPABASE_SERVICE_ROLE_KEY
- **Category**: Database
- **Required**: Yes
- **Description**: Private service role key with full database access (server-only)
- **Format**: JWT token (same format as anon key)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRob3lma2FrdnhqeHpvemx5a3NxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzI0Njc0OCwiZXhwIjoyMDc4ODIyNzQ4fQ.uk2o1Wvo-XZMACbNNsLdM4f_hFqjv4ozzwGK3diomNE`
- **How to Obtain**:
  1. Go to [Supabase Dashboard](https://app.supabase.com)
  2. Select your project
  3. Navigate to Settings > API
  4. Copy "service_role secret" key
- **Security Level**: Critical - Full database access
- **Notes**:
  - Never expose to browser or frontend code
  - Use only in API routes and server-side code
  - Bypasses Row Level Security policies
  - Requires secure storage in production

### Authentication Configuration

#### NEXTAUTH_URL
- **Category**: Authentication
- **Required**: Yes
- **Description**: The canonical URL of the application for NextAuth.js redirects
- **Format**: `http://localhost:3000` (dev) or `https://yourdomain.com` (production)
- **Example**:
  - Development: `http://localhost:3000`
  - Production: `https://stormwater-watch.org`
- **How to Obtain**:
  - Development: Use `http://localhost:3000`
  - Production: Use your deployed domain
- **Security Level**: Medium
- **Notes**:
  - Must match your actual deployment URL exactly
  - Affects OAuth redirects and callback URLs
  - Mismatch causes authentication failures
  - Must include protocol (http/https)

#### NEXTAUTH_SECRET
- **Category**: Authentication
- **Required**: Yes
- **Description**: Secret key for encrypting NextAuth.js sessions and tokens
- **Format**: Random base64 string (minimum 32 characters)
- **Example**: `Kp+Q7J8TN9VfR2M5wX1zHg4uY6vB3nC8`
- **How to Generate**:
  - Using OpenSSL: `openssl rand -base64 32`
  - Using Node.js: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
  - Using online generator: [Generate Random String](https://www.random.org/strings/?num=1&len=32&digits=on&unique=on&format=html&rnd=new)
- **Security Level**: Critical - Session encryption key
- **Notes**:
  - Use a strong, random value
  - Keep consistent across deployments
  - Different values break existing sessions
  - Never share or hardcode in code
  - Regenerate for security incidents

### Email Service Configuration

#### RESEND_API_KEY
- **Category**: Email Service
- **Required**: Yes
- **Description**: API key for Resend email service
- **Format**: `re_` prefix followed by random string
- **Example**: `re_Ww9oDSWi_MLQ8CXs2WgKXckJ8zKZ9Tfgr`
- **How to Obtain**:
  1. Go to [Resend Dashboard](https://resend.com)
  2. Navigate to "API Keys"
  3. Click "Create API Key"
  4. Copy the generated key
- **Security Level**: Critical - Can send emails
- **Notes**:
  - Controls who can send emails on your behalf
  - Keep private - never commit to version control
  - Regenerate if compromised
  - Enable rate limiting in production

#### RESEND_FROM_EMAIL
- **Category**: Email Service
- **Required**: Yes
- **Description**: Sender email address and display name for notifications
- **Format**: `"Display Name <email@domain.com>"`
- **Example**: `"Stormwater Watch <alerts@stormwater-watch.org>"`
- **How to Obtain**:
  1. Verify a domain in [Resend Dashboard](https://resend.com)
  2. Create a sending address (e.g., alerts@yourdomain.org)
  3. Use that address as the from email
- **Security Level**: Low
- **Notes**:
  - Domain must be verified in Resend
  - Display name can be any string
  - Email should be from verified domain
  - Unverified domains cause delivery failures

### Mapping Service Configuration

#### NEXT_PUBLIC_MAPBOX_TOKEN
- **Category**: Mapping Service
- **Required**: Yes
- **Description**: Public Mapbox token for browser-based map rendering
- **Format**: `pk.` prefix followed by encoded data
- **Example**: `pk.eyJ1IjoidHlsdWhvdyIsImEiOiJjbWkxajc1MDIwaXFvMmlxMWhiNzJrcWRvIn0.Q48VCgLkWPoDLoZuCQ31Lw`
- **How to Obtain**:
  1. Go to [Mapbox Account Dashboard](https://account.mapbox.com)
  2. Navigate to "Tokens"
  3. Click "Create token"
  4. Set scopes: `styles:read`, `fonts:read`, `datasets:read`
  5. Copy the token
- **Security Level**: Medium - Restricted to public operations
- **Notes**:
  - Safe to expose in browser code (NEXT_PUBLIC_ prefix)
  - Can be rate limited by Mapbox
  - Use separate tokens for different environments
  - Restrict scopes to minimum needed

#### MAPBOX_TOKEN
- **Category**: Mapping Service
- **Required**: Yes
- **Description**: Private Mapbox token for server-side operations
- **Format**: `pk.` prefix (same as public token or separate)
- **Example**: `pk.eyJ1IjoidHlsdWhvdyIsImEiOiJjbWkxajc1MDIwaXFvMmlxMWhiNzJrcWRvIn0.Q48VCgLkWPoDLoZuCQ31Lw`
- **How to Obtain**: Same process as NEXT_PUBLIC_MAPBOX_TOKEN
- **Security Level**: Critical - Full API access
- **Notes**:
  - Never expose to frontend
  - Use in API routes for tile manipulation
  - Can have higher rate limits than public token
  - Keep in server environment only

### Message Queue & Caching Configuration

#### UPSTASH_REDIS_REST_URL
- **Category**: Message Queue
- **Required**: Yes
- **Description**: REST API endpoint for Upstash Redis database
- **Format**: `https://[database-name].upstash.io`
- **Example**: `https://enabling-cricket-18216.upstash.io`
- **How to Obtain**:
  1. Go to [Upstash Console](https://console.upstash.com)
  2. Navigate to "Redis"
  3. Select your database
  4. Go to "REST API" tab
  5. Copy the "Endpoint" URL
- **Security Level**: Low - URL only, authentication via token
- **Notes**:
  - Works over HTTP/REST (not TCP)
  - Good for serverless environments
  - Combined with token for authentication

#### UPSTASH_REDIS_REST_TOKEN
- **Category**: Message Queue
- **Required**: Yes
- **Description**: Authentication token for Upstash Redis REST API
- **Format**: Random base64 string with AUco prefix
- **Example**: `AUcoAAIncDJlMmY5ZjA2MmEzMzQ0Yjc2OWNjYzY3YTQ0ZTUwOWUzYXAyMTgyMTY`
- **How to Obtain**:
  1. Go to [Upstash Console](https://console.upstash.com)
  2. Navigate to "Redis" > Your database
  3. Go to "REST API" tab
  4. Copy the "Token" value
- **Security Level**: Critical - Database authentication
- **Notes**:
  - Sent with every REST API request
  - Keep private - never commit to version control
  - Regenerate if compromised
  - Can revoke and recreate without data loss

### Scheduled Jobs Configuration

#### CRON_SECRET
- **Category**: Scheduled Jobs
- **Required**: Yes
- **Description**: Secret token for authenticating cron job requests
- **Format**: Random hex or alphanumeric string (minimum 16 characters)
- **Example**: `a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3`
- **How to Generate**:
  - Using OpenSSL: `openssl rand -hex 16`
  - Using Node.js: `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`
- **Security Level**: Critical - Prevents unauthorized cron triggers
- **Notes**:
  - Prevents external systems from triggering jobs
  - Must be verified in cron request headers
  - Different value disables existing cron jobs
  - Keep consistent across deployments
  - Share only with authorized cron services

### External APIs Configuration

#### NWS_USER_AGENT
- **Category**: External APIs
- **Required**: Yes
- **Description**: User-Agent header for National Weather Service API requests
- **Format**: `application-name (contact-email)`
- **Example**: `stormwater-watch.org (tylerhow@gmail.com)`
- **How to Obtain**:
  1. Use your organization name or domain
  2. Include your contact email
- **Security Level**: Low - Public contact information
- **Notes**:
  - NWS requires a descriptive User-Agent
  - Used for weather alerts and flood warnings
  - Email should be valid for contact purposes
  - Include meaningful app name for identification

### Optional: Monitoring & Notifications

#### SLACK_WEBHOOK_URL
- **Category**: Monitoring (Optional)
- **Required**: No - Leave empty to disable
- **Description**: Incoming webhook URL for sending alerts to Slack
- **Format**: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`
- **Example**: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`
- **How to Obtain**:
  1. Go to [Slack App Directory](https://api.slack.com/apps)
  2. Create a New App
  3. Enable "Incoming Webhooks"
  4. Click "Add New Webhook to Workspace"
  5. Select channel and authorize
  6. Copy the webhook URL
- **Security Level**: Critical - Can post to your Slack
- **Notes**:
  - Contains sensitive credentials in URL
  - Regenerate from Slack if exposed
  - Each webhook posts to specific channel
  - Can be easily revoked in Slack settings
  - Leave empty to disable Slack integration

#### SLACK_CHANNEL
- **Category**: Monitoring (Optional)
- **Required**: No
- **Description**: Slack channel or user ID for alert notifications
- **Format**: `#channel-name` or `U1234567890` (user ID)
- **Example**: `#stormwater-alerts`
- **How to Obtain**:
  - Channel name: `#` followed by channel name
  - User ID: Obtain from Slack user profile
- **Security Level**: Low
- **Notes**:
  - If empty, uses default channel from webhook
  - Channel must exist and webhook must have permission
  - Prefix with `#` for channels
  - Optional if webhook has default configured

### Optional: AI Features

#### INTERNVL_ENABLED
- **Category**: AI Features (Optional)
- **Required**: No
- **Description**: Enable advanced computer vision analysis features
- **Format**: `true` or `false`
- **Example**: `false`
- **How to Obtain**:
  - Contact platform administrator
  - Must have InterVL access to enable
- **Security Level**: Low
- **Notes**:
  - If false, vision model features are disabled
  - INTERNVL_BASE_URL is ignored if disabled
  - Requires separate subscription/access
  - Leave disabled by default

#### INTERNVL_BASE_URL
- **Category**: AI Features (Optional)
- **Required**: No - Only needed if INTERNVL_ENABLED=true
- **Description**: Base URL for InterVL computer vision API
- **Format**: `https://api.internvl.com` or custom endpoint
- **Example**: `https://api.internvl.com`
- **How to Obtain**:
  - Provided by InterVL service provider
  - May be self-hosted or cloud-based
- **Security Level**: Low
- **Notes**:
  - Only loaded if INTERNVL_ENABLED=true
  - Can point to custom self-hosted instance
  - Requires authentication in API calls

### Application Settings

#### NODE_ENV
- **Category**: Application Settings (Optional)
- **Required**: No - Defaults to "production"
- **Description**: Node.js execution environment
- **Format**: `development` or `production`
- **Example**: `development`
- **How to Obtain**:
  - Set based on your deployment environment
- **Security Level**: Low
- **Notes**:
  - Affects Next.js optimization and error reporting
  - Development: More verbose logs, no optimization
  - Production: Optimized, minimal logging
  - Automatically set in CI/CD deployments

#### NEXT_PUBLIC_APP_URL
- **Category**: Application Settings (Optional)
- **Required**: No
- **Description**: Public application URL for generating links in emails
- **Format**: `http://localhost:3000` (dev) or `https://yourdomain.com` (production)
- **Example**:
  - Development: `http://localhost:3000`
  - Production: `https://stormwater-watch.org`
- **How to Obtain**:
  - Use your application's accessible URL
  - Should match NEXTAUTH_URL for consistency
- **Security Level**: Low - Public URL
- **Notes**:
  - Used in email links and external references
  - Should be accessible from internet
  - Prefix NEXT_PUBLIC_ means exposed to browser
  - Must match actual deployment URL

## Security Best Practices

### Critical Security Variables
These variables grant sensitive access and must be protected:
- `DATABASE_URL` - Database password
- `SUPABASE_SERVICE_ROLE_KEY` - Full database access
- `NEXTAUTH_SECRET` - Session encryption
- `RESEND_API_KEY` - Email sending
- `MAPBOX_TOKEN` - API access
- `UPSTASH_REDIS_REST_TOKEN` - Redis access
- `CRON_SECRET` - Job authorization
- `SLACK_WEBHOOK_URL` - Slack posting

### Protection Measures
1. **Environment Files**: Never commit .env files to version control
2. **Access Control**: Use different keys for each environment (dev, staging, production)
3. **Rotation**: Rotate keys regularly and immediately if compromised
4. **Storage**: Use secure secret management systems in production (AWS Secrets Manager, Vault, etc.)
5. **Monitoring**: Log and alert on suspicious API usage
6. **Regeneration**: Always regenerate keys after suspected compromise

### Verification Checklist
- [ ] All required variables configured
- [ ] No hardcoded secrets in code
- [ ] .env files not committed to git
- [ ] Different keys for different environments
- [ ] Access logs monitored
- [ ] Team trained on secret management
- [ ] Incident response plan in place

## Troubleshooting

### Common Issues

#### Database Connection Fails
- Verify DATABASE_URL format is correct
- Check password doesn't contain special characters that need escaping
- Ensure IP is whitelisted in Supabase (all IPs for development)
- Verify database credentials are current

#### Authentication Redirects Fail
- Ensure NEXTAUTH_URL matches deployment URL exactly
- Check protocol (http/https) matches
- Verify NEXTAUTH_SECRET is set and consistent
- Clear browser cookies and try again

#### Email Sending Fails
- Verify domain is verified in Resend
- Check email is from verified domain
- Ensure API key has email sending permissions
- Check rate limits aren't exceeded

#### Map Not Loading
- Verify NEXT_PUBLIC_MAPBOX_TOKEN is set
- Check token hasn't exceeded rate limits
- Ensure token has styles:read scope
- Try separate development/production tokens

#### Jobs Not Triggering
- Verify CRON_SECRET is sent in request headers
- Check cron job logs for errors
- Ensure UPSTASH_REDIS_REST_TOKEN is valid
- Verify job is scheduled in cron service

## Setup Timeline

1. **Initial Setup** (1-2 hours)
   - Create accounts with all services
   - Generate API keys
   - Configure environment variables
   - Run database initialization

2. **Verification** (15-30 minutes)
   - Test database connection
   - Verify email sending
   - Test map rendering
   - Confirm cron jobs working

3. **Production Setup** (2-4 hours)
   - Create production accounts/projects
   - Generate production keys
   - Set up CI/CD for key injection
   - Enable monitoring and alerting

## Environment-Specific Examples

### Development
```
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
INTERNVL_ENABLED=false
```

### Staging
```
NEXTAUTH_URL=https://staging.yourdomain.com
NODE_ENV=production
INTERNVL_ENABLED=false
```

### Production
```
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production
INTERNVL_ENABLED=true/false (as needed)
```

## Support & Resources

- [Supabase Environment Variables](https://supabase.com/docs/guides/auth/securing-your-auth)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- [Resend Documentation](https://resend.com/docs)
- [Mapbox API Reference](https://docs.mapbox.com/api/)
- [Upstash Documentation](https://upstash.com/docs)
- [Slack Webhooks](https://api.slack.com/messaging/webhooks)
