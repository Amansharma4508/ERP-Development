import { NextResponse } from 'next/server';
// Apne Supabase client ka sahi import path yahan rakhein
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Database se saare coupons fetch karne ke liye
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, coupons: data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Naya coupon create karne ke liye
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, description, discount_type, discount_value, min_order_value, expires_at } = body;

    const { data, error } = await supabase
      .from('coupons')
      .insert([{ 
        code: code.toUpperCase(), 
        description, 
        discount_type, 
        discount_value, 
        min_order_value: min_order_value || 0, 
        expires_at: expires_at || null,
        is_active: true
      }])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, coupon: data[0], message: "Coupon created successfully!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Existing coupon ko edit/update karne ke liye
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, code, description, discount_type, discount_value, min_order_value, expires_at, is_active } = body;

    const { data, error } = await supabase
      .from('coupons')
      .update({ 
        code: code.toUpperCase(), 
        description, 
        discount_type, 
        discount_value, 
        min_order_value, 
        expires_at, 
        is_active 
      })
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, coupon: data[0], message: "Coupon updated successfully!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Coupon ko delete karne ke liye
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: "Coupon ID is required" }, { status: 400 });
    }

    const { error } = await supabase.from('coupons').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Coupon deleted successfully!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}