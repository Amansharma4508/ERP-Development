import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { pharmacyOrders, PharmacyOrder } from '@/lib/store';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const orders = user.role === 'admin'
    ? pharmacyOrders
    : pharmacyOrders.filter(o => o.userId === user.id);
  return NextResponse.json({ success: true, data: orders });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const order: PharmacyOrder = {
    id: `po${Date.now()}`,
    orderId: `PHARM-${String(pharmacyOrders.length + 1).padStart(3, '0')}`,
    userId: user.id,
    userName: user.fullName,
    medicines: body.medicines || [],
    deliveryType: body.deliveryType || '24hr',
    deliveryMode: body.deliveryMode || 'cod',
    centerName: body.centerName || '',
    address: body.address || '',
    status: 'pending',
    totalAmount: body.totalAmount || 0,
    prescriptionRequired: body.prescriptionRequired || false,
    createdAt: new Date().toISOString().split('T')[0],
  };
  pharmacyOrders.push(order);
  return NextResponse.json({ success: true, data: order }, { status: 201 });
}
