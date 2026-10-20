import {
  TrackingEventPayload,
  EventType,
  AttributionData,
  VisitorInfo,
} from '@/types/analytics';
import { parseTrafficOrigin, generateId } from './utm';

const COOKIE_VISITOR_KEY = 'utm_analytics_vid';
const COOKIE_SESSION_KEY = 'utm_analytics_sid';
const COOKIE_FIRST_TOUCH_KEY = 'utm_analytics_ft';
const COOKIE_LAST_TOUCH_KEY = 'utm_analytics_lt';
const COOKIE_LAST_ACTIVITY = 'utm_analytics_act';
const SESSION_START_EMITTED_KEY = 'utm_session_start_emitted';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Helper to safely access browser storage
function getStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export type EventListener = (event: TrackingEventPayload) => void;

class ClientTracker {
  private visitorId = '';
  private sessionId = '';
  private attribution: AttributionData = {
    firstTouch: null,
    lastNonDirect: null,
    current: {
      source: 'direct',
      medium: 'none',
      campaign: '(direct)',
    },
  };
  private isInitialized = false;
  private listeners: Set<EventListener> = new Set();
  private sessionEvents: TrackingEventPayload[] = [];

  public subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getSessionEvents(): TrackingEventPayload[] {
    return [...this.sessionEvents];
  }

  public getVisitorInfo(): VisitorInfo {
    return {
      visitorId: this.visitorId,
      sessionId: this.sessionId,
      isNewSession: false,
      attribution: this.attribution,
    };
  }

  public init(): VisitorInfo {
    if (typeof window === 'undefined') {
      return {
        visitorId: '',
        sessionId: '',
        isNewSession: false,
        attribution: this.attribution,
      };
    }

    if (this.isInitialized) {
      return this.getVisitorInfo();
    }

    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    // 1. Resolve Visitor ID (Persistent 1st party identifier)
    let vid = getStorage(COOKIE_VISITOR_KEY);
    if (!vid) {
      vid = generateId('vid');
      setStorage(COOKIE_VISITOR_KEY, vid);
    }
    this.visitorId = vid;

    // 2. Resolve Session & Timeout
    let sid = getStorage(COOKIE_SESSION_KEY);
    const lastAct = parseInt(getStorage(COOKIE_LAST_ACTIVITY) || '0', 10);
    const isSessionExpired = !sid || now - lastAct > SESSION_TIMEOUT_MS;
    let isNewSession = false;

    if (isSessionExpired) {
      sid = generateId('sid');
      setStorage(COOKIE_SESSION_KEY, sid);
      setStorage(SESSION_START_EMITTED_KEY, '');
      isNewSession = true;
    }
    this.sessionId = sid || generateId('sid');
    setStorage(COOKIE_LAST_ACTIVITY, now.toString());

    // 3. Parse Traffic Origin & UTMs
    const currentUrl = window.location.href;
    const referrer = document.referrer;
    const parsed = parseTrafficOrigin(currentUrl, referrer);

    // Retrieve existing attribution
    let firstTouch = null;
    let lastNonDirect = null;

    try {
      const rawFt = getStorage(COOKIE_FIRST_TOUCH_KEY);
      if (rawFt) firstTouch = JSON.parse(rawFt);
    } catch {}

    try {
      const rawLt = getStorage(COOKIE_LAST_TOUCH_KEY);
      if (rawLt) lastNonDirect = JSON.parse(rawLt);
    } catch {}

    // Determine current campaign touch
    const currentTouch = {
      source: parsed.source,
      medium: parsed.medium,
      campaign: parsed.campaign,
      content: parsed.content,
      term: parsed.term,
      referrer: parsed.referrer,
      referrerHost: parsed.referrerHost,
    };

    // If new attribution came from UTMs or non-direct referrer
    if (!parsed.isDirect && parsed.source !== 'internal') {
      const touchRecord = {
        source: parsed.source,
        medium: parsed.medium,
        campaign: parsed.campaign,
        content: parsed.content,
        term: parsed.term,
        landingPage: window.location.pathname,
        timestamp: nowIso,
      };

      // Set first touch if not already set
      if (!firstTouch) {
        firstTouch = touchRecord;
        setStorage(COOKIE_FIRST_TOUCH_KEY, JSON.stringify(firstTouch));
      }

      // Update last non-direct touch
      lastNonDirect = touchRecord;
      setStorage(COOKIE_LAST_TOUCH_KEY, JSON.stringify(lastNonDirect));
    } else {
      // Direct visit: if firstTouch is completely null, record direct as first touch
      if (!firstTouch) {
        firstTouch = {
          source: 'direct',
          medium: 'none',
          campaign: '(direct)',
          landingPage: window.location.pathname,
          timestamp: nowIso,
        };
        setStorage(COOKIE_FIRST_TOUCH_KEY, JSON.stringify(firstTouch));
      }
    }

    this.attribution = {
      firstTouch,
      lastNonDirect,
      current: currentTouch,
    };

    this.isInitialized = true;

    // 4. Auto-fire session_start if not already fired for this session
    const sessionStartSent = getStorage(SESSION_START_EMITTED_KEY);
    if (sessionStartSent !== this.sessionId) {
      this.sendEvent('session_start', {
        pagePath: window.location.pathname,
        metadata: {
          referrer: document.referrer || '(none)',
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          userAgent: navigator.userAgent.substring(0, 100),
        },
      });
      setStorage(SESSION_START_EMITTED_KEY, this.sessionId);
    }

    // 5. Fire initial page_view
    this.sendEvent('page_view', {
      pagePath: window.location.pathname,
      metadata: {
        title: document.title,
        url: window.location.href,
      },
    });

    return {
      visitorId: this.visitorId,
      sessionId: this.sessionId,
      isNewSession,
      attribution: this.attribution,
    };
  }

  public trackPageView(pagePath?: string, metadata?: Record<string, any>) {
    this.sendEvent('page_view', {
      pagePath: pagePath || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      metadata,
    });
  }

  public trackViewItem(productId: string, productName: string, price: number) {
    this.sendEvent('view_item', {
      pagePath: typeof window !== 'undefined' ? window.location.pathname : '/',
      productId,
      productName,
      revenue: price,
      currency: 'USD',
      metadata: { productId, productName, price },
    });
  }

  public trackAddToCart(productId: string, productName: string, price: number) {
    this.sendEvent('add_to_cart', {
      pagePath: typeof window !== 'undefined' ? window.location.pathname : '/',
      productId,
      productName,
      revenue: price,
      currency: 'USD',
      metadata: { productId, productName, price },
    });
  }

  public trackBeginCheckout(items: any[], totalRevenue: number) {
    this.sendEvent('begin_checkout', {
      pagePath: typeof window !== 'undefined' ? window.location.pathname : '/',
      revenue: totalRevenue,
      currency: 'USD',
      metadata: { itemsCount: items.length, items, totalRevenue },
    });
  }

  public trackPurchase(orderId: string, totalRevenue: number, items: any[]) {
    this.sendEvent('purchase', {
      pagePath: typeof window !== 'undefined' ? window.location.pathname : '/',
      orderId,
      revenue: totalRevenue,
      currency: 'USD',
      metadata: { orderId, totalRevenue, items },
    });
  }

  public trackCustomEvent(eventName: string, metadata?: Record<string, any>) {
    this.sendEvent('custom_event', {
      pagePath: typeof window !== 'undefined' ? window.location.pathname : '/',
      metadata: { customName: eventName, ...metadata },
    });
  }

  private sendEvent(
    eventName: EventType,
    params: {
      pagePath: string;
      productId?: string;
      productName?: string;
      orderId?: string;
      revenue?: number;
      currency?: string;
      metadata?: Record<string, any>;
    }
  ) {
    if (typeof window === 'undefined') return;

    // Refresh last activity
    setStorage(COOKIE_LAST_ACTIVITY, Date.now().toString());

    // Resolve UTM attribution for event
    // If current touch is direct or internal, fallback to lastNonDirect campaign
    const effectiveAttribution =
      this.attribution.current.source !== 'direct' && this.attribution.current.source !== 'internal'
        ? this.attribution.current
        : this.attribution.lastNonDirect || this.attribution.current;

    const eventPayload: TrackingEventPayload = {
      eventId: generateId('evt'),
      timestamp: new Date().toISOString(),
      visitorId: this.visitorId,
      sessionId: this.sessionId,
      eventName,
      pagePath: params.pagePath,
      referrer: document.referrer || undefined,
      referrerHost: document.referrer ? new URL(document.referrer).hostname : undefined,
      utm_source: effectiveAttribution.source,
      utm_medium: effectiveAttribution.medium,
      utm_campaign: effectiveAttribution.campaign,
      utm_content: effectiveAttribution.content,
      utm_term: effectiveAttribution.term,
      productId: params.productId,
      productName: params.productName,
      orderId: params.orderId,
      revenue: params.revenue,
      currency: params.currency || 'USD',
      metadata: params.metadata,
      attribution: this.attribution,
    };

    // Store in local session cache
    this.sessionEvents.unshift(eventPayload);
    if (this.sessionEvents.length > 50) {
      this.sessionEvents.pop();
    }

    // Notify listeners (UI reactive updates)
    this.listeners.forEach((fn) => {
      try {
        fn(eventPayload);
      } catch (e) {
        console.error('Error notifying event listener:', e);
      }
    });

    // Send payload to backend
    this.dispatchToBackend(eventPayload);
  }

  private async dispatchToBackend(payload: TrackingEventPayload) {
    try {
      const res = await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        keepalive: true, // Keepalive ensures events fire even if user navigates
      });
      if (!res.ok) {
        console.warn('[UTM Tracker] Backend responded with status:', res.status);
      }
    } catch (err) {
      console.error('[UTM Tracker] Failed to dispatch event to server:', err);
    }
  }
}

// Global Singleton for the browser session
export const tracker = new ClientTracker();
