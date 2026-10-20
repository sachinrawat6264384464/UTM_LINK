'use client';

import React, { useState } from 'react';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  MousePointerClick,
  Clock,
  Sparkles,
} from 'lucide-react';
import { TrackedLink } from '@/types/analytics';

interface TrackedLinksTableProps {
  links: TrackedLink[];
  baseUrl: string;
  onRefresh: () => void;
}

export function TrackedLinksTable({ links, baseUrl, onRefresh }: TrackedLinksTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCopy = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tracked link?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/analytics/links?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      }
    } catch {}
    finally {
      setDeletingId(null);
    }
  };

  if (!links || links.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
        <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl mx-auto flex items-center justify-center border border-blue-500/20">
          <Link2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">No Tracked Campaign Links Yet</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Generate your first tracked link using the Campaign Link Generator above. Any clicks on WhatsApp, LinkedIn, or Instagram will be recorded directly into your database.
        </p>
      </div>
    );
  }

  const getSourceBadge = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('whatsapp')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (s.includes('linkedin')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (s.includes('instagram')) return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    if (s.includes('facebook')) return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
    if (s.includes('google')) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Active Campaign Redirect Links
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {links.length} Links
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Share these links on social media or in messages. Server intercepts every click, stores telemetry, and redirects.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Campaign Title</th>
              <th className="py-3 px-4">Tracking URL (/r/...)</th>
              <th className="py-3 px-4">Source & Campaign</th>
              <th className="py-3 px-4 text-center">Clicks</th>
              <th className="py-3 px-4">Last Clicked</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {links.map((link) => {
              const shortUrl = `${baseUrl}/r/${link.shortCode}`;
              const isCopied = copiedId === link.id;

              return (
                <tr key={link.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{link.title}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]" title={link.destinationUrl}>
                      Target: {link.destinationUrl}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-emerald-400 bg-slate-950 px-2 py-1 rounded border border-slate-800 select-all">
                        /r/{link.shortCode}
                      </span>
                      <button
                        onClick={() => handleCopy(link.id, shortUrl)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Copy full short link"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${getSourceBadge(link.utmSource)}`}>
                        {link.utmSource}
                      </span>
                      <span className="text-slate-400 text-xs">/ {link.utmCampaign}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-mono font-bold border border-amber-500/20">
                      <MousePointerClick className="w-3.5 h-3.5" />
                      {link.clicksCount}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {link.lastClickedAt ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(link.lastClickedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : (
                      <span className="text-slate-600">No clicks yet</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          setTimeout(onRefresh, 1200);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium transition-colors"
                        title="Click to test live redirection and click tracking"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Test Click
                      </a>

                      <button
                        onClick={() => handleDelete(link.id)}
                        disabled={deletingId === link.id}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 transition-colors"
                        title="Delete link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
