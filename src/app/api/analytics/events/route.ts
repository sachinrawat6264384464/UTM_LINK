import { NextRequest, NextResponse } from 'next/server';
import { analyticsDb } from '@/lib/db/store';
import { isRateLimited } from '@/lib/security/rateLimit';
import { TrackingEventPayload } from '@/types/analytics';

const VALID_EVENT_NAMES = new Set([
  'session_start',
  'page_view',
  'link_click',
  'view_item',
  'add_to_cart',
  'begin_checkout',
  'purchase',
  'custom_event',
]);

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Too many tracking events.' },
        { status: 429 }
      );
    }

    // 2. Size & Payload Parsing
    const body: TrackingEventPayload = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { eventId, visitorId, sessionId, eventName, timestamp, pagePath, workspaceId } = body;

    // Validate required fields
    if (!eventId || typeof eventId !== 'string' || eventId.length > 100) {
      return NextResponse.json({ error: 'Invalid eventId' }, { status: 400 });
    }
    if (!visitorId || typeof visitorId !== 'string' || visitorId.length > 100) {
      return NextResponse.json({ error: 'Invalid visitorId' }, { status: 400 });
    }
    if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 100) {
      return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
    }
    if (!eventName || !VALID_EVENT_NAMES.has(eventName)) {
      return NextResponse.json({ error: `Unsupported event: ${eventName}` }, { status: 400 });
    }
    if (!pagePath || typeof pagePath !== 'string') {
      return NextResponse.json({ error: 'Invalid pagePath' }, { status: 400 });
    }

    // Sanitize string dimensions
    const sanitizedEvent: TrackingEventPayload = {
      ...body,
      workspaceId: workspaceId || 'ws_default',
      utm_source: body.utm_source ? body.utm_source.substring(0, 50).toLowerCase() : undefined,
      utm_medium: body.utm_medium ? body.utm_medium.substring(0, 50).toLowerCase() : undefined,
      utm_campaign: body.utm_campaign ? body.utm_campaign.substring(0, 80).toLowerCase() : undefined,
      utm_content: body.utm_content ? body.utm_content.substring(0, 100) : undefined,
      utm_term: body.utm_term ? body.utm_term.substring(0, 100) : undefined,
      timestamp: timestamp || new Date().toISOString(),
    };

    // 3. Ingestion into database
    const result = await analyticsDb.recordEvent(sanitizedEvent);

    return NextResponse.json({
      success: true,
      eventId,
      recorded: result.recorded,
      reason: result.reason,
    });
  } catch (error: any) {
    console.error('Error processing tracking event:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while ingesting event' },
      { status: 500 }
    );
  }
}
