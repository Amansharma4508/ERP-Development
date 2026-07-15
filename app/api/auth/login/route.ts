import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Supabase Auth se authenticate karein
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session = authData.session;
    const authUser = authData.user;

    // 2. Profiles table se aapke exact columns (full_name, account_type) fetch karein
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, account_type')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError.message);
    }

    const role = profile?.account_type || 'user';

    // 3. Agar role 'user' hai, to real DB check karein ki wallet application already submit hai ya nahi
    let walletOnboardingStatus: 'none' | 'pending' | 'in-progress' | 'approved' = 'none';

    if (role === 'user') {
      const { data: application, error: applicationError } = await supabaseAdmin
        .from('wallet_applications')
        .select('status')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (applicationError) {
        console.error('Wallet application check error:', applicationError.message);
      }

      if (!application) {
        walletOnboardingStatus = 'pending'; // form abhi tak fill nahi hua
      } else if (application.status === 'approved') {
        walletOnboardingStatus = 'approved';
      } else {
        walletOnboardingStatus = 'in-progress'; // submitted, review pending
      }
    }

    // 4. Map account_type to role and full_name to fullName for frontend context
    const responseBody = {
      success: true,
      data: {
        token: session?.access_token || '',
        user: {
          id: authUser.id,
          email: authUser.email || '',
          fullName: profile?.full_name || 'ERP User',
          role,
        },
        walletOnboardingStatus,
      },
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Login Route Error:', error);
    return new Response(JSON.stringify({ error: 'Login failed internally' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}