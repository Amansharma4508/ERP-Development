import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/jwt-config';
import { supabaseAdmin } from '@/lib/supabase/server';

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

    let decodedToken: any;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
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

    // 1. Fetch Wallet Application Details (delivery_status/delivery_updated_at bhi isi table mein hai)
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
      // Physical card delivery tracking
      delivery_status: appData?.delivery_status || 'processing',
      delivery_updated_at: appData?.delivery_updated_at || null,
    };

    return NextResponse.json({ success: true, data: responseData }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Backend API Route Example (Next.js / Node.js)
export async function POST(req) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return Response.json({ success: false, message: "Unauthorized: No token provided" }, { status: 401 });
    }

    // Token verify karne ke baad body parse karein
    const body = await req.json();
    
    // Check karein ki data aaya bhi hai ya nahi
    if (!body) {
      return Response.json({ success: false, message: "Request body is empty" }, { status: 400 });
    }

    // Database mein save karne ki logic (Prisma / Mongoose)
    // const savedData = await db.healthCard.create({ data: { ...body, userId } });

    return Response.json({ success: true, message: "Data saved successfully", data: body });
  } catch (error) {
    console.error("Database Save Error:", error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}