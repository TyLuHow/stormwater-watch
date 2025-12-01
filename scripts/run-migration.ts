#!/usr/bin/env tsx

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
config();

import { PrismaClient } from '@prisma/client';

async function runMigration() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    console.log('Reading migration file...');
    const migrationSQL = readFileSync(
      join(process.cwd(), 'prisma/migrations/add_pollutant_benchmarks.sql'),
      'utf-8'
    );

    console.log('Connecting to database...');
    console.log('Executing migration...');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`  Executing statement ${i + 1}/${statements.length}...`);
      try {
        await prisma.$executeRawUnsafe(stmt);
      } catch (err: any) {
        // Ignore "already exists" errors
        if (err.message?.includes('already exists') || err.meta?.message?.includes('already exists')) {
          console.log(`    (skipped - already exists)`);
        } else {
          throw err;
        }
      }
    }

    console.log('✓ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
