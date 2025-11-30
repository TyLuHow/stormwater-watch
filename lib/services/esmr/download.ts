// eSMR Download Service
// Downloads CSV files from California Water Board data portal

import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
import type { DownloadESMROptions, DownloadESMRResult } from '../../types/esmr';

// Dataset ID for eSMR data on data.ca.gov
const ESMR_DATASET_ID = '203e5d1f-ec9d-4d07-93aa-d8b74d3fe71f';

// Resource IDs for yearly data exports
// These are from the actual data.ca.gov dataset - update if new years are added
const ESMR_RESOURCE_IDS: Record<number, string> = {
  2025: '176a58bf-6f5d-4e3f-9ed9-592a509870eb',
  // Note: Earlier years would have different resource IDs
  // Check https://data.ca.gov/dataset/water-quality-effluent-electronic-self-monitoring-report-esmr-data for updates
};

// Full dataset (all years 2006-present) resource ID
const ESMR_FULL_RESOURCE_ID = '5ebbd97a-ffa9-4b75-8904-80e71a5e92c3';

const DEFAULT_OUTPUT_DIR = path.join(process.cwd(), 'data', 'esmr');

/**
 * Get the download URL for a specific year or full dataset
 * Uses the data.ca.gov direct download URLs
 */
function getDownloadURL(year: number | 'all'): string {
  const baseUrl = `https://data.ca.gov/dataset/${ESMR_DATASET_ID}/resource`;

  if (year === 'all') {
    // Note: The full dataset URL includes the date it was generated
    // This is a direct link to the most recent export
    return `${baseUrl}/${ESMR_FULL_RESOURCE_ID}/download/esmr-analytical-export_years-2006-2025_2025-11-05.zip`;
  }

  const resourceId = ESMR_RESOURCE_IDS[year];
  if (!resourceId) {
    // If we don't have a specific resource ID, try to use a pattern
    // Note: This may not work for all years - check data.ca.gov for actual URLs
    throw new Error(
      `No resource ID configured for year ${year}. ` +
      `Available years: ${Object.keys(ESMR_RESOURCE_IDS).join(', ')}. ` +
      `Use --all to download the complete dataset.`
    );
  }

  // The actual filename pattern used by data.ca.gov
  return `${baseUrl}/${resourceId}/download/esmr-analytical-export_year-${year}_2025-11-05.csv`;
}

/**
 * Calculate SHA256 checksum of a file
 */
function calculateChecksum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Download file from URL to local path with streaming
 */
function downloadFile(
  url: string,
  outputPath: string,
  onProgress?: (bytesDownloaded: number, totalBytes?: number) => void
): Promise<{ fileSize: number }> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (!redirectUrl) {
          return reject(new Error('Redirect without location header'));
        }
        return downloadFile(redirectUrl, outputPath, onProgress)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }

      const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
      let downloadedBytes = 0;

      const fileStream = fs.createWriteStream(outputPath);

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (onProgress) {
          onProgress(downloadedBytes, totalBytes || undefined);
        }
      });

      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve({ fileSize: downloadedBytes });
      });

      fileStream.on('error', (err) => {
        fs.unlinkSync(outputPath);
        reject(err);
      });
    }).on('error', reject);
  });
}

/**
 * Download eSMR data for a specific year
 */
export async function downloadESMRByYear(
  year: number,
  options: Partial<DownloadESMROptions> = {}
): Promise<DownloadESMRResult> {
  const outputDir = options.outputDir || DEFAULT_OUTPUT_DIR;
  const url = getDownloadURL(year);
  const fileName = `esmr-${year}.csv`;
  const filePath = path.join(outputDir, fileName);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const startTime = Date.now();

  try {
    console.log(`Downloading eSMR data for ${year}...`);
    console.log(`URL: ${url}`);
    console.log(`Output: ${filePath}`);

    const { fileSize } = await downloadFile(url, filePath, options.onProgress);

    console.log(`Download complete: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('Calculating checksum...');

    const checksum = await calculateChecksum(filePath);

    const result: DownloadESMRResult = {
      success: true,
      filePath,
      sourceUrl: url,
      fileSize,
      checksum,
      downloadedAt: new Date(),
    };

    console.log(`Checksum: ${checksum}`);
    console.log(`Download completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

    return result;
  } catch (error) {
    // Clean up partial file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    throw new Error(
      `Failed to download eSMR data for ${year}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Download full eSMR dataset (all years)
 */
export async function downloadESMRFull(
  options: Partial<DownloadESMROptions> = {}
): Promise<DownloadESMRResult> {
  const outputDir = options.outputDir || DEFAULT_OUTPUT_DIR;
  const url = getDownloadURL('all');
  const fileName = 'esmr-full.csv';
  const filePath = path.join(outputDir, fileName);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const startTime = Date.now();

  try {
    console.log('Downloading full eSMR dataset (all years)...');
    console.log(`URL: ${url}`);
    console.log(`Output: ${filePath}`);
    console.log('⚠️  This is a large file (~600MB) and may take several minutes');

    const { fileSize } = await downloadFile(url, filePath, options.onProgress);

    console.log(`Download complete: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('Calculating checksum...');

    const checksum = await calculateChecksum(filePath);

    const result: DownloadESMRResult = {
      success: true,
      filePath,
      sourceUrl: url,
      fileSize,
      checksum,
      downloadedAt: new Date(),
    };

    console.log(`Checksum: ${checksum}`);
    console.log(`Download completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

    return result;
  } catch (error) {
    // Clean up partial file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    throw new Error(
      `Failed to download full eSMR dataset: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Check if a file already exists and return its info
 */
export async function checkExistingFile(
  year: number | 'all',
  outputDir?: string
): Promise<DownloadESMRResult | null> {
  const dir = outputDir || DEFAULT_OUTPUT_DIR;
  const fileName = year === 'all' ? 'esmr-full.csv' : `esmr-${year}.csv`;
  const filePath = path.join(dir, fileName);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const stats = fs.statSync(filePath);
  const checksum = await calculateChecksum(filePath);

  return {
    success: true,
    filePath,
    sourceUrl: getDownloadURL(year),
    fileSize: stats.size,
    checksum,
    downloadedAt: stats.mtime,
  };
}

/**
 * Download with caching - only download if file doesn't exist or force is true
 */
export async function downloadESMRWithCache(
  year: number | 'all',
  options: Partial<DownloadESMROptions> & { force?: boolean } = {}
): Promise<DownloadESMRResult> {
  const { force = false, ...downloadOptions } = options;

  // Check for existing file
  if (!force) {
    const existing = await checkExistingFile(year, downloadOptions.outputDir);
    if (existing) {
      console.log(`Using cached file: ${existing.filePath}`);
      return existing;
    }
  }

  // Download fresh copy
  if (year === 'all') {
    return downloadESMRFull(downloadOptions);
  } else {
    return downloadESMRByYear(year, downloadOptions);
  }
}
