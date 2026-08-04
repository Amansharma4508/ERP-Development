import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET: Sabhi categories fetch karein
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('categories').select('*');
    if (error) throw error;
    return NextResponse.json({ success: true, categories: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Nayi category create karein
export async function POST(request: Request) {
  try {
    const { name, description } = await request.json();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert([{ name, slug, description }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, category: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}