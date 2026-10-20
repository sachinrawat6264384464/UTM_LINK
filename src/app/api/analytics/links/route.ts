import { NextRequest, NextResponse } from 'next/server';
import { analyticsDb } from '@/lib/db/store';
import { isAuthorizedAdmin } from '@/lib/auth/admin';

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId') || undefined;

  const links = await analyticsDb.getLinks(workspaceId);
  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      workspaceId,
      title,
      destinationUrl,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      customShortCode,
    } = body;

    if (!title || !destinationUrl || !utmSource || !utmMedium || !utmCampaign) {
      return NextResponse.json(
        { error: 'Missing required link fields: title, destinationUrl, utmSource, utmMedium, utmCampaign' },
        { status: 400 }
      );
    }

    const newLink = await analyticsDb.createLink({
      workspaceId: workspaceId || 'ws_default',
      title: title.trim(),
      destinationUrl: destinationUrl.trim(),
      utmSource: utmSource.trim(),
      utmMedium: utmMedium.trim(),
      utmCampaign: utmCampaign.trim(),
      utmContent: utmContent?.trim(),
      utmTerm: utmTerm?.trim(),
      customShortCode: customShortCode?.trim(),
    });

    return NextResponse.json({ success: true, link: newLink });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create tracked link' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const linkId = searchParams.get('id');
    if (!linkId) {
      return NextResponse.json({ error: 'Missing link id' }, { status: 400 });
    }

    await analyticsDb.deleteLink(linkId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete tracked link' }, { status: 500 });
  }
}
