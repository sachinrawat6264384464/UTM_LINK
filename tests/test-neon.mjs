import { neon } from '@neondatabase/serverless';

const NEON_URL = "postgresql://neondb_owner:npg_BVX8kIyUqlO0@ep-cold-sky-b53itt32-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function testConnection() {
  console.log('Testing connection to Neon PostgreSQL endpoint:', NEON_URL.split('@')[1]);
  try {
    const sql = neon(NEON_URL);
    const result = await sql`SELECT 1 as connected, NOW() as current_time, version() as pg_version`;
    console.log('✅ Successfully connected to Neon PostgreSQL!');
    console.log('Current Database Time:', result[0].current_time);
    console.log('Postgres Version:', result[0].pg_version);
    return true;
  } catch (err) {
    console.error('❌ Neon connection failed:', err);
    return false;
  }
}

testConnection();
