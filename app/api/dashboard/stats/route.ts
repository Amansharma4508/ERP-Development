import { NextRequest } from 'next/server';
import { appointments, healthRecords, wallets, orders, inventoryItems, accountingTransactions, doctors } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

// GET /api/dashboard/stats
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload) return toJson(errorResponse('Invalid token', 401));

  const wallet = wallets.find((w) => w.userId === payload.userId);

  if (payload.role === 'user') {
    const myAppts = appointments.filter((a) => a.patientId === payload.userId);
    const myRecords = healthRecords.filter((r) => r.userId === payload.userId);
    return toJson(successResponse({
      totalAppointments: myAppts.length,
      upcomingAppointments: myAppts.filter((a) => a.status === 'confirmed' || a.status === 'pending').length,
      healthRecords: myRecords.length,
      walletBalance: wallet?.balance ?? 0,
      recentAppointments: myAppts.slice(-3).reverse(),
    }));
  }

  if (payload.role === 'doctor') {
    const doc = doctors.find((d) => d.userId === payload.userId);
    const myAppts = appointments.filter((a) => a.doctorId === doc?.id);
    return toJson(successResponse({
      totalAppointments: myAppts.length,
      pendingAppointments: myAppts.filter((a) => a.status === 'pending').length,
      confirmedAppointments: myAppts.filter((a) => a.status === 'confirmed').length,
      completedAppointments: myAppts.filter((a) => a.status === 'completed').length,
      walletBalance: wallet?.balance ?? 0,
      recentAppointments: myAppts.slice(-5).reverse(),
    }));
  }

  // admin
  const totalIncome = accountingTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = accountingTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const lowStock = inventoryItems.filter((i) => i.quantity <= i.reorderLevel).length;

  return toJson(successResponse({
    totalAppointments: appointments.length,
    pendingOrders: orders.filter((o) => o.status === 'pending').length,
    lowStockItems: lowStock,
    totalInventoryItems: inventoryItems.length,
    revenue: totalIncome,
    expenses: totalExpense,
    profit: totalIncome - totalExpense,
    totalDoctors: doctors.length,
    recentAppointments: appointments.slice(-5).reverse(),
  }));
}
