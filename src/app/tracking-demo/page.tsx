'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Share2,
  TrendingUp,
  BarChart2,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Activity,
  Layers,
  ArrowRight,
  Eye,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { useTracker } from '@/lib/tracking/useTracker';
import { DEMO_PRODUCTS } from '@/lib/constants/products';
import { DemoProduct } from '@/types/analytics';

export default function TrackingDemoPage() {
  const {
    visitorInfo,
    recentEvents,
    trackViewItem,
    trackAddToCart,
    trackPurchase,
    trackCustomEvent,
  } = useTracker();

  const [selectedProduct, setSelectedProduct] = useState<DemoProduct | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<any | null>(null);
  const [isSimulatingOrder, setIsSimulatingOrder] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'activity' | 'attribution'>('products');

  const handleViewProduct = (product: DemoProduct) => {
    setSelectedProduct(product);
    trackViewItem(product.id, product.name, product.price);
  };

  const handleAddToCart = (product: DemoProduct) => {
    trackAddToCart(product.id, product.name, product.price);
    alert(`Added "${product.name}" ($${product.price}) to cart! Event "add_to_cart" dispatched.`);
  };

  const handleSimulatePurchase = async (product: DemoProduct) => {
    if (!visitorInfo) return;
    setIsSimulatingOrder(true);
    setPurchaseSuccess(null);

    try {
      const response = await fetch('/api/analytics/demo-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: visitorInfo.visitorId,
          sessionId: visitorInfo.sessionId,
          productId: product.id,
          quantity: 1,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPurchaseSuccess(data.order);
        // Refresh local activity list by emitting local tracker purchase
        trackPurchase(data.order.orderId, data.order.orderAmount, data.order.items);
      } else {
        alert(`Error: ${data.error || 'Failed to simulate purchase'}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setIsSimulatingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-md">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight">Custom Analytics Lab</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Demo Environment
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/analytics"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
            >
              <span>View Admin Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Testing Live Campaign Attribution & Telemetry
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Next-Gen UTM Attribution & Telemetry Engine
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            This demo simulates real-world marketing traffic. Inspect your detected UTM source below, test item interactions, and trigger simulated conversions to view instant dashboard attribution.
          </p>

          {/* Quick Simulation Link Shortcuts */}
          <div className="pt-2 flex flex-wrap justify-center gap-2 text-xs">
            <span className="text-slate-500 text-xs self-center mr-1">Quick switch test campaigns:</span>
            <a
              href="/tracking-demo?utm_source=linkedin&utm_medium=social&utm_campaign=portfolio_launch"
              className="px-3 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/60 transition-colors"
            >
              💼 LinkedIn Campaign
            </a>
            <a
              href="/tracking-demo?utm_source=instagram&utm_medium=social_story&utm_campaign=spring_deals"
              className="px-3 py-1.5 rounded-lg bg-pink-950/60 hover:bg-pink-900/80 text-pink-300 border border-pink-800/60 transition-colors"
            >
              📸 Instagram Story
            </a>
            <a
              href="/tracking-demo?utm_source=whatsapp&utm_medium=chat_share&utm_campaign=vip_referral"
              className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 transition-colors"
            >
              💬 WhatsApp Share
            </a>
            <a
              href="/tracking-demo"
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
            >
              ⚡ Direct Visit
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Detected Visitor Telemetry & Campaign Attribution HUD */}
        <div className="bg-slate-900 border border-blue-900/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Live Detected Visitor & Campaign State
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h2>
                <p className="text-xs text-slate-400">
                  Extracted from URL parameters, browser referrer, and first-party anonymous tokens
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-mono">Visitor:</span>
              <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono text-blue-300">
                {visitorInfo?.visitorId || 'Resolving...'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            {/* Source */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Source</div>
              <div className="text-sm font-bold text-blue-400 capitalize truncate">
                {visitorInfo?.attribution.current.source || 'direct'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">utm_source</div>
            </div>

            {/* Medium */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Medium</div>
              <div className="text-sm font-bold text-purple-400 capitalize truncate">
                {visitorInfo?.attribution.current.medium || 'none'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">utm_medium</div>
            </div>

            {/* Campaign */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Campaign</div>
              <div className="text-sm font-bold text-emerald-400 font-mono truncate">
                {visitorInfo?.attribution.current.campaign || '(direct)'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">utm_campaign</div>
            </div>

            {/* Content */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Content</div>
              <div className="text-sm font-medium text-slate-300 font-mono truncate">
                {visitorInfo?.attribution.current.content || '(none)'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">utm_content</div>
            </div>

            {/* Session ID */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Session ID</div>
              <div className="text-sm font-medium text-slate-300 font-mono truncate">
                {visitorInfo?.sessionId || '...'}
              </div>
              <div className="text-[10px] text-slate-500">30 min window</div>
            </div>

            {/* First Touch Source */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] uppercase font-semibold text-slate-500 mb-0.5">First Touch</div>
              <div className="text-sm font-semibold text-amber-400 capitalize truncate">
                {visitorInfo?.attribution.firstTouch?.source || 'direct'}
              </div>
              <div className="text-[10px] text-slate-500">First-touch rule</div>
            </div>
          </div>
        </div>

        {/* Product Cards for Testing Conversions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-400" />
                Attribution Conversion Testing Products
              </h2>
              <p className="text-xs text-slate-400">
                Interact with items below to dispatch <code>view_item</code>, <code>add_to_cart</code>, and server-verified <code>purchase</code> conversions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DEMO_PRODUCTS.map((product) => (
              <div
                key={product.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{product.image}</span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {product.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    {product.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 font-medium">Verified Price</span>
                    <span className="text-2xl font-bold text-white font-mono">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewProduct(product)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Item
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/80 text-xs font-semibold transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Add to Cart
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isSimulatingOrder}
                    onClick={() => handleSimulatePurchase(product)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg transition-all duration-200 disabled:opacity-50"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Test Conversion (${product.price})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simulated Purchase Success Alert */}
        {purchaseSuccess && (
          <div className="bg-emerald-950/60 border border-emerald-600/50 rounded-2xl p-6 shadow-2xl animate-in fade-in duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Simulated Order Successfully Attributed!
                  </h3>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Order <strong>{purchaseSuccess.orderId}</strong> created for{' '}
                    <strong>${purchaseSuccess.orderAmount.toFixed(2)}</strong> attributed to campaign:{' '}
                    <code className="bg-emerald-900/80 px-2 py-0.5 rounded text-white font-mono">
                      {purchaseSuccess.utmCampaign}
                    </code>{' '}
                    (Source: {purchaseSuccess.utmSource})
                  </p>
                </div>
              </div>

              <Link
                href="/admin/analytics"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <span>View In Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Current Session Event Telemetry Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-base font-bold text-white">
                  Real-Time Session Telemetry Stream
                </h3>
                <p className="text-xs text-slate-400">
                  Live events generated in this browser session (dispatched automatically to Next.js API)
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {recentEvents.length} events emitted
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {recentEvents.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                Initializing tracker...
              </div>
            ) : (
              recentEvents.map((evt) => (
                <div
                  key={evt.eventId}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[10px] text-slate-500">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold font-mono text-[11px]">
                      {evt.eventName}
                    </span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {evt.pagePath}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                    <span>
                      src: <strong className="text-blue-400">{evt.utm_source || 'direct'}</strong>
                    </span>
                    <span>
                      camp: <strong className="text-emerald-400">{evt.utm_campaign || '(direct)'}</strong>
                    </span>
                    {evt.revenue && (
                      <span className="text-emerald-400 font-bold">
                        +${evt.revenue.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500">
        <p>Custom UTM Tracking & Analytics System built from scratch with Next.js App Router.</p>
        <p className="mt-1">Zero third-party trackers, zero cookies from external advertising networks.</p>
      </footer>
    </div>
  );
}
