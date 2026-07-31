import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

function requireAdmin(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return { error: toJson(errorResponse('Unauthorized: No token provided', 401)) };
  }
  const payload = verifyToken(token);
  if (!payload) {
    return { error: toJson(errorResponse('Unauthorized: Invalid or expired token', 401)) };
  }
  if (payload.role?.toLowerCase() !== 'admin') {
    return { error: toJson(errorResponse(`Forbidden: Admin access required (got role: ${payload.role})`, 403)) };
  }
  return { payload };
}

// GET /api/admin/doctor - Fetch all doctors for admin
export async function GET(request: NextRequest) {
  const { error } = requireAdmin(request);
  if (error) return error;

  const { data, error: dbError } = await supabaseAdmin
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
      is_approved,
      is_blocked,
      created_at,
      profile:profiles!doctor_profiles_id_fkey ( full_name, email, phone_number )
    `)
    .order('created_at', { ascending: false });

  if (dbError) return toJson(errorResponse(dbError.message, 500));

  const formatted = (data ?? []).map((doc: any) => ({
    id: doc.id,
    fullName: doc.profile?.full_name ?? 'N/A',
    email: doc.profile?.email ?? 'N/A',
    phone: doc.profile?.phone_number ?? 'N/A',
    specialization: doc.specialization,
    licenseNo: doc.license_no,
    experienceYears: doc.experience_years,
    consultationFee: doc.consultation_fee,
    rating: doc.rating,
    reviewsCount: doc.review_count,
    bio: doc.bio,
    isApproved: doc.is_approved,
    isBlocked: doc.is_blocked,
    createdAt: doc.created_at,
  }));

  return toJson(successResponse(formatted));
}

// PATCH /api/admin/doctor - Approve or Reject / Block doctor
export async function PATCH(request: NextRequest) {
  const { error } = requireAdmin(request);
  if (error) return error;

  const body = await request.json();
  const { doctorId, isApproved, isBlocked } = body;

  if (!doctorId) return toJson(errorResponse('Doctor ID is required', 400));

  const updateData: any = {};
  if (typeof isApproved === 'boolean') updateData.is_approved = isApproved;
  if (typeof isBlocked === 'boolean') updateData.is_blocked = isBlocked;

  const { data, error: dbError } = await supabaseAdmin
    .from('doctor_profiles')
    .update(updateData)
    .eq('id', doctorId)
    .select()
    .single();

  if (dbError) return toJson(errorResponse(dbError.message, 500));

  return toJson(successResponse(data));
}

// DELETE /api/admin/doctor - Delete doctor profile
export async function DELETE(request: NextRequest) {
  const { error } = requireAdmin(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return toJson(errorResponse('Doctor ID required', 400));

  const { error: dbError } = await supabaseAdmin.from('doctor_profiles').delete().eq('id', id);
  if (dbError) return toJson(errorResponse(dbError.message, 500));

  return toJson(successResponse({ message: 'Doctor deleted successfully' }));
}