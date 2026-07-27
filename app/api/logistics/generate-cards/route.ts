import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

export async function GET(request: NextRequest) {
  try {
    const batchNo = `BATCH-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // 1. Naya batch create karein
    const { data: batchData, error: batchError } = await supabaseAdmin
      .from('card_print_batches')
      .insert({
        batch_no: batchNo,
        vendor_name: 'CardCraft Logistics (Vendor B)',
        card_type: 'Health Wallet Card',
        total_cards: 0,
        printed_cards: 0,
        status: 'assigned',
      })
      .select()
      .single();

    if (batchError) throw batchError;

    // 2. wallet_applications se data fetch karein aur profiles table ke sath join karein
    const { data: applications, error: appError } = await supabaseAdmin
      .from('wallet_applications')
      .select(`
        user_id,
        card_number,
        full_name,
        profiles:user_id (
          full_name,
          phone_number
        )
      `)
      .not('card_number', 'is', null);

    if (appError) throw appError;

    if (!applications || applications.length === 0) {
      return NextResponse.json({ success: false, message: 'No wallet applications with card numbers found.' });
    }

    // 3. card_print_items ke liye data map karein
    const cardItemsToInsert = applications.map((app: any) => {
      const profile = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles;
      return {
        batch_id: batchData.id,
        user_id: app.user_id,
        card_number: app.card_number,
        user_name: app.full_name || profile?.full_name || 'Unknown User',
        phone: profile?.phone_number || 'N/A',
        status: 'assigned',
      };
    });

    // 4. card_print_items mein insert karein
    const { error: insertError } = await supabaseAdmin
      .from('card_print_items')
      .insert(cardItemsToInsert);

    if (insertError) throw insertError;

    // 5. Batch ka total_cards update karein
    await supabaseAdmin
      .from('card_print_batches')
      .update({ total_cards: applications.length })
      .eq('id', batchData.id);

    return NextResponse.json({
      success: true,
      message: `Successfully generated batch ${batchNo} with ${applications.length} cards!`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}