#!/usr/bin/env tsx

// Create Facility Records from eSMR Data
// This script creates Facility records from ESMRFacility data to populate the dashboard.
// Usage: npm run db:create-facilities

// Load environment variables from .env file
import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Use DATABASE_URL (pooler connection) - DIRECT_URL may not be accessible from local env
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Map region codes to California counties (approximate mapping)
const regionToCountyMap: Record<string, string> = {
  '1': 'North Coast',      // Region 1 - North Coast
  '2': 'Bay Area',         // Region 2 - San Francisco Bay
  '3': 'Central Coast',    // Region 3 - Central Coast
  '4': 'Los Angeles',      // Region 4 - Los Angeles
  '5F': 'Fresno',          // Region 5F - Central Valley (Fresno)
  '5R': 'Redding',         // Region 5R - Central Valley (Redding)
  '5S': 'Sacramento',      // Region 5S - Central Valley (Sacramento)
  '6T': 'South Lake Tahoe', // Region 6T - Lahontan (South)
  '6V': 'Victorville',     // Region 6V - Lahontan (Victorville)
  '7': 'Colorado River',   // Region 7 - Colorado River
  '8': 'Santa Ana',        // Region 8 - Santa Ana
  '9': 'San Diego',        // Region 9 - San Diego
};

interface FacilityCreateResult {
  created: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}

async function createFacilitiesFromEsmr(): Promise<FacilityCreateResult> {
  const result: FacilityCreateResult = {
    created: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  console.log('='.repeat(70));
  console.log('Create Facilities from eSMR Data');
  console.log('='.repeat(70));
  console.log();

  // Fetch all eSMR facilities with their locations
  console.log('Fetching eSMR facilities...');
  const esmrFacilities = await prisma.eSMRFacility.findMany({
    include: {
      region: true,
      locations: {
        where: {
          OR: [
            { latitude: { not: null } },
            { longitude: { not: null } },
          ],
        },
        orderBy: { locationPlaceId: 'asc' },
        take: 1, // Get first location with coordinates
      },
    },
  });

  console.log(`Found ${esmrFacilities.length} eSMR facilities`);
  console.log();

  // Check for already linked facilities
  const existingLinks = await prisma.facility.findMany({
    where: { esmrFacilityId: { not: null } },
    select: { esmrFacilityId: true },
  });
  const linkedIds = new Set(existingLinks.map(f => f.esmrFacilityId));
  console.log(`Found ${linkedIds.size} already linked facilities`);
  console.log();

  // Process each eSMR facility
  console.log('Creating facilities...');

  for (const esmrFacility of esmrFacilities) {
    // Skip if already linked
    if (linkedIds.has(esmrFacility.facilityPlaceId)) {
      result.skipped++;
      continue;
    }

    try {
      // Get coordinates from first location, or use defaults
      let lat = new Decimal('36.7783'); // California center
      let lon = new Decimal('-119.4179');

      if (esmrFacility.locations.length > 0) {
        const location = esmrFacility.locations[0];
        if (location.latitude && location.longitude) {
          lat = location.latitude;
          lon = location.longitude;
        }
      }

      // Map region to county
      const county = regionToCountyMap[esmrFacility.regionCode] || esmrFacility.region.name;

      // Generate permit ID from facility place ID
      const permitId = `ESMR-${esmrFacility.facilityPlaceId}`;

      // Create facility record using upsert (idempotent)
      await prisma.facility.upsert({
        where: { permitId },
        update: {
          // Update link if needed
          esmrFacilityId: esmrFacility.facilityPlaceId,
          lastSeenAt: new Date(),
        },
        create: {
          name: esmrFacility.facilityName,
          permitId,
          lat,
          lon,
          county,
          receivingWater: esmrFacility.receivingWaterBody || null,
          esmrFacilityId: esmrFacility.facilityPlaceId,
        },
      });

      result.created++;

      // Log progress every 50 facilities
      if (result.created % 50 === 0) {
        console.log(`  Created ${result.created} facilities...`);
      }
    } catch (error) {
      result.errors++;
      const message = error instanceof Error ? error.message : String(error);
      result.errorDetails.push(`${esmrFacility.facilityPlaceId}: ${message}`);
    }
  }

  return result;
}

async function main() {
  try {
    const result = await createFacilitiesFromEsmr();

    console.log();
    console.log('='.repeat(70));
    console.log('Summary');
    console.log('='.repeat(70));
    console.log(`  Created:  ${result.created}`);
    console.log(`  Skipped:  ${result.skipped} (already linked)`);
    console.log(`  Errors:   ${result.errors}`);
    console.log();

    if (result.errorDetails.length > 0) {
      console.log('Error Details:');
      result.errorDetails.slice(0, 10).forEach(err => console.log(`  - ${err}`));
      if (result.errorDetails.length > 10) {
        console.log(`  ... and ${result.errorDetails.length - 10} more errors`);
      }
      console.log();
    }

    // Show final counts
    const facilityCount = await prisma.facility.count();
    const linkedCount = await prisma.facility.count({
      where: { esmrFacilityId: { not: null } },
    });

    console.log('Database State:');
    console.log(`  Total Facilities: ${facilityCount}`);
    console.log(`  Linked to eSMR:   ${linkedCount}`);
    console.log();

    console.log('Next Steps:');
    console.log('  1. Visit /dashboard to see updated facility count');
    console.log('  2. Violation events require Sample records with benchmark data');
    console.log('  3. Run `npm run db:studio` to verify data');
    console.log();

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
