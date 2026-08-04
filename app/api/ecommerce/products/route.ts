import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase'; // Ya aapka jo bhi supabase client ho

// 1. GET: Products aur Categories fetch karne ke liye
export async function GET(request: Request) {
  try {
    // Categories fetch karein
    const { data: categories, error: catError } = await supabaseAdmin
      .from('categories')
      .select('*');

    if (catError) throw catError;

    // Products fetch karein (categories join karke)
    const { data: products, error: prodError } = await supabaseAdmin
      .from('products')
      .select('*, categories(name)');

    if (prodError) throw prodError;

    return NextResponse.json({
      success: true,
      products: products || [],
      categories: categories || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// 2. POST: Naya product create karne ke liye
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, price, stock, category_id, image_url, seller_id } = body;

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([
        {
          title,
          description,
          price,
          stock,
          category_id: category_id || null,
          image_url,
          seller_id,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      product: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}