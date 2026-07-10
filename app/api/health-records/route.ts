import { NextRequest } from 'next/server';
import { healthRecords } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

// GET /api/health-records
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload) return toJson(errorResponse('Invalid token', 401));

  const result =
    payload.role === 'admin'
      ? healthRecords
      : healthRecords.filter((r) => r.userId === payload.userId);

  return toJson(successResponse(result));
}

// POST /api/health-records
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload) return toJson(errorResponse('Invalid token', 401));

  const body = await request.json();
  const { title, type, doctor, date, description, bloodGroup, allergies, notes } = body;

  if (!title || !type || !date || !description) {
    return toJson(errorResponse('title, type, date, description are required', 400));
  }

  const newRecord = {
    id: `hr${Date.now()}`,
    userId: payload.userId,
    title,
    type,
    doctor: doctor || 'Self',
    date,
    description,
    bloodGroup,
    allergies,
    notes,
    createdAt: new Date().toISOString().split('T')[0],
  };

  healthRecords.push(newRecord);
  return toJson(successResponse(newRecord, 201));
}
