import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_SELF_REGISTER_ROLES = ['user', 'doctor', 'logistics', 'wallet_user'];
const NEEDS_APPROVAL = ['doctor', 'logistics'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { email, password, fullName, phone, role = 'user' } = body;

    // Validation update to include phone check if required
    if (!email || !password || !fullName || !phone) {
      return toJson(errorResponse('All fields including phone number are required', 400));
    }

    if (!ALLOWED_SELF_REGISTER_ROLES.includes(role)) {
      console.warn(`⚠️ Blocked attempt to self-register with disallowed role: ${role}`);
      role = 'user';
    }

    const isApproved = !NEEDS_APPROVAL.includes(role);

    console.log("📝 Registration attempt for:", email, "role:", role);

    // Step 1: Create Auth User (Added phone to user_metadata)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone, role },
    });

    if (authError) {
      console.error("❌ Auth Error:", authError);
      if (authError.code === 'email_exists') {
        return toJson(errorResponse('A user with this email already exists', 409));
      }
      return toJson(errorResponse(authError.message, 400));
    }

    if (!authData?.user?.id) {
      return toJson(errorResponse('Failed to create user', 500));
    }

    console.log("✅ Auth user created with ID:", authData.user.id);

    // Step 2: Create Profile (Added phone column insertion)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        full_name: fullName,
        email: email,
        phone_number: phone, // ✅ Ab yeh safely save ya update ho jayega
        account_type: role,
        is_approved: isApproved,
      }, { onConflict: 'id' })
      .select();

    if (profileError) {
      console.error("🔴 Profile Upsert Failed:", {
        code: profileError.code,
        message: profileError.message,
      });

      await supabase.auth.admin.deleteUser(authData.user.id);
      console.log("🧹 Cleaned up auth user");

      return toJson(errorResponse('Failed to create user profile. Please try again.', 500));
    }

    console.log("✅ Profile created successfully!");

    // Step 3: Sign the new user in immediately
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("⚠️ Auto sign-in after register failed:", signInError.message);
    }

    const walletOnboardingStatus = role === 'user' ? 'pending' : 'none';

    return toJson(
      successResponse({
        token: signInData?.session?.access_token || '',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          fullName,
          phone,
          role,
          isApproved,
        },
        walletOnboardingStatus,
      }, 201)
    );

  } catch (error: any) {
    console.error("🚨 Unexpected Error:", error);
    return toJson(errorResponse('Something went wrong', 500));
  }
}