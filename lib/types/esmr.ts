// TypeScript types for eSMR data import pipeline

import { ESMRQualifier, ESMRLocationType } from '@prisma/client';

// =============================================================================
// RAW CSV TYPES (as parsed from CSV file)
// =============================================================================

export interface RawESMRRow {
  region: string;
  location: string;
  location_place_id: string;
  location_place_type: string;
  parameter: string;
  analytical_method_code: string;
  analytical_method: string;
  calculated_method: string;
  qualifier: string;
  result: string;
  units: string;
  mdl: string;
  ml: string;
  rl: string;
  sampling_date: string;
  sampling_time: string;
  analysis_date: string;
  analysis_time: string;
  review_priority_indicator: string;
  qa_codes: string;
  comments: string;
  facility_name: string;
  facility_place_id: string;
  report_name: string;
  latitude: string;
  longitude: string;
  receiving_water_body: string;
  smr_document_id: string;
  location_desc: string;
}

// =============================================================================
// TRANSFORMED TYPES (ready for database insertion)
// =============================================================================

export interface TransformedESMRRegion {
  code: string;
  name: string;
}

export interface TransformedESMRFacility {
  facilityPlaceId: number;
  facilityName: string;
  regionCode: string;
  receivingWaterBody: string | null;
}

export interface TransformedESMRLocation {
  locationPlaceId: number;
  facilityPlaceId: number;
  locationCode: string;
  locationType: ESMRLocationType;
  latitude: number | null;
  longitude: number | null;
  locationDesc: string | null;
}

export interface TransformedESMRParameter {
  parameterName: string;
  category: string | null;
  canonicalKey: string | null;
}

export interface TransformedESMRAnalyticalMethod {
  methodCode: string;
  methodName: string;
  category: string | null;
}

export interface TransformedESMRSample {
  locationPlaceId: number;
  parameterName: string; // Will be resolved to parameterId during import
  analyticalMethodCode: string | null; // Will be resolved to analyticalMethodId
  samplingDate: Date;
  samplingTime: Date;
  analysisDate: Date;
  analysisTime: Date;
  qualifier: ESMRQualifier;
  result: number | null;
  units: string;
  calculatedMethod: string | null;
  mdl: number | null;
  ml: number | null;
  rl: number | null;
  reviewPriorityIndicator: boolean | null;
  qaCodes: string | null;
  comments: string | null;
  reportName: string;
  smrDocumentId: number;
}

// Complete record with all entities
export interface TransformedESMRRecord {
  region: TransformedESMRRegion;
  facility: TransformedESMRFacility;
  location: TransformedESMRLocation;
  parameter: TransformedESMRParameter;
  analyticalMethod: TransformedESMRAnalyticalMethod | null;
  sample: TransformedESMRSample;
}

// =============================================================================
// IMPORT OPTIONS
// =============================================================================

export interface ImportESMROptions {
  // Which year to import (or 'all' for full dataset)
  year?: number | 'all';

  // Direct file path (skips download if provided)
  file?: string;

  // Dry run mode - parse and validate but don't insert
  dryRun?: boolean;

  // Batch size for database inserts
  batchSize?: number;

  // Progress callback
  onProgress?: (progress: ImportProgress) => void;

  // Force re-download even if file exists
  forceDownload?: boolean;

  // Skip validation errors and continue
  continueOnError?: boolean;
}

export interface ImportProgress {
  phase: 'download' | 'parse' | 'validate' | 'import' | 'complete';
  totalRecords?: number;
  processedRecords: number;
  insertedRecords: number;
  updatedRecords: number;
  erroredRecords: number;
  currentBatch?: number;
  totalBatches?: number;
  message?: string;
}

// =============================================================================
// IMPORT RESULTS
// =============================================================================

export interface ImportESMRResult {
  success: boolean;
  importId: string;
  dataYear: number | 'all';
  sourceFile: string;
  sourceUrl: string;

  statistics: ImportStatistics;

  duration: {
    downloadMs: number;
    parseMs: number;
    importMs: number;
    totalMs: number;
  };

  errors: ImportError[];

  startedAt: Date;
  completedAt: Date;
}

export interface ImportStatistics {
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsErrored: number;

  // Entity counts
  regionsCreated: number;
  facilitiesCreated: number;
  locationsCreated: number;
  parametersCreated: number;
  methodsCreated: number;
  samplesCreated: number;

  // Updates
  facilitiesUpdated: number;
  locationsUpdated: number;
}

export interface ImportError {
  rowNumber: number;
  phase: 'parse' | 'validate' | 'transform' | 'insert';
  field?: string;
  rawValue?: string;
  message: string;
  stack?: string;
}

// =============================================================================
// DOWNLOAD OPTIONS
// =============================================================================

export interface DownloadESMROptions {
  year: number | 'all';
  outputDir?: string;
  onProgress?: (bytesDownloaded: number, totalBytes?: number) => void;
}

export interface DownloadESMRResult {
  success: boolean;
  filePath: string;
  sourceUrl: string;
  fileSize: number;
  checksum: string;
  downloadedAt: Date;
}

// =============================================================================
// PARSER OPTIONS
// =============================================================================

export interface ParseESMROptions {
  filePath: string;
  batchSize?: number;
  skipHeader?: boolean;
  onBatch?: (batch: TransformedESMRRecord[], batchNumber: number) => void;
  onError?: (error: ImportError) => void;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface BatchResult {
  batchNumber: number;
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsErrored: number;
  errors: ImportError[];
}

// Lookup cache to avoid duplicate inserts
export interface EntityCache {
  regions: Map<string, string>; // code -> code
  facilities: Map<number, number>; // facilityPlaceId -> facilityPlaceId
  locations: Map<number, number>; // locationPlaceId -> locationPlaceId
  parameters: Map<string, string>; // parameterName -> id
  methods: Map<string, string>; // methodCode -> methodCode
}

// Job tracking for API
export interface ImportJob {
  id: string;
  status: 'pending' | 'downloading' | 'parsing' | 'importing' | 'completed' | 'failed';
  progress: ImportProgress;
  result?: ImportESMRResult;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
