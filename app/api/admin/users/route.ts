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

// app/api/admin/user/route.tsx

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) {
      return toJson(errorResponse('Unauthorized', 401));
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone_number, photo_url, account_type, is_blocked, created_at')
      .eq('account_type', 'user')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('🔴 Fetch users failed:', error.message);
      return toJson(errorResponse('Failed to fetch users', 500));
    }

    const users = data.map(u => {
  // 1. Pehle database wala URL check karein
  let finalPhotoUrl = u.photo_url;

  // 2. Agar database mein null hai, toh hum 'id.jpg' ya 'id' format try karenge
  // Note: Yahan aapko file extension (jaise .jpg ya .png) wahi rakhna hoga jo aapke storage mein hai
  if (!finalPhotoUrl) {
    // Agar aapka file name sirf 'user_id.jpg' hai toh:
    finalPhotoUrl = `${u.id}.jpg`; // Yahan apna format adjust karein
  }

  // 3. Ab public URL generate karein
  if (finalPhotoUrl && !finalPhotoUrl.startsWith('http')) {
    const { data: publicUrlData } = supabase.storage
      .from('live-photos')
      .getPublicUrl(finalPhotoUrl);
    
    finalPhotoUrl = publicUrlData.publicUrl;
  }

  return {
    id: u.id,
    fullName: u.full_name,
    email: u.email || '',
    phoneNumber: u.phone_number || '',
    photoUrl: finalPhotoUrl || '', 
    isBlocked: u.is_blocked,
    createdAt: u.created_at,
  };
});

    return toJson(successResponse({ users }, 200));
  } catch (error: any) {
    console.error('🚨 Unexpected error (GET users):', error);
    return toJson(errorResponse('Something went wrong', 500));
  }
}
// POST /api/admin/users — admin manually adds a new patient account
export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) {
      return toJson(errorResponse('Unauthorized', 401));
    }

    const body = await request.json();
    const { email, password, fullName, phoneNumber } = body;

    if (!email || !password || !fullName) {
      return toJson(errorResponse('Email, password and full name are required', 400));
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'user' },
    });

    if (authError) {
      if (authError.code === 'email_exists') {
        return toJson(errorResponse('A user with this email already exists', 409));
      }
      return toJson(errorResponse(authError.message, 400));
    }

    if (!authData?.user?.id) {
      return toJson(errorResponse('Failed to create user', 500));
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: fullName,
        account_type: 'user',
        email,
        phone_number: phoneNumber || null,
      });

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.error('🔴 Profile insert failed:', profileError.message);
      return toJson(errorResponse('Failed to create user profile', 500));
    }

    return toJson(
      successResponse(
        {
          user: {
            id: authData.user.id,
            email,
            fullName,
            phoneNumber: phoneNumber || '',
            photoUrl: '',
            isBlocked: false,
            createdAt: new Date().toISOString(),
          },
        },
        201
      )
    );
  } catch (error: any) {
    console.error('🚨 Unexpected error (POST users):', error);
    return toJson(errorResponse('Something went wrong', 500));
  }
}