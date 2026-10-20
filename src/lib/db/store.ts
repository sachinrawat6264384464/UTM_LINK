import fs from 'fs';
import path from 'path';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import {
  OverviewMetrics,
  TrafficSourceMetric,
  CampaignMetric,
  RecentEventItem,
  TrackingEventPayload,
} from '@/types/analytics';

export interface DbVisitor {
  id: string;
  visitorId: string;
  firstSeen: string;
  lastSeen: string;
}

export interface DbSession {
  id: string;
  sessionId: string;
  visitorId: string;
  startedAt: string;
  lastActivityAt: string;
  landingPage: string;
  referrer: string | null;
  referrerHost: string | null;
  source: string;
  medium: string;
  campaign: string;
  content: string | null;
  term: string | null;
}

export interface DbTrackingEvent {
  id: string;
  eventId: string;
  sessionId: string;
  visitorId: string;
  eventName: string;
  eventTimestamp: string;
  pagePath: string;
  referrerHost: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  metadata?: any;
}

export interface DbOrder {
  id: string;
  orderId: string;
  sessionId: string;
  visitorId: string;
  orderAmount: number;
  currency: string;
  orderStatus: string;
  createdAt: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  items?: any[];
}

export interface AnalyticsDbSchema {
  visitors: DbVisitor[];
  sessions: DbSession[];
  tracking_events: DbTrackingEvent[];
  orders: DbOrder[];
}

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'data')
  : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'analytics_store.json');

const NEON_DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_BVX8kIyUqlO0@ep-cold-sky-b53itt32-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require';

class AnalyticsStore {
  private data: AnalyticsDbSchema = {
    visitors: [],
    sessions: [],
    tracking_events: [],
    orders: [],
  };

  private initialized = false;
  private neonClient: NeonQueryFunction<false, false> | null = null;
  private neonConnected = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (this.initialized) return;

    // 1. Try connecting to Neon PostgreSQL if DATABASE_URL is present
    if (NEON_DATABASE_URL && NEON_DATABASE_URL.includes('neon.tech')) {
      try {
        const sql = neon(NEON_DATABASE_URL);
        // Test query and initialize Neon schema
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
        this.neonClient = sql;
        this.neonConnected = true;
        console.log('[AnalyticsStore] Successfully connected and initialized Neon PostgreSQL tables.');
      } catch (neonErr) {
        console.warn('[AnalyticsStore] Neon PostgreSQL initialization notice (falling back to local store):', neonErr);
        this.neonConnected = false;
      }
    }

    // 2. Initialize local JSON store as local cache/fallback
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
    } catch (e) {
      console.error('[AnalyticsStore] Local store fallback error:', e);
    }

    this.initialized = true;
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[AnalyticsStore] Failed to persist data:', e);
    }
  }

  public async getVisitor(visitorId: string): Promise<DbVisitor | undefined> {
    await this.init();
    if (this.neonConnected && this.neonClient) {
      try {
        const rows = await this.neonClient`SELECT * FROM utm_visitors WHERE visitor_id = ${visitorId} LIMIT 1`;
        if (rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            visitorId: r.visitor_id,
            firstSeen: new Date(r.first_seen).toISOString(),
            lastSeen: new Date(r.last_seen).toISOString(),
          };
        }
      } catch {}
    }
    return this.data.visitors.find((v) => v.visitorId === visitorId);
  }

  public async upsertVisitor(visitorId: string, timestamp: string): Promise<DbVisitor> {
    await this.init();
    const id = `v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (this.neonConnected && this.neonClient) {
      try {
        await this.neonClient`
          INSERT INTO utm_visitors (id, visitor_id, first_seen, last_seen)
          VALUES (${id}, ${visitorId}, ${timestamp}, ${timestamp})
          ON CONFLICT (visitor_id) DO UPDATE SET last_seen = ${timestamp}
        `;
      } catch (err) {
        console.error('Neon upsertVisitor error:', err);
      }
    }

    let visitor = this.data.visitors.find((v) => v.visitorId === visitorId);
    if (!visitor) {
      visitor = {
        id,
        visitorId,
        firstSeen: timestamp,
        lastSeen: timestamp,
      };
      this.data.visitors.push(visitor);
    } else {
      visitor.lastSeen = timestamp;
    }
    this.save();
    return visitor;
  }

  public async getSession(sessionId: string): Promise<DbSession | undefined> {
    await this.init();
    if (this.neonConnected && this.neonClient) {
      try {
        const rows = await this.neonClient`SELECT * FROM utm_sessions WHERE session_id = ${sessionId} LIMIT 1`;
        if (rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            sessionId: r.session_id,
            visitorId: r.visitor_id,
            startedAt: new Date(r.started_at).toISOString(),
            lastActivityAt: new Date(r.last_activity_at).toISOString(),
            landingPage: r.landing_page,
            referrer: r.referrer,
            referrerHost: r.referrer_host,
            source: r.source,
            medium: r.medium,
            campaign: r.campaign,
            content: r.content,
            term: r.term,
          };
        }
      } catch {}
    }
    return this.data.sessions.find((s) => s.sessionId === sessionId);
  }

  public async createOrUpdateSession(
    sessionId: string,
    visitorId: string,
    sessionData: {
      startedAt: string;
      lastActivityAt: string;
      landingPage: string;
      referrer?: string | null;
      referrerHost?: string | null;
      source: string;
      medium: string;
      campaign: string;
      content?: string | null;
      term?: string | null;
    }
  ): Promise<DbSession> {
    await this.init();
    const id = `s_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (this.neonConnected && this.neonClient) {
      try {
        await this.neonClient`
          INSERT INTO utm_sessions (
            id, session_id, visitor_id, started_at, last_activity_at,
            landing_page, referrer, referrer_host, source, medium, campaign, content, term
          )
          VALUES (
            ${id}, ${sessionId}, ${visitorId}, ${sessionData.startedAt}, ${sessionData.lastActivityAt},
            ${sessionData.landingPage}, ${sessionData.referrer || null}, ${sessionData.referrerHost || null},
            ${sessionData.source || 'direct'}, ${sessionData.medium || 'none'}, ${sessionData.campaign || '(direct)'},
            ${sessionData.content || null}, ${sessionData.term || null}
          )
          ON CONFLICT (session_id) DO UPDATE SET last_activity_at = ${sessionData.lastActivityAt}
        `;
      } catch (err) {
        console.error('Neon createOrUpdateSession error:', err);
      }
    }

    let session = this.data.sessions.find((s) => s.sessionId === sessionId);
    if (!session) {
      session = {
        id,
        sessionId,
        visitorId,
        startedAt: sessionData.startedAt,
        lastActivityAt: sessionData.lastActivityAt,
        landingPage: sessionData.landingPage,
        referrer: sessionData.referrer || null,
        referrerHost: sessionData.referrerHost || null,
        source: sessionData.source || 'direct',
        medium: sessionData.medium || 'none',
        campaign: sessionData.campaign || '(direct)',
        content: sessionData.content || null,
        term: sessionData.term || null,
      };
      this.data.sessions.push(session);
    } else {
      session.lastActivityAt = sessionData.lastActivityAt;
    }
    this.save();
    return session;
  }

  public async recordEvent(event: TrackingEventPayload): Promise<{ recorded: boolean; reason?: string }> {
    await this.init();

    // Check duplicate eventId
    if (this.neonConnected && this.neonClient) {
      try {
        const existing = await this.neonClient`SELECT id FROM utm_tracking_events WHERE event_id = ${event.eventId} LIMIT 1`;
        if (existing.length > 0) return { recorded: false, reason: 'duplicate_event_id' };

        if (event.eventName === 'session_start') {
          const startEvt = await this.neonClient`SELECT id FROM utm_tracking_events WHERE session_id = ${event.sessionId} AND event_name = 'session_start' LIMIT 1`;
          if (startEvt.length > 0) return { recorded: false, reason: 'duplicate_session_start' };
        }
      } catch {}
    } else {
      if (this.data.tracking_events.some((e) => e.eventId === event.eventId)) {
        return { recorded: false, reason: 'duplicate_event_id' };
      }
      if (event.eventName === 'session_start') {
        const existingStart = this.data.tracking_events.find(
          (e) => e.sessionId === event.sessionId && e.eventName === 'session_start'
        );
        if (existingStart) {
          return { recorded: false, reason: 'duplicate_session_start' };
        }
      }
    }

    // Upsert visitor & session
    await this.upsertVisitor(event.visitorId, event.timestamp);
    await this.createOrUpdateSession(event.sessionId, event.visitorId, {
      startedAt: event.timestamp,
      lastActivityAt: event.timestamp,
      landingPage: event.pagePath,
      referrer: event.referrer,
      referrerHost: event.referrerHost,
      source: event.utm_source || 'direct',
      medium: event.utm_medium || 'none',
      campaign: event.utm_campaign || '(direct)',
      content: event.utm_content,
      term: event.utm_term,
    });

    const eventDbId = `e_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const metadataObj = { revenue: event.revenue, ...(event.metadata || {}) };

    if (this.neonConnected && this.neonClient) {
      try {
        await this.neonClient`
          INSERT INTO utm_tracking_events (
            id, event_id, session_id, visitor_id, event_name, event_timestamp,
            page_path, referrer_host, utm_source, utm_medium, utm_campaign,
            utm_content, utm_term, metadata
          )
          VALUES (
            ${eventDbId}, ${event.eventId}, ${event.sessionId}, ${event.visitorId},
            ${event.eventName}, ${event.timestamp}, ${event.pagePath},
            ${event.referrerHost || null}, ${event.utm_source || null}, ${event.utm_medium || null},
            ${event.utm_campaign || null}, ${event.utm_content || null}, ${event.utm_term || null},
            ${JSON.stringify(metadataObj)}
          )
        `;
      } catch (err) {
        console.error('Neon recordEvent error:', err);
      }
    }

    const dbEvent: DbTrackingEvent = {
      id: eventDbId,
      eventId: event.eventId,
      sessionId: event.sessionId,
      visitorId: event.visitorId,
      eventName: event.eventName,
      eventTimestamp: event.timestamp,
      pagePath: event.pagePath,
      referrerHost: event.referrerHost || null,
      utmSource: event.utm_source || null,
      utmMedium: event.utm_medium || null,
      utmCampaign: event.utm_campaign || null,
      utmContent: event.utm_content || null,
      utmTerm: event.utm_term || null,
      metadata: metadataObj,
    };

    this.data.tracking_events.push(dbEvent);
    this.save();
    return { recorded: true };
  }

  public async recordOrder(order: {
    orderId: string;
    sessionId: string;
    visitorId: string;
    orderAmount: number;
    currency: string;
    orderStatus: string;
    createdAt: string;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    items?: any[];
  }): Promise<{ recorded: boolean; order: DbOrder }> {
    await this.init();

    const session = await this.getSession(order.sessionId);
    const orderDbId = `o_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const utmSource = order.utmSource || session?.source || 'direct';
    const utmMedium = order.utmMedium || session?.medium || 'none';
    const utmCampaign = order.utmCampaign || session?.campaign || '(direct)';

    if (this.neonConnected && this.neonClient) {
      try {
        await this.neonClient`
          INSERT INTO utm_orders (
            id, order_id, session_id, visitor_id, order_amount, currency,
            order_status, created_at, utm_source, utm_medium, utm_campaign, items
          )
          VALUES (
            ${orderDbId}, ${order.orderId}, ${order.sessionId}, ${order.visitorId},
            ${order.orderAmount}, ${order.currency || 'USD'}, ${order.orderStatus || 'completed'},
            ${order.createdAt}, ${utmSource}, ${utmMedium}, ${utmCampaign},
            ${JSON.stringify(order.items || [])}
          )
          ON CONFLICT (order_id) DO NOTHING
        `;
      } catch (err) {
        console.error('Neon recordOrder error:', err);
      }
    }

    const dbOrder: DbOrder = {
      id: orderDbId,
      orderId: order.orderId,
      sessionId: order.sessionId,
      visitorId: order.visitorId,
      orderAmount: order.orderAmount,
      currency: order.currency || 'USD',
      orderStatus: order.orderStatus || 'completed',
      createdAt: order.createdAt,
      utmSource,
      utmMedium,
      utmCampaign,
      items: order.items || [],
    };

    this.data.orders.push(dbOrder);
    this.save();
    return { recorded: true, order: dbOrder };
  }

  public async getOverview(filters?: { source?: string; campaign?: string; startDate?: string; endDate?: string }): Promise<OverviewMetrics> {
    await this.init();

    let events = this.data.tracking_events;
    let sessions = this.data.sessions;
    let orders = this.data.orders;
    let visitors = this.data.visitors;

    if (filters?.source && filters.source !== 'all') {
      sessions = sessions.filter((s) => s.source.toLowerCase() === filters.source!.toLowerCase());
      const sessionIds = new Set(sessions.map((s) => s.sessionId));
      events = events.filter((e) => sessionIds.has(e.sessionId));
      orders = orders.filter((o) => sessionIds.has(o.sessionId));
    }

    if (filters?.campaign && filters.campaign !== 'all') {
      sessions = sessions.filter((s) => s.campaign.toLowerCase() === filters.campaign!.toLowerCase());
      const sessionIds = new Set(sessions.map((s) => s.sessionId));
      events = events.filter((e) => sessionIds.has(e.sessionId));
      orders = orders.filter((o) => sessionIds.has(o.sessionId));
    }

    const uniqueVisitorIds = new Set(sessions.map((s) => s.visitorId));
    const totalSessions = sessions.length;
    const totalPageViews = events.filter((e) => e.eventName === 'page_view').length;
    const totalAddToCart = events.filter((e) => e.eventName === 'add_to_cart').length;
    const totalPurchases = orders.length;
    const trackedRevenue = orders.reduce((sum, o) => sum + Number(o.orderAmount || 0), 0);
    const conversionRate = totalSessions > 0 ? Number(((totalPurchases / totalSessions) * 100).toFixed(2)) : 0;

    return {
      totalVisitors: visitors.length,
      totalSessions,
      totalPageViews,
      uniqueVisitors: uniqueVisitorIds.size,
      totalAddToCart,
      totalPurchases,
      trackedRevenue: Number(trackedRevenue.toFixed(2)),
      conversionRate,
    };
  }

  public async getSourcesReport(): Promise<TrafficSourceMetric[]> {
    await this.init();

    const sourceMap = new Map<string, {
      source: string;
      medium: string;
      campaign: string;
      visitors: Set<string>;
      sessions: Set<string>;
      pageViews: number;
      purchases: number;
      revenue: number;
    }>();

    for (const session of this.data.sessions) {
      const key = `${session.source}_${session.medium}_${session.campaign}`.toLowerCase();
      if (!sourceMap.has(key)) {
        sourceMap.set(key, {
          source: session.source,
          medium: session.medium,
          campaign: session.campaign,
          visitors: new Set(),
          sessions: new Set(),
          pageViews: 0,
          purchases: 0,
          revenue: 0,
        });
      }
      const entry = sourceMap.get(key)!;
      entry.visitors.add(session.visitorId);
      entry.sessions.add(session.sessionId);
    }

    for (const event of this.data.tracking_events) {
      if (event.eventName === 'page_view') {
        const session = this.data.sessions.find((s) => s.sessionId === event.sessionId);
        if (session) {
          const key = `${session.source}_${session.medium}_${session.campaign}`.toLowerCase();
          const entry = sourceMap.get(key);
          if (entry) entry.pageViews += 1;
        }
      }
    }

    for (const order of this.data.orders) {
      const session = this.data.sessions.find((s) => s.sessionId === order.sessionId);
      const source = order.utmSource || session?.source || 'direct';
      const medium = order.utmMedium || session?.medium || 'none';
      const campaign = order.utmCampaign || session?.campaign || '(direct)';
      const key = `${source}_${medium}_${campaign}`.toLowerCase();
      const entry = sourceMap.get(key);
      if (entry) {
        entry.purchases += 1;
        entry.revenue += Number(order.orderAmount || 0);
      }
    }

    const results: TrafficSourceMetric[] = [];
    for (const [, val] of sourceMap.entries()) {
      const sessionCount = val.sessions.size;
      const conversionRate = sessionCount > 0 ? Number(((val.purchases / sessionCount) * 100).toFixed(2)) : 0;
      results.push({
        source: val.source,
        medium: val.medium,
        campaign: val.campaign,
        visitors: val.visitors.size,
        sessions: sessionCount,
        pageViews: val.pageViews,
        purchases: val.purchases,
        revenue: Number(val.revenue.toFixed(2)),
        conversionRate,
      });
    }

    return results.sort((a, b) => b.sessions - a.sessions);
  }

  public async getCampaignsReport(): Promise<CampaignMetric[]> {
    await this.init();

    const campaignMap = new Map<string, {
      campaign: string;
      source: string;
      medium: string;
      visitors: Set<string>;
      sessions: Set<string>;
      pageViews: number;
      purchases: number;
      revenue: number;
    }>();

    for (const session of this.data.sessions) {
      const key = session.campaign.toLowerCase();
      if (!campaignMap.has(key)) {
        campaignMap.set(key, {
          campaign: session.campaign,
          source: session.source,
          medium: session.medium,
          visitors: new Set(),
          sessions: new Set(),
          pageViews: 0,
          purchases: 0,
          revenue: 0,
        });
      }
      const entry = campaignMap.get(key)!;
      entry.visitors.add(session.visitorId);
      entry.sessions.add(session.sessionId);
    }

    for (const event of this.data.tracking_events) {
      if (event.eventName === 'page_view') {
        const session = this.data.sessions.find((s) => s.sessionId === event.sessionId);
        if (session) {
          const entry = campaignMap.get(session.campaign.toLowerCase());
          if (entry) entry.pageViews += 1;
        }
      }
    }

    for (const order of this.data.orders) {
      const session = this.data.sessions.find((s) => s.sessionId === order.sessionId);
      const campaignKey = (order.utmCampaign || session?.campaign || '(direct)').toLowerCase();
      const entry = campaignMap.get(campaignKey);
      if (entry) {
        entry.purchases += 1;
        entry.revenue += Number(order.orderAmount || 0);
      }
    }

    const results: CampaignMetric[] = [];
    for (const [, val] of campaignMap.entries()) {
      const sessionCount = val.sessions.size;
      const conversionRate = sessionCount > 0 ? Number(((val.purchases / sessionCount) * 100).toFixed(2)) : 0;
      results.push({
        campaign: val.campaign,
        source: val.source,
        medium: val.medium,
        visitors: val.visitors.size,
        sessions: sessionCount,
        pageViews: val.pageViews,
        purchases: val.purchases,
        revenue: Number(val.revenue.toFixed(2)),
        conversionRate,
      });
    }

    return results.sort((a, b) => b.revenue - a.revenue || b.sessions - a.sessions);
  }

  public async getRecentEvents(limit = 50, filters?: { eventName?: string; source?: string }): Promise<RecentEventItem[]> {
    await this.init();

    let events = [...this.data.tracking_events].reverse();

    if (filters?.eventName && filters.eventName !== 'all') {
      events = events.filter((e) => e.eventName === filters.eventName);
    }

    if (filters?.source && filters.source !== 'all') {
      events = events.filter((e) => (e.utmSource || 'direct').toLowerCase() === filters.source!.toLowerCase());
    }

    return events.slice(0, limit).map((e) => {
      const session = this.data.sessions.find((s) => s.sessionId === e.sessionId);
      return {
        id: e.id,
        eventId: e.eventId,
        eventName: e.eventName,
        eventTimestamp: e.eventTimestamp,
        pagePath: e.pagePath,
        source: e.utmSource || session?.source || 'direct',
        medium: e.utmMedium || session?.medium || 'none',
        campaign: e.utmCampaign || session?.campaign || '(direct)',
        visitorId: e.visitorId,
        sessionId: e.sessionId,
        revenue: e.metadata?.revenue || e.metadata?.amount,
        metadata: e.metadata,
      };
    });
  }

  public async getVisualizationsData() {
    await this.init();

    const timeMap = new Map<string, { date: string; visitors: Set<string>; sessions: Set<string>; pageViews: number; purchases: number }>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      timeMap.set(dateKey, {
        date: dateKey,
        visitors: new Set(),
        sessions: new Set(),
        pageViews: 0,
        purchases: 0,
      });
    }

    for (const s of this.data.sessions) {
      const dateKey = s.startedAt.split('T')[0];
      if (timeMap.has(dateKey)) {
        const item = timeMap.get(dateKey)!;
        item.visitors.add(s.visitorId);
        item.sessions.add(s.sessionId);
      }
    }

    for (const e of this.data.tracking_events) {
      if (e.eventName === 'page_view') {
        const dateKey = e.eventTimestamp.split('T')[0];
        if (timeMap.has(dateKey)) {
          timeMap.get(dateKey)!.pageViews += 1;
        }
      }
    }

    for (const o of this.data.orders) {
      const dateKey = o.createdAt.split('T')[0];
      if (timeMap.has(dateKey)) {
        timeMap.get(dateKey)!.purchases += 1;
      }
    }

    const timeline = Array.from(timeMap.values()).map((item) => ({
      date: item.date,
      visitors: item.visitors.size,
      sessions: item.sessions.size,
      pageViews: item.pageViews,
      purchases: item.purchases,
    }));

    const sourceCounts = new Map<string, number>();
    for (const s of this.data.sessions) {
      const src = s.source || 'direct';
      sourceCounts.set(src, (sourceCounts.get(src) || 0) + 1);
    }
    const sourcesDistribution = Array.from(sourceCounts.entries()).map(([source, count]) => ({
      source,
      count,
    }));

    const purchasesBySourceMap = new Map<string, { source: string; purchases: number; revenue: number }>();
    for (const o of this.data.orders) {
      const src = o.utmSource || 'direct';
      if (!purchasesBySourceMap.has(src)) {
        purchasesBySourceMap.set(src, { source: src, purchases: 0, revenue: 0 });
      }
      const entry = purchasesBySourceMap.get(src)!;
      entry.purchases += 1;
      entry.revenue += Number(o.orderAmount || 0);
    }
    const purchasesBySource = Array.from(purchasesBySourceMap.values()).map((p) => ({
      source: p.source,
      purchases: p.purchases,
      revenue: Number(p.revenue.toFixed(2)),
    }));

    const revenueByCampaignMap = new Map<string, { campaign: string; revenue: number; purchases: number }>();
    for (const o of this.data.orders) {
      const camp = o.utmCampaign || '(direct)';
      if (!revenueByCampaignMap.has(camp)) {
        revenueByCampaignMap.set(camp, { campaign: camp, revenue: 0, purchases: 0 });
      }
      const entry = revenueByCampaignMap.get(camp)!;
      entry.revenue += Number(o.orderAmount || 0);
      entry.purchases += 1;
    }
    const revenueByCampaign = Array.from(revenueByCampaignMap.values()).map((c) => ({
      campaign: c.campaign,
      revenue: Number(c.revenue.toFixed(2)),
      purchases: c.purchases,
    }));

    return {
      timeline,
      sourcesDistribution,
      purchasesBySource,
      revenueByCampaign,
    };
  }

  public async seedDemoData() {
    await this.init();
    const batchId = Date.now().toString(36);

    const sources = [
      { source: 'linkedin', medium: 'social', campaign: 'portfolio_launch' },
      { source: 'instagram', medium: 'social_story', campaign: 'spring_deals' },
      { source: 'whatsapp', medium: 'chat_share', campaign: 'vip_referral' },
      { source: 'facebook', medium: 'paid_ad', campaign: 'retargeting_q2' },
      { source: 'google', medium: 'organic', campaign: 'organic_search' },
      { source: 'direct', medium: 'none', campaign: '(direct)' },
    ];

    const now = Date.now();
    for (let i = 0; i < 24; i++) {
      const srcObj = sources[i % sources.length];
      const daysAgo = Math.floor(Math.random() * 5);
      const eventTime = new Date(now - daysAgo * 86400000 - Math.random() * 36000000).toISOString();
      const vid = `vid_demo_${batchId}_${Math.floor(i / 2)}`;
      const sid = `sid_demo_${batchId}_${i}`;

      await this.upsertVisitor(vid, eventTime);
      await this.createOrUpdateSession(sid, vid, {
        startedAt: eventTime,
        lastActivityAt: eventTime,
        landingPage: '/tracking-demo',
        source: srcObj.source,
        medium: srcObj.medium,
        campaign: srcObj.campaign,
      });

      await this.recordEvent({
        eventId: `evt_demo_start_${batchId}_${i}`,
        timestamp: eventTime,
        visitorId: vid,
        sessionId: sid,
        eventName: 'session_start',
        pagePath: '/tracking-demo',
        utm_source: srcObj.source,
        utm_medium: srcObj.medium,
        utm_campaign: srcObj.campaign,
      });

      await this.recordEvent({
        eventId: `evt_demo_pv_${batchId}_${i}`,
        timestamp: eventTime,
        visitorId: vid,
        sessionId: sid,
        eventName: 'page_view',
        pagePath: '/tracking-demo',
        utm_source: srcObj.source,
        utm_medium: srcObj.medium,
        utm_campaign: srcObj.campaign,
      });

      if (Math.random() > 0.3) {
        await this.recordEvent({
          eventId: `evt_demo_vi_${batchId}_${i}`,
          timestamp: eventTime,
          visitorId: vid,
          sessionId: sid,
          eventName: 'view_item',
          pagePath: '/tracking-demo',
          productId: 'prod_growth_bundle',
          productName: 'Growth Attribution Suite',
          utm_source: srcObj.source,
          utm_medium: srcObj.medium,
          utm_campaign: srcObj.campaign,
        });
      }

      if (Math.random() > 0.5) {
        await this.recordEvent({
          eventId: `evt_demo_atc_${batchId}_${i}`,
          timestamp: eventTime,
          visitorId: vid,
          sessionId: sid,
          eventName: 'add_to_cart',
          pagePath: '/tracking-demo',
          productId: 'prod_growth_bundle',
          productName: 'Growth Attribution Suite',
          revenue: 199.0,
          utm_source: srcObj.source,
          utm_medium: srcObj.medium,
          utm_campaign: srcObj.campaign,
        });

        if (Math.random() > 0.4) {
          const orderAmount = 199.0;
          await this.recordOrder({
            orderId: `ord_demo_${batchId}_${i}`,
            sessionId: sid,
            visitorId: vid,
            orderAmount,
            currency: 'USD',
            orderStatus: 'completed',
            createdAt: eventTime,
            utmSource: srcObj.source,
            utmMedium: srcObj.medium,
            utmCampaign: srcObj.campaign,
          });

          await this.recordEvent({
            eventId: `evt_demo_pur_${batchId}_${i}`,
            timestamp: eventTime,
            visitorId: vid,
            sessionId: sid,
            eventName: 'purchase',
            pagePath: '/tracking-demo',
            orderId: `ord_demo_${batchId}_${i}`,
            revenue: orderAmount,
            utm_source: srcObj.source,
            utm_medium: srcObj.medium,
            utm_campaign: srcObj.campaign,
          });
        }
      }
    }
  }

  public async resetData() {
    await this.init();
    if (this.neonConnected && this.neonClient) {
      try {
        await this.neonClient`
          TRUNCATE TABLE utm_tracking_events, utm_orders, utm_sessions, utm_visitors CASCADE;
        `;
      } catch (err) {
        console.error('Neon truncate error:', err);
      }
    }
    this.data = {
      visitors: [],
      sessions: [],
      tracking_events: [],
      orders: [],
    };
    this.save();
  }
}

export const analyticsDb = new AnalyticsStore();
