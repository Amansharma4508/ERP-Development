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

// GET /api/logistics/team
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!guard(token)) return toJson(errorResponse('Unauthorized', 401));

  const { searchParams } = new URL(request.url);
  const pointId = searchParams.get('pointId');
  const status  = searchParams.get('status');

  let result = [...logisticsTeam];
  if (pointId) result = result.filter(m => m.pointId === pointId);
  if (status)  result = result.filter(m => m.status === status);

  return toJson(successResponse(result));
}

// POST /api/logistics/team
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!guard(token)) return toJson(errorResponse('Unauthorized', 401));

  const body = await request.json();
  const { name, role, pointId, area, phone } = body;

  if (!name || !role || !pointId || !phone) {
    return toJson(errorResponse('name, role, pointId and phone are required', 400));
  }

  const newMember = {
    id:          `tm${Date.now()}`,
    name, role, pointId,
    area:        area ?? '',
    phone,
    status:      'active' as const,
    joiningDate: new Date().toISOString().split('T')[0],
  };

  logisticsTeam.push(newMember);
  return toJson(successResponse(newMember, 201));
}
