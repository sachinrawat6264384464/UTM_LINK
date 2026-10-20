'use client';

import React, { useState, useEffect } from 'react';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  PlusCircle,
  Zap,
} from 'lucide-react';
import { Workspace } from '@/types/analytics';

interface Preset {
  name: string;
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  term?: string;
  icon: string;
  badgeColor: string;
}

const PRESETS: Preset[] = [
  {
    name: 'LinkedIn',
    source: 'linkedin',
    medium: 'social',
    campaign: 'portfolio_launch',
    content: 'hero_cta',
    term: 'nextjs_analytics',
    icon: '💼',
    badgeColor: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
  },
  {
    name: 'Instagram',
    source: 'instagram',
    medium: 'social_story',
    campaign: 'spring_deals',
    content: 'swipe_up',
    icon: '📸',
    badgeColor: 'bg-pink-600/20 text-pink-400 border-pink-500/30',
  },
  {
    name: 'WhatsApp',
    source: 'whatsapp',
    medium: 'chat_share',
    campaign: 'vip_referral',
    content: 'group_invite',
    icon: '💬',
    badgeColor: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30',
  },
  {
    name: 'Facebook',
    source: 'facebook',
    medium: 'paid_ad',
    campaign: 'retargeting_q2',
    content: 'video_card',
    icon: '👥',
    badgeColor: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30',
  },
  {
    name: 'Email',
    source: 'newsletter',
    medium: 'email',
    campaign: 'weekly_digest',
    content: 'digest_button',
    icon: '✉️',
    badgeColor: 'bg-amber-600/20 text-amber-400 border-amber-500/30',
  },
  {
    name: 'Google Organic',
    source: 'google',
    medium: 'organic',
    campaign: 'organic_search',
    icon: '🔍',
    badgeColor: 'bg-cyan-600/20 text-cyan-400 border-cyan-500/30',
  },
];

interface UtmGeneratorProps {
  workspaces?: Workspace[];
  selectedWorkspaceId?: string;
  onLinkCreated?: () => void;
}

export function UtmGenerator({
  workspaces = [],
  selectedWorkspaceId = 'ws_default',
  onLinkCreated,
}: UtmGeneratorProps) {
  const [baseUrl, setBaseUrl] = useState('');
  const [workspaceId, setWorkspaceId] = useState(selectedWorkspaceId);
  const [title, setTitle] = useState('');
  const [destinationPath, setDestinationPath] = useState('/tracking-demo');
  const [source, setSource] = useState('whatsapp');
  const [medium, setMedium] = useState('chat_share');
  const [campaign, setCampaign] = useState('vip_referral');
  const [content, setContent] = useState('broadcast_cta');
  const [term, setTerm] = useState('');
  const [customShortCode, setCustomShortCode] = useState('');
  
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedShort, setCopiedShort] = useState(false);
  const [savingLink, setSavingLink] = useState(false);
  const [createdShortUrl, setCreatedShortUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (selectedWorkspaceId && selectedWorkspaceId !== 'all') {
      setWorkspaceId(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId]);

  const buildGeneratedUrl = (): string => {
    const origin = baseUrl || 'http://localhost:3000';
    let target = destinationPath.trim() || '/tracking-demo';
    
    // Support relative paths and absolute external URLs (e.g. https://my-botmartz.com)
    let url: URL;
    try {
      if (target.startsWith('http://') || target.startsWith('https://')) {
        url = new URL(target);
      } else {
        const path = target.startsWith('/') ? target : `/${target}`;
        url = new URL(`${origin}${path}`);
      }

      if (source.trim()) url.searchParams.set('utm_source', source.trim().toLowerCase());
      if (medium.trim()) url.searchParams.set('utm_medium', medium.trim().toLowerCase());
      if (campaign.trim()) url.searchParams.set('utm_campaign', campaign.trim().toLowerCase());
      if (content.trim()) url.searchParams.set('utm_content', content.trim());
      if (term.trim()) url.searchParams.set('utm_term', term.trim());
      if (workspaceId) url.searchParams.set('utm_project', workspaceId);
      return url.toString();
    } catch {
      return `${origin}${target.startsWith('/') ? target : `/${target}`}`;
    }
  };

  const generatedUrl = buildGeneratedUrl();

  const handleCopyFull = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopiedFull(true);
      setTimeout(() => setCopiedFull(false), 2000);
    } catch {}
  };

  const handleCopyShort = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedShort(true);
      setTimeout(() => setCopiedShort(false), 2000);
    } catch {}
  };

  const applyPreset = (preset: Preset) => {
    setSource(preset.source);
    setMedium(preset.medium);
    setCampaign(preset.campaign);
    setContent(preset.content || '');
    setTerm(preset.term || '');
    if (!title) {
      setTitle(`${preset.name} Campaign`);
    }
  };

  const handleCreateTrackedLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLink(true);
    setCreatedShortUrl(null);

    try {
      const linkTitle = title.trim() || `${source} - ${campaign}`;
      const res = await fetch('/api/analytics/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspaceId === 'all' ? 'ws_default' : workspaceId,
          title: linkTitle,
          destinationUrl: destinationPath.trim() || '/tracking-demo',
          utmSource: source.trim() || 'direct',
          utmMedium: medium.trim() || 'none',
          utmCampaign: campaign.trim() || '(direct)',
          utmContent: content.trim(),
          utmTerm: term.trim(),
          customShortCode: customShortCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.link) {
        const shortUrl = `${baseUrl || 'http://localhost:3000'}/r/${data.link.shortCode}`;
        setCreatedShortUrl(shortUrl);
        setTitle('');
        setCustomShortCode('');
        if (onLinkCreated) onLinkCreated();
      } else {
        alert(data.error || 'Failed to create link');
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setSavingLink(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Campaign Link Generator & Click Tracker
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Live Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Create and save campaign links with automatic click-counting, redirection (/r/[code]), and project attribution
            </p>
          </div>
        </div>

        {/* Workspace select for link */}
        {workspaces.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Target Project:</span>
            <select
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Preset Quick Buttons */}
      <div className="mb-5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          One-Click Platform Presets
        </label>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 hover:scale-105 ${p.badgeColor}`}
            >
              <span>{p.icon}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Form Fields */}
      <form onSubmit={handleCreateTrackedLink}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Link Title / Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. WhatsApp Launch Broadcast"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Destination URL or Path <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={destinationPath}
              onChange={(e) => setDestinationPath(e.target.value)}
              placeholder="/tracking-demo or https://botmartz.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Campaign Source (<code className="text-blue-400">utm_source</code>){' '}
              <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="whatsapp, linkedin, instagram"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Campaign Medium (<code className="text-blue-400">utm_medium</code>){' '}
              <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
              placeholder="social, chat_share, email"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Campaign Name (<code className="text-blue-400">utm_campaign</code>){' '}
              <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="vip_referral, summer_sale"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Custom Short Code (optional)
            </label>
            <input
              type="text"
              value={customShortCode}
              onChange={(e) => setCustomShortCode(e.target.value)}
              placeholder="e.g. wa-launch or botmartz-deal"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <button
            type="submit"
            disabled={savingLink}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md"
          >
            <Zap className="w-4 h-4" />
            <span>{savingLink ? 'Saving Link...' : 'Save & Generate Tracked Click Link (/r/...)'}</span>
          </button>
        </div>
      </form>

      {/* Generated Tracked Short Link Box (if newly created) */}
      {createdShortUrl && (
        <div className="mb-4 p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Link Successfully Saved! Anyone clicking this link will be tracked into your database:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyShort(createdShortUrl)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                {copiedShort ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedShort ? 'Copied Short URL!' : 'Copy Short Link'}
              </button>
              <a
                href={createdShortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Test Click Now
              </a>
            </div>
          </div>
          <div className="font-mono text-xs text-emerald-300 bg-slate-950 p-2.5 rounded-lg border border-emerald-800/50 break-all select-all">
            {createdShortUrl}
          </div>
        </div>
      )}

      {/* Direct Full UTM URL Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Direct Destination URL with UTM Tags
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyFull}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                copiedFull ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {copiedFull ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedFull ? 'Copied!' : 'Copy Direct URL'}
            </button>
            <a
              href={generatedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Page
            </a>
          </div>
        </div>

        <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80 font-mono text-xs text-blue-400 break-all select-all">
          {generatedUrl}
        </div>
      </div>
    </div>
  );
}
