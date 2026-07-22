import { NextRequest } from 'next/server';
import { vendors } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

function guard(token: string | undefined) {
  if (!token) return null;
  const p = verifyToken(token);
  if (!p || (p.role !== 'logistics' && p.role !== 'admin')) return null;
  return p;
}

// PATCH /api/logistics/vendors/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!guard(token)) return toJson(errorResponse('Unauthorized', 401));

  const { id } = await params;
  const vendor = vendors.find(v => v.id === id);
  if (!vendor) return toJson(errorResponse('Vendor not found', 404));

  const body = await request.json();
  
  // Handle type-specific validations
  if (body.vendorType && !['hospital', 'wallet-card'].includes(body.vendorType)) {
    return toJson(errorResponse('Invalid vendor type', 400));
  }

  // Merge with proper type handling
  const updatedVendor = {
    ...vendor,
    ...body,
    creditDays: body.creditDays !== undefined ? Number(body.creditDays) : vendor.creditDays,
    turnaroundDays: body.turnaroundDays !== undefined ? Number(body.turnaroundDays) : vendor.turnaroundDays,
  };

  // Update in store
  const idx = vendors.findIndex(v => v.id === id);
  vendors[idx] = updatedVendor;

  return toJson(successResponse(updatedVendor));
}

// DELETE /api/logistics/vendors/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!guard(token)) return toJson(errorResponse('Unauthorized', 401));

  const { id } = await params;
  const idx = vendors.findIndex(v => v.id === id);
  if (idx === -1) return toJson(errorResponse('Vendor not found', 404));

  vendors.splice(idx, 1);
  return toJson(successResponse({ message: 'Deleted' }));
}