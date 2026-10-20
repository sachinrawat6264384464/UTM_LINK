import { NextRequest } from 'next/server';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'utm_admin_secret_key_2026';

export function isAuthorizedAdmin(req: NextRequest): boolean {
  // Check header 'x-admin-key'
  const headerKey = req.headers.get('x-admin-key');
  if (headerKey && headerKey === ADMIN_API_KEY) {
    return true;
  }

  // Check Authorization Bearer header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token === ADMIN_API_KEY) return true;
  }

  // Check URL search param ?key=...
  const url = new URL(req.url);
  const paramKey = url.searchParams.get('adminKey');
  if (paramKey && paramKey === ADMIN_API_KEY) {
    return true;
  }

  // Check cookie
  const cookieKey = req.cookies.get('utm_admin_token')?.value;
  if (cookieKey && cookieKey === ADMIN_API_KEY) {
    return true;
  }

  // For seamless local testing in development, default to authorized if in dev mode unless strictly set
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return false;
}
