import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // Aapka existing Supabase client

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientId, items, totalAmount } = body;

    // Validation
    if (!patientId || !items || items.length === 0 || !totalAmount) {
      return NextResponse.json(
        { success: false, error: "Missing required order fields (patientId, items, totalAmount)." },
        { status: 400 }
      );
    }

    // Supabase mein real data insert karna
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          patient_id: patientId,
          items: items, // JSONB format mein cart/medicines items
          total_amount: totalAmount,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { success: true, message: "Order placed successfully!", data },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Supabase Order API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}