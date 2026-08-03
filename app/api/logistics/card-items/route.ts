import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// GET: Fetch all card items (Aapka purana code)
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('card_print_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Single (via query param ?id=...) or Bulk (via body { ids: [...] })
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single Delete
    if (id) {
      const { error } = await supabaseAdmin
        .from('card_print_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Card item deleted successfully' });
    }

    // Bulk Delete
    const body = await request.json().catch(() => null);
    if (body && Array.isArray(body.ids)) {
      const { error } = await supabaseAdmin
        .from('card_print_items')
        .delete()
        .in('id', body.ids);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Selected card items deleted successfully' });
    }

    return NextResponse.json({ success: false, error: 'No ID or IDs provided' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}