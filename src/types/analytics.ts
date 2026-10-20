export type UTMParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

export type AttributionData = {
  firstTouch: {
    source: string;
    medium: string;
    campaign: string;
    content?: string;
    term?: string;
    landingPage: string;
    timestamp: string;
  } | null;
  lastNonDirect: {
    source: string;
    medium: string;
    campaign: string;
    content?: string;
    term?: string;
    landingPage: string;
    timestamp: string;
  } | null;
  current: {
    source: string;
    medium: string;
    campaign: string;
    content?: string;
    term?: string;
    referrer?: string;
    referrerHost?: string;
  };
};

export type EventType =
  | 'session_start'
  | 'page_view'
  | 'view_item'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'custom_event';

export interface TrackingEventPayload {
  eventId: string;
  timestamp: string; // ISO string
  visitorId: string;
  sessionId: string;
  eventName: EventType;
  pagePath: string;
  referrer?: string;
  referrerHost?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  productId?: string;
  productName?: string;
  orderId?: string;
  revenue?: number;
  currency?: string;
  metadata?: Record<string, any>;
  attribution?: AttributionData;
}

export interface DemoProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  image: string;
  description: string;
}

export interface OverviewMetrics {
  totalVisitors: number;
  totalSessions: number;
  totalPageViews: number;
  uniqueVisitors: number;
  totalAddToCart: number;
  totalPurchases: number;
  trackedRevenue: number;
  conversionRate: number; // percentage
}

export interface TrafficSourceMetric {
  source: string;
  medium: string;
  campaign: string;
  visitors: number;
  sessions: number;
  pageViews: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
}

export interface CampaignMetric {
  campaign: string;
  source: string;
  medium: string;
  visitors: number;
  sessions: number;
  pageViews: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
}

export interface RecentEventItem {
  id: string;
  eventId: string;
  eventName: string;
  eventTimestamp: string;
  pagePath: string;
  source: string;
  medium: string;
  campaign: string;
  visitorId: string;
  sessionId: string;
  revenue?: number;
  metadata?: Record<string, any>;
}

export interface VisitorInfo {
  visitorId: string;
  sessionId: string;
  isNewSession: boolean;
  attribution: AttributionData;
}
