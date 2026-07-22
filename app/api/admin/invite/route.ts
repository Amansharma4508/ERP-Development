import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

async function getVerifiedAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    console.error('Auth Debug: No token found in headers');
    return null;
  }

  const { data: callerAuth, error: callerAuthError } = await supabaseAdmin.auth.getUser(token);
  if (callerAuthError || !callerAuth?.user) {
    console.error('Auth Debug: Supabase getUser failed:', callerAuthError?.message);
    return null;
  }

  // Check in admin_members table
  const { data: adminMember } = await supabaseAdmin
    .from('admin_members')
    .select('id, email')
    .ilike('email', callerAuth.user.email || '')
    .maybeSingle();

  if (adminMember) {
    return callerAuth.user; 
  }

  // Fallback check in profiles table
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('account_type')
    .eq('id', callerAuth.user.id)
    .maybeSingle();

  if (profile?.account_type === 'admin') {
    return callerAuth.user;
  }

  console.error('Auth Debug: User is authenticated but not found in admin tables:', callerAuth.user.email);
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await getVerifiedAdmin(request);
    if (!adminUser) {
      return new Response(JSON.stringify({ error: 'Forbidden — admin access required or session expired' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { email } = await request.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    // Note: invited_by ko hata diya hai taaki foreign key / uuid mismatch error na aaye
    const { error: insertError } = await supabaseAdmin.from('admin_invites').insert({
      email,
      token,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error('Invite database insert error:', insertError.message);
      return new Response(JSON.stringify({ error: `DB Error: ${insertError.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const baseUrl = 
      process.env.NEXT_PUBLIC_APP_URL || 
      request.nextUrl.origin || 
      'http://localhost:3000';

    const inviteLink = `${baseUrl}/admin/register?token=${token}`;

    let emailSent = false;
    try {
      const { error: emailError } = await resend.emails.send({
        from: 'HealthERP <onboarding@resend.dev>',
        to: email,
        subject: 'You have been invited as HealthERP Admin',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Admin Access Invitation</h2>
            <p>Click below to setup your admin account:</p>
            <a href="${inviteLink}" style="padding: 12px 24px; background: #4f46e5; color: white; border-radius: 8px; text-decoration: none; display: inline-block;">
              Accept Admin Invite
            </a>
          </div>
        `,
      });
      if (!emailError) emailSent = true;
    } catch (err) {
      console.error('Email sending exception:', err);
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailSent,
        inviteLink,
        expiresAt,
        message: emailSent ? 'Invite email sent successfully!' : 'Invite created! Copy the link manually.',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Invite route critical error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Something went wrong' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: invite, error } = await supabaseAdmin
      .from('admin_invites')
      .select('email, expires_at, used')
      .eq('token', token)
      .single();

    if (error || !invite) {
      return new Response(JSON.stringify({ valid: false, error: 'Invalid invite link' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (invite.used) {
      return new Response(JSON.stringify({ valid: false, error: 'This invite has already been used' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, error: 'This invite has expired' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ valid: true, email: invite.email }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Something went wrong' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}