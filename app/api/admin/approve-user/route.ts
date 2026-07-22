import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

export async function POST(request: NextRequest) {
  try {
    // 1. Extract the caller's token from the Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing authorization token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Resolve the token to a real Supabase user (never trust a client-sent user id/role)
    const { data: callerAuth, error: callerAuthError } = await supabaseAdmin.auth.getUser(token);

    if (callerAuthError || !callerAuth?.user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Confirm the caller is actually an admin, by checking the DB — not a header/body flag
    const { data: callerProfile, error: callerProfileError } = await supabaseAdmin
      .from('profiles')
      .select('account_type')
      .eq('id', callerAuth.user.id)
      .single();

    if (callerProfileError || callerProfile?.account_type !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden — admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Parse the target user + action
    const body = await request.json();
    const { userId, action } = body; // action: 'approve' | 'reject'

    if (!userId || !['approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'userId and a valid action are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'approve') {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId);

      if (updateError) {
        console.error('Approve error:', updateError.message);
        return new Response(JSON.stringify({ error: 'Failed to approve user' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Reject: block the account and mark it disapproved so they can't slip in later
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ is_approved: false, is_blocked: true })
        .eq('id', userId);

      if (updateError) {
        console.error('Reject error:', updateError.message);
        return new Response(JSON.stringify({ error: 'Failed to reject user' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Approve-user route error:', error);
    return new Response(JSON.stringify({ error: 'Something went wrong' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// GET: list all pending (unapproved) doctor/logistics profiles — used by the admin dashboard
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing authorization token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: callerAuth, error: callerAuthError } = await supabaseAdmin.auth.getUser(token);

    if (callerAuthError || !callerAuth?.user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: callerProfile, error: callerProfileError } = await supabaseAdmin
      .from('profiles')
      .select('account_type')
      .eq('id', callerAuth.user.id)
      .single();

    if (callerProfileError || callerProfile?.account_type !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden — admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: pendingUsers, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, account_type, created_at')
      .in('account_type', ['doctor', 'logistics'])
      .eq('is_approved', false)
      .eq('is_blocked', false)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Fetch pending users error:', fetchError.message);
      return new Response(JSON.stringify({ error: 'Failed to fetch pending users' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data: pendingUsers }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Fetch pending users route error:', error);
    return new Response(JSON.stringify({ error: 'Something went wrong' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}