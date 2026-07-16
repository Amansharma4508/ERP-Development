import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, fullName, email, phoneNumber, dob } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID missing' }, { status: 400 });
    }

    const { error: dbError } = await supabaseAdmin
      .from('wallet_applications')
      .update({
        full_name: fullName,
        email: email,
        phone_number: phoneNumber,
        dob: dob,
      })
      .eq('user_id', userId);

    if (dbError) {
      return NextResponse.json({ success: false, error: `DB Error: ${dbError.message}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}