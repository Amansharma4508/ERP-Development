import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { JWT_SECRET } from '@/lib/jwt-config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
  auth: { persistSession: false },
});

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendResetEmail(email: string, resetLink: string) {
  const fromAddress = process.env.RESEND_FROM_EMAIL || 'HealthERP <onboarding@resend.dev>';

  try {
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: 'Reset your HealthERP password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #0f172a;">
          <div style="background: linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%); border-radius: 16px; padding: 24px; color: white; margin-bottom: 20px;">
            <h2 style="margin: 0 0 12px; font-size: 24px;">Reset your password</h2>
            <p style="margin: 0; line-height: 1.6; opacity: 0.95;">
              We received a request to reset the password for your HealthERP account.
            </p>
          </div>
          <p style="margin: 0 0 16px; line-height: 1.7;">
            Use the secure link below to choose a new password. This link is valid for one hour.
          </p>
          <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 700;">
            Reset Password
          </a>
          <p style="margin-top: 20px; color: #475569; font-size: 13px; line-height: 1.6;">
            If you did not request this change, you can ignore this email.
          </p>
        </div>
      `,
    });

    return !error;
  } catch (error) {
    console.error('Password reset email send failed:', error);
    return false;
  }
}

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
      console.error('Failed to list users for reset request:', listUsersError);
      return NextResponse.json(
        { success: false, error: 'Unable to process password reset request right now.' },
        { status: 500 },
      );
    }

    const matchedUser = usersData?.users?.find((user) => normalizeEmail(user.email || '') === normalizedEmail);

    if (!matchedUser) {
      return NextResponse.json({
        success: true,
        emailSent: false,
        message: 'If an account exists for this email, a reset link has been sent.',
      });
    }

    const resetToken = jwt.sign(
      {
        sub: matchedUser.id,
        email: normalizedEmail,
        purpose: 'password-reset',
      },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const emailSent = await sendResetEmail(normalizedEmail, resetLink);

    return NextResponse.json({
      success: true,
      emailSent,
      resetLink: emailSent ? undefined : resetLink,
      message: emailSent
        ? 'If an account exists for this email, a reset link has been sent.'
        : 'If an account exists for this email, a reset link has been generated. The email delivery service needs to be configured for production.',
    });
  } catch (error: any) {
    console.error('Forgot password route failed:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Unable to process password reset request.' },
      { status: 500 },
    );
  }
}
