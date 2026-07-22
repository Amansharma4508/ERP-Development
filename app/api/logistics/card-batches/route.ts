import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

// GET: Fetch all batches
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('card_print_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create a new Card Printing Batch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { batchNo, vendorId, vendorName, cardType, totalCards } = body;

    const { data, error } = await supabaseAdmin
      .from('card_print_batches')
      .insert({
        batch_no: batchNo,
        vendor_id: vendorId || null,
        vendor_name: vendorName || 'Vendor B',
        card_type: cardType || 'Wallet Card',
        total_cards: totalCards,
        printed_cards: 0,
        status: 'assigned',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}