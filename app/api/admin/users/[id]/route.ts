import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

const supabase = supabaseAdmin;

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // 1. Pehle users table / profiles se ya jahan main user data hai wahan se delete karein
    // Note: Agar aap Supabase Auth users ko bhi delete karna chahte hain, toh admin auth API use hoti hai.
    // Filhal aapke database tables (jaise 'wallet_applications' ya 'profiles' ya 'users') se delete karne ke liye:

    const { error: walletAppError } = await supabase
      .from('wallet_applications')
      .delete()
      .eq('user_id', userId);

    if (walletAppError) {
      return NextResponse.json({ success: false, error: walletAppError.message }, { status: 400 });
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      return NextResponse.json({ success: false, error: profileError.message }, { status: 400 });
    }

    // Optional: Agar Supabase Auth (auth.users) se bhi user ko hatana ho:
    // const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully from database' 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}