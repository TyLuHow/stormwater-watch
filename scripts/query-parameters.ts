#!/usr/bin/env tsx

import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  // Get parameter categories and counts
  const params = await prisma.eSMRParameter.findMany({
    select: { parameterName: true, category: true },
    orderBy: [{ category: 'asc' }, { parameterName: 'asc' }]
  });

  // Group by category
  const byCategory = params.reduce((acc, p) => {
    const cat = p.category || 'Uncategorized';
    acc[cat] = acc[cat] || [];
    acc[cat].push(p.parameterName);
    return acc;
  }, {} as Record<string, string[]>);

  console.log("=== eSMR PARAMETER CATEGORIES ===");
  console.log("Total parameters:", params.length);
  console.log("");

  for (const [cat, names] of Object.entries(byCategory)) {
    console.log(`${cat} (${names.length}):`);
    names.slice(0, 10).forEach(n => console.log(`  - ${n}`));
    if (names.length > 10) console.log(`  ... and ${names.length - 10} more`);
    console.log("");
  }

  // Get ConfigPollutant if any
  const configPollutants = await prisma.configPollutant.findMany();
  console.log("=== EXISTING CONFIG POLLUTANTS ===");
  console.log("Count:", configPollutants.length);
  configPollutants.forEach(p => console.log(`  - ${p.key}: unit=${p.canonicalUnit}, aliases=${p.aliases.join(', ')}`));

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
