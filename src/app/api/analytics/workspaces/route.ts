import { NextRequest, NextResponse } from 'next/server';
import { analyticsDb } from '@/lib/db/store';
import { isAuthorizedAdmin } from '@/lib/auth/admin';

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaces = await analyticsDb.getWorkspaces();
  return NextResponse.json(workspaces);
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    const ws = await analyticsDb.createWorkspace(name.trim(), description?.trim());
    return NextResponse.json({ success: true, workspace: ws });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create workspace' }, { status: 500 });
  }
}
