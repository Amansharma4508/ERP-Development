import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js ke naye rules ke mutabiq params ko await karna zaroori hai
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // 1. Pehle wallet_applications se main record fetch karein
    const { data: walletApp, error: walletError } = await supabase
      .from('wallet_applications')
      .select('*')
      .eq('user_id', id)
      .maybeSingle();

    if (walletError) {
      return NextResponse.json({ error: walletError.message }, { status: 400 });
    }

    if (!walletApp) {
      return NextResponse.json({ error: 'Application not found in database' }, { status: 404 });
    }

    // 2. Agar user_id maujood hai, toh profiles table se alag query karke data le aayein
    let profileData = {};
    if (walletApp.user_id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', walletApp.user_id)
        .maybeSingle();

      if (!profileError && profile) {
        profileData = profile;
      }
    }

    // 3. Dono data ko combine karke frontend ko bhej dein
    const combinedData = {
      ...walletApp,
      profiles: profileData,
    };

    return NextResponse.json({ data: combinedData }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await request.json();

    // Agar URL wala id user_id hai, toh yahan .eq('user_id', id) karein
    const { error } = await supabase
      .from('wallet_applications')
      .update(body)
      .eq('user_id', id); // Yah agar table ki primary key 'id' hai toh .eq('id', id) hi rehne dein

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}