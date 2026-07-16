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
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // 1. Auth Email Update
    // Agar email same hai, toh isse skip karein taaki unnecessary error na aaye
    const { data: userRecord, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userRecord?.user?.email !== email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email: email }
      );

      if (authError) {
        // Yahan se JSON error return hoga, HTML page nahi
        return NextResponse.json({ success: false, error: authError.message }, { status: 400 });
      }
    }

    // 2. Database Update
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
      return NextResponse.json({ success: false, error: dbError.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully!' 
    });

  } catch (error: any) {
    // Catch block mein har haal mein JSON return karein taaki 'Unexpected Token' error na aaye
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Something went wrong' }, 
      { status: 500 }
    );
  }
}