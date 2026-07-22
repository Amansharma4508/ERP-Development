import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

// GET: Fetch users directly from wallet_applications for Vendor B Card Fulfillment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterStatus = searchParams.get('status');

    // 1. Fetch applications/users from wallet_applications table
    // (Agar aapke table me column names alag hain, to unhe matching ke hisab se rename kar lijiye)
    const { data: applications, error: appError } = await supabaseAdmin
      .from('wallet_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (appError) {
      console.error('Error fetching wallet applications:', appError);
      throw appError;
    }

    // 2. Map wallet applications to Card Item Format for Vendor B UI
    const mappedItems = (applications || []).map((app: any) => {
      // Logic for status: Default is 'assigned' as requested
      const currentStatus = app.card_status || app.status || 'assigned';

      return {
        id: app.id,
        user_name: app.full_name || app.user_name || app.applicant_name || 'Name Unavailable',
        phone: app.phone || app.phone_number || app.mobile || 'N/A',
        card_number: app.card_number || app.application_no || `CARD-${app.id.toString().slice(0, 8).toUpperCase()}`,
        status: currentStatus, // Default = 'assigned'
        digital_card_url: app.digital_card_url || null,
        created_at: app.created_at,
      };
    });

    // 3. Filter by status if requested (all, assigned, in-progress, printed, pending)
    let filteredData = mappedItems;
    if (filterStatus && filterStatus !== 'all') {
      filteredData = mappedItems.filter((item) => item.status === filterStatus);
    }

    return NextResponse.json({ success: true, data: filteredData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}