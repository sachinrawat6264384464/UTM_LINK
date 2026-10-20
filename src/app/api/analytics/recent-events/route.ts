import { NextRequest, NextResponse } from 'next/server';
import { analyticsDb } from '@/lib/db/store';
import { isAuthorizedAdmin } from '@/lib/auth/admin';

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10));
  const eventName = searchParams.get('eventName') || undefined;
  const source = searchParams.get('source') || undefined;
  const workspaceId = searchParams.get('workspaceId') || undefined;

  const events = await analyticsDb.getRecentEvents(limit, {
    eventName,
    source,
    workspaceId,
  });

  return NextResponse.json(events);
}
