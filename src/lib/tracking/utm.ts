import { UTMParams, AttributionData } from '@/types/analytics';

export interface ParsedTrafficInfo {
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  term?: string;
  referrer?: string;
  referrerHost?: string;
  isDirect: boolean;
}

/**
 * Parses UTM parameters and resolves traffic origin using UTM > Known Referrers > Generic Referrer > Direct
 */
export function parseTrafficOrigin(currentUrlStr: string, referrerStr?: string): ParsedTrafficInfo {
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

    // 1. Explicit UTM tagging (highest precedence)
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

    // 2. Known Referrer detection when no UTMs are present
    if (referrerHost) {
      // Check if referrer is the same site (internal navigation)
      const currentHost = url.hostname.toLowerCase();
      if (referrerHost === currentHost) {
        // Internal navigation - caller will retain existing session attribution
        return {
          source: 'internal',
          medium: 'internal',
          campaign: 'internal',
          referrer: referrerStr,
          referrerHost,
          isDirect: false,
        };
      }

      // Search Engines
      if (
        referrerHost.includes('google.') ||
        referrerHost.includes('bing.') ||
        referrerHost.includes('yahoo.') ||
        referrerHost.includes('duckduckgo.') ||
        referrerHost.includes('ecosia.') ||
        referrerHost.includes('baidu.')
      ) {
        const engine = referrerHost.includes('google')
          ? 'google'
          : referrerHost.includes('bing')
          ? 'bing'
          : referrerHost.includes('duckduckgo')
          ? 'duckduckgo'
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

      // Social Platforms
      if (referrerHost.includes('linkedin.') || referrerHost.includes('lnkd.in')) {
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
      if (referrerHost.includes('facebook.') || referrerHost.includes('fb.me') || referrerHost.includes('messenger.')) {
        return {
          source: 'facebook',
          medium: 'social_referral',
          campaign: 'facebook_organic',
          referrer: referrerStr,
          referrerHost,
          isDirect: false,
        };
      }
      if (referrerHost.includes('t.co') || referrerHost.includes('twitter.') || referrerHost.includes('x.com')) {
        return {
          source: 'twitter',
          medium: 'social_referral',
          campaign: 'twitter_organic',
          referrer: referrerStr,
          referrerHost,
          isDirect: false,
        };
      }
      if (referrerHost.includes('youtube.')) {
        return {
          source: 'youtube',
          medium: 'social_referral',
          campaign: 'youtube_organic',
          referrer: referrerStr,
          referrerHost,
          isDirect: false,
        };
      }

      // Generic external referral
      return {
        source: referrerHost,
        medium: 'referral',
        campaign: 'external_referral',
        referrer: referrerStr,
        referrerHost,
        isDirect: false,
      };
    }

    // 3. Fallback: Direct visit
    return {
      source: 'direct',
      medium: 'none',
      campaign: '(direct)',
      referrer: undefined,
      referrerHost: undefined,
      isDirect: true,
    };
  } catch (err) {
    // Graceful error fallback
    return {
      source: 'direct',
      medium: 'none',
      campaign: '(direct)',
      isDirect: true,
    };
  }
}

/**
 * Generate a unique ID (nanoid-like lightweight random ID safe across SSR/Client)
 */
export function generateId(prefix: string = 'evt'): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}${randomStr}`;
}
