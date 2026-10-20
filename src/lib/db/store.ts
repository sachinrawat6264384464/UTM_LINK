import fs from 'fs';
import path from 'path';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import {
  OverviewMetrics,
  TrafficSourceMetric,
  CampaignMetric,
  RecentEventItem,
  TrackingEventPayload,
  Workspace,
  TrackedLink,
  LinkClick,
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
  workspaceId?: string;
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
  workspaceId?: string;
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
  workspaceId?: string;
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
  workspaces: Workspace[];
  links: TrackedLink[];
  link_clicks: LinkClick[];
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

const DEFAULT_WORKSPACES: Workspace[] = [
  {
    id: 'ws_default',
    name: 'Primary Application',
    slug: 'default',
    description: 'Main project UTM tracking and conversion telemetry',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ws_botmartz',
    name: 'Botmartz 3.0',
    slug: 'botmartz',
    description: 'Botmartz marketing campaigns, landing pages, and referrals',
    createdAt: new Date().toISOString(),
  },
];

class AnalyticsStore {
  private data: AnalyticsDbSchema = {
    workspaces: [...DEFAULT_WORKSPACES],
    links: [],
    link_clicks: [],
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
        
        // Workspaces table
        await sql`
          CREATE TABLE IF NOT EXISTS utm_workspaces (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMPTZ NOT NULL
          )
        `;

        // Tracked links table
        await sql`
          CREATE TABLE IF NOT EXISTS utm_links (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL,
            short_code TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            destination_url TEXT NOT NULL,
            utm_source TEXT NOT NULL,
            utm_medium TEXT NOT NULL,
            utm_campaign TEXT NOT NULL,
            utm_content TEXT,
            utm_term TEXT,
            clicks_count INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL,
            last_clicked_at TIMESTAMPTZ
          )
        `;

        // Link clicks telemetry table
        await sql`
          CREATE TABLE IF NOT EXISTS utm_link_clicks (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL,
            link_id TEXT NOT NULL,
            short_code TEXT NOT NULL,
            destination_url TEXT NOT NULL,
            utm_source TEXT NOT NULL,
            utm_medium TEXT NOT NULL,
            utm_campaign TEXT NOT NULL,
            ip TEXT,
            user_agent TEXT,
            referrer TEXT,
            clicked_at TIMESTAMPTZ NOT NULL
          )
        `;

        // Visitors table
        await sql`
          CREATE TABLE IF NOT EXISTS utm_visitors (
            id TEXT PRIMARY KEY,
            visitor_id TEXT UNIQUE NOT NULL,
            first_seen TIMESTAMPTZ NOT NULL,
            last_seen TIMESTAMPTZ NOT NULL
          )
        `;

        // Sessions table
        await sql`
          CREATE TABLE IF NOT EXISTS utm_sessions (
            id TEXT PRIMARY KEY,
            session_id TEXT UNIQUE NOT NULL,
            visitor_id TEXT NOT NULL,
            workspace_id TEXT,
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

        // Ensure workspace_id column on utm_sessions
        await sql`ALTER TABLE utm_sessions ADD COLUMN IF NOT EXISTS workspace_id TEXT`;

        // Tracking events table
        await sql`
          CREATE TABLE IF NOT EXISTS utm_tracking_events (
            id TEXT PRIMARY KEY,
            event_id TEXT UNIQUE NOT NULL,
            session_id TEXT NOT NULL,
            visitor_id TEXT NOT NULL,
            workspace_id TEXT,
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

        // Ensure workspace_id column on utm_tracking_events
        await sql`ALTER TABLE utm_tracking_events ADD COLUMN IF NOT EXISTS workspace_id TEXT`;

        // Orders table
        await sql`
          CREATE TABLE IF NOT EXISTS utm_orders (
            id TEXT PRIMARY KEY,
            order_id TEXT UNIQUE NOT NULL,
            session_id TEXT NOT NULL,
            visitor_id TEXT NOT NULL,
            workspace_id TEXT,
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

        // Ensure workspace_id column on utm_orders
        await sql`ALTER TABLE utm_orders ADD COLUMN IF NOT EXISTS workspace_id TEXT`;

        // Seed default workspaces in Neon if empty
        const existingWs = await sql`SELECT count(*) FROM utm_workspaces`;
        if (Number(existingWs[0]?.count || 0) === 0) {
          for (const ws of DEFAULT_WORKSPACES) {
            await sql`
              INSERT INTO utm_workspaces (id, name, slug, description, created_at)
              VALUES (${ws.id}, ${ws.name}, ${ws.slug}, ${ws.description || ''}, ${ws.createdAt})
              ON CONFLICT (slug) DO NOTHING
            `;
          }
        }

        this.neonClient = sql;
        this.neonConnected = true;
        console.log('[AnalyticsStore] Successfully connected and synchronized Neon schema.');
        await this.syncFromNeon();
      } catch (neonErr) {
        console.warn('[AnalyticsStore] Neon PostgreSQL initialization fallback notice:', neonErr);
        this.neonConnected = false;
      }
    }

    // 2. Local fallback sync
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          workspaces: parsed.workspaces?.length ? parsed.workspaces : [...DEFAULT_WORKSPACES],
          links: parsed.links || [],
          link_clicks: parsed.link_clicks || [],
          visitors: parsed.visitors || [],
          sessions: parsed.sessions || [],
          tracking_events: parsed.tracking_events || [],
          orders: parsed.orders || [],
        };
      } else {
        this.save();
      }
    } catch (e) {
      console.error('[AnalyticsStore] Local store fallback error:', e);
    }

    this.initialized = true;
  }

  private async syncFromNeon() {
    if (!this.neonConnected || !this.neonClient) return;
    try {
      const [workspaces, links, linkClicks, visitors, sessions, events, orders] = await Promise.all([
        this.neonClient`SELECT id, name, slug, description, created_at FROM utm_workspaces ORDER BY created_at ASC`,
        this.neonClient`SELECT id, workspace_id, short_code, title, destination_url, utm_source, utm_medium, utm_campaign, utm_content, utm_term, clicks_count, created_at, last_clicked_at FROM utm_links ORDER BY created_at DESC`,
        this.neonClient`SELECT id, workspace_id, link_id, short_code, destination_url, utm_source, utm_medium, utm_campaign, ip, user_agent, referrer, clicked_at FROM utm_link_clicks ORDER BY clicked_at DESC LIMIT 500`,
        this.neonClient`SELECT id, visitor_id, first_seen, last_seen FROM utm_visitors`,
        this.neonClient`SELECT id, session_id, visitor_id, workspace_id, started_at, last_activity_at, landing_page, referrer, referrer_host, source, medium, campaign, content, term FROM utm_sessions`,
        this.neonClient`SELECT id, event_id, session_id, visitor_id, workspace_id, event_name, event_timestamp, page_path, referrer_host, utm_source, utm_medium, utm_campaign, utm_content, utm_term, metadata FROM utm_tracking_events ORDER BY event_timestamp DESC LIMIT 1000`,
        this.neonClient`SELECT id, order_id, session_id, visitor_id, workspace_id, order_amount, currency, order_status, created_at, utm_source, utm_medium, utm_campaign, items FROM utm_orders ORDER BY created_at DESC LIMIT 500`,
      ]);

      if (workspaces && workspaces.length > 0) {
        this.data.workspaces = workspaces.map((w: any) => ({
          id: w.id,
          name: w.name,
          slug: w.slug,
          description: w.description || '',
          createdAt: new Date(w.created_at).toISOString(),
        }));
      }

      this.data.links = (links || []).map((l: any) => ({
        id: l.id,
        workspaceId: l.workspace_id,
        shortCode: l.short_code,
        title: l.title,
        destinationUrl: l.destination_url,
        utmSource: l.utm_source,
        utmMedium: l.utm_medium,
        utmCampaign: l.utm_campaign,
        utmContent: l.utm_content || undefined,
        utmTerm: l.utm_term || undefined,
        clicksCount: Number(l.clicks_count || 0),
        createdAt: new Date(l.created_at).toISOString(),
        lastClickedAt: l.last_clicked_at ? new Date(l.last_clicked_at).toISOString() : undefined,
      }));

      this.data.link_clicks = (linkClicks || []).map((c: any) => ({
        id: c.id,
        workspaceId: c.workspace_id,
        linkId: c.link_id,
        shortCode: c.short_code,
        destinationUrl: c.destination_url,
        utmSource: c.utm_source,
        utmMedium: c.utm_medium,
        utmCampaign: c.utm_campaign,
        ip: c.ip || undefined,
        userAgent: c.user_agent || undefined,
        referrer: c.referrer || undefined,
        clickedAt: new Date(c.clicked_at).toISOString(),
      }));

      this.data.visitors = (visitors || []).map((v: any) => ({
        id: v.id,
        visitorId: v.visitor_id,
        firstSeen: new Date(v.first_seen).toISOString(),
        lastSeen: new Date(v.last_seen).toISOString(),
      }));

      this.data.sessions = (sessions || []).map((s: any) => ({
        id: s.id,
        sessionId: s.session_id,
        visitorId: s.visitor_id,
        workspaceId: s.workspace_id || undefined,
        startedAt: new Date(s.started_at).toISOString(),
        lastActivityAt: new Date(s.last_activity_at).toISOString(),
        landingPage: s.landing_page,
        referrer: s.referrer,
        referrerHost: s.referrer_host,
        source: s.source,
        medium: s.medium,
        campaign: s.campaign,
        content: s.content,
        term: s.term,
      }));

      this.data.tracking_events = (events || []).map((e: any) => ({
        id: e.id,
        eventId: e.event_id,
        sessionId: e.session_id,
        visitorId: e.visitor_id,
        workspaceId: e.workspace_id || undefined,
        eventName: e.event_name,
        eventTimestamp: new Date(e.event_timestamp).toISOString(),
        pagePath: e.page_path,
        referrerHost: e.referrer_host,
        utmSource: e.utm_source,
        utmMedium: e.utm_medium,
        utmCampaign: e.utm_campaign,
        utmContent: e.utm_content,
        utmTerm: e.utm_term,
        metadata: typeof e.metadata === 'string' ? JSON.parse(e.metadata) : e.metadata || {},
      }));

      this.data.orders = (orders || []).map((o: any) => ({
        id: o.id,
        orderId: o.order_id,
        sessionId: o.session_id,
        visitorId: o.visitor_id,
        workspaceId: o.workspace_id || undefined,
        orderAmount: Number(o.order_amount || 0),
        currency: o.currency || 'USD',
        orderStatus: o.order_status || 'completed',
        createdAt: new Date(o.created_at).toISOString(),
        utmSource: o.utm_source,
        utmMedium: o.utm_medium,
        utmCampaign: o.utm_campaign,
        items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items || [],
      }));
    } catch (err) {
      console.error('[AnalyticsStore] Failed to sync data from Neon:', err);
    }
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

  // ================= WORKSPACES =================
  public async getWorkspaces(): Promise<Workspace[]> {
    await this.init();
    await this.syncFromNeon();
    return this.data.workspaces;
  }

  public async createWorkspace(name: string, description?: string): Promise<Workspace> {
    await this.init();
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const id = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const createdAt = new Date().toISOString();

    if (this.neonConnected && this.neonClient) {
      try {
        await this.neonClient`
          INSERT INTO utm_workspaces (id, name, slug, description, created_at)
          VALUES (${id}, ${name}, ${slug}, ${description || ''}, ${createdAt})
        `;
      } catch (err) {
        console.error('Neon createWorkspace error:', err);
      }
    }

    const ws: Workspace = { id, name, slug, description, createdAt };
    this.data.workspaces.push(ws);
    this.save();
    return ws;
  }

  // ================= TRACKED LINKS =================
  public async getLinks(workspaceId?: string): Promise<TrackedLink[]> {
    await this.init();
    await this.syncFromNeon();
    if (workspaceId && workspaceId !== 'all') {
      return this.data.links.filter((l) => l.workspaceId === workspaceId);
    }
    return this.data.links;
  }

  public async getLinkByCode(shortCode: string): Promise<TrackedLink | undefined> {
    await this.init();
    if (this.neonConnected && this.neonClient) {
      try {
        const rows = await this.neonClient`
          SELECT * FROM utm_links WHERE LOWER(short_code) = ${shortCode.toLowerCase()} LIMIT 1
        `;
        if (rows.length > 0) {
          const l = rows[0];
          return {
            id: l.id,
            workspaceId: l.workspace_id,
            shortCode: l.short_code,
            title: l.title,
            destinationUrl: l.destination_url,
            utmSource: l.utm_source,
            utmMedium: l.utm_medium,
            utmCampaign: l.utm_campaign,
            utmContent: l.utm_content || undefined,
            utmTerm: l.utm_term || undefined,
            clicksCount: Number(l.clicks_count || 0),
            createdAt: new Date(l.created_at).toISOString(),
            lastClickedAt: l.last_clicked_at ? new Date(l.last_clicked_at).toISOString() : undefined,
          };
        }
      } catch {}
    }
    return this.data.links.find((l) => l.shortCode.toLowerCase() === shortCode.toLowerCase());
  }

  public async createLink(linkData: {
    workspaceId: string;
    title: string;
    destinationUrl: string;
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    utmContent?: string;
    utmTerm?: string;
    customShortCode?: string;
  }): Promise<TrackedLink> {
    await this.init();

    const shortCode = (
      linkData.customShortCode?.trim() ||
      `${linkData.utmSource.substring(0, 3)}-${Math.random().toString(36).substring(2, 7)}`
    ).toLowerCase();

    const id = `lnk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const createdAt = new Date().toISOString();

    if (this.neonConnected && this.neonClient) {
      try {
        await this.neonClient`
          INSERT INTO utm_links (
            id, workspace_id, short_code, title, destination_url,
            utm_source, utm_medium, utm_campaign, utm_content, utm_term,
            clicks_count, created_at
          )
          VALUES (
            ${id}, ${linkData.workspaceId}, ${shortCode}, ${linkData.title}, ${linkData.destinationUrl},
            ${linkData.utmSource.toLowerCase()}, ${linkData.utmMedium.toLowerCase()}, ${linkData.utmCampaign.toLowerCase()},
            ${linkData.utmContent || null}, ${linkData.utmTerm || null}, 0, ${createdAt}
          )
          ON CONFLICT (short_code) DO NOTHING
        `;
      } catch (err) {
        console.error('Neon createLink error:', err);
      }
    }

    const newLink: TrackedLink = {
      id,
      workspaceId: linkData.workspaceId,
      shortCode,
      title: linkData.title,
      destinationUrl: linkData.destinationUrl,
      utmSource: linkData.utmSource.toLowerCase(),
      utmMedium: linkData.utmMedium.toLowerCase(),
      utmCampaign: linkData.utmCampaign.toLowerCase(),
      utmContent: linkData.utmContent,
      utmTerm: linkData.utmTerm,
      clicksCount: 0,
      createdAt,
    };

    this.data.links.unshift(newLink);
    this.save();
    return newLink;
  }

  public async deleteLink(linkId: string): Promise<boolean> {
    await this.init();
    if (this.neonConnected && this.neonClient) {
      try {
        await this.neonClient`DELETE FROM utm_links WHERE id = ${linkId}`;
      } catch (err) {
        console.error('Neon deleteLink error:', err);
      }
    }
    this.data.links = this.data.links.filter((l) => l.id !== linkId);
    this.save();
    return true;
  }

  // ================= REDIRECTION & CLICK RECORDING =================
  public async recordLinkClick(
    shortCode: string,
    meta: { ip?: string; userAgent?: string; referrer?: string }
  ): Promise<{ success: boolean; redirectUrl: string; link?: TrackedLink }> {
    await this.init();
    const link = await this.getLinkByCode(shortCode);

    if (!link) {
      return { success: false, redirectUrl: '/' };
    }

    const clickedAt = new Date().toISOString();
    const clickId = `clk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const visitorId = `vid_click_${Date.now().toString(36)}`;
    const sessionId = `sid_click_${Date.now().toString(36)}`;

    // Build final redirect URL with UTM parameters appended
    let finalUrl = link.destinationUrl;
    try {
      const parsed = new URL(link.destinationUrl, 'http://localhost:3000');
      if (!parsed.searchParams.has('utm_source')) parsed.searchParams.set('utm_source', link.utmSource);
      if (!parsed.searchParams.has('utm_medium')) parsed.searchParams.set('utm_medium', link.utmMedium);
      if (!parsed.searchParams.has('utm_campaign')) parsed.searchParams.set('utm_campaign', link.utmCampaign);
      if (link.utmContent && !parsed.searchParams.has('utm_content')) parsed.searchParams.set('utm_content', link.utmContent);
      if (link.utmTerm && !parsed.searchParams.has('utm_term')) parsed.searchParams.set('utm_term', link.utmTerm);
      if (!parsed.searchParams.has('utm_project')) parsed.searchParams.set('utm_project', link.workspaceId);
      finalUrl = parsed.toString();
    } catch {
      finalUrl = link.destinationUrl;
    }

    // 1. Neon DB Updates
    if (this.neonConnected && this.neonClient) {
      try {
        await Promise.all([
          this.neonClient`
            UPDATE utm_links 
            SET clicks_count = clicks_count + 1, last_clicked_at = ${clickedAt} 
            WHERE id = ${link.id}
          `,
          this.neonClient`
            INSERT INTO utm_link_clicks (
              id, workspace_id, link_id, short_code, destination_url,
              utm_source, utm_medium, utm_campaign, ip, user_agent, referrer, clicked_at
            )
            VALUES (
              ${clickId}, ${link.workspaceId}, ${link.id}, ${link.shortCode}, ${finalUrl},
              ${link.utmSource}, ${link.utmMedium}, ${link.utmCampaign},
              ${meta.ip || null}, ${meta.userAgent || null}, ${meta.referrer || null}, ${clickedAt}
            )
          `,
        ]);
      } catch (err) {
        console.error('Neon recordLinkClick error:', err);
      }
    }

    // 2. In-memory updates
    const localLink = this.data.links.find((l) => l.id === link.id);
    if (localLink) {
      localLink.clicksCount = (localLink.clicksCount || 0) + 1;
      localLink.lastClickedAt = clickedAt;
    }

    this.data.link_clicks.unshift({
      id: clickId,
      workspaceId: link.workspaceId,
      linkId: link.id,
      shortCode: link.shortCode,
      destinationUrl: finalUrl,
      utmSource: link.utmSource,
      utmMedium: link.utmMedium,
      utmCampaign: link.utmCampaign,
      ip: meta.ip,
      userAgent: meta.userAgent,
      referrer: meta.referrer,
      clickedAt,
    });

    // 3. Record tracking event & visitor session for analytics aggregation
    await this.recordEvent({
      eventId: `evt_${clickId}`,
      workspaceId: link.workspaceId,
      timestamp: clickedAt,
      visitorId,
      sessionId,
      eventName: 'link_click',
      pagePath: `/r/${link.shortCode}`,
      utm_source: link.utmSource,
      utm_medium: link.utmMedium,
      utm_campaign: link.utmCampaign,
      utm_content: link.utmContent,
      utm_term: link.utmTerm,
      metadata: {
        shortCode: link.shortCode,
        title: link.title,
        destinationUrl: finalUrl,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    });

    this.save();
    return { success: true, redirectUrl: finalUrl, link: localLink || link };
  }

  // ================= VISITORS & SESSIONS =================
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
            workspaceId: r.workspace_id,
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
      workspaceId?: string;
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
            id, session_id, visitor_id, workspace_id, started_at, last_activity_at,
            landing_page, referrer, referrer_host, source, medium, campaign, content, term
          )
          VALUES (
            ${id}, ${sessionId}, ${visitorId}, ${sessionData.workspaceId || 'ws_default'}, ${sessionData.startedAt}, ${sessionData.lastActivityAt},
            ${sessionData.landingPage}, ${sessionData.referrer || null}, ${sessionData.referrerHost || null},
            ${sessionData.source || 'direct'}, ${sessionData.medium || 'none'}, ${sessionData.campaign || '(direct)'},
            ${sessionData.content || null}, ${sessionData.term || null}
          )
          ON CONFLICT (session_id) DO UPDATE SET 
            last_activity_at = ${sessionData.lastActivityAt},
            source = CASE WHEN ${sessionData.source} != 'direct' THEN ${sessionData.source} ELSE utm_sessions.source END,
            medium = CASE WHEN ${sessionData.medium} != 'none' THEN ${sessionData.medium} ELSE utm_sessions.medium END,
            campaign = CASE WHEN ${sessionData.campaign} != '(direct)' THEN ${sessionData.campaign} ELSE utm_sessions.campaign END,
            workspace_id = COALESCE(${sessionData.workspaceId || null}, utm_sessions.workspace_id)
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
        workspaceId: sessionData.workspaceId || 'ws_default',
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
      if (sessionData.source && sessionData.source !== 'direct') session.source = sessionData.source;
      if (sessionData.medium && sessionData.medium !== 'none') session.medium = sessionData.medium;
      if (sessionData.campaign && sessionData.campaign !== '(direct)') session.campaign = sessionData.campaign;
      if (sessionData.workspaceId) session.workspaceId = sessionData.workspaceId;
    }
    this.save();
    return session;
  }

  // ================= EVENTS & ORDERS =================
  public async recordEvent(event: TrackingEventPayload): Promise<{ recorded: boolean; reason?: string }> {
    await this.init();

    // Prevent duplicate eventId
    if (this.data.tracking_events.some((e) => e.eventId === event.eventId)) {
      return { recorded: false, reason: 'duplicate_event_id' };
    }

    // Upsert visitor & session
    await this.upsertVisitor(event.visitorId, event.timestamp);
    await this.createOrUpdateSession(event.sessionId, event.visitorId, {
      workspaceId: event.workspaceId,
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
            id, event_id, session_id, visitor_id, workspace_id, event_name, event_timestamp,
            page_path, referrer_host, utm_source, utm_medium, utm_campaign,
            utm_content, utm_term, metadata
          )
          VALUES (
            ${eventDbId}, ${event.eventId}, ${event.sessionId}, ${event.visitorId},
            ${event.workspaceId || 'ws_default'}, ${event.eventName}, ${event.timestamp}, ${event.pagePath},
            ${event.referrerHost || null}, ${event.utm_source || null}, ${event.utm_medium || null},
            ${event.utm_campaign || null}, ${event.utm_content || null}, ${event.utm_term || null},
            ${JSON.stringify(metadataObj)}
          )
          ON CONFLICT (event_id) DO NOTHING
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
      workspaceId: event.workspaceId || 'ws_default',
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
    workspaceId?: string;
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
    const workspaceId = order.workspaceId || session?.workspaceId || 'ws_default';
    const utmSource = order.utmSource || session?.source || 'direct';
    const utmMedium = order.utmMedium || session?.medium || 'none';
    const utmCampaign = order.utmCampaign || session?.campaign || '(direct)';

    if (this.neonConnected && this.neonClient) {
      try {
        await this.neonClient`
          INSERT INTO utm_orders (
            id, order_id, session_id, visitor_id, workspace_id, order_amount, currency,
            order_status, created_at, utm_source, utm_medium, utm_campaign, items
          )
          VALUES (
            ${orderDbId}, ${order.orderId}, ${order.sessionId}, ${order.visitorId}, ${workspaceId},
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
      workspaceId,
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

  // ================= METRICS & ANALYTICS REPORTS =================
  public async getOverview(filters?: {
    workspaceId?: string;
    source?: string;
    campaign?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<OverviewMetrics> {
    await this.init();
    await this.syncFromNeon();

    let events = this.data.tracking_events;
    let sessions = this.data.sessions;
    let orders = this.data.orders;
    let visitors = this.data.visitors;
    let linkClicks = this.data.link_clicks;

    // Filter by Workspace
    if (filters?.workspaceId && filters.workspaceId !== 'all') {
      sessions = sessions.filter((s) => s.workspaceId === filters.workspaceId);
      events = events.filter((e) => e.workspaceId === filters.workspaceId);
      orders = orders.filter((o) => o.workspaceId === filters.workspaceId);
      linkClicks = linkClicks.filter((c) => c.workspaceId === filters.workspaceId);
    }

    if (filters?.source && filters.source !== 'all') {
      sessions = sessions.filter((s) => s.source.toLowerCase() === filters.source!.toLowerCase());
      const sessionIds = new Set(sessions.map((s) => s.sessionId));
      events = events.filter((e) => sessionIds.has(e.sessionId) || e.utmSource?.toLowerCase() === filters.source!.toLowerCase());
      orders = orders.filter((o) => sessionIds.has(o.sessionId));
      linkClicks = linkClicks.filter((c) => c.utmSource.toLowerCase() === filters.source!.toLowerCase());
    }

    if (filters?.campaign && filters.campaign !== 'all') {
      sessions = sessions.filter((s) => s.campaign.toLowerCase() === filters.campaign!.toLowerCase());
      const sessionIds = new Set(sessions.map((s) => s.sessionId));
      events = events.filter((e) => sessionIds.has(e.sessionId) || e.utmCampaign?.toLowerCase() === filters.campaign!.toLowerCase());
      orders = orders.filter((o) => sessionIds.has(o.sessionId));
      linkClicks = linkClicks.filter((c) => c.utmCampaign.toLowerCase() === filters.campaign!.toLowerCase());
    }

    const uniqueVisitorIds = new Set(sessions.map((s) => s.visitorId));
    const totalSessions = sessions.length;
    const totalPageViews = events.filter((e) => e.eventName === 'page_view').length;
    const totalAddToCart = events.filter((e) => e.eventName === 'add_to_cart').length;
    const totalPurchases = orders.length;
    const trackedRevenue = orders.reduce((sum, o) => sum + Number(o.orderAmount || 0), 0);
    const totalLinkClicks = linkClicks.length + events.filter((e) => e.eventName === 'link_click').length;
    const effectiveDenominator = Math.max(totalSessions, totalLinkClicks);
    const conversionRate = effectiveDenominator > 0 ? Number(((totalPurchases / effectiveDenominator) * 100).toFixed(2)) : 0;

    return {
      totalVisitors: visitors.length,
      totalSessions,
      totalPageViews,
      totalLinkClicks,
      uniqueVisitors: uniqueVisitorIds.size,
      totalAddToCart,
      totalPurchases,
      trackedRevenue: Number(trackedRevenue.toFixed(2)),
      conversionRate,
    };
  }

  public async getSourcesReport(workspaceId?: string): Promise<TrafficSourceMetric[]> {
    await this.init();
    await this.syncFromNeon();

    const sourceMap = new Map<string, {
      source: string;
      medium: string;
      campaign: string;
      visitors: Set<string>;
      sessions: Set<string>;
      pageViews: number;
      clicks: number;
      purchases: number;
      revenue: number;
    }>();

    const getOrCreate = (source: string, medium: string, campaign: string) => {
      const s = (source || 'direct').toLowerCase();
      const m = (medium || 'none').toLowerCase();
      const c = (campaign || '(direct)').toLowerCase();
      const key = `${s}_${m}_${c}`;
      if (!sourceMap.has(key)) {
        sourceMap.set(key, {
          source: s,
          medium: m,
          campaign: c,
          visitors: new Set(),
          sessions: new Set(),
          pageViews: 0,
          clicks: 0,
          purchases: 0,
          revenue: 0,
        });
      }
      return sourceMap.get(key)!;
    };

    // Aggregate sessions
    let filteredSessions = this.data.sessions;
    if (workspaceId && workspaceId !== 'all') {
      filteredSessions = filteredSessions.filter((s) => s.workspaceId === workspaceId);
    }
    for (const session of filteredSessions) {
      const entry = getOrCreate(session.source, session.medium, session.campaign);
      entry.visitors.add(session.visitorId);
      entry.sessions.add(session.sessionId);
    }

    // Aggregate events (page_view & link_click)
    let filteredEvents = this.data.tracking_events;
    if (workspaceId && workspaceId !== 'all') {
      filteredEvents = filteredEvents.filter((e) => e.workspaceId === workspaceId);
    }
    for (const event of filteredEvents) {
      const entry = getOrCreate(event.utmSource || 'direct', event.utmMedium || 'none', event.utmCampaign || '(direct)');
      if (event.eventName === 'page_view') {
        entry.pageViews += 1;
      } else if (event.eventName === 'link_click') {
        entry.clicks += 1;
      }
    }

    // Aggregate direct link clicks table
    let filteredLinkClicks = this.data.link_clicks;
    if (workspaceId && workspaceId !== 'all') {
      filteredLinkClicks = filteredLinkClicks.filter((c) => c.workspaceId === workspaceId);
    }
    for (const click of filteredLinkClicks) {
      const entry = getOrCreate(click.utmSource, click.utmMedium, click.utmCampaign);
      entry.clicks += 1;
    }

    // Aggregate orders
    let filteredOrders = this.data.orders;
    if (workspaceId && workspaceId !== 'all') {
      filteredOrders = filteredOrders.filter((o) => o.workspaceId === workspaceId);
    }
    for (const order of filteredOrders) {
      const entry = getOrCreate(order.utmSource || 'direct', order.utmMedium || 'none', order.utmCampaign || '(direct)');
      entry.purchases += 1;
      entry.revenue += Number(order.orderAmount || 0);
    }

    const results: TrafficSourceMetric[] = [];
    for (const [, val] of sourceMap.entries()) {
      const sessionCount = val.sessions.size;
      const effectiveInteractions = Math.max(sessionCount, val.clicks);
      const conversionRate = effectiveInteractions > 0 ? Number(((val.purchases / effectiveInteractions) * 100).toFixed(2)) : 0;
      results.push({
        source: val.source,
        medium: val.medium,
        campaign: val.campaign,
        visitors: val.visitors.size,
        sessions: sessionCount,
        pageViews: val.pageViews,
        clicks: val.clicks,
        purchases: val.purchases,
        revenue: Number(val.revenue.toFixed(2)),
        conversionRate,
      });
    }

    return results.sort((a, b) => b.clicks + b.sessions - (a.clicks + a.sessions) || b.revenue - a.revenue);
  }

  public async getCampaignsReport(workspaceId?: string): Promise<CampaignMetric[]> {
    await this.init();
    await this.syncFromNeon();

    const campaignMap = new Map<string, {
      campaign: string;
      source: string;
      medium: string;
      visitors: Set<string>;
      sessions: Set<string>;
      pageViews: number;
      clicks: number;
      purchases: number;
      revenue: number;
    }>();

    const getOrCreate = (campaign: string, source: string, medium: string) => {
      const c = (campaign || '(direct)').toLowerCase();
      const s = (source || 'direct').toLowerCase();
      const m = (medium || 'none').toLowerCase();
      const key = `${c}_${s}_${m}`;
      if (!campaignMap.has(key)) {
        campaignMap.set(key, {
          campaign: c,
          source: s,
          medium: m,
          visitors: new Set(),
          sessions: new Set(),
          pageViews: 0,
          clicks: 0,
          purchases: 0,
          revenue: 0,
        });
      }
      return campaignMap.get(key)!;
    };

    let filteredSessions = this.data.sessions;
    if (workspaceId && workspaceId !== 'all') {
      filteredSessions = filteredSessions.filter((s) => s.workspaceId === workspaceId);
    }
    for (const s of filteredSessions) {
      const entry = getOrCreate(s.campaign, s.source, s.medium);
      entry.visitors.add(s.visitorId);
      entry.sessions.add(s.sessionId);
    }

    let filteredEvents = this.data.tracking_events;
    if (workspaceId && workspaceId !== 'all') {
      filteredEvents = filteredEvents.filter((e) => e.workspaceId === workspaceId);
    }
    for (const e of filteredEvents) {
      const entry = getOrCreate(e.utmCampaign || '(direct)', e.utmSource || 'direct', e.utmMedium || 'none');
      if (e.eventName === 'page_view') entry.pageViews += 1;
      if (e.eventName === 'link_click') entry.clicks += 1;
    }

    let filteredOrders = this.data.orders;
    if (workspaceId && workspaceId !== 'all') {
      filteredOrders = filteredOrders.filter((o) => o.workspaceId === workspaceId);
    }
    for (const o of filteredOrders) {
      const entry = getOrCreate(o.utmCampaign || '(direct)', o.utmSource || 'direct', o.utmMedium || 'none');
      entry.purchases += 1;
      entry.revenue += Number(o.orderAmount || 0);
    }

    const results: CampaignMetric[] = [];
    for (const [, val] of campaignMap.entries()) {
      const sessionCount = val.sessions.size;
      const effectiveVol = Math.max(sessionCount, val.clicks);
      const conversionRate = effectiveVol > 0 ? Number(((val.purchases / effectiveVol) * 100).toFixed(2)) : 0;
      results.push({
        campaign: val.campaign,
        source: val.source,
        medium: val.medium,
        visitors: val.visitors.size,
        sessions: sessionCount,
        pageViews: val.pageViews,
        clicks: val.clicks,
        purchases: val.purchases,
        revenue: Number(val.revenue.toFixed(2)),
        conversionRate,
      });
    }

    return results.sort((a, b) => b.clicks + b.sessions - (a.clicks + a.sessions) || b.revenue - a.revenue);
  }

  public async getRecentEvents(limit = 50, filters?: { eventName?: string; source?: string; workspaceId?: string }): Promise<RecentEventItem[]> {
    await this.init();
    await this.syncFromNeon();

    let events = [...this.data.tracking_events].reverse();

    if (filters?.workspaceId && filters.workspaceId !== 'all') {
      events = events.filter((e) => e.workspaceId === filters.workspaceId);
    }

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
        workspaceId: e.workspaceId,
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

  public async getVisualizationsData(workspaceId?: string) {
    await this.init();
    await this.syncFromNeon();

    const timeMap = new Map<string, { date: string; visitors: Set<string>; sessions: Set<string>; pageViews: number; purchases: number; clicks: number }>();

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
        clicks: 0,
      });
    }

    let sessions = this.data.sessions;
    let events = this.data.tracking_events;
    let orders = this.data.orders;
    let linkClicks = this.data.link_clicks;

    if (workspaceId && workspaceId !== 'all') {
      sessions = sessions.filter((s) => s.workspaceId === workspaceId);
      events = events.filter((e) => e.workspaceId === workspaceId);
      orders = orders.filter((o) => o.workspaceId === workspaceId);
      linkClicks = linkClicks.filter((c) => c.workspaceId === workspaceId);
    }

    for (const s of sessions) {
      const dateKey = s.startedAt.split('T')[0];
      if (timeMap.has(dateKey)) {
        const item = timeMap.get(dateKey)!;
        item.visitors.add(s.visitorId);
        item.sessions.add(s.sessionId);
      }
    }

    for (const e of events) {
      const dateKey = e.eventTimestamp.split('T')[0];
      if (timeMap.has(dateKey)) {
        const item = timeMap.get(dateKey)!;
        if (e.eventName === 'page_view') item.pageViews += 1;
        if (e.eventName === 'link_click') item.clicks += 1;
      }
    }

    for (const c of linkClicks) {
      const dateKey = c.clickedAt.split('T')[0];
      if (timeMap.has(dateKey)) {
        timeMap.get(dateKey)!.clicks += 1;
      }
    }

    for (const o of orders) {
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
      clicks: item.clicks,
    }));

    // Sources distribution
    const sourceCounts = new Map<string, number>();
    for (const s of sessions) {
      const src = s.source || 'direct';
      sourceCounts.set(src, (sourceCounts.get(src) || 0) + 1);
    }
    for (const c of linkClicks) {
      const src = c.utmSource || 'direct';
      sourceCounts.set(src, (sourceCounts.get(src) || 0) + 1);
    }
    const sourcesDistribution = Array.from(sourceCounts.entries()).map(([source, count]) => ({
      source,
      count,
    }));

    // Purchases by source
    const purchasesBySourceMap = new Map<string, { source: string; purchases: number; revenue: number }>();
    for (const o of orders) {
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

    // Revenue by campaign
    const revenueByCampaignMap = new Map<string, { campaign: string; revenue: number; purchases: number }>();
    for (const o of orders) {
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

    const workspaces = ['ws_default', 'ws_botmartz'];
    const now = Date.now();

    for (let i = 0; i < 24; i++) {
      const srcObj = sources[i % sources.length];
      const wsId = workspaces[i % workspaces.length];
      const daysAgo = Math.floor(Math.random() * 5);
      const eventTime = new Date(now - daysAgo * 86400000 - Math.random() * 36000000).toISOString();
      const vid = `vid_demo_${batchId}_${Math.floor(i / 2)}`;
      const sid = `sid_demo_${batchId}_${i}`;

      await this.upsertVisitor(vid, eventTime);
      await this.createOrUpdateSession(sid, vid, {
        workspaceId: wsId,
        startedAt: eventTime,
        lastActivityAt: eventTime,
        landingPage: '/tracking-demo',
        source: srcObj.source,
        medium: srcObj.medium,
        campaign: srcObj.campaign,
      });

      await this.recordEvent({
        eventId: `evt_demo_start_${batchId}_${i}`,
        workspaceId: wsId,
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
        workspaceId: wsId,
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
          workspaceId: wsId,
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
          workspaceId: wsId,
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
            workspaceId: wsId,
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
            workspaceId: wsId,
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
          TRUNCATE TABLE utm_tracking_events, utm_orders, utm_sessions, utm_visitors, utm_link_clicks, utm_links CASCADE;
        `;
      } catch (err) {
        console.error('Neon truncate error:', err);
      }
    }
    this.data = {
      workspaces: [...DEFAULT_WORKSPACES],
      links: [],
      link_clicks: [],
      visitors: [],
      sessions: [],
      tracking_events: [],
      orders: [],
    };
    this.save();
  }
}

export const analyticsDb = new AnalyticsStore();
