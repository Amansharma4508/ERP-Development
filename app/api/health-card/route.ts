import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

// Storage bucket jisme live photos upload hote hain (Image 1 se confirm: "live-photos", PUBLIC)
const LIVE_PHOTO_BUCKET = 'live-photos';

/**
 * DB mein live_photo_url kabhi full public URL (http...) hota hai,
 * kabhi sirf filename/path (jaise "WhatsApp Image 2026-07-07 at 11.54.4....jpeg").
 * Ye function dono cases handle karke hamesha ek valid loadable public URL return karta hai.
 */
function resolveLivePhotoUrl(rawValue: string | null): string | null {
  if (!rawValue) return null;

  // Already full URL hai to as-is return karo
  if (rawValue.startsWith('http://') || rawValue.startsWith('https://')) {
    return rawValue;
  }

  // Warna isse storage bucket ka path/filename maan kar public URL banao
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

    // Token se user nikalna (Supabase session token verify)
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !userData?.user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    const { data, error } = await supabaseAdmin
      .from('wallet_applications')
      .select(`
        full_name,
        father_name,
        mother_name,
        dob,
        gender,
        blood_group,
        house_number,
        ward_number,
        village_city,
        gram_panchayat,
        block,
        district,
        state,
        pin_code,
        head_of_family,
        area_code,
        live_photo_url,
        card_number,
        status,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'No application found' },
        { status: 404 }
      );
    }

    // live_photo_url ko normalize karke bhejo taaki frontend <img> hamesha valid URL pe point kare
    const responseData = {
      ...data,
      live_photo_url: resolveLivePhotoUrl(data.live_photo_url),
    };

    return NextResponse.json({ success: true, data: responseData }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}