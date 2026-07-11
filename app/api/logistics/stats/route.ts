import { NextRequest } from 'next/server';
import { shipments, vendors, warehouses, logisticsTeam, logisticsLedger } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload || (payload.role !== 'logistics' && payload.role !== 'admin')) {
    return toJson(errorResponse('Forbidden', 403));
  }

  const totalShipments    = shipments.length;
  const inTransit         = shipments.filter(s => s.status === 'in_transit').length;
  const delivered         = shipments.filter(s => s.status === 'delivered').length;
  const pending           = shipments.filter(s => s.status === 'po_received' || s.status === 'prep').length;
  const activeVendors     = vendors.filter(v => v.supplyStatus === 'active').length;
  const totalVendors      = vendors.length;
  const activeTeam        = logisticsTeam.filter(m => m.status === 'active').length;
  const totalTeam         = logisticsTeam.length;

  const totalDebits       = logisticsLedger.filter(l => l.type === 'debit').reduce((s, l) => s + l.amount, 0);
  const totalCredits      = logisticsLedger.filter(l => l.type === 'credit').reduce((s, l) => s + l.amount, 0);
  const totalDue          = vendors.reduce((s, v) => s + v.dueAmount, 0);

  const warehouseUtil     = warehouses.map(w => ({
    name: w.name,
    pointId: w.pointId,
    usedPct: Math.round((w.usedCapacity / w.totalCapacity) * 100),
  }));

  const recentShipments   = [...shipments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return toJson(successResponse({
    totalShipments, inTransit, delivered, pending,
    activeVendors, totalVendors,
    activeTeam, totalTeam,
    totalDebits, totalCredits,
    netBalance: totalCredits - totalDebits,
    totalDue,
    warehouseUtil,
    recentShipments,
  }));
}
