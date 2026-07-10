import { NextRequest } from 'next/server';
import { inventoryItems } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

function requireAdminOrDoctor(token: string | undefined) {
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role === 'user') return null;
  return payload;
}

// PATCH /api/inventory/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  const payload = requireAdminOrDoctor(token);
  if (!payload) return toJson(errorResponse('Unauthorized', 401));

  const { id } = await params;
  const item = inventoryItems.find((i) => i.id === id);
  if (!item) return toJson(errorResponse('Item not found', 404));

  const body = await request.json();
  Object.assign(item, body, { lastUpdated: new Date().toISOString().split('T')[0] });

  return toJson(successResponse(item));
}

// DELETE /api/inventory/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return toJson(errorResponse('Forbidden', 403));

  const { id } = await params;
  const idx = inventoryItems.findIndex((i) => i.id === id);
  if (idx === -1) return toJson(errorResponse('Item not found', 404));

  inventoryItems.splice(idx, 1);
  return toJson(successResponse({ message: 'Deleted' }));
}
