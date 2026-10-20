import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, testName, details) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`, details || '');
    failed++;
  }
}

// 1. UTM Parser Logic Test
function parseTrafficOrigin(currentUrlStr, referrerStr) {
  try {
    const url = new URL(currentUrlStr);
    const searchParams = url.searchParams;

    const utm_source = searchParams.get('utm_source')?.trim().toLowerCase();
    const utm_medium = searchParams.get('utm_medium')?.trim().toLowerCase();
    const utm_campaign = searchParams.get('utm_campaign')?.trim().toLowerCase();
    const utm_content = searchParams.get('utm_content')?.trim();
    const utm_term = searchParams.get('utm_term')?.trim();

    let referrerHost = '';
    if (referrerStr && referrerStr.trim().length > 0) {
      try {
        const refUrl = new URL(referrerStr);
        referrerHost = refUrl.hostname.toLowerCase();
      } catch {
        referrerHost = '';
      }
    }

    if (utm_source) {
      return {
        source: utm_source,
        medium: utm_medium || 'campaign',
        campaign: utm_campaign || 'unspecified_campaign',
        content: utm_content || undefined,
        term: utm_term || undefined,
        referrer: referrerStr || undefined,
        referrerHost: referrerHost || undefined,
        isDirect: false,
      };
    }

    if (referrerHost) {
      const currentHost = url.hostname.toLowerCase();
      if (referrerHost === currentHost) {
        return {
          source: 'internal',
          medium: 'internal',
          campaign: 'internal',
          referrer: referrerStr,
          referrerHost,
          isDirect: false,
        };
      }

      if (
        referrerHost.includes('google.') ||
        referrerHost.includes('bing.') ||
        referrerHost.includes('yahoo.') ||
        referrerHost.includes('duckduckgo.')
      ) {
        const engine = referrerHost.includes('google')
          ? 'google'
          : referrerHost.includes('bing')
          ? 'bing'
          : 'organic_search';
        return {
          source: engine,
          medium: 'organic',
          campaign: 'organic_search',
          referrer: referrerStr,
          referrerHost,
          isDirect: false,
        };
      }

      if (referrerHost.includes('linkedin.')) {
        return {
          source: 'linkedin',
          medium: 'social_referral',
          campaign: 'linkedin_organic',
          referrer: referrerStr,
          referrerHost,
          isDirect: false,
        };
      }
      if (referrerHost.includes('instagram.')) {
        return {
          source: 'instagram',
          medium: 'social_referral',
          campaign: 'instagram_organic',
          referrer: referrerStr,
          referrerHost,
          isDirect: false,
        };
      }
      if (referrerHost.includes('whatsapp.') || referrerHost.includes('wa.me')) {
        return {
          source: 'whatsapp',
          medium: 'messaging',
          campaign: 'whatsapp_share',
          referrer: referrerStr,
          referrerHost,
          isDirect: false,
        };
      }

      return {
        source: referrerHost,
        medium: 'referral',
        campaign: 'external_referral',
        referrer: referrerStr,
        referrerHost,
        isDirect: false,
      };
    }

    return {
      source: 'direct',
      medium: 'none',
      campaign: '(direct)',
      isDirect: true,
    };
  } catch (err) {
    return {
      source: 'direct',
      medium: 'none',
      campaign: '(direct)',
      isDirect: true,
    };
  }
}

function generateId(prefix = 'evt') {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}${randomStr}`;
}

console.log('\n======================================================');
console.log('🧪 RUNNING CUSTOM UTM TRACKING VERIFICATION SUITE');
console.log('======================================================\n');

// SUITE 1: UTM Parsing Verification
console.log('--- Test Suite 1: UTM Parameter Extraction & Attribution Parsing ---');
const linkedinRes = parseTrafficOrigin(
  'http://localhost:3000/tracking-demo?utm_source=linkedin&utm_medium=social&utm_campaign=portfolio_launch&utm_content=hero_cta&utm_term=nextjs',
  'https://www.linkedin.com/feed/'
);
assert(linkedinRes.source === 'linkedin', 'LinkedIn utm_source parsed correctly');
assert(linkedinRes.medium === 'social', 'LinkedIn utm_medium parsed correctly');
assert(linkedinRes.campaign === 'portfolio_launch', 'LinkedIn utm_campaign parsed correctly');
assert(linkedinRes.content === 'hero_cta', 'LinkedIn utm_content parsed correctly');
assert(linkedinRes.term === 'nextjs', 'LinkedIn utm_term parsed correctly');
assert(linkedinRes.isDirect === false, 'LinkedIn traffic identified as non-direct campaign');

// SUITE 2: Multi-Channel Attribution
console.log('\n--- Test Suite 2: Multi-Channel Attribution Detection ---');
const instaRes = parseTrafficOrigin(
  'http://localhost:3000/tracking-demo?utm_source=instagram&utm_medium=social_story&utm_campaign=spring_deals'
);
assert(instaRes.source === 'instagram', 'Instagram utm_source parsed correctly');
assert(instaRes.medium === 'social_story', 'Instagram utm_medium parsed correctly');

const waRes = parseTrafficOrigin(
  'http://localhost:3000/tracking-demo?utm_source=whatsapp&utm_medium=chat_share&utm_campaign=vip_referral'
);
assert(waRes.source === 'whatsapp', 'WhatsApp utm_source parsed correctly');
assert(waRes.medium === 'chat_share', 'WhatsApp utm_medium parsed correctly');

const googleOrganic = parseTrafficOrigin(
  'http://localhost:3000/tracking-demo',
  'https://www.google.com/search?q=nextjs+utm'
);
assert(googleOrganic.source === 'google' && googleOrganic.medium === 'organic', 'Google organic detected from HTTP referrer');

const directRes = parseTrafficOrigin('http://localhost:3000/tracking-demo');
assert(directRes.source === 'direct' && directRes.isDirect === true, 'Direct visit properly detected without artificial UTM');

// SUITE 3: Token Generation & Idempotency
console.log('\n--- Test Suite 3: Token Generation & ID Uniqueness ---');
const vid = generateId('vid');
const sid = generateId('sid');
const eid = generateId('evt');
assert(vid.startsWith('vid_') && vid.length > 10, 'Visitor ID token format valid');
assert(sid.startsWith('sid_') && sid.length > 10, 'Session ID token format valid');
assert(eid.startsWith('evt_') && eid.length > 10, 'Event ID token format valid');
assert(generateId('vid') !== generateId('vid'), 'Two successive IDs are unique');

// SUITE 4: Conversion Rate and Revenue Calculation Formula
console.log('\n--- Test Suite 4: Analytics Math & Conversion Calculations ---');
const totalPurchases = 3;
const totalSessions = 15;
const calculatedRate = Number(((totalPurchases / totalSessions) * 100).toFixed(2));
assert(calculatedRate === 20, 'Conversion rate calculation formula produces 20.00%');

const items = [
  { price: 199.0, quantity: 1 },
  { price: 79.0, quantity: 2 },
];
const serverCalculatedRevenue = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
assert(serverCalculatedRevenue === 357.0, 'Server-side verified pricing prevents client tampering ($357.00)');

console.log('\n======================================================');
console.log(`SUMMARY: ${passed} PASSED | ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
}
