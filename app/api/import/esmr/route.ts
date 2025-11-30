// POST /api/import/esmr - Trigger eSMR data import

import { NextRequest, NextResponse } from 'next/server';
import { importESMR } from '@/lib/services/esmr';
import type { ImportJob } from '@/lib/types/esmr';

// In-memory job store (in production, use Redis or database)
const jobs = new Map<string, ImportJob>();

// Generate simple job ID
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, dryRun = false, batchSize = 1000 } = body;

    // Validate year
    if (!year) {
      return NextResponse.json(
        { error: 'Missing required field: year' },
        { status: 400 }
      );
    }

    if (year !== 'all' && (typeof year !== 'number' || year < 2006 || year > new Date().getFullYear())) {
      return NextResponse.json(
        { error: 'Invalid year. Must be a number between 2006 and current year, or "all"' },
        { status: 400 }
      );
    }

    // Create job
    const jobId = generateJobId();
    const job: ImportJob = {
      id: jobId,
      status: 'pending',
      progress: {
        phase: 'download',
        processedRecords: 0,
        insertedRecords: 0,
        updatedRecords: 0,
        erroredRecords: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jobs.set(jobId, job);

    // Start import in background (don't await)
    importESMR({
      year,
      dryRun,
      batchSize,
      onProgress: (progress) => {
        const currentJob = jobs.get(jobId);
        if (currentJob) {
          currentJob.progress = progress;
          currentJob.updatedAt = new Date();

          // Update status based on phase
          switch (progress.phase) {
            case 'download':
              currentJob.status = 'downloading';
              break;
            case 'parse':
              currentJob.status = 'parsing';
              break;
            case 'import':
              currentJob.status = 'importing';
              break;
            case 'complete':
              currentJob.status = 'completed';
              break;
          }
        }
      },
    })
      .then((result) => {
        const currentJob = jobs.get(jobId);
        if (currentJob) {
          currentJob.status = 'completed';
          currentJob.result = result;
          currentJob.updatedAt = new Date();
        }
      })
      .catch((error) => {
        const currentJob = jobs.get(jobId);
        if (currentJob) {
          currentJob.status = 'failed';
          currentJob.error = error instanceof Error ? error.message : String(error);
          currentJob.updatedAt = new Date();
        }
      });

    // Return job ID immediately
    return NextResponse.json(
      {
        jobId,
        status: 'pending',
        message: 'Import job started',
        statusUrl: `/api/import/esmr/${jobId}`,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('Error starting import job:', error);
    return NextResponse.json(
      { error: 'Failed to start import job', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET /api/import/esmr - List recent jobs
export async function GET() {
  const recentJobs = Array.from(jobs.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 20);

  return NextResponse.json({
    jobs: recentJobs.map((job) => ({
      id: job.id,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    })),
  });
}
