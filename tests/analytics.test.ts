import { parseTrafficOrigin, generateId } from '../src/lib/tracking/utm';
import { analyticsDb } from '../src/lib/db/store';
import { DEMO_PRODUCTS } from '../src/lib/constants/products';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`, details || '');
    failed++;
  }
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING UTM TRACKING & ATTRIBUTION TEST SUITE');
  console.log('======================================================\n');

  // TEST SUITE 1: UTM Parsing
  console.log('--- Test Suite 1: UTM Parsing & Origin Resolution ---');

  // 1.1 LinkedIn Campaign
  const linkedinUrl = 'https://example.com/tracking-demo?utm_source=linkedin&utm_medium=social&utm_campaign=portfolio_launch&utm_content=hero_cta&utm_term=nextjs';
  const linkedinOrigin = parseTrafficOrigin(linkedinUrl, 'https://www.linkedin.com/');
  assert(linkedinOrigin.source === 'linkedin', 'LinkedIn source correctly extracted');
  assert(linkedinOrigin.medium === 'social', 'LinkedIn medium correctly extracted');
  assert(linkedinOrigin.campaign === 'portfolio_launch', 'LinkedIn campaign correctly extracted');
  assert(linkedinOrigin.content === 'hero_cta', 'LinkedIn content correctly extracted');
  assert(linkedinOrigin.term === 'nextjs', 'LinkedIn term correctly extracted');
  assert(linkedinOrigin.isDirect === false, 'LinkedIn traffic is NOT direct');

  // 1.2 WhatsApp Share
  const whatsappUrl = 'https://example.com/tracking-demo?utm_source=whatsapp&utm_medium=chat_share&utm_campaign=vip_referral';
  const whatsappOrigin = parseTrafficOrigin(whatsappUrl);
  assert(whatsappOrigin.source === 'whatsapp', 'WhatsApp source correctly extracted');
  assert(whatsappOrigin.medium === 'chat_share', 'WhatsApp medium correctly extracted');
  assert(whatsappOrigin.campaign === 'vip_referral', 'WhatsApp campaign correctly extracted');

  // 1.3 Google Organic (No UTMs, Referrer detected)
  const organicUrl = 'https://example.com/tracking-demo';
  const googleOrigin = parseTrafficOrigin(organicUrl, 'https://www.google.com/search?q=custom+utm+tracker');
  assert(googleOrigin.source === 'google', 'Google organic detected from referrer');
  assert(googleOrigin.medium === 'organic', 'Google medium classified as organic');
  assert(googleOrigin.campaign === 'organic_search', 'Google campaign classified as organic_search');

  // 1.4 Internal Navigation (Same host referrer)
  const internalOrigin = parseTrafficOrigin('https://example.com/tracking-demo', 'https://example.com/admin/analytics');
  assert(internalOrigin.source === 'internal', 'Internal navigation identified to retain session campaign');

  // 1.5 Direct Traffic
  const directOrigin = parseTrafficOrigin('https://example.com/tracking-demo');
  assert(directOrigin.source === 'direct', 'Direct traffic identified when no UTM and no referrer');
  assert(directOrigin.isDirect === true, 'Direct flag set to true');

  // TEST SUITE 2: ID Generation
  console.log('\n--- Test Suite 2: Unique ID Generation ---');
  const vid1 = generateId('vid');
  const vid2 = generateId('vid');
  const sid1 = generateId('sid');
  assert(vid1.startsWith('vid_'), 'Visitor ID starts with vid_ prefix');
  assert(sid1.startsWith('sid_'), 'Session ID starts with sid_ prefix');
  assert(vid1 !== vid2, 'Unique IDs are distinct across calls');

  // TEST SUITE 3: Database & Deduplication
  console.log('\n--- Test Suite 3: Database Storage & Deduplication ---');
  await analyticsDb.resetData();

  const testVid = generateId('vid_test');
  const testSid = generateId('sid_test');
  const testEid = generateId('evt_test');
  const timestamp = new Date().toISOString();

  // Ingest first event
  const res1 = await analyticsDb.recordEvent({
    eventId: testEid,
    timestamp,
    visitorId: testVid,
    sessionId: testSid,
    eventName: 'session_start',
    pagePath: '/tracking-demo',
    utm_source: 'linkedin',
    utm_medium: 'social',
    utm_campaign: 'portfolio_launch',
  });
  assert(res1.recorded === true, 'Initial session_start successfully recorded');

  // Duplicate eventId rejection
  const resDuplicate = await analyticsDb.recordEvent({
    eventId: testEid, // SAME EVENT ID
    timestamp,
    visitorId: testVid,
    sessionId: testSid,
    eventName: 'session_start',
    pagePath: '/tracking-demo',
  });
  assert(resDuplicate.recorded === false && resDuplicate.reason === 'duplicate_event_id', 'Duplicate eventId successfully rejected');

  // Duplicate session_start rejection in same session
  const resDuplicateStart = await analyticsDb.recordEvent({
    eventId: generateId('evt_second_start'),
    timestamp,
    visitorId: testVid,
    sessionId: testSid,
    eventName: 'session_start',
    pagePath: '/tracking-demo',
  });
  assert(resDuplicateStart.recorded === false && resDuplicateStart.reason === 'duplicate_session_start', 'Duplicate session_start for same session rejected');

  // Subsequent page_view allowed
  const resPv = await analyticsDb.recordEvent({
    eventId: generateId('evt_pv'),
    timestamp,
    visitorId: testVid,
    sessionId: testSid,
    eventName: 'page_view',
    pagePath: '/tracking-demo',
    utm_source: 'linkedin',
    utm_medium: 'social',
    utm_campaign: 'portfolio_launch',
  });
  assert(resPv.recorded === true, 'Subsequent page_view in same session recorded');

  // TEST SUITE 4: Verified Conversion & Attribution
  console.log('\n--- Test Suite 4: Order Conversion & Attribution ---');
  const product = DEMO_PRODUCTS[0];
  const orderAmount = product.price;

  const orderResult = await analyticsDb.recordOrder({
    orderId: generateId('ord_test'),
    sessionId: testSid,
    visitorId: testVid,
    orderAmount,
    currency: 'USD',
    orderStatus: 'simulated_success',
    createdAt: timestamp,
    utmSource: 'linkedin',
    utmMedium: 'social',
    utmCampaign: 'portfolio_launch',
  });
  assert(orderResult.recorded === true, 'Simulated order created');
  assert(orderResult.order.utmSource === 'linkedin', 'Order correctly attributed to LinkedIn source');
  assert(orderResult.order.utmCampaign === 'portfolio_launch', 'Order correctly attributed to portfolio_launch campaign');

  // TEST SUITE 5: Overview & Traffic Aggregations
  console.log('\n--- Test Suite 5: Metric Aggregations & Calculations ---');
  const overview = await analyticsDb.getOverview();
  assert(overview.totalSessions === 1, 'Overview shows 1 session');
  assert(overview.totalPurchases === 1, 'Overview shows 1 purchase');
  assert(overview.trackedRevenue === orderAmount, 'Overview trackedRevenue matches verified purchase amount');
  assert(overview.conversionRate === 100, 'Conversion rate correctly calculated as 100%');

  const sourcesReport = await analyticsDb.getSourcesReport();
  const linkedinReport = sourcesReport.find((s) => s.source === 'linkedin');
  assert(linkedinReport !== undefined, 'Sources report includes LinkedIn');
  assert(linkedinReport?.purchases === 1, 'LinkedIn source shows 1 purchase');
  assert(linkedinReport?.revenue === orderAmount, 'LinkedIn source revenue correctly attributed');

  console.log('\n======================================================');
  console.log(`SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
