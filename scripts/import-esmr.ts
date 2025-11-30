#!/usr/bin/env tsx

// eSMR Import CLI Script
// Usage: npm run import:esmr -- --year=2025 [--dry-run] [--batch-size=1000]

import { importESMR } from '../lib/services/esmr';
import type { ImportProgress } from '../lib/types/esmr';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options: {
    year?: number | 'all';
    file?: string;
    dryRun: boolean;
    batchSize: number;
    forceDownload: boolean;
    help: boolean;
  } = {
    dryRun: false,
    batchSize: 1000,
    forceDownload: false,
    help: false,
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--all') {
      options.year = 'all';
    } else if (arg === '--force-download') {
      options.forceDownload = true;
    } else if (arg.startsWith('--year=')) {
      const year = parseInt(arg.split('=')[1], 10);
      if (isNaN(year)) {
        console.error(`Invalid year: ${arg.split('=')[1]}`);
        process.exit(1);
      }
      options.year = year;
    } else if (arg.startsWith('--file=')) {
      options.file = arg.split('=')[1];
    } else if (arg.startsWith('--batch-size=')) {
      const batchSize = parseInt(arg.split('=')[1], 10);
      if (isNaN(batchSize) || batchSize < 1) {
        console.error(`Invalid batch size: ${arg.split('=')[1]}`);
        process.exit(1);
      }
      options.batchSize = batchSize;
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
eSMR Import Tool

Import California Water Board eSMR (Electronic Self-Monitoring Report) data.

USAGE:
  npm run import:esmr -- [OPTIONS]

OPTIONS:
  --year=YYYY          Import data for a specific year (e.g., --year=2025)
  --all                Import full dataset (all years)
  --file=PATH          Import from a local CSV file (skips download)
  --dry-run            Validate and parse without inserting to database
  --batch-size=N       Number of records per batch (default: 1000)
  --force-download     Re-download file even if cached
  -h, --help           Show this help message

EXAMPLES:
  # Import 2025 data (dry run)
  npm run import:esmr -- --year=2025 --dry-run

  # Import 2025 data to database
  npm run import:esmr -- --year=2025

  # Import from local sample file (dry run)
  npm run import:esmr -- --file=./data/esmr/sample-2025.csv --dry-run

  # Import full dataset with custom batch size
  npm run import:esmr -- --all --batch-size=5000

  # Force re-download and import
  npm run import:esmr -- --year=2025 --force-download

EXIT CODES:
  0    Success
  1    Error occurred

For more information, see: /research/esmr-schema-analysis.md
`);
}

// Format duration in human-readable format
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

// Format file size in human-readable format
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// Progress bar
let lastProgressLine = '';

function clearProgressLine() {
  if (lastProgressLine) {
    process.stdout.write('\r' + ' '.repeat(lastProgressLine.length) + '\r');
  }
}

function showProgress(progress: ImportProgress) {
  clearProgressLine();

  let line = '';

  switch (progress.phase) {
    case 'download':
      if (progress.totalRecords) {
        const percent = ((progress.processedRecords / progress.totalRecords) * 100).toFixed(1);
        const downloaded = formatBytes(progress.processedRecords);
        const total = formatBytes(progress.totalRecords);
        line = `Downloading: ${downloaded} / ${total} (${percent}%)`;
      } else {
        line = progress.message || 'Downloading...';
      }
      break;

    case 'validate':
      line = progress.message || 'Validating...';
      break;

    case 'parse':
    case 'import':
      if (progress.totalRecords && progress.currentBatch && progress.totalBatches) {
        const percent = ((progress.processedRecords / progress.totalRecords) * 100).toFixed(1);
        line = `Processing: Batch ${progress.currentBatch}/${progress.totalBatches} | ${progress.processedRecords.toLocaleString()} / ${progress.totalRecords.toLocaleString()} records (${percent}%) | ${progress.insertedRecords.toLocaleString()} inserted`;
      } else {
        line = `Processing: ${progress.processedRecords.toLocaleString()} records processed`;
      }
      break;

    case 'complete':
      line = progress.message || 'Complete!';
      break;
  }

  lastProgressLine = line;
  process.stdout.write(line);
}

// Main function
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  // Validate required arguments
  if (!options.year && !options.file) {
    console.error('Error: Must specify --year=YYYY, --all, or --file=PATH');
    console.error('Run with --help for usage information');
    process.exit(1);
  }

  console.log('='.repeat(70));
  console.log('eSMR Data Import');
  console.log('='.repeat(70));
  console.log();
  if (options.file) {
    console.log(`File:           ${options.file}`);
  } else {
    console.log(`Year:           ${options.year}`);
  }
  console.log(`Dry Run:        ${options.dryRun ? 'YES (no data will be inserted)' : 'NO'}`);
  console.log(`Batch Size:     ${options.batchSize.toLocaleString()} records`);
  if (!options.file) {
    console.log(`Force Download: ${options.forceDownload ? 'YES' : 'NO'}`);
  }
  console.log();

  if (options.dryRun) {
    console.log('DRY RUN MODE: Parsing and validating only, no database changes will be made.');
    console.log();
  }

  const startTime = Date.now();

  try {
    const result = await importESMR({
      year: options.file ? 2025 : options.year!, // Use 2025 as placeholder when using file
      file: options.file,
      dryRun: options.dryRun,
      batchSize: options.batchSize,
      forceDownload: options.forceDownload,
      onProgress: showProgress,
    });

    clearProgressLine();
    console.log();
    console.log('='.repeat(70));
    console.log('Import Complete!');
    console.log('='.repeat(70));
    console.log();

    console.log('SUMMARY:');
    console.log(`  Import ID:         ${result.importId}`);
    console.log(`  Source File:       ${result.sourceFile}`);
    console.log(`  Records Processed: ${result.statistics.recordsProcessed.toLocaleString()}`);
    console.log(`  Records Inserted:  ${result.statistics.recordsInserted.toLocaleString()}`);
    console.log(`  Records Updated:   ${result.statistics.recordsUpdated.toLocaleString()}`);
    console.log(`  Records Errored:   ${result.statistics.recordsErrored.toLocaleString()}`);
    console.log();

    console.log('ENTITIES CREATED:');
    console.log(`  Regions:     ${result.statistics.regionsCreated}`);
    console.log(`  Facilities:  ${result.statistics.facilitiesCreated}`);
    console.log(`  Locations:   ${result.statistics.locationsCreated}`);
    console.log(`  Parameters:  ${result.statistics.parametersCreated}`);
    console.log(`  Methods:     ${result.statistics.methodsCreated}`);
    console.log(`  Samples:     ${result.statistics.samplesCreated.toLocaleString()}`);
    console.log();

    console.log('DURATION:');
    console.log(`  Download: ${formatDuration(result.duration.downloadMs)}`);
    console.log(`  Parse:    ${formatDuration(result.duration.parseMs)}`);
    console.log(`  Import:   ${formatDuration(result.duration.importMs)}`);
    console.log(`  Total:    ${formatDuration(result.duration.totalMs)}`);
    console.log();

    if (result.errors.length > 0) {
      console.log('ERRORS:');
      console.log(`  ${result.errors.length} error(s) occurred during import`);
      console.log();
      console.log('First 10 errors:');
      result.errors.slice(0, 10).forEach((error, i) => {
        console.log(`  ${i + 1}. Row ${error.rowNumber}: ${error.message}`);
      });
      console.log();
      if (result.errors.length > 10) {
        console.log(`  ... and ${result.errors.length - 10} more errors`);
        console.log();
      }
    }

    if (options.dryRun) {
      console.log('DRY RUN: No data was inserted into the database.');
    }

    console.log('Import completed successfully!');
    process.exit(0);
  } catch (error) {
    clearProgressLine();
    console.log();
    console.error('='.repeat(70));
    console.error('Import Failed');
    console.error('='.repeat(70));
    console.error();
    console.error('ERROR:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error();
      console.error('STACK TRACE:');
      console.error(error.stack);
    }
    console.error();
    console.error(`Duration: ${formatDuration(Date.now() - startTime)}`);
    process.exit(1);
  }
}

// Run main function
main();
