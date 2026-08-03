import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/jwt-config';
import { supabaseAdmin } from '@/lib/supabase/server';

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email : '';

    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 },
      );
    }

    const normalizedEmail = normalizeEmail(email);
    const { data: usersData, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();

    if (listUsersError) {
      return NextResponse.json(
        { success: false, error: 'Unable to process request right now.' },
        { status: 500 },
      );
    }

    const matchedUser = usersData?.users?.find((user) => normalizeEmail(user.email || '') === normalizedEmail);

    if (!matchedUser) {
      // Security ke liye hum hamesha success message hi dete hain taaki koi email enumeration na ho sake
      return NextResponse.json({
        success: true,
        message: 'If an account exists, you can reset your password below.',
      });
    }

    // Token generate karein jo 15 minutes tak valid ho
    const resetToken = jwt.sign(
      {
        sub: matchedUser.id,
        email: normalizedEmail,
        purpose: 'password-reset',
      },
      JWT_SECRET,
      { expiresIn: '15m' },
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    return NextResponse.json({
      success: true,
      resetLink, // <-- Yeh hum direct frontend ko bhej rahe hain bina email ke!
      message: 'Account found! Click the link below to set a new password.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Something went wrong.' },
      { status: 500 },
    );
  }
}