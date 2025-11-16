# Stormwater Watch

A nonprofit platform for monitoring California stormwater permit violations using public CIWQS/SMARTS data.

## Mission

Empower environmental organizations to identify, track, and act on stormwater violations affecting California watersheds and communities.

## Features

- Automated ingestion of public violation data
- Spatial enrichment with watershed and community context  
- Configurable alerts for environmental organizations
- Attorney-ready case packet generation
- Focus on repeat offenders and impaired waters

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Supabase)
- **Queue**: Upstash Redis
- **Email**: Resend
- **Maps**: Mapbox
- **Language**: TypeScript

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and configure
3. Install dependencies: `npm install`
4. Run migrations: `npx prisma migrate dev`
5. Start development: `npm run dev`

## Data Sources

All data comes from public sources:
- CIWQS/SMARTS Interactive Violation Reports
- USGS HUC12 Watersheds
- CalEnviroScreen 4.0
- EPA 303(d) Impaired Waters

## License

MIT License - See LICENSE file

## Contributing

See CONTRIBUTING.md for guidelines.

## Contact

For questions or support, please open an issue on GitHub.