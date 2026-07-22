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

// GET /api/logistics/vendors
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!guard(token)) return toJson(errorResponse('Unauthorized', 401));

  const { searchParams } = new URL(request.url);
  const status   = searchParams.get('status');
  const category = searchParams.get('category');
  const vendorType = searchParams.get('vendorType');

  let result = [...vendors];
  if (status)   result = result.filter(v => v.supplyStatus === status);
  if (category) result = result.filter(v => v.category === category);
  if (vendorType) result = result.filter(v => v.vendorType === vendorType);

  return toJson(successResponse(result));
}

// POST /api/logistics/vendors
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!guard(token)) return toJson(errorResponse('Unauthorized', 401));

  const body = await request.json();
  const {
    name,
    vendorType,
    category,
    categoryName,
    contactPerson,
    email,
    phone,
    address,
    area,
    gstNo,
    licenseNo,
    paymentTerms,
    creditDays,
    // Hospital specific
    hospitalName,
    licenseType,
    stateRegistration,
    // Wallet/Card specific
    cardTypes,
    printingCapacity,
    turnaroundDays,
  } = body;

  if (!name || !vendorType || !contactPerson || !email || !phone) {
    return toJson(errorResponse('Missing required fields', 400));
  }

  if (!['hospital', 'wallet-card'].includes(vendorType)) {
    return toJson(errorResponse('Invalid vendor type', 400));
  }

  const newVendor = {
    id:            `v${Date.now()}`,
    vendorId:      `VND-${String(vendors.length + 1).padStart(3, '0')}`,
    name,
    vendorType,
    category:      category ?? '1',
    categoryName,
    contactPerson,
    email,
    phone,
    address:       address ?? '',
    area:          area ?? '',
    gstNo:         gstNo ?? '',
    licenseNo:     licenseNo ?? '',
    paymentTerms:  paymentTerms ?? 'Net 30',
    creditDays:    Number(creditDays ?? 30),
    ...(vendorType === 'hospital' && {
      hospitalName:      hospitalName ?? '',
      licenseType:       licenseType ?? '',
      stateRegistration: stateRegistration ?? '',
    }),
    ...(vendorType === 'wallet-card' && {
      cardTypes:        cardTypes ?? [],
      printingCapacity: printingCapacity ?? '',
      turnaroundDays:   Number(turnaroundDays ?? 5),
    }),
    rating:       0,
    supplyStatus: 'active' as const,
    totalOrders:  0,
    paidAmount:   0,
    dueAmount:    0,
    createdAt:    new Date().toISOString().split('T')[0],
  };

  vendors.push(newVendor);
  return toJson(successResponse(newVendor, 201));
}