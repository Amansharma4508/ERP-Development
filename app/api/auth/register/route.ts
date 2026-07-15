import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, role = 'user' } = body;

    if (!email || !password || !fullName) {
      return toJson(errorResponse('All fields are required', 400));
    }

    console.log("📝 Registration attempt for:", email);

    // Step 1: Create Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
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

    // Step 2: Create Profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: fullName,
        account_type: role,
      })
      .select();

    if (profileError) {
      console.error("🔴 Profile Insert Failed:", {
        code: profileError.code,
        message: profileError.message,
      });

      await supabase.auth.admin.deleteUser(authData.user.id);
      console.log("🧹 Cleaned up auth user");

      return toJson(errorResponse('Failed to create user profile. Please try again.', 500));
    }

    console.log("✅ Profile created successfully!");

    // Step 3: Sign the new user in immediately so we can return a real session token.
    // Without this, the frontend has no token to call authenticated routes (like wallet submit)
    // right after registering.
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("⚠️ Auto sign-in after register failed:", signInError.message);
    }

    // Step 4: Brand new user, so wallet onboarding is always 'pending' for role 'user'
    const walletOnboardingStatus = role === 'user' ? 'pending' : 'none';

    return toJson(
      successResponse({
        token: signInData?.session?.access_token || '',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          fullName,
          role,
        },
        walletOnboardingStatus,
      }, 201)
    );

  } catch (error: any) {
    console.error("🚨 Unexpected Error:", error);
    return toJson(errorResponse('Something went wrong', 500));
  }
}