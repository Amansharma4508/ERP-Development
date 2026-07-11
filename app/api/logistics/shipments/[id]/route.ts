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

const STATUS_FLOW: Record<string, string> = {
  po_received: 'prep',
  prep:        'in_transit',
  in_transit:  'delivered',
};

// PATCH /api/logistics/shipments/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!guard(token)) return toJson(errorResponse('Unauthorized', 401));

  const { id } = await params;
  const shipment = shipments.find(s => s.id === id);
  if (!shipment) return toJson(errorResponse('Shipment not found', 404));

  const body   = await request.json();
  const { status, actualDelivery } = body;

  const valid = ['po_received','prep','in_transit','delivered','cancelled'];
  if (!valid.includes(status)) return toJson(errorResponse('Invalid status', 400));

  shipment.status = status;
  if (status === 'delivered') {
    shipment.actualDelivery = actualDelivery ?? new Date().toISOString().split('T')[0];
  }

  return toJson(successResponse(shipment));
}

// DELETE /api/logistics/shipments/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!guard(token)) return toJson(errorResponse('Unauthorized', 401));

  const { id } = await params;
  const idx = shipments.findIndex(s => s.id === id);
  if (idx === -1) return toJson(errorResponse('Shipment not found', 404));

  shipments.splice(idx, 1);
  return toJson(successResponse({ message: 'Deleted' }));
}
