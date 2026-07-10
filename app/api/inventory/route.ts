import { NextRequest } from 'next/server';
import { inventoryItems } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

function requireAdminOrDoctor(token: string | undefined) {
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role === 'user') return null;
  return payload;
}

// GET /api/inventory
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  const payload = requireAdminOrDoctor(token);
  if (!payload) return toJson(errorResponse('Unauthorized', 401));

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const lowStock = searchParams.get('lowStock') === 'true';

  let result = [...inventoryItems];
  if (category) result = result.filter((i) => i.category === category);
  if (lowStock) result = result.filter((i) => i.quantity <= i.reorderLevel);

  return toJson(successResponse(result));
}

// POST /api/inventory - add item
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  const payload = requireAdminOrDoctor(token);
  if (!payload) return toJson(errorResponse('Unauthorized', 401));

  const body = await request.json();
  const { name, sku, category, quantity, reorderLevel, unitCost, supplier } = body;

  if (!name || !sku || !category || quantity == null || !unitCost) {
    return toJson(errorResponse('Missing required fields', 400));
  }

  const existing = inventoryItems.find((i) => i.sku === sku);
  if (existing) return toJson(errorResponse('SKU already exists', 409));

  const newItem = {
    id: `inv${Date.now()}`,
    name, sku, category,
    quantity: Number(quantity),
    reorderLevel: Number(reorderLevel ?? 10),
    unitCost: Number(unitCost),
    supplier: supplier || 'Unknown',
    lastUpdated: new Date().toISOString().split('T')[0],
  };

  inventoryItems.push(newItem);
  return toJson(successResponse(newItem, 201));
}
