import { NextRequest } from 'next/server';
import { accountingTransactions } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

// DELETE /api/accounting/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return toJson(errorResponse('Forbidden', 403));

  const { id } = await params;
  const idx = accountingTransactions.findIndex((t) => t.id === id);
  if (idx === -1) return toJson(errorResponse('Transaction not found', 404));

  accountingTransactions.splice(idx, 1);
  return toJson(successResponse({ message: 'Deleted' }));
}
