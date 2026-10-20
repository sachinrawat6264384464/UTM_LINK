'use client';

import { useEffect, useState } from 'react';
import { tracker } from '@/lib/tracking/tracker';
import { TrackingEventPayload, VisitorInfo } from '@/types/analytics';

export function useTracker() {
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo | null>(null);
  const [recentEvents, setRecentEvents] = useState<TrackingEventPayload[]>([]);

  useEffect(() => {
    // Initialize tracking on mount
    const info = tracker.init();
    setVisitorInfo(info);
    setRecentEvents(tracker.getSessionEvents());

    // Subscribe to real-time events triggered during this session
    const unsubscribe = tracker.subscribe((newEvent) => {
      setRecentEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
      setVisitorInfo(tracker.getVisitorInfo());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    visitorInfo,
    recentEvents,
    trackPageView: (pagePath?: string, metadata?: Record<string, any>) => tracker.trackPageView(pagePath, metadata),
    trackViewItem: (id: string, name: string, price: number) => tracker.trackViewItem(id, name, price),
    trackAddToCart: (id: string, name: string, price: number) => tracker.trackAddToCart(id, name, price),
    trackBeginCheckout: (items: any[], total: number) => tracker.trackBeginCheckout(items, total),
    trackPurchase: (orderId: string, total: number, items: any[]) => tracker.trackPurchase(orderId, total, items),
    trackCustomEvent: (eventName: string, metadata?: Record<string, any>) => tracker.trackCustomEvent(eventName, metadata),
  };
}
