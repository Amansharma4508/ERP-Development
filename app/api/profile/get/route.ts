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
    const { data: profile, error } = await supabaseAdmin
      .from('wallet_applications')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });

    // 2. Auth user details fetch karein (Email ke liye)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    const authEmail = authData?.user?.email || "";

    // 3. Agar profile nahi hai, to ek default object banayein
    let finalData = profile || { user_id: userId, full_name: "", phone_number: "", dob: "" };

    // 4. Member ID Logic (Agar database mein nahi hai to generate karein)
    let memberId = finalData.member_id;
    if (!memberId) {
      const randomNum = Math.floor(10000000 + Math.random() * 90000000);
      memberId = `SVA${randomNum}`;
      
      // Agar profile exist karti hai to update, nahi to error/handle (optional)
      if (profile) {
        await supabaseAdmin.from('wallet_applications').update({ member_id: memberId }).eq('user_id', userId);
      }
      // Note: Agar profile exist nahi karti to aap yahan .insert() bhi kar sakte hain
    }

    // 5. DOB Formatting
    let formattedDob = "";
    if (finalData.dob) {
      const d = new Date(finalData.dob);
      if (!isNaN(d.getTime())) formattedDob = d.toISOString().split('T')[0];
    }

    return NextResponse.json({
      success: true,
      data: { 
        ...finalData, 
        member_id: memberId,
        email: finalData.email || authEmail, // Database mein na ho to Auth email
        dob: formattedDob 
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}