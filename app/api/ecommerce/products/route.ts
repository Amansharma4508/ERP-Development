import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// 1. GET: Products aur Categories fetch karne ke liye
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const { data: categories, error: catError } = await supabaseAdmin
      .from('categories')
      .select('*');

    if (catError) throw catError;

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
    const { title, description, manufacturer, price, stock, category_id, image_url, seller_id } = body;

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([
        {
          title,
          description,
          manufacturer: manufacturer || null,
          price,
          stock,
          category_id: category_id || null,
          image_url,
          seller_id,
        },
      ])
      .select('*, categories(name)')
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

// 3. DELETE: Products delete karne ke liye
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body;

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

// 4. PUT: Existing product update karne ke liye
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, description, manufacturer, price, stock, category_id, image_url } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required for update' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        title,
        description,
        manufacturer: manufacturer || null,
        price,
        stock,
        category_id: category_id || null,
        image_url,
      })
      .eq('id', id)
      .select('*, categories(name)')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      product: data,
      message: 'Product updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}