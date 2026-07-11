import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { demographics, Demographics } from '@/lib/store';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const demo = demographics.find(d => d.userId === user.id) || null;
  return NextResponse.json({ success: true, data: demo });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const idx = demographics.findIndex(d => d.userId === user.id);
  const demo: Demographics = { userId: user.id, ...body };
  if (idx >= 0) demographics[idx] = demo;
  else demographics.push(demo);
  return NextResponse.json({ success: true, data: demo });
}
