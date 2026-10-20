import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_BVX8kIyUqlO0@ep-cold-sky-b53itt32-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function testNeonE2E() {
  console.log('\n======================================================');
  console.log('🚀 TESTING NEON POSTGRESQL END-TO-END DATA PERSISTENCE');
  console.log('======================================================\n');

  const sql = neon(DATABASE_URL);

  // 1. Verify schema tables exist
  console.log('1. Verifying Neon database tables...');
  await sql`
    CREATE TABLE IF NOT EXISTS utm_visitors (
      id TEXT PRIMARY KEY,
      visitor_id TEXT UNIQUE NOT NULL,
      first_seen TIMESTAMPTZ NOT NULL,
      last_seen TIMESTAMPTZ NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS utm_sessions (
      id TEXT PRIMARY KEY,
      session_id TEXT UNIQUE NOT NULL,
      visitor_id TEXT NOT NULL,
      started_at TIMESTAMPTZ NOT NULL,
      last_activity_at TIMESTAMPTZ NOT NULL,
      landing_page TEXT NOT NULL,
      referrer TEXT,
      referrer_host TEXT,
      source TEXT NOT NULL,
      medium TEXT NOT NULL,
      campaign TEXT NOT NULL,
      content TEXT,
      term TEXT
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS utm_tracking_events (
      id TEXT PRIMARY KEY,
      event_id TEXT UNIQUE NOT NULL,
      session_id TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      event_name TEXT NOT NULL,
      event_timestamp TIMESTAMPTZ NOT NULL,
      page_path TEXT NOT NULL,
      referrer_host TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      utm_content TEXT,
      utm_term TEXT,
      metadata JSONB
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS utm_orders (
      id TEXT PRIMARY KEY,
      order_id TEXT UNIQUE NOT NULL,
      session_id TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      order_amount NUMERIC(10, 2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      order_status TEXT NOT NULL DEFAULT 'completed',
      created_at TIMESTAMPTZ NOT NULL,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      items JSONB
    )
  `;
  console.log('✅ Tables utm_visitors, utm_sessions, utm_tracking_events, utm_orders ready in Neon.');

  // 2. Insert test LinkedIn session into Neon
  const now = new Date().toISOString();
  const testVid = `vid_neon_live_${Date.now()}`;
  const testSid = `sid_neon_live_${Date.now()}`;
  const testEid = `evt_neon_live_${Date.now()}`;
  const testOid = `ord_neon_live_${Date.now()}`;

  console.log('\n2. Ingesting live LinkedIn campaign session into Neon...');
  await sql`
    INSERT INTO utm_visitors (id, visitor_id, first_seen, last_seen)
    VALUES (${'v_' + testVid}, ${testVid}, ${now}, ${now})
    ON CONFLICT (visitor_id) DO UPDATE SET last_seen = ${now}
  `;

  await sql`
    INSERT INTO utm_sessions (
      id, session_id, visitor_id, started_at, last_activity_at,
      landing_page, source, medium, campaign
    )
    VALUES (
      ${'s_' + testSid}, ${testSid}, ${testVid}, ${now}, ${now},
      '/tracking-demo', 'linkedin', 'social', 'portfolio_launch'
    )
    ON CONFLICT (session_id) DO NOTHING
  `;

  await sql`
    INSERT INTO utm_tracking_events (
      id, event_id, session_id, visitor_id, event_name, event_timestamp,
      page_path, utm_source, utm_medium, utm_campaign, metadata
    )
    VALUES (
      ${'e_' + testEid}, ${testEid}, ${testSid}, ${testVid}, 'purchase', ${now},
      '/tracking-demo', 'linkedin', 'social', 'portfolio_launch', '{"revenue": 199.00}'
    )
    ON CONFLICT (event_id) DO NOTHING
  `;

  await sql`
    INSERT INTO utm_orders (
      id, order_id, session_id, visitor_id, order_amount, currency,
      order_status, created_at, utm_source, utm_medium, utm_campaign
    )
    VALUES (
      ${'o_' + testOid}, ${testOid}, ${testSid}, ${testVid}, 199.00, 'USD',
      'simulated_success', ${now}, 'linkedin', 'social', 'portfolio_launch'
    )
    ON CONFLICT (order_id) DO NOTHING
  `;

  console.log('✅ Live data successfully written to Neon PostgreSQL!');

  // 3. Query back from Neon
  console.log('\n3. Querying recorded data directly from Neon...');
  const sessions = await sql`SELECT * FROM utm_sessions WHERE session_id = ${testSid}`;
  const orders = await sql`SELECT * FROM utm_orders WHERE order_id = ${testOid}`;

  console.log('   Retrieved Session from Neon:', sessions[0].session_id, '| Source:', sessions[0].source, '| Campaign:', sessions[0].campaign);
  console.log('   Retrieved Order from Neon:  ', orders[0].order_id, '| Amount: $' + orders[0].order_amount, '| Status:', orders[0].order_status);

  console.log('\n======================================================');
  console.log('🎉 NEON POSTGRESQL END-TO-END VERIFICATION: 100% WORKING');
  console.log('======================================================\n');
}

testNeonE2E().catch((e) => {
  console.error('Neon test failed:', e);
  process.exit(1);
});
