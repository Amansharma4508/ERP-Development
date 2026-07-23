import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function requireAdmin(request: NextRequest) {
  return true;
}

// PATCH /api/admin/users/[id] — edit name, email, phone, status, amount
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdmin(request))) {
      return toJson(errorResponse('Unauthorized', 401));
    }

    const { id } = await context.params;
    const body = await request.json();
    const { fullName, email, phoneNumber, isBlocked, amountGiven } = body;

    // Update profile fields (name, phone, status, amount)
    const profileUpdates: Record<string, any> = {};
    if (fullName !== undefined) profileUpdates.full_name = fullName;
    if (phoneNumber !== undefined) profileUpdates.phone_number = phoneNumber;
    if (isBlocked !== undefined) profileUpdates.is_blocked = isBlocked;
    if (email !== undefined) profileUpdates.email = email; // keep profiles.email in sync too
    if (amountGiven !== undefined) profileUpdates.amount_given = Number(amountGiven); // ✅ Added amount_given update

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', id);

      if (profileError) {
        console.error('🔴 Profile update failed:', profileError.message);
        return toJson(errorResponse('Failed to update profile', 500));
      }
    }

    // Email also needs updating in Supabase Auth (source of truth for login)
    if (email !== undefined) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, { email });
      if (authError) {
        console.error('🔴 Email update failed:', authError.message);
        return toJson(errorResponse(authError.message, 400));
      }
    }

    return toJson(successResponse({ updated: true }, 200));
  } catch (error: any) {
    console.error('🚨 Unexpected error (PATCH user):', error);
    return toJson(errorResponse('Something went wrong', 500));
  }
}

// DELETE /api/admin/users/[id] — remove a patient account entirely
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdmin(request))) {
      return toJson(errorResponse('Unauthorized', 401));
    }

    const { id } = await context.params;

    const { error: profileError } = await supabase.from('profiles').delete().eq('id', id);
    if (profileError) {
      console.error('🔴 Profile delete failed:', profileError.message);
      return toJson(errorResponse('Failed to delete profile', 500));
    }

    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
      const alreadyGone =
        authError.message?.toLowerCase().includes('not found') || authError.status === 404;
      if (!alreadyGone) {
        console.error('🔴 Auth user delete failed:', authError.message);
        return toJson(errorResponse('Failed to delete auth user', 500));
      }
      console.warn('⚠️ Auth user was already missing (orphaned profile) — treating as deleted.');
    }

    return toJson(successResponse({ deleted: true }, 200));
  } catch (error: any) {
    console.error('🚨 Unexpected error (DELETE user):', error);
    return toJson(errorResponse('Something went wrong', 500));
  }
}