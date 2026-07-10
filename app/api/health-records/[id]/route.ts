import { NextRequest } from 'next/server';
import { healthRecords } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

// PATCH /api/health-records/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload) return toJson(errorResponse('Invalid token', 401));

  const { id } = await params;
  const record = healthRecords.find((r) => r.id === id);
  if (!record) return toJson(errorResponse('Record not found', 404));
  if (record.userId !== payload.userId && payload.role !== 'admin') {
    return toJson(errorResponse('Forbidden', 403));
  }

  const body = await request.json();
  Object.assign(record, body);
  return toJson(successResponse(record));
}

// DELETE /api/health-records/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload) return toJson(errorResponse('Invalid token', 401));

  const { id } = await params;
  const idx = healthRecords.findIndex((r) => r.id === id);
  if (idx === -1) return toJson(errorResponse('Record not found', 404));
  if (healthRecords[idx].userId !== payload.userId && payload.role !== 'admin') {
    return toJson(errorResponse('Forbidden', 403));
  }

  healthRecords.splice(idx, 1);
  return toJson(successResponse({ message: 'Deleted' }));
}
