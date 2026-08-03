import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET: Wallet applications aur profiles table ko join karke fetch karne ke liye
export async function GET(request: Request) {
  try {
    // Yahan profiles table se name, email, aur phone_number join kiye ja rahe hain
    // (Note: Supabase automatically relation detect kar lega agar wallet_applications mein user_id ya profile_id field hai)
    const { data, error } = await supabase
      .from('wallet_applications')
      .select(`
        *,
        profiles (
          full_name,
          email,
          phone_number
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Join error, trying fallback:', error.message);
      
      // Fallback: Agar join mein koi error aaye toh sirf wallet_applications ka data bhej do taaki app break na ho
      const fallback = await supabase
        .from('wallet_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (fallback.error) {
        return NextResponse.json({ error: fallback.error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: fallback.data }, { status: 200 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH/PUT: Status update karne ke liye
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('wallet_applications')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Application delete karne ke liye
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('wallet_applications')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Deleted successfully' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}