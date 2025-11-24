import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Redis } from '@upstash/redis';
import { supabaseClient } from '@/lib/providers';

export async function GET() {
  try {
    const checks = await Promise.allSettled([
      // Check database
      prisma.$queryRaw`SELECT 1`,
      
      // Check Redis
      checkRedis(),
      
      // Check Supabase storage
      checkSupabaseStorage(),
    ]);

    const [dbCheck, redisCheck, storageCheck] = checks;

    const services = {
      database: dbCheck.status === 'fulfilled' ? 'up' : 'down',
      redis: redisCheck.status === 'fulfilled' ? 'up' : 'down',
      storage: storageCheck.status === 'fulfilled' ? 'up' : 'down'
    };

    const isHealthy = Object.values(services).every(status => status === 'up');
    
    const response = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      services,
      timestamp: new Date().toISOString()
    };

    if (isHealthy) {
      return NextResponse.json(response);
    } else {
      return NextResponse.json(response, { status: 503 });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

async function checkRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis not configured');
  }
  
  const redis = Redis.fromEnv();
  await redis.ping();
}

async function checkSupabaseStorage() {
  if (!supabaseClient) {
    throw new Error('Supabase not configured');
  }
  
  // Try to list buckets to check storage connectivity
  const { error } = await supabaseClient.storage.listBuckets();
  if (error) {
    throw new Error(`Supabase storage error: ${error.message}`);
  }
}