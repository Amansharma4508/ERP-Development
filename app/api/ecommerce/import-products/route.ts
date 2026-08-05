import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Read sheet as an array of arrays (rows) to avoid header-matching issues completely
    const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (!rawData || rawData.length <= 1) {
      return NextResponse.json({ success: false, error: 'Excel file is empty or missing data' }, { status: 400 });
    }

    // 1. "Medicine & OTC" category ensure karein
    let { data: catData } = await supabaseAdmin
      .from('categories')
      .select('id')
      .ilike('name', 'Medicine & OTC')
      .single();

    let targetCategoryId = catData?.id;

    if (!targetCategoryId) {
      const { data: newCat } = await supabaseAdmin
        .from('categories')
        .insert([{ name: 'Medicine & OTC', slug: 'medicine-and-otc', description: 'Medicines and OTC products' }])
        .select('id')
        .single();
      targetCategoryId = newCat?.id;
    }

    const pharmaImages = [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1550572017-edd951b55104?w=500&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=500&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500&auto=format&fit=crop&q=60',
    ];

    // Skip row 0 (headers) and map from index 1 onwards
    const formattedProducts = rawData.slice(1).map((row, index) => {
      const productName = row[0] ? String(row[0]).trim() : ''; // Column A: Product Name
      const manufacturer = row[1] ? String(row[1]).trim() : ''; // Column B: Manufacturer Name
      const ptr = row[2] ? parseFloat(row[2]) || 0 : 0;         // Column C: PTR
      const mrp = row[3] ? parseFloat(row[3]) || 0 : 0;         // Column D: MRP

      const randomImage = pharmaImages[index % pharmaImages.length];

      return {
        title: productName || 'Unnamed Product',
        description: manufacturer ? `Mfg: ${manufacturer}` : 'Medicine & Healthcare Product',
        manufacturer: manufacturer || null,
        price: mrp,
        ptr: ptr,
        stock: 100,
        category_id: targetCategoryId || null,
        image_url: randomImage,
      };
    }).filter(p => p.title !== 'Unnamed Product' && p.price > 0);

    if (formattedProducts.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid products found to import.' }, { status: 400 });
    }

    // Batch insert into Supabase (500 items at a time)
    const batchSize = 500;
    let insertedCount = 0;

    for (let i = 0; i < formattedProducts.length; i += batchSize) {
      const batch = formattedProducts.slice(i, i + batchSize);
      const { error } = await supabaseAdmin.from('products').insert(batch);
      if (error) throw error;
      insertedCount += batch.length;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedCount} products with exact names and prices!`,
    });
  } catch (error: any) {
    console.error('Import failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}