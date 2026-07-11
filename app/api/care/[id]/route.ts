import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { careBookings } from '@/lib/store';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const idx = careBookings.findIndex(b => b.id === params.id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await req.json();
  Object.assign(careBookings[idx], body);
  return NextResponse.json({ success: true, data: careBookings[idx] });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const idx = careBookings.findIndex(b => b.id === params.id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  careBookings.splice(idx, 1);
  return NextResponse.json({ success: true });
}
