'use client';

import React, { useState } from 'react';

export interface TimelinePoint {
  date: string;
  visitors: number;
  sessions: number;
  pageViews: number;
  purchases: number;
  clicks?: number;
}

export interface SourcePoint {
  source: string;
  count: number;
}

export interface PurchasePoint {
  source: string;
  purchases: number;
  revenue: number;
}

export interface CampaignPoint {
  campaign: string;
  revenue: number;
  purchases: number;
}

export function VisitorsTimelineChart({ data }: { data: TimelinePoint[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-56 flex-col items-center justify-center text-sm text-slate-400 gap-2">
        <span>No link clicks or visitor activity in this date range.</span>
        <span className="text-xs text-slate-500">Create a tracked link below or switch to another project.</span>
      </div>
    );
  }

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.sessions, d.pageViews, d.clicks || 0)),
    4
  );
  const height = 180;
  const width = 600;
  const paddingX = 40;
  const paddingY = 25;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const pointsSessions = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * chartW;
    const y = height - paddingY - (d.sessions / maxVal) * chartH;
    return { x, y, data: d };
  });

  const pointsClicks = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * chartW;
    const y = height - paddingY - ((d.clicks || 0) / maxVal) * chartH;
    return { x, y, data: d };
  });

  const pointsPV = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * chartW;
    const y = height - paddingY - (d.pageViews / maxVal) * chartH;
    return { x, y, data: d };
  });

  const sessionPath = pointsSessions.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const clicksPath = pointsClicks.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const pvPath = pointsPV.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

  const areaSession = `${sessionPath} L ${pointsSessions[pointsSessions.length - 1].x} ${height - paddingY} L ${pointsSessions[0].x} ${height - paddingY} Z`;

  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
            Sessions
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-400"></span>
            Link Clicks
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-500"></span>
            Page Views
          </span>
        </div>
        <span className="text-slate-500">Peak: {maxVal} events</span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 select-none">
        <defs>
          <linearGradient id="sessionGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.33, 0.66, 1].map((pct, idx) => {
          const y = height - paddingY - pct * chartH;
          return (
            <g key={idx}>
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.75" />
              <text x={paddingX - 8} y={y + 3} fill="#64748b" fontSize="9" textAnchor="end">
                {Math.round(pct * maxVal)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaSession} fill="url(#sessionGrad)" />

        {/* Line paths */}
        <path d={sessionPath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={clicksPath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={pvPath} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {pointsSessions.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoveredIdx === i ? 6 : 4}
            fill="#1e293b"
            stroke="#3b82f6"
            strokeWidth="2.5"
            className="cursor-pointer transition-all duration-200"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        ))}

        {/* X Axis labels */}
        {pointsSessions.map((p, i) => {
          const label = p.data.date.split('-').slice(1).join('/');
          return (
            <text key={i} x={p.x} y={height - 5} fill="#64748b" fontSize="10" textAnchor="middle">
              {label}
            </text>
          );
        })}
      </svg>

      {hoveredIdx !== null && (
        <div className="absolute top-2 right-4 bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs z-10 pointer-events-none">
          <div className="font-semibold text-slate-200 mb-1">{data[hoveredIdx].date}</div>
          <div className="text-blue-400">Sessions: {data[hoveredIdx].sessions}</div>
          <div className="text-amber-400">Link Clicks: {data[hoveredIdx].clicks || 0}</div>
          <div className="text-emerald-400">Page Views: {data[hoveredIdx].pageViews}</div>
          <div className="text-purple-400">Purchases: {data[hoveredIdx].purchases}</div>
        </div>
      )}
    </div>
  );
}

export function SourcesDonutChart({ data }: { data: SourcePoint[] }) {
  if (!data || data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-56 flex-col items-center justify-center text-sm text-slate-400 gap-1">
        <span>No traffic sources recorded yet.</span>
        <span className="text-xs text-slate-500">Test a link from WhatsApp, LinkedIn, or Instagram.</span>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2">
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {data.reduce(
            (acc, d, i) => {
              const pct = (d.count / total) * 100;
              const dashArray = `${pct} ${100 - pct}`;
              const strokeOffset = acc.offset;
              acc.offset -= pct;
              acc.elements.push(
                <circle
                  key={d.source}
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke={colors[i % colors.length]}
                  strokeWidth="15"
                  strokeDasharray={dashArray}
                  strokeDashoffset={strokeOffset}
                  className="transition-all duration-300 hover:opacity-80"
                />
              );
              return acc;
            },
            { offset: 0, elements: [] as React.ReactNode[] }
          ).elements}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-white">{total}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Touchpoints</span>
        </div>
      </div>

      <div className="flex-1 space-y-2 w-full max-w-xs">
        {data.slice(0, 5).map((d, i) => {
          const pct = Math.round((d.count / total) * 100);
          return (
            <div key={d.source} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-300 capitalize truncate max-w-[120px]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                {d.source}
              </span>
              <span className="text-slate-400 font-mono">
                {d.count} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PurchasesBySourceBarChart({ data }: { data: PurchasePoint[] }) {
  if (!data || data.length === 0 || data.every((d) => d.purchases === 0 && d.revenue === 0)) {
    return (
      <div className="flex h-56 flex-col items-center justify-center text-sm text-slate-400 gap-1">
        <span>No conversions recorded for this project yet.</span>
        <span className="text-xs text-slate-500">Test an order from the tracking demo page.</span>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 10);

  return (
    <div className="space-y-3 py-2">
      {data.map((item) => {
        const pct = Math.min(100, Math.max(8, (item.revenue / maxRevenue) * 100));
        return (
          <div key={item.source} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300 capitalize">{item.source}</span>
              <span className="text-emerald-400 font-semibold font-mono">
                ${item.revenue.toFixed(2)} ({item.purchases} orders)
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RevenueByCampaignBarChart({ data }: { data: CampaignPoint[] }) {
  if (!data || data.length === 0 || data.every((d) => d.revenue === 0)) {
    return (
      <div className="flex h-56 flex-col items-center justify-center text-sm text-slate-400 gap-1">
        <span>No campaign revenue yet.</span>
        <span className="text-xs text-slate-500">Campaigns will appear when purchases are attributed.</span>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 10);

  return (
    <div className="space-y-3 py-2">
      {data.slice(0, 5).map((item) => {
        const pct = Math.min(100, Math.max(8, (item.revenue / maxRevenue) * 100));
        return (
          <div key={item.campaign} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300 truncate max-w-[180px]">{item.campaign}</span>
              <span className="text-purple-400 font-semibold font-mono">
                ${item.revenue.toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
