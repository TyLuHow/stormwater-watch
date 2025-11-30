// eSMR Parser Service
// Parses CSV files and transforms them into database-ready records

import fs from 'fs';
import { parse } from 'csv-parse';
import type {
  RawESMRRow,
  TransformedESMRRecord,
  ParseESMROptions,
  ImportError,
  TransformedESMRRegion,
  TransformedESMRFacility,
  TransformedESMRLocation,
  TransformedESMRParameter,
  TransformedESMRAnalyticalMethod,
  TransformedESMRSample,
} from '../../types/esmr';
import { ESMRQualifier, ESMRLocationType } from '@prisma/client';

const DEFAULT_BATCH_SIZE = 1000;

/**
 * Map raw qualifier string to ESMRQualifier enum
 */
function parseQualifier(raw: string): ESMRQualifier {
  const normalized = raw.trim().toUpperCase();
  switch (normalized) {
    case '=':
      return ESMRQualifier.DETECTED;
    case '<':
      return ESMRQualifier.LESS_THAN;
    case '>':
      return ESMRQualifier.GREATER_THAN;
    case 'ND':
      return ESMRQualifier.NOT_DETECTED;
    case 'DNQ':
      return ESMRQualifier.DETECTED_NOT_QUANTIFIED;
    default:
      throw new Error(`Unknown qualifier: ${raw}`);
  }
}

/**
 * Map raw location type to ESMRLocationType enum
 */
function parseLocationType(raw: string): ESMRLocationType {
  const normalized = raw.trim().toUpperCase();
  if (normalized.includes('EFFLUENT')) return ESMRLocationType.EFFLUENT_MONITORING;
  if (normalized.includes('INFLUENT')) return ESMRLocationType.INFLUENT_MONITORING;
  if (normalized.includes('RECEIVING')) return ESMRLocationType.RECEIVING_WATER_MONITORING;
  if (normalized.includes('RECYCLED')) return ESMRLocationType.RECYCLED_WATER_MONITORING;
  if (normalized.includes('INTERNAL')) return ESMRLocationType.INTERNAL_MONITORING;
  if (normalized.includes('GROUNDWATER')) return ESMRLocationType.GROUNDWATER_MONITORING;
  throw new Error(`Unknown location type: ${raw}`);
}

/**
 * Extract region code from region name (e.g., "Region 2 - San Francisco Bay" -> "R2")
 */
function extractRegionCode(regionName: string): string {
  const match = regionName.match(/Region\s+(\d+[A-Z]?)/i);
  if (!match) {
    throw new Error(`Cannot extract region code from: ${regionName}`);
  }
  return `R${match[1]}`;
}

/**
 * Parse a nullable decimal value
 */
function parseDecimal(raw: string): number | null {
  if (!raw || raw.trim() === '' || raw === 'NA' || raw === 'NaN') {
    return null;
  }
  const parsed = parseFloat(raw);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse a nullable integer value
 */
function parseInteger(raw: string): number | null {
  if (!raw || raw.trim() === '' || raw === 'NA' || raw === 'NaN') {
    return null;
  }
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse a nullable boolean value (Y/N)
 */
function parseBoolean(raw: string): boolean | null {
  if (!raw || raw.trim() === '' || raw === 'NA' || raw === 'NaN') {
    return null;
  }
  const normalized = raw.trim().toUpperCase();
  if (normalized === 'Y' || normalized === 'YES') return true;
  if (normalized === 'N' || normalized === 'NO') return false;
  return null;
}

/**
 * Parse date string (YYYY-MM-DD)
 */
function parseDate(raw: string): Date {
  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${raw}`);
  }
  return parsed;
}

/**
 * Parse time string (HH:MM:SS) - returns a Date with time component
 */
function parseTime(raw: string): Date {
  // Create a date with epoch + time
  const [hours, minutes, seconds] = raw.split(':').map((s) => parseInt(s, 10));
  const date = new Date(0);
  date.setUTCHours(hours, minutes, seconds || 0, 0);
  return date;
}

/**
 * Clean and normalize string value
 */
function cleanString(raw: string): string | null {
  if (!raw || raw.trim() === '' || raw === 'NA' || raw === 'NaN') {
    return null;
  }
  // Remove BOM if present
  return raw.replace(/^\uFEFF/, '').trim();
}

/**
 * Transform raw CSV row to structured record
 */
function transformRow(raw: RawESMRRow, rowNumber: number): TransformedESMRRecord {
  try {
    // Extract region
    const regionCode = extractRegionCode(raw.region);
    const region: TransformedESMRRegion = {
      code: regionCode,
      name: raw.region.trim(),
    };

    // Extract facility
    const facilityPlaceId = parseInt(raw.facility_place_id, 10);
    if (isNaN(facilityPlaceId)) {
      throw new Error(`Invalid facility_place_id: ${raw.facility_place_id}`);
    }

    const facility: TransformedESMRFacility = {
      facilityPlaceId,
      facilityName: raw.facility_name.trim(),
      regionCode,
      receivingWaterBody: cleanString(raw.receiving_water_body),
    };

    // Extract location
    const locationPlaceId = parseInt(raw.location_place_id, 10);
    if (isNaN(locationPlaceId)) {
      throw new Error(`Invalid location_place_id: ${raw.location_place_id}`);
    }

    const location: TransformedESMRLocation = {
      locationPlaceId,
      facilityPlaceId,
      locationCode: raw.location.trim(),
      locationType: parseLocationType(raw.location_place_type),
      latitude: parseDecimal(raw.latitude),
      longitude: parseDecimal(raw.longitude),
      locationDesc: cleanString(raw.location_desc),
    };

    // Extract parameter
    const parameter: TransformedESMRParameter = {
      parameterName: raw.parameter.trim(),
      category: null, // Will be enriched later
      canonicalKey: null, // Will be mapped to ConfigPollutant later
    };

    // Extract analytical method (optional)
    let analyticalMethod: TransformedESMRAnalyticalMethod | null = null;
    const methodCode = cleanString(raw.analytical_method_code);
    const methodName = cleanString(raw.analytical_method);

    if (methodCode && methodName) {
      analyticalMethod = {
        methodCode,
        methodName,
        category: null,
      };
    }

    // Extract sample
    const smrDocumentId = parseInt(raw.smr_document_id, 10);
    if (isNaN(smrDocumentId)) {
      throw new Error(`Invalid smr_document_id: ${raw.smr_document_id}`);
    }

    const sample: TransformedESMRSample = {
      locationPlaceId,
      parameterName: parameter.parameterName,
      analyticalMethodCode: methodCode,
      samplingDate: parseDate(raw.sampling_date),
      samplingTime: parseTime(raw.sampling_time),
      analysisDate: parseDate(raw.analysis_date),
      analysisTime: parseTime(raw.analysis_time),
      qualifier: parseQualifier(raw.qualifier),
      result: parseDecimal(raw.result),
      units: raw.units.trim(),
      calculatedMethod: cleanString(raw.calculated_method),
      mdl: parseDecimal(raw.mdl),
      ml: parseDecimal(raw.ml),
      rl: parseDecimal(raw.rl),
      reviewPriorityIndicator: parseBoolean(raw.review_priority_indicator),
      qaCodes: cleanString(raw.qa_codes),
      comments: cleanString(raw.comments),
      reportName: raw.report_name.trim(),
      smrDocumentId,
    };

    return {
      region,
      facility,
      location,
      parameter,
      analyticalMethod,
      sample,
    };
  } catch (error) {
    throw new Error(
      `Row ${rowNumber}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Parse CSV file in batches using async generator
 */
export async function* parseESMRInBatches(
  options: ParseESMROptions
): AsyncGenerator<TransformedESMRRecord[], void, unknown> {
  const {
    filePath,
    batchSize = DEFAULT_BATCH_SIZE,
    skipHeader = false,
    onBatch,
    onError,
  } = options;

  let batch: TransformedESMRRecord[] = [];
  let batchNumber = 0;
  let rowNumber = 0;

  const parser = fs.createReadStream(filePath).pipe(
    parse({
      columns: true, // Use first row as column names
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // Be lenient with column count mismatches
      bom: true, // Handle UTF-8 BOM
    })
  );

  for await (const rawRow of parser) {
    rowNumber++;

    if (skipHeader && rowNumber === 1) {
      continue;
    }

    try {
      const record = transformRow(rawRow as RawESMRRow, rowNumber);
      batch.push(record);

      if (batch.length >= batchSize) {
        batchNumber++;
        if (onBatch) {
          onBatch(batch, batchNumber);
        }
        yield batch;
        batch = [];
      }
    } catch (error) {
      const importError: ImportError = {
        rowNumber,
        phase: 'parse',
        message: error instanceof Error ? error.message : String(error),
        rawValue: JSON.stringify(rawRow),
      };

      if (onError) {
        onError(importError);
      } else {
        // If no error handler, log to console
        console.error(`Parse error at row ${rowNumber}:`, importError.message);
      }
    }
  }

  // Yield remaining records
  if (batch.length > 0) {
    batchNumber++;
    if (onBatch) {
      onBatch(batch, batchNumber);
    }
    yield batch;
  }
}

/**
 * Parse entire file into memory (use only for small files)
 */
export async function parseESMRFile(filePath: string): Promise<TransformedESMRRecord[]> {
  const records: TransformedESMRRecord[] = [];
  const errors: ImportError[] = [];

  for await (const batch of parseESMRInBatches({
    filePath,
    onError: (error) => errors.push(error),
  })) {
    records.push(...batch);
  }

  if (errors.length > 0) {
    console.warn(`Parsed with ${errors.length} errors`);
  }

  return records;
}

/**
 * Get record count from CSV file without loading into memory
 */
export async function getRecordCount(filePath: string): Promise<number> {
  let count = 0;

  const parser = fs.createReadStream(filePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      bom: true, // Handle UTF-8 BOM
    })
  );

  for await (const _ of parser) {
    count++;
  }

  return count;
}

/**
 * Validate CSV file structure without parsing all records
 */
export async function validateCSVStructure(
  filePath: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    const parser = fs.createReadStream(filePath).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        to: 10, // Only check first 10 rows
        bom: true, // Handle UTF-8 BOM
      })
    );

    let rowCount = 0;
    const requiredColumns = [
      'region',
      'location',
      'location_place_id',
      'parameter',
      'qualifier',
      'units',
      'sampling_date',
      'sampling_time',
      'facility_name',
      'facility_place_id',
      'smr_document_id',
    ];

    for await (const row of parser) {
      rowCount++;

      // Check for required columns
      if (rowCount === 1) {
        const columns = Object.keys(row);
        const missing = requiredColumns.filter((col) => !columns.includes(col));

        if (missing.length > 0) {
          errors.push(`Missing required columns: ${missing.join(', ')}`);
        }
      }

      // Try to parse first row to validate format
      if (rowCount === 1) {
        try {
          transformRow(row as RawESMRRow, 1);
        } catch (error) {
          errors.push(
            `Sample row failed to parse: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    }

    if (rowCount === 0) {
      errors.push('File is empty');
    }
  } catch (error) {
    errors.push(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
