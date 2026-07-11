import { NextRequest } from 'next/server';
import { logisticsLedger } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

function guard(token: string | undefined) {
  if (!token) return null;
  const p = verifyToken(token);
  if (!p || (p.role !== 'logistics' && p.role !== 'admin')) return null;
  return p;
}

// GET /api/logistics/ledger
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!guard(token)) return toJson(errorResponse('Unauthorized', 401));

  const sorted = [...logisticsLedger].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalDebits  = logisticsLedger.filter(l => l.type === 'debit').reduce((s, l) => s + l.amount, 0);
  const totalCredits = logisticsLedger.filter(l => l.type === 'credit').reduce((s, l) => s + l.amount, 0);

  return toJson(successResponse({ entries: sorted, totalDebits, totalCredits, net: totalCredits - totalDebits }));
}

// POST /api/logistics/ledger
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!guard(token)) return toJson(errorResponse('Unauthorized', 401));

  const body = await request.json();
  const { type, category, amount, description, reference, date } = body;

  if (!type || !category || !amount || !description || !date) {
    return toJson(errorResponse('Missing required fields', 400));
  }

  const newEntry = {
    id:          `ll${Date.now()}`,
    type,        category,
    amount:      Number(amount),
    description, reference: reference ?? '',
    date,
  };

  logisticsLedger.push(newEntry);
  return toJson(successResponse(newEntry, 201));
}
