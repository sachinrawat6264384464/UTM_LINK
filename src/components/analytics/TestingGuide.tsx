'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Globe,
  Share2,
  ShoppingCart,
  TrendingUp,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';

export function TestingGuide() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 bg-slate-900/80 hover:bg-slate-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              How to Test UTM Tracking & Attribution
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Interactive Lab Guide
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Step-by-step walkthrough for simulating campaigns (LinkedIn, Instagram, WhatsApp) and verifying conversions
            </p>
          </div>
        </div>
        <div className="text-slate-400">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-6 pt-2 border-t border-slate-800 space-y-6 text-sm text-slate-300">
          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">
                  1
                </span>
                Generate Campaign Link
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click a preset above (e.g. <strong>LinkedIn</strong> or <strong>WhatsApp</strong>) or type custom UTM values in the UTM Campaign Builder.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-xs">
                  2
                </span>
                Launch & Trigger Conversion
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click <strong>Open in New Tab</strong>. On the Demo Lab page, inspect the detected campaign badge, click <strong>Test Conversion</strong> or <strong>Simulate Purchase</strong>.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">
                  3
                </span>
                Verify Attributed Analytics
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Return to this dashboard. See the new visitor session, source breakdown, purchase event, and revenue attributed accurately.
              </p>
            </div>
          </div>

          {/* Core Concept Definitions */}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              UTM Tracking Dimension Glossary
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="font-semibold text-blue-400 mb-0.5">Source (utm_source)</div>
                <div className="text-slate-400">Where the visitor originated (e.g., <code>linkedin</code>, <code>instagram</code>, <code>google</code>).</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="font-semibold text-purple-400 mb-0.5">Medium (utm_medium)</div>
                <div className="text-slate-400">The marketing channel or mechanism (e.g., <code>social</code>, <code>cpc</code>, <code>email</code>, <code>chat_share</code>).</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="font-semibold text-emerald-400 mb-0.5">Campaign (utm_campaign)</div>
                <div className="text-slate-400">Specific marketing initiative or promotion (e.g., <code>portfolio_launch</code>, <code>spring_deals</code>).</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="font-semibold text-cyan-400 mb-0.5">Referrer Header</div>
                <div className="text-slate-400">The referring website host captured from browser header (e.g., <code>document.referrer</code>).</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="font-semibold text-pink-400 mb-0.5">Landing Page</div>
                <div className="text-slate-400">The first URL path accessed at the start of a user session.</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="font-semibold text-amber-400 mb-0.5">Attribution Model</div>
                <div className="text-slate-400">
                  Rules associating a purchase with touchpoints (e.g., First-Touch vs. Last Non-Direct Touch).
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-3 p-3 bg-blue-950/30 border border-blue-900/50 rounded-xl text-xs text-blue-200">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Zero Third-Party Dependency & Privacy Friendly:</span> This tracking engine operates exclusively with first-party anonymous tokens (<code>vid_</code> and <code>sid_</code>). No PII, cookies from third-party networks, or invasive device fingerprinting are collected.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
