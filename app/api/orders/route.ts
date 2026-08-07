import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientId, items, totalAmount, discountApplied, couponCode, paymentMethod, shippingAddress } = body;

    // Validation: Agar koi required cheez available na ho toh order kabhi successful nahi hoga
    if (!patientId || !items || items.length === 0 || totalAmount === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required order fields (patientId, items, totalAmount)." },
        { status: 400 }
      );
    }

    // Orders table ke naye columns ke sath payload
    const orderPayload = {
      patient_id: patientId,
      total_amount: totalAmount,
      shipping_address: shippingAddress || null,
      payment_method: paymentMethod || 'wallet', // 👈 Ab yeh direct column mein save hoga
      status: 'pending',
      items: {
        products: items,
        coupon_code: couponCode || null,
        discount_applied: discountApplied || 0
      },
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select();

    if (error) {
      throw error;
    }

    const orderId = data && data[0] ? data[0].id : "ORD-" + Math.floor(100000 + Math.random() * 900000);

    return NextResponse.json(
      { success: true, message: "Order placed successfully and saved to database!", orderId, data },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Supabase Order API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}