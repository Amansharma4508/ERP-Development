import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase'; // Make sure path apke project ke hisaab se sahi ho

// 1. GET: Products aur Categories fetch karne ke liye (with pagination for 27k+ rows)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10); // Default 50 products per page
    const offset = (page - 1) * limit;

    // Categories fetch karein
    const { data: categories, error: catError } = await supabaseAdmin
      .from('categories')
      .select('*');

    if (catError) throw catError;

    // Products fetch karein with pagination (taaki 27,000+ products mein site slow na ho)
    const { data: products, error: prodError, count } = await supabaseAdmin
      .from('products')
      .select('*, categories(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (prodError) throw prodError;

    return NextResponse.json({
      success: true,
      products: products || [],
      categories: categories || [],
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
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
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// 3. DELETE: Single ya Multiple products database se delete karne ke liye
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body; // Array of product IDs

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'No product IDs provided' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .in('id', ids);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${ids.length} product(s) from database.`,
    });
  } catch (error: any) {
    console.error('Delete failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}