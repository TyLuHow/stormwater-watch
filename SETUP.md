# Stormwater Watch - Setup Guide

This guide will help you set up the Stormwater Watch platform for local development or production deployment.

## Prerequisites

- Node.js 18+ and npm
- Git
- PostgreSQL database (we use Supabase)
- Required API keys (see below)

## Quick Start

The fastest way to get started:

```bash
# Run the automated setup script
./scripts/quick-start.sh
```

This script will:
1. Check for `.env` file (create from template if missing)
2. Install npm dependencies
3. Create database tables
4. Initialize Supabase storage buckets
5. Seed test data
6. Validate your setup

## Manual Setup

If you prefer to set up manually or need to troubleshoot:

### 1. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your API keys and configuration:

#### Required Services

**Database (Supabase)**
- Sign up at https://supabase.com
- Create a new project
- Get your database URL and keys from Settings > Database & API
```env
DATABASE_URL="postgresql://..."
SUPABASE_URL="https://[PROJECT_ID].supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

**Queue (Upstash Redis)**
- Sign up at https://upstash.com
- Create a new Redis database
- Copy the REST API credentials
```env
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

**Email (Resend)**
- Sign up at https://resend.com
- Get your API key from the dashboard
```env
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="Stormwater Watch <alerts@yourdomain.org>"
```

**Maps (Mapbox)**
- Sign up at https://mapbox.com
- Create a new access token
```env
NEXT_PUBLIC_MAPBOX_TOKEN="pk...."
MAPBOX_TOKEN="sk...."  # Secret token for server-side
```

**Authentication**
- Generate a secret key for NextAuth:
```bash
openssl rand -base64 32
```
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[generated secret]"
```

**Cron Jobs**
- Generate a secret for cron job authentication:
```bash
openssl rand -hex 16
```
```env
CRON_SECRET="[generated secret]"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

Create database tables:

```bash
npm run db:push
```

Initialize Supabase storage buckets:

```bash
npm run setup:supabase
```

Seed test data:

```bash
npm run db:seed
```

### 4. Validate Setup

Run the validation script to ensure everything is configured correctly:

```bash
npm run setup:validate
```

This will test connections to:
- PostgreSQL database
- Upstash Redis
- Supabase storage
- And verify all required environment variables

### 5. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking

### Database
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed database with test data
- `npm run db:reset` - Reset database (DESTRUCTIVE!)
- `npm run db:studio` - Open Prisma Studio
- `npm run db:generate` - Generate Prisma Client

### Setup & Validation
- `npm run setup:env` - Copy .env.example to .env
- `npm run setup:validate` - Validate environment setup
- `npm run setup:supabase` - Initialize Supabase storage
- `npm run setup:all` - Run full setup (env, db, supabase, seed)

### Geodata
- `npm run geodata:load` - Load geographic boundary data
- `npm run enrich` - Enrich facilities with spatial data

### Testing
- `npm run test:health` - Test health endpoint
- `npm run test:build` - Run type-check, lint, and build

## Test Data

After seeding, you'll have:

- **3 Users** (1 ADMIN, 2 PARTNER)
  - admin@stormwaterwatch.org
  - partner1@example.org
  - partner2@example.org

- **10 Facilities** across 3 California counties:
  - Alameda County (5)
  - Santa Clara County (3)
  - Contra Costa County (2)

- **~100 Samples** with violations over 90 days

- **3 Subscriptions** (POLYGON, BUFFER, JURISDICTION modes)

Access test data in Prisma Studio:
```bash
npm run db:studio
```

## Production Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Configure environment variables in Vercel dashboard:
   - Go to your project settings
   - Add all variables from `.env.production`
   - Generate NEW secrets for `NEXTAUTH_SECRET` and `CRON_SECRET`

3. Deploy:
```bash
vercel --prod
```

### Environment Variables in Vercel

The `vercel.json` file is already configured with environment variable mappings. In Vercel dashboard, create these secrets:

- `@database_url`
- `@supabase_url`
- `@supabase_anon_key`
- `@supabase_service_role_key`
- `@upstash_redis_rest_url`
- `@upstash_redis_rest_token`
- `@resend_api_key`
- `@mapbox_token`
- `@next_public_mapbox_token`
- `@nextauth_secret` (generate new for production!)
- `@nextauth_url` (your production URL)
- `@cron_secret` (generate new for production!)
- `@nws_user_agent`
- `@resend_from_email`

### Cron Jobs

Vercel cron jobs are configured in `vercel.json`:
- Daily job: `/api/cron/daily` at 2:15 AM UTC
- Weekly job: `/api/cron/weekly` at 2:30 AM UTC on Mondays

Protect these endpoints with the `CRON_SECRET` header.

## Monitoring

### Slack Notifications

Configure Slack webhook for alerts:

1. Create a Slack app and incoming webhook
2. Add webhook URL to `.env`:
```env
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
SLACK_CHANNEL="#stormwater-alerts"
```

## Troubleshooting

### Database Connection Failed

- Verify `DATABASE_URL` is correct
- Check if Supabase project is active
- Ensure IP is allowlisted in Supabase (Settings > Database)
- Try direct connection URL instead of pooler

### Supabase Storage Issues

- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check if buckets exist in Supabase dashboard
- Re-run `npm run setup:supabase`

### Redis Connection Failed

- Verify Upstash credentials
- Check if Redis instance is active
- Try recreating the Redis database

### Build Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma Client
npm run db:generate

# Type check
npm run type-check
```

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Upstash Documentation](https://docs.upstash.com)
- [Resend Documentation](https://resend.com/docs)
- [Mapbox Documentation](https://docs.mapbox.com)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs in Vercel dashboard (production)
3. Check Prisma Studio for database state
4. Review API responses in browser DevTools

## Security Notes

- Never commit `.env` files to git
- Rotate secrets regularly in production
- Use different secrets for dev/staging/production
- Keep `SUPABASE_SERVICE_ROLE_KEY` secure (full database access)
- Protect cron endpoints with `CRON_SECRET`
- Review RLS policies in Supabase regularly
