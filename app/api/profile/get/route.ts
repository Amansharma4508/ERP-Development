import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // 1. Database se profile fetch karein
    const { data, error } = await supabaseAdmin
      .from('wallet_applications')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });

    // 2. Agar database mein email nahi hai, to Auth system se email lein
    let userEmail = data?.email;
    if (!userEmail) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (!userError && userData.user) {
        userEmail = userData.user.email;
      }
    }

    // 3. Member ID logic (jaise pehle tha)
    let memberId = data?.member_id;
    if (!memberId) {
      const randomNum = Math.floor(10000000 + Math.random() * 90000000);
      memberId = `SVA${randomNum}`;
      await supabaseAdmin.from('wallet_applications').update({ member_id: memberId }).eq('user_id', userId);
    }

    // DOB Formatting
    let formattedDob = "";
    if (data?.dob) {
      const d = new Date(data.dob);
      if (!isNaN(d.getTime())) formattedDob = d.toISOString().split('T')[0];
    }

    return NextResponse.json({
      success: true,
      data: { 
        ...data, 
        member_id: memberId,
        email: userEmail, // Yahan se sahi email jayega
        dob: formattedDob 
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}