import { DemoProduct } from '@/types/analytics';

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: 'prod_growth_bundle',
    name: 'Growth Attribution Suite',
    category: 'Analytics Software',
    price: 199.0,
    currency: 'USD',
    image: '📊',
    description: 'Enterprise attribution tracking engine with real-time multi-touch campaign insights.',
  },
  {
    id: 'prod_utm_builder_pro',
    name: 'UTM Campaign Manager Pro',
    category: 'Marketing Tools',
    price: 79.0,
    currency: 'USD',
    image: '🎯',
    description: 'Automated UTM link builder with custom presets, shortened URLs, and QR code generator.',
  },
  {
    id: 'prod_funnel_optimizer',
    name: 'Funnel & Conversion Radar',
    category: 'Conversion Optimization',
    price: 129.0,
    currency: 'USD',
    image: '⚡',
    description: 'Deep funnel tracking with checkout drop-off analysis and cross-channel ROAS mapping.',
  },
];
