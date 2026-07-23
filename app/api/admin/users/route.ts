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

// app/api/admin/users/route.ts

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) {
      return toJson(errorResponse('Unauthorized', 401));
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone_number, photo_url, account_type, is_blocked, created_at, amount_given, amount_used')
      .eq('account_type', 'user')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('🔴 Fetch users failed:', error.message);
      return toJson(errorResponse('Failed to fetch users', 500));
    }

    const users = data.map(u => {
      let finalPhotoUrl = u.photo_url;

      if (!finalPhotoUrl) {
        finalPhotoUrl = `${u.id}.jpg`;
      }

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
        amountGiven: Number(u.amount_given ?? 35000), // ✅ Mapped
        amountUsed: Number(u.amount_used ?? 0),     // ✅ Mapped
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
    const { email, password, fullName, phoneNumber, amountGiven } = body;

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

    const initialAmount = Number(amountGiven) || 35000;

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: fullName,
        account_type: 'user',
        email,
        phone_number: phoneNumber || null,
        amount_given: initialAmount, // ✅ Default 35000 or custom saved
        amount_used: 0,             // ✅ Default 0
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
            amountGiven: initialAmount,
            amountUsed: 0,
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