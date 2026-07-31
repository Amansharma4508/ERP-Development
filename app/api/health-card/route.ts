import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

const LIVE_PHOTO_BUCKET = 'live-photos';

function resolveLivePhotoUrl(rawValue: string | null): string | null {
  if (!rawValue) return null;
  if (rawValue.startsWith('http://') || rawValue.startsWith('https://')) {
    return rawValue;
  }
  const { data } = supabaseAdmin.storage
    .from(LIVE_PHOTO_BUCKET)
    .getPublicUrl(rawValue);
  return data?.publicUrl ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    // Login route mein jo secret ya logic use hota hai token generate karne ke liye
    // Yahan hum token ko decode kar rahe hain taaki userId mil sake
    const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'your-secret-key';
    
    let decodedToken: any;
    try {
      decodedToken = jwt.verify(token, jwtSecret);
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = decodedToken?.id || decodedToken?.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID missing in token' },
        { status: 401 }
      );
    }

    // 1. Fetch Wallet Application Details
    const { data: appData, error: appError } = await supabaseAdmin
      .from('wallet_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (appError) {
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: 400 }
      );
    }

    // 2. Fetch Profile Details
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('amount_given, amount_used, balance')
      .eq('id', userId)
      .maybeSingle();

    // 3. Fetch User Transactions History
    const { data: transactionsData } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const amountGiven = profileData?.amount_given ?? 35000;
    const amountUsed = profileData?.amount_used ?? 0;
    const remainingBalance = profileData?.balance ?? (amountGiven - amountUsed);

    const responseData = {
      ...(appData || {}),
      live_photo_url: resolveLivePhotoUrl(appData?.live_photo_url),
      amount_given: amountGiven,
      amount_used: amountUsed,
      remaining_balance: remainingBalance,
      transactions: transactionsData || [],
    };

    return NextResponse.json({ success: true, data: responseData }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}