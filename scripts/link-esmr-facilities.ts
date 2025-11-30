#!/usr/bin/env tsx

// Facility Linking Script
// Links existing Facility records to ESMRFacility records based on name similarity and geographic proximity
// Usage: npm run link:facilities -- [--auto-link] [--dry-run]

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Use DIRECT_URL for scripts (bypasses connection pooler)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

// Calculate Levenshtein distance between two strings
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  return track[str2.length][str1.length];
}

// Calculate distance between two coordinates in meters
function getDistanceInMeters(
  lat1: Decimal | number,
  lon1: Decimal | number,
  lat2: Decimal | number,
  lon2: Decimal | number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (typeof lat1 === 'number' ? lat1 : lat1.toNumber()) * Math.PI / 180;
  const φ2 = (typeof lat2 === 'number' ? lat2 : lat2.toNumber()) * Math.PI / 180;
  const Δφ = ((typeof lat2 === 'number' ? lat2 : lat2.toNumber()) - (typeof lat1 === 'number' ? lat1 : lat1.toNumber())) * Math.PI / 180;
  const Δλ = ((typeof lon2 === 'number' ? lon2 : lon2.toNumber()) - (typeof lon1 === 'number' ? lon1 : lon1.toNumber())) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Normalize facility name for comparison
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface MatchScore {
  esmrFacilityId: number;
  esmrFacilityName: string;
  score: number;
  reasons: string[];
  exactMatch: boolean;
  distance?: number;
}

interface MatchResult {
  facility: {
    id: string;
    name: string;
    permitId: string;
    lat: Decimal;
    lon: Decimal;
  };
  matches: MatchScore[];
  bestMatch?: MatchScore;
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    autoLink: false,
    dryRun: false,
    help: false,
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--auto-link') {
      options.autoLink = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }

  return options;
}

// Display help message
function showHelp() {
  console.log(`
Facility Linking Tool

Link existing Facility records to ESMRFacility records based on name similarity
and geographic proximity.

USAGE:
  npm run link:facilities -- [OPTIONS]

OPTIONS:
  --auto-link    Automatically link high-confidence exact matches
  --dry-run      Show matches without making database changes
  -h, --help     Show this help message

EXAMPLES:
  # Show all potential matches (dry run)
  npm run link:facilities -- --dry-run

  # Auto-link exact matches
  npm run link:facilities -- --auto-link

  # Auto-link with dry-run (show what would be linked)
  npm run link:facilities -- --auto-link --dry-run

MATCHING LOGIC:
  1. Exact name match (case-insensitive) = Auto-link candidate
  2. Fuzzy name match (Levenshtein distance < 3) = Manual review
  3. Geographic proximity (within 100m) = Manual review

OUTPUT:
  - Matched: Facilities with potential eSMR links found
  - Unmatched: Facilities with no potential links
  - Ambiguous: Facilities with multiple potential matches
  - Auto-linked: Facilities automatically linked (if --auto-link used)
`);
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  console.log('='.repeat(70));
  console.log('Facility Linking Tool');
  console.log('='.repeat(70));
  console.log();
  console.log(`Mode:      ${options.dryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log(`Auto-link: ${options.autoLink ? 'YES (exact matches only)' : 'NO'}`);
  console.log();

  // Fetch unlinked facilities
  console.log('Fetching unlinked facilities...');
  const facilities = await prisma.facility.findMany({
    where: { esmrFacilityId: null },
    select: {
      id: true,
      name: true,
      permitId: true,
      lat: true,
      lon: true,
    },
  });

  console.log(`Found ${facilities.length} unlinked facilities`);
  console.log();

  // Fetch all eSMR facilities
  console.log('Fetching eSMR facilities...');
  const esmrFacilities = await prisma.eSMRFacility.findMany({
    select: {
      facilityPlaceId: true,
      facilityName: true,
      locations: {
        select: {
          latitude: true,
          longitude: true,
        },
        where: {
          latitude: { not: null },
          longitude: { not: null },
        },
        take: 1,
      },
    },
  });

  console.log(`Found ${esmrFacilities.length} eSMR facilities`);
  console.log();

  const results: MatchResult[] = [];
  let autoLinkedCount = 0;
  let matchedCount = 0;
  let unmatchedCount = 0;
  let ambiguousCount = 0;

  console.log('Analyzing matches...');
  console.log();

  for (const facility of facilities) {
    const normalizedFacilityName = normalizeName(facility.name);
    const matches: MatchScore[] = [];

    for (const esmrFacility of esmrFacilities) {
      const normalizedEsmrName = normalizeName(esmrFacility.facilityName);
      const levenshtein = levenshteinDistance(normalizedFacilityName, normalizedEsmrName);
      const reasons: string[] = [];
      let score = 0;
      let exactMatch = false;

      // Check for exact match
      if (normalizedFacilityName === normalizedEsmrName) {
        score += 100;
        reasons.push('Exact name match');
        exactMatch = true;
      } else if (levenshtein < 3) {
        score += 50 - (levenshtein * 10);
        reasons.push(`Similar name (distance: ${levenshtein})`);
      }

      // Check geographic proximity if eSMR facility has location
      if (esmrFacility.locations.length > 0) {
        const esmrLocation = esmrFacility.locations[0];
        if (esmrLocation.latitude && esmrLocation.longitude) {
          const distance = getDistanceInMeters(
            facility.lat,
            facility.lon,
            esmrLocation.latitude,
            esmrLocation.longitude
          );

          if (distance < 100) {
            score += 50;
            reasons.push(`Within 100m (${distance.toFixed(0)}m)`);
          } else if (distance < 500) {
            score += 20;
            reasons.push(`Within 500m (${distance.toFixed(0)}m)`);
          }

          if (score > 0 || distance < 1000) {
            matches.push({
              esmrFacilityId: esmrFacility.facilityPlaceId,
              esmrFacilityName: esmrFacility.facilityName,
              score,
              reasons,
              exactMatch,
              distance,
            });
          }
        }
      } else if (score > 0) {
        // Add name-only matches
        matches.push({
          esmrFacilityId: esmrFacility.facilityPlaceId,
          esmrFacilityName: esmrFacility.facilityName,
          score,
          reasons,
          exactMatch,
        });
      }
    }

    // Sort matches by score
    matches.sort((a, b) => b.score - a.score);

    if (matches.length > 0) {
      const bestMatch = matches[0];
      results.push({
        facility,
        matches,
        bestMatch,
      });

      if (bestMatch.exactMatch && matches.length === 1) {
        matchedCount++;

        // Auto-link if enabled
        if (options.autoLink) {
          if (!options.dryRun) {
            await prisma.facility.update({
              where: { id: facility.id },
              data: { esmrFacilityId: bestMatch.esmrFacilityId },
            });
          }
          autoLinkedCount++;
          console.log(`AUTO-LINKED: ${facility.name} (${facility.permitId})`);
          console.log(`         --> ${bestMatch.esmrFacilityName} (ID: ${bestMatch.esmrFacilityId})`);
          console.log(`         --> ${bestMatch.reasons.join(', ')}`);
          console.log();
        }
      } else if (matches.length > 1 || !bestMatch.exactMatch) {
        ambiguousCount++;
      } else {
        matchedCount++;
      }
    } else {
      unmatchedCount++;
      results.push({
        facility,
        matches: [],
      });
    }
  }

  console.log();
  console.log('='.repeat(70));
  console.log('Linking Report');
  console.log('='.repeat(70));
  console.log();

  console.log('SUMMARY:');
  console.log(`  Total Unlinked:    ${facilities.length}`);
  console.log(`  Matched:           ${matchedCount} (high-confidence single matches)`);
  console.log(`  Ambiguous:         ${ambiguousCount} (multiple or low-confidence matches)`);
  console.log(`  Unmatched:         ${unmatchedCount} (no matches found)`);
  if (options.autoLink) {
    console.log(`  Auto-linked:       ${autoLinkedCount}${options.dryRun ? ' (would be linked)' : ''}`);
  }
  console.log();

  // Show ambiguous matches that need manual review
  const ambiguousMatches = results.filter(r =>
    r.matches.length > 1 || (r.matches.length === 1 && !r.bestMatch?.exactMatch)
  );

  if (ambiguousMatches.length > 0) {
    console.log('AMBIGUOUS MATCHES (manual review needed):');
    console.log();

    ambiguousMatches.slice(0, 20).forEach((result, i) => {
      console.log(`${i + 1}. ${result.facility.name} (${result.facility.permitId})`);
      result.matches.slice(0, 3).forEach((match, j) => {
        console.log(`   ${j === 0 ? 'Best:' : `  ${j + 1}.`} ${match.esmrFacilityName} (ID: ${match.esmrFacilityId})`);
        console.log(`       Score: ${match.score} - ${match.reasons.join(', ')}`);
      });
      console.log();
    });

    if (ambiguousMatches.length > 20) {
      console.log(`   ... and ${ambiguousMatches.length - 20} more ambiguous matches`);
      console.log();
    }
  }

  // Show unmatched facilities
  const unmatchedFacilities = results.filter(r => r.matches.length === 0);
  if (unmatchedFacilities.length > 0) {
    console.log('UNMATCHED FACILITIES (no eSMR data found):');
    console.log();
    unmatchedFacilities.slice(0, 10).forEach((result, i) => {
      console.log(`${i + 1}. ${result.facility.name} (${result.facility.permitId})`);
    });
    if (unmatchedFacilities.length > 10) {
      console.log(`   ... and ${unmatchedFacilities.length - 10} more unmatched facilities`);
    }
    console.log();
  }

  console.log('NEXT STEPS:');
  if (ambiguousMatches.length > 0) {
    console.log('  - Review ambiguous matches and link manually via admin UI at /admin/facility-linking');
  }
  if (unmatchedFacilities.length > 0) {
    console.log('  - Unmatched facilities may not have eSMR data or use different naming');
  }
  if (!options.autoLink && matchedCount > 0) {
    console.log('  - Run with --auto-link to automatically link exact matches');
  }
  if (options.dryRun) {
    console.log('  - Run without --dry-run to apply changes to database');
  }
  console.log();

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  prisma.$disconnect();
  process.exit(1);
});
