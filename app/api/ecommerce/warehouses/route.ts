import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET: Fetch warehouses and map database columns accurately
export async function GET(request: Request) {
  try {
    const { data: warehouses, error } = await supabaseAdmin
      .from('warehouses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map database columns (snake_case) to frontend interface (camelCase)
    const formattedWarehouses = (warehouses || []).map((w: any) => ({
      id: w.id,
      name: w.name,
      ownerName: w.owner_name || w.ownerName || '',
      contactNumber: w.contact_number || w.contactNumber || '',
      address: w.address || '',
      licenseNumber: w.license_number || w.licenseNumber || '',
      warehouseType: w.warehouse_type || w.warehouseType || '',
      status: w.status || 'active',
    }));

    return NextResponse.json({
      success: true,
      warehouses: formattedWarehouses,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST: Save warehouse
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, ownerName, contactNumber, address, licenseNumber, warehouseType, status } = body;

    const { data, error } = await supabaseAdmin
      .from('warehouses')
      .insert([
        {
          name,
          owner_name: ownerName,
          contact_number: contactNumber,
          address,
          license_number: licenseNumber,
          warehouse_type: warehouseType,
          status: status || 'active',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      warehouse: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update warehouse status (Active, Inactive, Hold)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Warehouse ID and status are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('warehouses')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      warehouse: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Remove warehouse
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Warehouse ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('warehouses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Warehouse deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}