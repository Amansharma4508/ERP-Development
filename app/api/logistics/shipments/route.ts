import { NextRequest } from 'next/server';
import { shipments } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

function guard(token: string | undefined) {
  if (!token) return null;
  const p = verifyToken(token);
  if (!p || (p.role !== 'logistics' && p.role !== 'admin')) return null;
  return p;
}

// GET /api/logistics/shipments
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!guard(token)) return toJson(errorResponse('Unauthorized', 401));

  const { searchParams } = new URL(request.url);
  const status   = searchParams.get('status');
  const toType   = searchParams.get('toType');
  const vendorId = searchParams.get('vendorId');

  let result = [...shipments];
  if (status)   result = result.filter(s => s.status === status);
  if (toType)   result = result.filter(s => s.toType === toType);
  if (vendorId) result = result.filter(s => s.vendorId === vendorId);

  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return toJson(successResponse(result));
}

// POST /api/logistics/shipments
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!guard(token)) return toJson(errorResponse('Unauthorized', 401));

  const body = await request.json();
  const { vendorId, vendorName, fromLocation, toLocation, toType,
          items, carrierName, dispatchDate, expectedDelivery, totalValue } = body;

  if (!vendorName || !fromLocation || !toLocation || !toType || !items?.length || !carrierName) {
    return toJson(errorResponse('Missing required fields', 400));
  }

  const newShipment = {
    id:               `sh${Date.now()}`,
    shipmentId:       `SHP-${new Date().getFullYear()}-${String(shipments.length + 1).padStart(3, '0')}`,
    vendorId:         vendorId ?? `v${Date.now()}`,
    vendorName,
    fromLocation,
    toLocation,
    toType,
    items,
    status:           'po_received' as const,
    carrierName,
    trackingNumber:   `TRK-${Date.now().toString().slice(-8)}`,
    dispatchDate:     dispatchDate ?? new Date().toISOString().split('T')[0],
    expectedDelivery: expectedDelivery ?? '',
    totalValue:       Number(totalValue ?? 0),
    createdAt:        new Date().toISOString().split('T')[0],
  };

  shipments.push(newShipment);
  return toJson(successResponse(newShipment, 201));
}
