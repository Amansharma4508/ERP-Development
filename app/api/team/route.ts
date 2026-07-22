import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch all admin invites
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_invites') // 👈 Table Name Updated
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Add new admin invite
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, role } = body;

    const { data, error } = await supabaseAdmin
      .from('admin_invites') // 👈 Table Name Updated
      .insert([{ name, email, role, status: 'invited' }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}