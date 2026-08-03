import { NextRequest } from 'next/server';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { generateToken } from '@/lib/auth';
import { createAdminUser, deleteAdminUser, signInWithPassword } from '@/lib/supabase/auth';
import { upsertDoctorProfile, upsertProfile } from '@/lib/supabase/db';

const ALLOWED_SELF_REGISTER_ROLES = ['user', 'doctor', 'logistics', 'wallet_user'];
const NEEDS_APPROVAL = ['doctor', 'logistics'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { email, password, fullName, phone, role = 'user' } = body;

    if (!email || !password || !fullName || !phone) {
      return toJson(errorResponse('All fields including phone number are required', 400));
    }

    const NEEDS_APPROVAL = ['doctor', 'logistics'];
    // Check karein ki role ko approval chahiye ya nahi
    const isApproved = !NEEDS_APPROVAL.includes(role);

    console.log("📝 Registration attempt for:", email, "role:", role);

    // Step 1: Create Auth User
    const { data: authData, error: authError } = await createAdminUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone, role },
    });

    if (authError) {
      console.error("❌ Auth Error:", authError);
      if (authError.code === 'email_exists' || authError.message.includes('already registered')) {
        return toJson(errorResponse('A user with this email already exists', 409));
      }
      return toJson(errorResponse(authError.message, 400));
    }

    if (!authData?.user?.id) {
      return toJson(errorResponse('Failed to create user', 500));
    }

    // Baaki ka code waisa hi rahega...

    console.log("✅ Auth user created with ID:", authData.user.id);

    // Step 2: Create Profile (Sirf 'user' ke liye 35000, baki roles ke liye 0)
    const initialAmountGiven = (role === 'user') ? 35000 : 0;

    const { data: profileData, error: profileError } = await upsertProfile({
      id: authData.user.id,
      full_name: fullName,
      email,
      phone_number: phone,
      account_type: role,
      is_approved: isApproved,
      amount_given: initialAmountGiven,
      amount_used: 0,
    });

    if (profileError) {
      console.error("🔴 Profile Upsert Failed:", {
        code: profileError.code,
        message: profileError.message,
      });

      await deleteAdminUser(authData.user.id);
      console.log("🧹 Cleaned up auth user");

      return toJson(errorResponse('Failed to create user profile. Please try again.', 500));
    }

    console.log("✅ Profile created successfully!");

    // Step 2.5: Agar role 'doctor' hai toh doctor_profiles table mein initial blank/default row create karein
    if (role === 'doctor') {
      const { error: doctorProfileError } = await upsertDoctorProfile({
        id: authData.user.id,
        specialization: 'General Practice',
        license_no: 'PENDING',
        experience_years: 0,
        consultation_fee: 0,
        is_approved: false,
        is_blocked: false,
      });

      if (doctorProfileError) {
        console.error("🔴 Doctor Profile Initial Insertion Failed:", doctorProfileError);
      } else {
        console.log("✅ Initial doctor profile created successfully!");
      }
    }

    // Step 3: Sign the new user in immediately
    const { error: signInError } = await signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("⚠️ Auto sign-in after register failed:", signInError.message);
    }

    const walletOnboardingStatus = role === 'user' ? 'pending' : 'none';
    const appToken = generateToken({
      id: authData.user.id,
      userId: authData.user.id,
      email: authData.user.email || email,
      fullName,
      role: role as any,
    });

    return toJson(
      successResponse({
        token: appToken,
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