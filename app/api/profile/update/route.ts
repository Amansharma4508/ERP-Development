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

    // 1. Auth email update - Ye setting on hone ki wajah se ab confirmation trigger karega
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email: email } 
    );

    if (authError) {
      return NextResponse.json({ success: false, error: authError.message }, { status: 400 });
    }

    // 2. Database Update - Yahan dhyaan dein:
    // Hum email database mein tabhi update karenge jab wo confirm ho jaye, 
    // lekin filhal ke liye agar aap chahte hain ki UI par naya email dikhe, 
    // to ise update rehne dein.
    const { error: dbError } = await supabaseAdmin
      .from('wallet_applications')
      .update({
        full_name: fullName,
        email: email, // Naya email yahan set ho jayega
        phone_number: phoneNumber,
        dob: dob,
      })
      .eq('user_id', userId);

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email update request sent! Please verify the new email address.' 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}