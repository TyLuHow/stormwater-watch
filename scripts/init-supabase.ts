#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initializeSupabase() {
  console.log('🚀 Initializing Supabase...');
  
  try {
    // Create storage buckets
    const buckets = [
      { name: 'uploads', config: { public: true, fileSizeLimit: 52428800, allowedMimeTypes: ['text/csv', 'application/pdf', 'application/zip'] }},
      { name: 'exports', config: { public: false, fileSizeLimit: 52428800, allowedMimeTypes: ['text/csv', 'application/pdf'] }},
      { name: 'case-packets', config: { public: false, fileSizeLimit: 10485760, allowedMimeTypes: ['application/pdf'] }},
      { name: 'imports', config: { public: false, fileSizeLimit: 104857600, allowedMimeTypes: ['text/csv', 'application/zip'] }}
    ];
    
    console.log('📁 Creating storage buckets...');
    for (const bucket of buckets) {
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.config.public,
        fileSizeLimit: bucket.config.fileSizeLimit,
        allowedMimeTypes: bucket.config.allowedMimeTypes
      });
      
      if (error && !error.message.includes('already exists')) {
        console.error(`❌ Error creating bucket ${bucket.name}:`, error.message);
      } else {
        console.log(`✅ Bucket ${bucket.name} ready`);
      }
    }
    
    // Test database connection
    console.log('🔍 Testing database connection...');
    const { data, error } = await supabase
      .from('facility')
      .select('count')
      .limit(1);
      
    if (error) {
      console.log(`⚠️  Database connection issue: ${error.message}`);
      console.log('📋 Note: This is expected if tables don\'t exist yet. Run "npm run db:push" first.');
    } else {
      console.log('✅ Database connection successful');
    }
    
    // Test storage access
    console.log('📦 Testing storage access...');
    const { data: bucketList, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error(`❌ Storage access failed: ${bucketError.message}`);
    } else {
      console.log(`✅ Storage accessible - found ${bucketList.length} buckets`);
    }
    
    console.log('\n🎉 Supabase initialization complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run "npm run db:push" to create database tables');
    console.log('   2. Run "npm run db:seed" to add sample data');
    console.log('   3. Start the app with "npm run dev"');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  initializeSupabase().catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export { initializeSupabase };