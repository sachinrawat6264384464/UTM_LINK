'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Activity,
  Eye,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Database,
  Trash2,
  Filter,
  BarChart3,
  Layers,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  OverviewMetrics,
  TrafficSourceMetric,
  CampaignMetric,
  RecentEventItem,
} from '@/types/analytics';
import {
  VisitorsTimelineChart,
  SourcesDonutChart,
  PurchasesBySourceBarChart,
  RevenueByCampaignBarChart,
} from '@/components/analytics/AnalyticsCharts';
import { UtmGenerator } from '@/components/analytics/UtmGenerator';
import { TestingGuide } from '@/components/analytics/TestingGuide';

export default function AdminAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [dateRange, setDateRange] = useState('7d');

  // Metrics Data
  const [overview, setOverview] = useState<OverviewMetrics>({
    totalVisitors: 0,
    totalSessions: 0,
    totalPageViews: 0,
    uniqueVisitors: 0,
    totalAddToCart: 0,
    totalPurchases: 0,
    trackedRevenue: 0,
    conversionRate: 0,
  });

  const [sources, setSources] = useState<TrafficSourceMetric[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignMetric[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEventItem[]>([]);
  const [visualData, setVisualData] = useState<any>({
    timeline: [],
    sourcesDistribution: [],
    purchasesBySource: [],
    revenueByCampaign: [],
  });

  // Modal for Event Details
  const [selectedEvent, setSelectedEvent] = useState<RecentEventItem | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (selectedSource !== 'all') queryParams.set('source', selectedSource);
      if (selectedCampaign !== 'all') queryParams.set('campaign', selectedCampaign);

      const [overviewRes, sourcesRes, campaignsRes, eventsRes, visualRes] = await Promise.all([
        fetch(`/api/analytics/overview?${queryParams.toString()}`),
        fetch('/api/analytics/sources'),
        fetch('/api/analytics/campaigns'),
        fetch(`/api/analytics/recent-events?limit=30&source=${selectedSource}`),
        fetch('/api/analytics/visualizations'),
      ]);

      if (!overviewRes.ok || !sourcesRes.ok || !eventsRes.ok) {
        throw new Error('Failed to retrieve analytics from API');
      }

      const overviewData = await overviewRes.json();
      const sourcesData = await sourcesRes.json();
      const campaignsData = await campaignsRes.json();
      const eventsData = await eventsRes.json();
      const visual = await visualRes.json();

      setOverview(overviewData);
      setSources(sourcesData);
      setCampaigns(campaignsData);
      setRecentEvents(eventsData);
      setVisualData(visual);
    } catch (err: any) {
      console.error('Analytics load error:', err);
      setError(err.message || 'Could not connect to tracking database');
    } finally {
      setLoading(false);
    }
  }, [selectedSource, selectedCampaign]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSeedData = async () => {
    try {
      await fetch('/api/analytics/seed', { method: 'POST' });
      fetchDashboardData();
    } catch {}
  };

  const handleResetData = async () => {
    if (confirm('Are you sure you want to clear all tracking events and orders?')) {
      try {
        await fetch('/api/analytics/reset', { method: 'POST' });
        fetchDashboardData();
      } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                UTM Analytics & Attribution Engine
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Custom Next.js Stack
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Independent, zero-third-party tracking system with first-touch & last-touch attribution
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/tracking-demo"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all duration-200"
          >
            <span>Open Demo Website</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleSeedData}
            title="Populate test data across LinkedIn, Instagram, Google, and WhatsApp"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 text-xs font-medium transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            Seed Sample Data
          </button>

          <button
            type="button"
            onClick={handleResetData}
            title="Clear all session and event records"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900/40 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset Data
          </button>
        </div>
      </header>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800 rounded-xl text-red-300 text-xs flex items-center justify-between">
          <span>Failed to load tracking data: {error}</span>
          <button
            onClick={fetchDashboardData}
            className="underline font-semibold ml-4 hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Overview Metric Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Visitors */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Visitors
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {overview.totalVisitors.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="text-blue-400 font-medium">
              {overview.uniqueVisitors} unique active
            </span>
          </div>
        </div>

        {/* Sessions */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Sessions
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {overview.totalSessions.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="text-purple-400 font-medium">30m timeout window</span>
          </div>
        </div>

        {/* Page Views */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Page Views
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {overview.totalPageViews.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            {overview.totalSessions > 0
              ? `${(overview.totalPageViews / overview.totalSessions).toFixed(1)} pages / session`
              : '0 pages / session'}
          </div>
        </div>

        {/* Add to Cart */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Add To Cart
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {overview.totalAddToCart.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-400">
            Intent conversion events
          </div>
        </div>

        {/* Total Purchases */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Purchases
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mb-1">
            {overview.totalPurchases.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            Simulated test orders
          </div>
        </div>

        {/* Tracked Revenue */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tracked Revenue
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1 font-mono">
            ${overview.trackedRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400">
            Attributed dollar value
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all col-span-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Session Conversion Rate
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 font-mono">
              {overview.conversionRate}%
            </div>
            <div className="text-xs text-slate-400">
              ({overview.totalPurchases} purchases / {overview.totalSessions} sessions)
            </div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, overview.conversionRate * 3)}%` }}
            />
          </div>
        </div>
      </section>

      {/* UTM Generator Section */}
      <section>
        <UtmGenerator />
      </section>

      {/* Visualizations Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitors over time */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            Visitors & Sessions Over Time
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Daily activity trend over the last 7 calendar days
          </p>
          <VisitorsTimelineChart data={visualData.timeline || []} />
        </div>

        {/* Traffic Sources Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            Traffic Sources Distribution
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Share of sessions by marketing source (LinkedIn, WhatsApp, Google, etc.)
          </p>
          <SourcesDonutChart data={visualData.sourcesDistribution || []} />
        </div>

        {/* Purchases by Source */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            Conversions & Revenue By Source
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Dollar revenue attributed to each traffic source
          </p>
          <PurchasesBySourceBarChart data={visualData.purchasesBySource || []} />
        </div>

        {/* Revenue by Campaign */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            Campaign Performance Comparison
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Total sales generated by specific marketing campaigns
          </p>
          <RevenueByCampaignBarChart data={visualData.revenueByCampaign || []} />
        </div>
      </section>

      {/* Traffic Source & Campaign Reports Table */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              Traffic Source & Campaign Attribution Report
            </h3>
            <p className="text-xs text-slate-400">
              Multi-dimensional attribution report showing visitors, conversions, and revenue by channel
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Sources</option>
              <option value="linkedin">LinkedIn</option>
              <option value="instagram">Instagram</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="facebook">Facebook</option>
              <option value="google">Google</option>
              <option value="direct">Direct</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Medium</th>
                <th className="py-3 px-4">Campaign</th>
                <th className="py-3 px-4 text-right">Visitors</th>
                <th className="py-3 px-4 text-right">Sessions</th>
                <th className="py-3 px-4 text-right">Page Views</th>
                <th className="py-3 px-4 text-right">Purchases</th>
                <th className="py-3 px-4 text-right">Revenue</th>
                <th className="py-3 px-4 text-right">Conv. Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {sources.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                    No traffic source records available. Seed data or generate campaign clicks to view.
                  </td>
                </tr>
              ) : (
                sources.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white capitalize flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      {item.source}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{item.medium}</td>
                    <td className="py-3 px-4 font-mono text-blue-300 truncate max-w-[160px]">{item.campaign}</td>
                    <td className="py-3 px-4 text-right font-mono">{item.visitors}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-white">{item.sessions}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">{item.pageViews}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">{item.purchases}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">${item.revenue.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium">
                      <span className={`px-2 py-0.5 rounded-full ${item.conversionRate > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500'}`}>
                        {item.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Activity Table */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Live Tracking Event Ingestion Feed
            </h3>
            <p className="text-xs text-slate-400">
              Raw telemetry stream displaying event names, attribution dimensions, and timestamps
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">Showing {recentEvents.length} events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Medium</th>
                <th className="py-3 px-4">Campaign</th>
                <th className="py-3 px-4">Page</th>
                <th className="py-3 px-4">Visitor / Session ID</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No events tracked yet. Click links or simulate a test conversion on the demo page.
                  </td>
                </tr>
              ) : (
                recentEvents.map((evt) => {
                  const eventBadgeColor =
                    evt.eventName === 'purchase'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : evt.eventName === 'add_to_cart'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : evt.eventName === 'session_start'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30';

                  return (
                    <tr key={evt.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {new Date(evt.eventTimestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-md border text-[11px] font-semibold ${eventBadgeColor}`}>
                          {evt.eventName}
                        </span>
                      </td>
                      <td className="py-3 px-4 capitalize font-medium text-slate-200">{evt.source}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono">{evt.medium}</td>
                      <td className="py-3 px-4 text-blue-400 font-mono truncate max-w-[120px]">{evt.campaign}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono">{evt.pagePath}</td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[10px] truncate max-w-[140px]">
                        {evt.visitorId.substring(0, 10)}... | {evt.sessionId.substring(0, 10)}...
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(evt)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Educational Guide */}
      <section>
        <TestingGuide />
      </section>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                Event Telemetry Details
                <span className="text-[11px] font-mono px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                  {selectedEvent.eventName}
                </span>
              </h4>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white text-base font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Event ID:</span>
                <span className="text-slate-200">{selectedEvent.eventId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Visitor ID:</span>
                <span className="text-slate-200">{selectedEvent.visitorId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Session ID:</span>
                <span className="text-slate-200">{selectedEvent.sessionId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-200">{selectedEvent.eventTimestamp}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Source:</span>
                <span className="text-blue-400 font-semibold">{selectedEvent.source}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Medium:</span>
                <span className="text-purple-400 font-semibold">{selectedEvent.medium}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Campaign:</span>
                <span className="text-emerald-400 font-semibold">{selectedEvent.campaign}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Page Path:</span>
                <span className="text-slate-200">{selectedEvent.pagePath}</span>
              </div>

              {selectedEvent.metadata && (
                <div className="pt-2">
                  <span className="text-slate-400 block mb-1">Payload Metadata:</span>
                  <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto text-[11px] text-emerald-400">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
