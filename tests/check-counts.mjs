import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_BVX8kIyUqlO0@ep-cold-sky-b53itt32-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function check() {
  const sql = neon(DATABASE_URL);
  const visitors = await sql`SELECT count(*) FROM utm_visitors`;
  const sessions = await sql`SELECT count(*) FROM utm_sessions`;
  const events = await sql`SELECT count(*) FROM utm_tracking_events`;
  const orders = await sql`SELECT count(*) FROM utm_orders`;
  console.log('Neon Database Live Counts:');
  console.log('Visitors:', visitors[0].count);
  console.log('Sessions:', sessions[0].count);
  console.log('Events:  ', events[0].count);
  console.log('Orders:  ', orders[0].count);
}

check();
