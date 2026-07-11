import { NextRequest } from 'next/server';
import { logisticsTeam } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

function guard(token: string | undefined) {
  if (!token) return null;
  const p = verifyToken(token);
  if (!p || (p.role !== 'logistics' && p.role !== 'admin')) return null;
  return p;
}

// PATCH /api/logistics/team/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!guard(token)) return toJson(errorResponse('Unauthorized', 401));

  const { id } = await params;
  const member = logisticsTeam.find(m => m.id === id);
  if (!member) return toJson(errorResponse('Member not found', 404));

  const body = await request.json();
  Object.assign(member, body);
  return toJson(successResponse(member));
}

// DELETE /api/logistics/team/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!guard(token)) return toJson(errorResponse('Unauthorized', 401));

  const { id } = await params;
  const idx = logisticsTeam.findIndex(m => m.id === id);
  if (idx === -1) return toJson(errorResponse('Member not found', 404));

  logisticsTeam.splice(idx, 1);
  return toJson(successResponse({ message: 'Deleted' }));
}
