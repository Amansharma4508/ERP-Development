import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function guard(token: string | undefined) {
  if (!token) return null;
  const p = verifyToken(token);
  if (!p) return null;
  const allowedRoles = ['authenticated', 'admin', 'logistics', 'member', 'support'];
  if (!allowedRoles.includes(p.role)) return null;
  return p;
}

// GET /api/logistics/vendors?type=hospital
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!guard(token)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vendorType = searchParams.get('type') || searchParams.get('vendorType');

    let query = supabase.from('hospital_vendors').select('*');
    if (vendorType) {
      query = query.eq('vendor_type', vendorType);
    }

    const { data, error } = await query;
    if (error) throw error;

    const formattedData = (data || []).map((v: any) => ({
      id: v.id,
      vendorId: `VND-${v.id.slice(0, 3)}`,
      name: v.name,
      vendorType: v.vendor_type,
      categoryName: v.category_name,
      contactPerson: v.contact_person,
      phone: v.phone,
      hospitalName: v.hospital_name,
      licenseType: v.license_type,
      state: v.state || '',
      supplyStatus: v.supply_status || 'active',
      amountGiven: Number(v.amount_given || 0),
      amountUsed: Number(v.amount_used || 0),
      dueAmount: v.due_amount,
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/logistics/vendors
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!guard(token)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, vendorType, categoryName, contactPerson, phone, hospitalName, licenseType, state, supplyStatus, amountGiven, amountUsed } = body;

    if (!name || !contactPerson || !phone || !hospitalName) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('hospital_vendors')
      .insert([
        {
          name,
          vendor_type: vendorType || 'hospital',
          category_name: categoryName || 'Medical Services',
          contact_person: contactPerson,
          phone,
          hospital_name: hospitalName,
          license_type: licenseType || '',
          state: state || '',
          supply_status: supplyStatus || 'active',
          amount_given: Number(amountGiven || 0),
          amount_used: Number(amountUsed || 0),
          due_amount: 0,
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data: data[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}