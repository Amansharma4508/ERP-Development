import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

export async function POST(request: NextRequest) {
  try {
    const { token, password, fullName } = await request.json();

    if (!token || !password || !fullName) {
      return new Response(JSON.stringify({ error: 'Token, password and full name are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Re-verify the token server-side (never trust the client just passed the check page)
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('admin_invites')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      return new Response(JSON.stringify({ error: 'Invalid invite link' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (invite.used) {
      return new Response(JSON.stringify({ error: 'This invite has already been used' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'This invite has expired' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Create the auth user with the invited email — account_type is hardcoded 'admin' below,
    // never taken from the request body.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'admin' },
    });

    if (authError) {
      if (authError.code === 'email_exists') {
        return new Response(JSON.stringify({ error: 'An account with this email already exists' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Create profile — account_type hardcoded, is_approved true (admins don't need approval)
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      full_name: fullName,
      email: invite.email,
      account_type: 'admin',
      is_approved: true,
    });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(JSON.stringify({ error: 'Failed to create admin profile' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Mark invite as used so it can never be replayed
    await supabaseAdmin.from('admin_invites').update({ used: true }).eq('token', token);

    // 5. Sign them in immediately, same pattern as the regular register route
    const { data: signInData } = await supabaseAdmin.auth.signInWithPassword({
      email: invite.email,
      password,
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        token: signInData?.session?.access_token || '',
        user: {
          id: authData.user.id,
          email: invite.email,
          fullName,
          role: 'admin',
          isApproved: true,
        },
      },
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Register-with-invite route error:', error);
    return new Response(JSON.stringify({ error: 'Something went wrong' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
