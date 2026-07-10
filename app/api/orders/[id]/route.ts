import { NextRequest } from 'next/server';
import { orders } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

// PATCH /api/orders/[id] - update status
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload || payload.role === 'user') return toJson(errorResponse('Forbidden', 403));

  const { id } = await params;
  const order = orders.find((o) => o.id === id);
  if (!order) return toJson(errorResponse('Order not found', 404));

  const body = await request.json();
  const { status, deliveryDate } = body;
  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return toJson(errorResponse('Invalid status', 400));

  order.status = status;
  if (deliveryDate) order.deliveryDate = deliveryDate;

  return toJson(successResponse(order));
}

// DELETE /api/orders/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return toJson(errorResponse('Forbidden', 403));

  const { id } = await params;
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return toJson(errorResponse('Order not found', 404));

  orders.splice(idx, 1);
  return toJson(successResponse({ message: 'Deleted' }));
}
