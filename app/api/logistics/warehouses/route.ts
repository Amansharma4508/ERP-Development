import { NextRequest } from 'next/server';
import { warehouses } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

function guard(token: string | undefined) {
  if (!token) return null;
  const p = verifyToken(token);
  if (!p || (p.role !== 'logistics' && p.role !== 'admin')) return null;
  return p;
}

// GET /api/logistics/warehouses
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!guard(token)) return toJson(errorResponse('Unauthorized', 401));
  return toJson(successResponse(warehouses));
}

// PATCH /api/logistics/warehouses/[id] — update stock
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!guard(token)) return toJson(errorResponse('Unauthorized', 401));

  const body = await request.json();
  const { warehouseId, itemName, sku, quantity, unit, action } = body;

  const wh = warehouses.find(w => w.id === warehouseId);
  if (!wh) return toJson(errorResponse('Warehouse not found', 404));

  const existingItem = wh.stock.find(s => s.sku === sku);
  if (action === 'add') {
    if (existingItem) {
      existingItem.quantity += Number(quantity);
      existingItem.lastUpdated = new Date().toISOString().split('T')[0];
    } else {
      wh.stock.push({ itemName, sku, quantity: Number(quantity), unit: unit ?? 'units', lastUpdated: new Date().toISOString().split('T')[0] });
    }
    wh.usedCapacity = Math.min(wh.totalCapacity, wh.usedCapacity + Number(quantity));
  } else if (action === 'remove') {
    if (!existingItem) return toJson(errorResponse('Item not found in warehouse', 404));
    existingItem.quantity = Math.max(0, existingItem.quantity - Number(quantity));
    wh.usedCapacity = Math.max(0, wh.usedCapacity - Number(quantity));
  }

  return toJson(successResponse(wh));
}
