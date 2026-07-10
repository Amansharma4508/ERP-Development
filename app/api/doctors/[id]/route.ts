import { NextRequest } from 'next/server';
import { doctors } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';

// GET /api/doctors/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doctor = doctors.find((d) => d.id === id);
  if (!doctor) return toJson(errorResponse('Doctor not found', 404));
  return toJson(successResponse(doctor));
}
