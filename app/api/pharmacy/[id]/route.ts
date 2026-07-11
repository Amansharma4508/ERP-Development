import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { pharmacyOrders } from '@/lib/store';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const idx = pharmacyOrders.findIndex(o => o.id === params.id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await req.json();
  Object.assign(pharmacyOrders[idx], body);
  return NextResponse.json({ success: true, data: pharmacyOrders[idx] });
}
