import { NextRequest, NextResponse } from 'next/server';
import { analyticsDb } from '@/lib/db/store';
import { DEMO_PRODUCTS } from '@/lib/constants/products';
import { generateId } from '@/lib/tracking/utm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { visitorId, sessionId, productId, quantity = 1 } = body;

    if (!visitorId || typeof visitorId !== 'string') {
      return NextResponse.json({ error: 'visitorId is required' }, { status: 400 });
    }
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Server-side lookup of product: NEVER trust client-submitted amount
    const product = DEMO_PRODUCTS.find((p) => p.id === productId) || DEMO_PRODUCTS[0];
    const qty = Math.max(1, Math.min(10, Number(quantity) || 1));
    const calculatedAmount = Number((product.price * qty).toFixed(2));

    const orderId = generateId('ord_sim');
    const nowIso = new Date().toISOString();

    // Verify session in DB
    const session = await analyticsDb.getSession(sessionId);

    // Record verified order in DB
    const { order } = await analyticsDb.recordOrder({
      orderId,
      sessionId,
      visitorId,
      orderAmount: calculatedAmount,
      currency: product.currency,
      orderStatus: 'simulated_success',
      createdAt: nowIso,
      utmSource: session?.source || 'direct',
      utmMedium: session?.medium || 'none',
      utmCampaign: session?.campaign || '(direct)',
      items: [
        {
          productId: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity: qty,
          total: calculatedAmount,
        },
      ],
    });

    // Ingest the purchase event
    await analyticsDb.recordEvent({
      eventId: generateId('evt_pur'),
      timestamp: nowIso,
      visitorId,
      sessionId,
      eventName: 'purchase',
      pagePath: '/tracking-demo',
      orderId,
      revenue: calculatedAmount,
      currency: product.currency,
      utm_source: session?.source,
      utm_medium: session?.medium,
      utm_campaign: session?.campaign,
      metadata: {
        isDemoPurchase: true,
        orderId,
        productName: product.name,
        amount: calculatedAmount,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Simulated conversion processed successfully',
      order,
    });
  } catch (error: any) {
    console.error('Error handling demo purchase:', error);
    return NextResponse.json(
      { error: 'Failed to process simulated order' },
      { status: 500 }
    );
  }
}
