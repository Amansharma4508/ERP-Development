import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

// GET /api/doctors - Fetch approved doctors from database with optional specialization filter
export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return toJson(errorResponse('Unauthorized', 401));

  const payload = verifyToken(token);
  if (!payload) return toJson(errorResponse('Invalid token', 401));

  const { searchParams } = new URL(request.url);
  const specialization = searchParams.get('specialization');

  let query = supabaseAdmin
    .from('doctor_profiles')
    .select(`
      id,
      specialization,
      license_no,
      experience_years,
      consultation_fee,
      rating,
      review_count,
      bio,
      available_slots,
      is_approved,
      profile:profiles!doctor_profiles_id_fkey ( full_name, email )
    `)
    .eq('is_approved', true)
    .or('is_blocked.eq.false,is_blocked.is.null');

  if (specialization && specialization.toLowerCase() !== 'all') {
    query = query.ilike('specialization', `%${specialization}%`);
  }

  const { data, error } = await query;

  if (error) {
    return toJson(errorResponse(error.message, 500));
  }

  const formattedDoctors = (data ?? []).map((doc: any) => ({
    id: doc.id,
    fullName: doc.profile?.full_name ?? 'Dr. Unknown',
    email: doc.profile?.email ?? 'N/A',
    licenseNo: doc.license_no ?? 'N/A',
    specialization: doc.specialization || 'General',
    experienceYears: doc.experience_years || 0,
    consultationFee: Number(doc.consultation_fee || 0),
    rating: Number(doc.rating || 5.0),
    reviewsCount: doc.review_count || 0,
    bio: doc.bio || '',
    availableDays: doc.available_slots?.days ?? [],
  }));

  return toJson(successResponse(formattedDoctors));
}