import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

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

// POST: Create a new Card Printing Batch (Aapka purana code)
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

// DELETE: Single or Bulk delete for batches
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const { error } = await supabaseAdmin
        .from('card_print_batches')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Batch deleted successfully' });
    }

    const body = await request.json().catch(() => null);
    if (body && Array.isArray(body.ids)) {
      const { error } = await supabaseAdmin
        .from('card_print_batches')
        .delete()
        .in('id', body.ids);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Selected batches deleted successfully' });
    }

    return NextResponse.json({ success: false, error: 'No ID or IDs provided' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}