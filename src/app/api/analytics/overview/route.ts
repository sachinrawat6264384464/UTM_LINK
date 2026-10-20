import { NextRequest, NextResponse } from 'next/server';
import { analyticsDb } from '@/lib/db/store';
import { isAuthorizedAdmin } from '@/lib/auth/admin';

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId') || undefined;
  const source = searchParams.get('source') || undefined;
  const campaign = searchParams.get('campaign') || undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  const overview = await analyticsDb.getOverview({
    workspaceId,
    source,
    campaign,
    startDate,
    endDate,
  });

  return NextResponse.json(overview);
}
