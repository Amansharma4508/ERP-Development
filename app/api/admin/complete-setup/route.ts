import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

export async function POST(request: NextRequest) {
  try {
    const { token, fullName, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    // 1. Verify invite in 'admin_invites'
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('admin_invites')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 });
    }

    if (invite.used) {
      return NextResponse.json({ error: 'This invite link has already been used' }, { status: 400 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invite link has expired' }, { status: 400 });
    }

    const cleanEmail = invite.email.toLowerCase().trim();

    // 2. Create User in Supabase Auth
    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: fullName || 'Super Admin' },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // 3. Add to 'admin_members' table
    const { error: adminInsertError } = await supabaseAdmin
      .from('admin_members')
      .insert({
        id: authUser.user.id,
        email: cleanEmail,
        full_name: fullName || 'Super Admin',
      });

    if (adminInsertError) {
      console.error('Error inserting into admin_members:', adminInsertError);
    }

    // 4. Mark invite as used
    await supabaseAdmin
      .from('admin_invites')
      .update({ used: true })
      .eq('token', token);

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully! You can now log in.',
    });

  } catch (error: any) {
    console.error('Complete setup route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}