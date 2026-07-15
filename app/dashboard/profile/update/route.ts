import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, fullName, phoneNumber, dob } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID missing' }, { status: 400 });
    }

    // 1. Supabase Auth internal metadata mein phone number update kar rahe hain
    // Kyunki aapke paas public table mein phone ka column nahi hai, metadata best jagah hai.
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: { phone_number: phoneNumber } }
    );

    if (authError) {
      return NextResponse.json({ success: false, error: `Auth update failed: ${authError.message}` }, { status: 400 });
    }

    // 2. Public table ('wallet_applications') mein Name aur DOB update kar rahe hain
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('wallet_applications')
      .update({
        full_name: fullName,
        dob: dob
      })
      .eq('user_id', userId)
      .select();

    if (dbError) {
      return NextResponse.json({ success: false, error: `Database update failed: ${dbError.message}` }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile and Auth metadata updated successfully!', 
      data: dbData 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server Error' }, { status: 500 });
  }
}