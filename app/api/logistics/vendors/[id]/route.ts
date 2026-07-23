import { NextRequest } from 'next/server';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
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
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!guard(token)) return toJson(errorResponse('Unauthorized', 401));

    const { id } = await params;
    const body = await request.json();

    const { name, vendorType, categoryName, contactPerson, phone, hospitalName, licenseType, supplyStatus, dueAmount } = body;

    // Supabase table 'hospital_vendors' mein update karein
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (vendorType !== undefined) updateData.vendor_type = vendorType;
    if (categoryName !== undefined) updateData.category_name = categoryName;
    if (contactPerson !== undefined) updateData.contact_person = contactPerson;
    if (phone !== undefined) updateData.phone = phone;
    if (hospitalName !== undefined) updateData.hospital_name = hospitalName;
    if (licenseType !== undefined) updateData.license_type = licenseType;
    if (supplyStatus !== undefined) updateData.supply_status = supplyStatus;
    if (dueAmount !== undefined) updateData.due_amount = dueAmount;

    const { data, error } = await supabase
      .from('hospital_vendors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return toJson(errorResponse('Vendor not found or update failed', 404));
    }

    // Frontend ke format ke mutabik response map karein
    const formattedVendor = {
      id: data.id,
      vendorId: `VND-${data.id.slice(0, 3)}`,
      name: data.name,
      vendorType: data.vendor_type,
      categoryName: data.category_name,
      contactPerson: data.contact_person,
      phone: data.phone,
      hospitalName: data.hospital_name,
      licenseType: data.license_type,
      supplyStatus: data.supply_status,
      dueAmount: data.due_amount,
    };

    return toJson(successResponse(formattedVendor));
  } catch (err: any) {
    return toJson(errorResponse(err.message, 500));
  }
}

// DELETE /api/logistics/vendors/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!guard(token)) return toJson(errorResponse('Unauthorized', 401));

    const { id } = await params;

    const { error, count } = await supabase
      .from('hospital_vendors')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error || count === 0) {
      return toJson(errorResponse('Vendor not found', 404));
    }

    return toJson(successResponse({ message: 'Deleted successfully' }));
  } catch (err: any) {
    return toJson(errorResponse(err.message, 500));
  }
}