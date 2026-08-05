import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET: Fetch all return/refund requests
export async function GET(request: Request) {
  try {
    const { data: returns, error } = await supabaseAdmin
      .from('returns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedReturns = (returns || []).map((r: any) => ({
      id: r.id,
      returnNumber: r.return_number || `RET-${r.id}`,
      orderNumber: r.order_number || 'N/A',
      customerName: r.customer_name || 'Guest',
      reason: r.reason || 'No reason specified',
      requestType: r.request_type || 'return',
      status: r.status || 'requested',
      createdAt: r.created_at,
    }));

    return NextResponse.json({ success: true, returns: formattedReturns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Update return/refund/replacement status
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Return ID and status are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('returns')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, returnItem: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}