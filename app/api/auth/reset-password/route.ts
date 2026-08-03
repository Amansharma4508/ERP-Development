import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/jwt-config';
import { supabaseAdmin } from '@/lib/supabase/server';

const normalizeEmail = (value: string) => value.trim().toLowerCase();

function validatePassword(password: string) {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasLetter || !hasNumber) {
    return 'Password must contain both letters and numbers.';
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body.token === 'string' ? body.token : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : '';

    if (!token) {
      return NextResponse.json({ success: false, error: 'Reset token is required.' }, { status: 400 });
    }

    if (!password || !confirmPassword) {
      return NextResponse.json({ success: false, error: 'A new password and confirmation are required.' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, error: 'Passwords do not match.' }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ success: false, error: passwordError }, { status: 400 });
    }

    let decoded: jwt.JwtPayload | string;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 401 },
      );
    }

    const payload = typeof decoded === 'string' ? null : decoded;
    if (!payload || payload.purpose !== 'password-reset' || !payload.sub || !payload.email) {
      return NextResponse.json(
        { success: false, error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 401 },
      );
    }

    const { data: usersData, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
    if (listUsersError) {
      console.error('Failed to list users for password reset:', listUsersError);
      return NextResponse.json({ success: false, error: 'Unable to reset password right now.' }, { status: 500 });
    }

    const matchedUser = usersData?.users?.find((user) => {
      const normalized = normalizeEmail(user.email || '');
      return user.id === payload.sub || normalized === normalizeEmail(String(payload.email));
    });

    if (!matchedUser) {
      return NextResponse.json(
        { success: false, error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 401 },
      );
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(matchedUser.id, {
      password,
    });

    if (updateError) {
      console.error('Password update failed:', updateError);
      return NextResponse.json({ success: false, error: updateError.message || 'Password reset failed.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset successfully. You can now sign in with your new password.',
    });
  } catch (error: any) {
    console.error('Reset password failed:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Unable to reset password.' },
      { status: 500 },
    );
  }
}
