import { NextRequest } from 'next/server';
import { doctors } from '@/lib/store';
import { successResponse, toJson } from '@/lib/api-utils';

// GET /api/doctors - public list of all doctors
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const specialization = searchParams.get('specialization');

  const result = specialization
    ? doctors.filter((d) => d.specialization.toLowerCase().includes(specialization.toLowerCase()))
    : doctors;

  return toJson(successResponse(result));
}
