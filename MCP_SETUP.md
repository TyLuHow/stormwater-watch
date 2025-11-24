# MCP & Supabase CLI Setup Guide

This guide covers setting up Model Context Protocol (MCP) servers and Supabase CLI for the Stormwater Watch project.

## MCP Configuration

### What is MCP?

Model Context Protocol (MCP) allows Claude to interact directly with external services, databases, and tools. For Stormwater Watch, we've configured:

1. **Supabase MCP** - Direct database and storage access
2. **Postgres MCP** - SQL database queries
3. **Filesystem MCP** - File system operations in the project
4. **GitHub MCP** - Repository operations

### Current MCP Setup

Your `claude_desktop_config.json` has been configured with:

#### 1. Filesystem Access (Project Directory)
```json
"filesystem": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "C:\\Users\\Tyler Luby Howard\\Downloads\\code"
  ]
}
```
- Allows Claude to read/write files in the Stormwater Watch project
- Scoped to project directory for security

#### 2. Supabase MCP (Stormwater Watch)
```json
"supabase-stormwater": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-supabase",
    "https://dhoyfkakvxjxzozlyksq.supabase.co",
    "eyJhbGci..."
  ]
}
```
- Direct access to Supabase project
- Can manage storage buckets, auth, and database
- Uses service role key (full admin access)

#### 3. Postgres MCP (Database Queries)
```json
"server-postgres": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-postgres",
    "postgresql://postgres.dhoyfkakvxjxzozlyksq:...@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  ]
}
```
- Execute SQL queries directly
- Connection pooling enabled
- Same database as Stormwater Watch

#### 4. GitHub MCP
```json
"server-github": {
  "command": "npx",
  "args": ["@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..."
  }
}
```
- Repository operations
- Issue/PR management
- Code reviews

### Using MCP in Claude

Once configured, Claude can:

**Query database directly:**
```sql
-- Claude can execute this via Postgres MCP
SELECT COUNT(*) FROM facility WHERE county = 'Alameda';
```

**Manage Supabase storage:**
```
List buckets, upload files, manage permissions via Supabase MCP
```

**Read/write project files:**
```
Read schema.prisma, modify .env, create new files via Filesystem MCP
```

**GitHub operations:**
```
Create issues, review PRs, manage repos via GitHub MCP
```

### Restart Required

After modifying `claude_desktop_config.json`, you **MUST restart Claude Desktop** for changes to take effect:

1. Close Claude Desktop completely
2. Reopen Claude Desktop
3. MCPs will load automatically

### Verifying MCP Connection

In Claude Desktop, you can verify MCPs are loaded by asking:
- "What MCP servers are available?"
- "Can you query the facility table?"
- "List the files in the project directory"

---

## Supabase CLI Setup

The Supabase CLI allows you to manage your Supabase project from the command line.

### Installation

Run the installation script:

```bash
./scripts/install-supabase-cli.sh
```

This will:
1. Download Supabase CLI v1.137.2 for Linux
2. Install it system-wide
3. Verify the installation

**Manual installation:**
```bash
wget -qO- https://github.com/supabase/cli/releases/download/v1.137.2/supabase_1.137.2_linux_amd64.deb -O /tmp/supabase.deb
sudo dpkg -i /tmp/supabase.deb
rm /tmp/supabase.deb
supabase --version
```

### Connect to Project

Run the login script:

```bash
./scripts/supabase-login.sh
```

This will link your local environment to the Stormwater Watch Supabase project.

**Manual connection:**
```bash
# Option 1: Link with project credentials
supabase link --project-ref dhoyfkakvxjxzozlyksq --password "[Italy]March180"

# Option 2: Login with browser (requires access token)
supabase login
```

### Common Supabase CLI Commands

#### Database Operations

```bash
# Pull schema from remote database
supabase db pull

# See local vs remote schema differences
supabase db diff

# Push local migrations to remote
supabase db push

# Create a new migration
supabase migration new add_new_table

# Reset local database
supabase db reset

# Open Supabase Studio locally
supabase start
```

#### Storage Operations

```bash
# List storage buckets
supabase storage ls

# Create a new bucket
supabase storage create my-bucket

# Delete a bucket
supabase storage delete my-bucket
```

#### Functions Operations

```bash
# List edge functions
supabase functions list

# Create a new edge function
supabase functions new my-function

# Deploy an edge function
supabase functions deploy my-function

# View function logs
supabase functions logs my-function
```

#### Project Status

```bash
# Check project status
supabase status

# View project settings
supabase projects list

# Get project API URL and keys
supabase projects api-keys
```

### Supabase Configuration

The project's Supabase configuration is in `supabase/config.toml`:

- **Project ID**: dhoyfkakvxjxzozlyksq
- **API URL**: https://dhoyfkakvxjxzozlyksq.supabase.co
- **Database Port**: 54322 (local)
- **API Port**: 54321 (local)
- **Studio Port**: 54323 (local)

### Local Development with Supabase

Start a local Supabase instance:

```bash
# Start all services (Docker required)
supabase start

# Stop all services
supabase stop

# View local dashboard
open http://localhost:54323
```

**Note:** Local Supabase requires Docker. For development without Docker, connect directly to the remote Supabase instance.

### Syncing Schema

To keep Prisma schema in sync with Supabase:

```bash
# 1. Pull current schema from Supabase
supabase db pull

# 2. Generate Prisma schema from database
npm run db:generate

# 3. Make changes to Prisma schema
# Edit prisma/schema.prisma

# 4. Push changes to Supabase
npm run db:push
```

### Migration Workflow

For production deployments:

```bash
# 1. Create a migration from schema changes
supabase migration new my_changes

# 2. Edit the migration SQL file
# File created in supabase/migrations/

# 3. Test migration locally
supabase db reset

# 4. Apply to remote
supabase db push
```

### Troubleshooting

**CLI not found after installation:**
```bash
# Reload shell
source ~/.bashrc  # or ~/.zshrc

# Verify PATH
which supabase
```

**Connection issues:**
```bash
# Re-link project
supabase link --project-ref dhoyfkakvxjxzozlyksq --password "[Italy]March180"

# Check connection
supabase status
```

**Permission errors:**
```bash
# Ensure service role key is set
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."

# Or use --service-role flag
supabase db push --service-role
```

## MCP vs Supabase CLI

**Use MCP when:**
- Working in Claude Desktop
- Need Claude to access database/storage
- Want AI-assisted queries and operations
- Interactive development in chat

**Use Supabase CLI when:**
- Running terminal commands
- Creating migrations
- Deploying functions
- CI/CD pipelines
- Local development setup

Both tools complement each other for a complete development workflow.

## Security Notes

### MCP Security

- Service role key in MCP config has **full admin access**
- MCP configs are local to your machine
- Never commit `claude_desktop_config.json` to git
- Restart Claude Desktop to reload MCP configs

### Supabase CLI Security

- Store credentials in environment variables
- Use `.env` files for local development
- Never commit database passwords
- Rotate service role keys regularly

## Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Supabase MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/supabase)
- [Postgres MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/postgres)
