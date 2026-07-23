import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

export async function GET(request: NextRequest) {
  try {
    // ✅ supabaseAdmin use karein taaki reference error na aaye
    const { data, error } = await supabaseAdmin
      .from('card_print_items')
      .select(`
        id,
        batch_id,
        card_number,
        status,
        created_at,
        user_id,
        profiles:user_id (
          full_name,
          phone_number
        )
      `);

    if (error) {
      console.error('Error fetching card print items:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Data ko format karke frontend ke liye 'phone' key mein map kar rahe hain
    const formattedData = (data || []).map((item: any) => ({
      id: item.id,
      batch_id: item.batch_id,
      user_name: item.profiles?.full_name || 'Unknown',
      phone: item.profiles?.phone_number || 'N/A', // ✅ Database ka phone_number yahan correctly map ho raha hai
      card_number: item.card_number,
      status: item.status,
      created_at: item.created_at,
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}