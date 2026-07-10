import { NextRequest } from 'next/server';
import { orders } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

// GET /api/orders
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload || payload.role === 'user') return toJson(errorResponse('Forbidden', 403));

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const result = status ? orders.filter((o) => o.status === status) : orders;

  return toJson(successResponse(result));
}

// POST /api/orders - create order
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload || payload.role === 'user') return toJson(errorResponse('Forbidden', 403));

  const body = await request.json();
  const { supplierName, items } = body;

  if (!supplierName || !items?.length) {
    return toJson(errorResponse('supplierName and items are required', 400));
  }

  const totalAmount = items.reduce(
    (sum: number, i: { quantity: number; unitPrice: number }) => sum + i.quantity * i.unitPrice,
    0,
  );

  const newOrder = {
    id: `ord${Date.now()}`,
    orderId: `ORD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`,
    supplierId: `sup${Date.now()}`,
    supplierName,
    items,
    status: 'pending' as const,
    totalAmount,
    orderDate: new Date().toISOString().split('T')[0],
  };

  orders.push(newOrder);
  return toJson(successResponse(newOrder, 201));
}
