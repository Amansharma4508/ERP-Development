import { NextRequest } from 'next/server';
import { accountingTransactions } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

// GET /api/accounting
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return toJson(errorResponse('Forbidden', 403));

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const result = type
    ? accountingTransactions.filter((t) => t.type === type)
    : accountingTransactions;

  const sorted = [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIncome = accountingTransactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = accountingTransactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  return toJson(successResponse({ transactions: sorted, totalIncome, totalExpense, profit: totalIncome - totalExpense }));
}

// POST /api/accounting
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return toJson(errorResponse('Forbidden', 403));

  const body = await request.json();
  const { type, category, amount, description, date, reference } = body;

  if (!type || !category || !amount || !description || !date) {
    return toJson(errorResponse('Missing required fields', 400));
  }

  const newTxn = {
    id: `acc${Date.now()}`,
    transactionId: `TXN-${String(accountingTransactions.length + 1).padStart(3, '0')}`,
    type,
    category,
    amount: Number(amount),
    description,
    date,
    reference,
  };

  accountingTransactions.push(newTxn);
  return toJson(successResponse(newTxn, 201));
}
