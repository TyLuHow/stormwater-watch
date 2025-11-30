// eSMR Import Service
// Orchestrates the full import pipeline: download -> parse -> import

import { PrismaClient } from '@prisma/client';
import type {
  ImportESMROptions,
  ImportESMRResult,
  ImportStatistics,
  ImportError,
  ImportProgress,
  TransformedESMRRecord,
  EntityCache,
  BatchResult,
} from '../../types/esmr';
import { downloadESMRWithCache } from './download';
import { parseESMRInBatches, validateCSVStructure, getRecordCount } from './parser';

// Use DIRECT_URL for bulk imports (bypasses connection pooler)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

const DEFAULT_BATCH_SIZE = 1000;

/**
 * Build entity caches from database
 */
async function buildEntityCaches(): Promise<EntityCache> {
  const [regions, facilities, locations, parameters, methods] = await Promise.all([
    prisma.eSMRRegion.findMany({ select: { code: true } }),
    prisma.eSMRFacility.findMany({ select: { facilityPlaceId: true } }),
    prisma.eSMRLocation.findMany({ select: { locationPlaceId: true } }),
    prisma.eSMRParameter.findMany({ select: { id: true, parameterName: true } }),
    prisma.eSMRAnalyticalMethod.findMany({ select: { methodCode: true } }),
  ]);

  return {
    regions: new Map(regions.map((r) => [r.code, r.code])),
    facilities: new Map(facilities.map((f) => [f.facilityPlaceId, f.facilityPlaceId])),
    locations: new Map(locations.map((l) => [l.locationPlaceId, l.locationPlaceId])),
    parameters: new Map(parameters.map((p) => [p.parameterName, p.id])),
    methods: new Map(methods.map((m) => [m.methodCode, m.methodCode])),
  };
}

/**
 * Upsert regions from batch
 */
async function upsertRegions(
  records: TransformedESMRRecord[],
  cache: EntityCache
): Promise<number> {
  const uniqueRegions = new Map<string, TransformedESMRRecord['region']>();

  for (const record of records) {
    if (!cache.regions.has(record.region.code)) {
      uniqueRegions.set(record.region.code, record.region);
    }
  }

  if (uniqueRegions.size === 0) return 0;

  // Insert new regions
  const regionData = Array.from(uniqueRegions.values());
  await prisma.eSMRRegion.createMany({
    data: regionData,
    skipDuplicates: true,
  });

  // Update cache
  regionData.forEach((r) => cache.regions.set(r.code, r.code));

  return uniqueRegions.size;
}

/**
 * Upsert facilities from batch
 */
async function upsertFacilities(
  records: TransformedESMRRecord[],
  cache: EntityCache
): Promise<{ created: number; updated: number }> {
  const facilitiesToUpsert = new Map<number, TransformedESMRRecord['facility']>();

  for (const record of records) {
    facilitiesToUpsert.set(record.facility.facilityPlaceId, record.facility);
  }

  let created = 0;
  let updated = 0;

  // Upsert each facility
  for (const facility of facilitiesToUpsert.values()) {
    const isNew = !cache.facilities.has(facility.facilityPlaceId);

    await prisma.eSMRFacility.upsert({
      where: { facilityPlaceId: facility.facilityPlaceId },
      create: {
        ...facility,
        createdAt: new Date(),
        lastSeenAt: new Date(),
      },
      update: {
        facilityName: facility.facilityName,
        receivingWaterBody: facility.receivingWaterBody,
        lastSeenAt: new Date(),
      },
    });

    if (isNew) {
      created++;
      cache.facilities.set(facility.facilityPlaceId, facility.facilityPlaceId);
    } else {
      updated++;
    }
  }

  return { created, updated };
}

/**
 * Upsert locations from batch
 */
async function upsertLocations(
  records: TransformedESMRRecord[],
  cache: EntityCache
): Promise<{ created: number; updated: number }> {
  const locationsToUpsert = new Map<number, TransformedESMRRecord['location']>();

  for (const record of records) {
    locationsToUpsert.set(record.location.locationPlaceId, record.location);
  }

  let created = 0;
  let updated = 0;

  // Upsert each location
  for (const location of locationsToUpsert.values()) {
    const isNew = !cache.locations.has(location.locationPlaceId);

    await prisma.eSMRLocation.upsert({
      where: { locationPlaceId: location.locationPlaceId },
      create: {
        ...location,
        createdAt: new Date(),
        lastSeenAt: new Date(),
      },
      update: {
        locationCode: location.locationCode,
        locationType: location.locationType,
        latitude: location.latitude,
        longitude: location.longitude,
        locationDesc: location.locationDesc,
        lastSeenAt: new Date(),
      },
    });

    if (isNew) {
      created++;
      cache.locations.set(location.locationPlaceId, location.locationPlaceId);
    } else {
      updated++;
    }
  }

  return { created, updated };
}

/**
 * Upsert parameters from batch
 */
async function upsertParameters(
  records: TransformedESMRRecord[],
  cache: EntityCache
): Promise<number> {
  const uniqueParameters = new Map<string, TransformedESMRRecord['parameter']>();

  for (const record of records) {
    if (!cache.parameters.has(record.parameter.parameterName)) {
      uniqueParameters.set(record.parameter.parameterName, record.parameter);
    }
  }

  if (uniqueParameters.size === 0) return 0;

  let created = 0;

  // Create new parameters
  for (const parameter of uniqueParameters.values()) {
    const result = await prisma.eSMRParameter.upsert({
      where: { parameterName: parameter.parameterName },
      create: parameter,
      update: {},
      select: { id: true, parameterName: true },
    });

    if (!cache.parameters.has(result.parameterName)) {
      cache.parameters.set(result.parameterName, result.id);
      created++;
    }
  }

  return created;
}

/**
 * Upsert analytical methods from batch
 */
async function upsertAnalyticalMethods(
  records: TransformedESMRRecord[],
  cache: EntityCache
): Promise<number> {
  const uniqueMethods = new Map<string, TransformedESMRRecord['analyticalMethod']>();

  for (const record of records) {
    if (record.analyticalMethod && !cache.methods.has(record.analyticalMethod.methodCode)) {
      uniqueMethods.set(record.analyticalMethod.methodCode, record.analyticalMethod);
    }
  }

  if (uniqueMethods.size === 0) return 0;

  // Create new methods
  const methodData = Array.from(uniqueMethods.values()).filter(
    (m): m is NonNullable<typeof m> => m !== null
  );

  await prisma.eSMRAnalyticalMethod.createMany({
    data: methodData,
    skipDuplicates: true,
  });

  // Update cache
  methodData.forEach((m) => cache.methods.set(m.methodCode, m.methodCode));

  return uniqueMethods.size;
}

/**
 * Insert samples from batch
 */
async function insertSamples(
  records: TransformedESMRRecord[],
  cache: EntityCache
): Promise<number> {
  const sampleData = records.map((record) => {
    const parameterId = cache.parameters.get(record.sample.parameterName);
    if (!parameterId) {
      throw new Error(`Parameter not found in cache: ${record.sample.parameterName}`);
    }

    return {
      locationPlaceId: record.sample.locationPlaceId,
      parameterId,
      analyticalMethodId: record.sample.analyticalMethodCode || null,
      samplingDate: record.sample.samplingDate,
      samplingTime: record.sample.samplingTime,
      analysisDate: record.sample.analysisDate,
      analysisTime: record.sample.analysisTime,
      qualifier: record.sample.qualifier,
      result: record.sample.result,
      units: record.sample.units,
      calculatedMethod: record.sample.calculatedMethod,
      mdl: record.sample.mdl,
      ml: record.sample.ml,
      rl: record.sample.rl,
      reviewPriorityIndicator: record.sample.reviewPriorityIndicator,
      qaCodes: record.sample.qaCodes,
      comments: record.sample.comments,
      reportName: record.sample.reportName,
      smrDocumentId: record.sample.smrDocumentId,
    };
  });

  const result = await prisma.eSMRSample.createMany({
    data: sampleData,
    skipDuplicates: true,
  });

  return result.count;
}

/**
 * Process a batch of records
 */
async function processBatch(
  batch: TransformedESMRRecord[],
  batchNumber: number,
  cache: EntityCache,
  dryRun: boolean
): Promise<BatchResult> {
  const errors: ImportError[] = [];
  let recordsInserted = 0;
  let recordsUpdated = 0;

  try {
    if (dryRun) {
      // In dry run, just validate - don't insert
      return {
        batchNumber,
        recordsProcessed: batch.length,
        recordsInserted: 0,
        recordsUpdated: 0,
        recordsErrored: 0,
        errors: [],
      };
    }

    // Upsert dimension tables
    await upsertRegions(batch, cache);
    const { created: facilitiesCreated, updated: facilitiesUpdated } = await upsertFacilities(
      batch,
      cache
    );
    const { created: locationsCreated, updated: locationsUpdated } = await upsertLocations(
      batch,
      cache
    );
    await upsertParameters(batch, cache);
    await upsertAnalyticalMethods(batch, cache);

    // Insert samples
    const samplesInserted = await insertSamples(batch, cache);

    recordsInserted = samplesInserted;
    recordsUpdated = facilitiesUpdated + locationsUpdated;
  } catch (error) {
    errors.push({
      rowNumber: batchNumber * batch.length,
      phase: 'insert',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  return {
    batchNumber,
    recordsProcessed: batch.length,
    recordsInserted,
    recordsUpdated,
    recordsErrored: errors.length,
    errors,
  };
}

/**
 * Main import function
 */
export async function importESMR(options: ImportESMROptions = {}): Promise<ImportESMRResult> {
  const {
    year = new Date().getFullYear(),
    file,
    dryRun = false,
    batchSize = DEFAULT_BATCH_SIZE,
    onProgress,
    forceDownload = false,
    continueOnError = true,
  } = options;

  const startTime = Date.now();
  const errors: ImportError[] = [];

  // Create import record (skip in dry-run mode)
  let importRecord: { id: string } | null = null;
  if (!dryRun) {
    importRecord = await prisma.eSMRImport.create({
      data: {
        dataYear: year === 'all' ? 0 : year,
        sourceUrl: file || '',
        sourceFile: file || '',
        recordsProcessed: 0,
        recordsInserted: 0,
        recordsUpdated: 0,
        recordsErrored: 0,
        startedAt: new Date(),
      },
    });
  }

  try {
    let downloadResult: { filePath: string; sourceUrl: string };
    let downloadDuration = 0;

    // Phase 1: Download (or use provided file)
    if (file) {
      // Use provided file directly
      const fs = await import('fs');
      const path = await import('path');
      const resolvedPath = path.resolve(file);

      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`File not found: ${resolvedPath}`);
      }

      downloadResult = {
        filePath: resolvedPath,
        sourceUrl: `file://${resolvedPath}`,
      };

      if (onProgress) {
        onProgress({
          phase: 'download',
          processedRecords: 0,
          insertedRecords: 0,
          updatedRecords: 0,
          erroredRecords: 0,
          message: `Using local file: ${file}`,
        });
      }
    } else {
      // Download from data.ca.gov
      const downloadStartTime = Date.now();
      if (onProgress) {
        onProgress({
          phase: 'download',
          processedRecords: 0,
          insertedRecords: 0,
          updatedRecords: 0,
          erroredRecords: 0,
          message: `Downloading eSMR data for ${year}...`,
        });
      }

      const result = await downloadESMRWithCache(year, {
        force: forceDownload,
        onProgress: (bytes, total) => {
          if (onProgress && total) {
            const percent = ((bytes / total) * 100).toFixed(1);
            onProgress({
              phase: 'download',
              processedRecords: bytes,
              totalRecords: total,
              insertedRecords: 0,
              updatedRecords: 0,
              erroredRecords: 0,
              message: `Downloading... ${percent}%`,
            });
          }
        },
      });

      downloadResult = {
        filePath: result.filePath,
        sourceUrl: result.sourceUrl,
      };
      downloadDuration = Date.now() - downloadStartTime;
    }

    // Update import record with download info (skip in dry-run mode)
    if (!dryRun && importRecord) {
      await prisma.eSMRImport.update({
        where: { id: importRecord.id },
        data: {
          sourceUrl: downloadResult.sourceUrl,
          sourceFile: downloadResult.filePath,
        },
      });
    }

    // Phase 2: Validate
    if (onProgress) {
      onProgress({
        phase: 'validate',
        processedRecords: 0,
        insertedRecords: 0,
        updatedRecords: 0,
        erroredRecords: 0,
        message: 'Validating CSV structure...',
      });
    }

    const validation = await validateCSVStructure(downloadResult.filePath);
    if (!validation.valid) {
      throw new Error(`CSV validation failed: ${validation.errors.join(', ')}`);
    }

    // Get total record count for progress tracking
    const totalRecords = await getRecordCount(downloadResult.filePath);

    // Phase 3: Parse and Import
    const parseStartTime = Date.now();
    const statistics: ImportStatistics = {
      recordsProcessed: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      recordsErrored: 0,
      regionsCreated: 0,
      facilitiesCreated: 0,
      locationsCreated: 0,
      parametersCreated: 0,
      methodsCreated: 0,
      samplesCreated: 0,
      facilitiesUpdated: 0,
      locationsUpdated: 0,
    };

    // Build entity caches (skip in dry-run mode)
    const cache = dryRun
      ? {
          regions: new Map<string, string>(),
          facilities: new Map<number, number>(),
          locations: new Map<number, number>(),
          parameters: new Map<string, string>(),
          methods: new Map<string, string>(),
        }
      : await buildEntityCaches();

    let batchNumber = 0;
    const totalBatches = Math.ceil(totalRecords / batchSize);

    for await (const batch of parseESMRInBatches({
      filePath: downloadResult.filePath,
      batchSize,
      onError: (error) => {
        errors.push(error);
        statistics.recordsErrored++;
      },
    })) {
      batchNumber++;

      if (onProgress) {
        onProgress({
          phase: 'import',
          totalRecords,
          processedRecords: statistics.recordsProcessed,
          insertedRecords: statistics.recordsInserted,
          updatedRecords: statistics.recordsUpdated,
          erroredRecords: statistics.recordsErrored,
          currentBatch: batchNumber,
          totalBatches,
          message: `Processing batch ${batchNumber}/${totalBatches}...`,
        });
      }

      const batchResult = await processBatch(batch, batchNumber, cache, dryRun);

      statistics.recordsProcessed += batchResult.recordsProcessed;
      statistics.recordsInserted += batchResult.recordsInserted;
      statistics.recordsUpdated += batchResult.recordsUpdated;
      statistics.samplesCreated += batchResult.recordsInserted;

      if (batchResult.errors.length > 0) {
        errors.push(...batchResult.errors);
        if (!continueOnError) {
          throw new Error(`Batch ${batchNumber} failed: ${batchResult.errors[0].message}`);
        }
      }
    }

    const parseDuration = Date.now() - parseStartTime;
    const totalDuration = Date.now() - startTime;

    // Update import record with final statistics (skip in dry-run mode)
    if (!dryRun && importRecord) {
      await prisma.eSMRImport.update({
        where: { id: importRecord.id },
        data: {
          recordsProcessed: statistics.recordsProcessed,
          recordsInserted: statistics.recordsInserted,
          recordsUpdated: statistics.recordsUpdated,
          recordsErrored: statistics.recordsErrored,
          errors: errors.length > 0 ? JSON.stringify(errors.slice(0, 100)) : null,
          completedAt: new Date(),
        },
      });

      // Save detailed errors to error table
      if (errors.length > 0) {
        const errorRecords = errors.slice(0, 1000).map((error) => ({
          importId: importRecord.id,
          rowNumber: error.rowNumber,
          rawData: error.rawValue || '',
          errorMessage: error.message,
        }));

        await prisma.eSMRImportError.createMany({
          data: errorRecords,
        });
      }
    }

    if (onProgress) {
      onProgress({
        phase: 'complete',
        totalRecords,
        processedRecords: statistics.recordsProcessed,
        insertedRecords: statistics.recordsInserted,
        updatedRecords: statistics.recordsUpdated,
        erroredRecords: statistics.recordsErrored,
        message: 'Import complete!',
      });
    }

    return {
      success: true,
      importId: importRecord?.id || 'dry-run',
      dataYear: year,
      sourceFile: downloadResult.filePath,
      sourceUrl: downloadResult.sourceUrl,
      statistics,
      duration: {
        downloadMs: downloadDuration,
        parseMs: parseDuration,
        importMs: parseDuration,
        totalMs: totalDuration,
      },
      errors: errors.slice(0, 100), // Limit errors in response
      startedAt: new Date(startTime),
      completedAt: new Date(),
    };
  } catch (error) {
    // Mark import as failed (skip in dry-run mode)
    if (!dryRun && importRecord) {
      await prisma.eSMRImport.update({
        where: { id: importRecord.id },
        data: {
          completedAt: new Date(),
          errors: JSON.stringify([
            {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            },
          ]),
        },
      });
    }

    throw error;
  }
}
