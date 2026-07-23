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

// PATCH /api/logistics/vendors/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!guard(token)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.contactPerson !== undefined) updateData.contact_person = body.contactPerson;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.hospitalName !== undefined) updateData.hospital_name = body.hospitalName;
    if (body.licenseType !== undefined) updateData.license_type = body.licenseType;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.supplyStatus !== undefined) updateData.supply_status = body.supplyStatus;
    if (body.amountGiven !== undefined) updateData.amount_given = Number(body.amountGiven);
    if (body.amountUsed !== undefined) updateData.amount_used = Number(body.amountUsed);

    const { data, error } = await supabase
      .from('hospital_vendors')
      .update(updateData)
      .eq('id', params.id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data: data[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/logistics/vendors/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!guard(token)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('hospital_vendors')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}