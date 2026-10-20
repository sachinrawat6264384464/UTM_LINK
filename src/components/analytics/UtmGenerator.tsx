'use client';

import React, { useState, useEffect } from 'react';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Share2,
  RefreshCw,
} from 'lucide-react';

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
  {
    name: 'Direct Visit',
    source: '',
    medium: '',
    campaign: '',
    icon: '⚡',
    badgeColor: 'bg-slate-700/50 text-slate-300 border-slate-600/30',
  },
];

export function UtmGenerator() {
  const [baseUrl, setBaseUrl] = useState('');
  const [destinationPath, setDestinationPath] = useState('/tracking-demo');
  const [source, setSource] = useState('linkedin');
  const [medium, setMedium] = useState('social');
  const [campaign, setCampaign] = useState('portfolio_launch');
  const [content, setContent] = useState('cta_button');
  const [term, setTerm] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const buildGeneratedUrl = (): string => {
    const origin = baseUrl || 'http://localhost:3000';
    const path = destinationPath.startsWith('/') ? destinationPath : `/${destinationPath}`;
    
    // Direct visit preset (no parameters)
    if (!source && !medium && !campaign) {
      return `${origin}${path}`;
    }

    try {
      const url = new URL(`${origin}${path}`);
      if (source.trim()) url.searchParams.set('utm_source', source.trim().toLowerCase());
      if (medium.trim()) url.searchParams.set('utm_medium', medium.trim().toLowerCase());
      if (campaign.trim()) url.searchParams.set('utm_campaign', campaign.trim().toLowerCase());
      if (content.trim()) url.searchParams.set('utm_content', content.trim());
      if (term.trim()) url.searchParams.set('utm_term', term.trim());
      return url.toString();
    } catch {
      return `${origin}${path}`;
    }
  };

  const generatedUrl = buildGeneratedUrl();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const applyPreset = (preset: Preset) => {
    setSource(preset.source);
    setMedium(preset.medium);
    setCampaign(preset.campaign);
    setContent(preset.content || '');
    setTerm(preset.term || '');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              UTM Campaign Link Builder
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Live Generator
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Create campaign links with exact attribution dimensions and test end-to-end tracking
            </p>
          </div>
        </div>
      </div>

      {/* Preset Quick Buttons */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          One-Click Campaign Presets
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Destination URL / Path <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={destinationPath}
            onChange={(e) => setDestinationPath(e.target.value)}
            placeholder="/tracking-demo"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
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
            placeholder="linkedin, instagram, google"
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
            placeholder="social, cpc, email, banner"
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
            placeholder="portfolio_launch, summer_sale"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Campaign Content (<code className="text-slate-400">utm_content</code>)
          </label>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="cta_button, sidebar_banner"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Campaign Term (<code className="text-slate-400">utm_term</code>)
          </label>
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="target_keyword"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>
      </div>

      {/* Result Output Preview */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Generated Tracking Link
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied Link!' : 'Copy to Clipboard'}
            </button>

            <a
              href={generatedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in New Tab
            </a>
          </div>
        </div>

        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 font-mono text-xs text-emerald-400 break-all select-all">
          {generatedUrl}
        </div>
      </div>
    </div>
  );
}
