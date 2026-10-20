import { NextRequest, NextResponse } from 'next/server';
import { analyticsDb } from '@/lib/db/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || undefined;
    const referrer = req.headers.get('referer') || undefined;

    const result = await analyticsDb.recordLinkClick(code, {
      ip,
      userAgent,
      referrer,
    });

    if (result.success && result.redirectUrl) {
      // Safe redirection to destination target
      return NextResponse.redirect(new URL(result.redirectUrl, req.url), 307);
    }

    // Fallback if short code does not exist
    return NextResponse.redirect(new URL('/admin/analytics?notice=link_not_found', req.url));
  } catch (err) {
    console.error('Link redirection handler error:', err);
    return NextResponse.redirect(new URL('/', req.url));
  }
}
