import { NextRequest } from 'next/server';
import { wallets, walletTransactions } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

// GET /api/wallet - get balance + transactions
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload) return toJson(errorResponse('Invalid token', 401));

  const wallet = wallets.find((w) => w.userId === payload.userId) ?? { userId: payload.userId, balance: 0 };
  const txns = walletTransactions
    .filter((t) => t.userId === payload.userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return toJson(successResponse({ balance: wallet.balance, transactions: txns }));
}

// POST /api/wallet - top up wallet
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload) return toJson(errorResponse('Invalid token', 401));

  const body = await request.json();
  const { amount } = body;

  if (!amount || amount <= 0) return toJson(errorResponse('Invalid amount', 400));
  if (amount > 10000) return toJson(errorResponse('Maximum top-up is $10,000', 400));

  let wallet = wallets.find((w) => w.userId === payload.userId);
  if (!wallet) {
    wallet = { userId: payload.userId, balance: 0 };
    wallets.push(wallet);
  }
  wallet.balance += amount;

  const txn = {
    id: `wt${Date.now()}`,
    userId: payload.userId,
    type: 'credit' as const,
    amount,
    description: 'Wallet top-up',
    category: 'Top-up',
    date: new Date().toISOString().split('T')[0],
  };
  walletTransactions.push(txn);

  return toJson(successResponse({ balance: wallet.balance, transaction: txn }, 201));
}
