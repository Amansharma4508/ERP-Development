import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET: Fetch all orders with accurate column mapping
export async function GET(request: Request) {
  try {
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedOrders = (orders || []).map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number || `ORD-${o.id}`, // Fallback if order_number is blank
      customerName: o.customer_name || 'Guest Customer',
      customerEmail: o.customer_email || '',
      items: o.items || [],
      totalAmount: o.total_amount || 0,
      shippingAddress: o.shipping_address || 'Not Provided',
      status: o.status || 'pending',
      createdAt: o.created_at,
    }));

    return NextResponse.json({ success: true, orders: formattedOrders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Update order status
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Order ID and status are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}