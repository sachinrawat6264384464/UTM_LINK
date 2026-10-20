import Link from 'next/link';
import {
  BarChart3,
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  TrendingUp,
  Link2,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      {/* Top Banner */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-base text-white tracking-tight">
              UTM Tracking & Attribution Core
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/analytics"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Admin Dashboard
            </Link>
            <Link
              href="/tracking-demo"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              Launch Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" />
          100% First-Party Custom Analytics System
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Internal UTM Tracking & Attribution Engine
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Built from scratch using Next.js App Router, TypeScript, and relational persistence. No Google Analytics, no Tag Manager, zero third-party platform dependencies.
        </p>

        {/* Dual Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left pt-6">
          {/* Card 1: Public Demo Website */}
          <Link
            href="/tracking-demo"
            className="group relative bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                  <TrendingUp className="w-6 h-6" />
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  /tracking-demo
                </span>
              </div>

              <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
                Public Tracking Demo Lab
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Test landing page that reads UTM campaign tags, tracks visitor interactions, records <code>view_item</code> and <code>add_to_cart</code>, and allows triggering simulated test orders.
              </p>
            </div>

            <div className="pt-6 flex items-center text-xs font-bold text-blue-400 group-hover:translate-x-1 transition-transform">
              <span>Open Public Demo</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </Link>

          {/* Card 2: Admin Analytics Dashboard */}
          <Link
            href="/admin/analytics"
            className="group relative bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-6 shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
                  <BarChart3 className="w-6 h-6" />
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  /admin/analytics
                </span>
              </div>

              <h2 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors mb-2">
                Admin Analytics Dashboard
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full telemetry console with UTM link generator, traffic source breakdown (LinkedIn, Instagram, WhatsApp), conversion rates, charts, and real-time event inspector.
              </p>
            </div>

            <div className="pt-6 flex items-center text-xs font-bold text-purple-400 group-hover:translate-x-1 transition-transform">
              <span>Open Admin Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 text-xs text-left">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 font-bold text-slate-200 mb-1">
              <Link2 className="w-4 h-4 text-blue-400" />
              Campaign Presets & URL Builder
            </div>
            <p className="text-slate-400">
              One-click generators for LinkedIn, WhatsApp, Instagram, Facebook, Google organic, and direct links.
            </p>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 font-bold text-slate-200 mb-1">
              <Layers className="w-4 h-4 text-purple-400" />
              Dual Attribution Engine
            </div>
            <p className="text-slate-400">
              Maintains first-touch origin alongside last non-direct campaign attribution for every conversion.
            </p>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 font-bold text-slate-200 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Privacy-First & Zero PII
            </div>
            <p className="text-slate-400">
              Operates using anonymous tokens without tracking third-party advertising cookies or storing raw IPs.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        Custom UTM Tracking & Analytics System built for pair-programming verification.
      </footer>
    </div>
  );
}
