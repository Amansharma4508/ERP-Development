import { NextRequest } from 'next/server';
import {
  doctorWallets, doctorWalletTransactions, doctors, paymentControls,
} from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

// GET /api/doctor-wallet
// Doctor sees their own wallet; admin sees all
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload) return toJson(errorResponse('Invalid token', 401));

  if (payload.role === 'admin') {
    // Return all doctor wallets for admin
    const all = doctorWallets.map((dw) => {
      const txns = doctorWalletTransactions.filter((t) => t.doctorId === dw.doctorId);
      const control = paymentControls.find(
        (c) => c.entityType === 'doctor' && c.entityId === dw.doctorId,
      );
      return {
        ...dw,
        transactions: txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        paymentPaused: control?.paused ?? false,
        pauseReason:   control?.pauseReason ?? null,
        controlId:     control?.id ?? null,
      };
    });
    return toJson(successResponse({ wallets: all }));
  }

  if (payload.role === 'doctor') {
    // Find the doctor profile linked to this user
    const doctor = doctors.find((d) => d.userId === payload.userId);
    if (!doctor) return toJson(errorResponse('Doctor profile not found', 404));

    const wallet = doctorWallets.find((dw) => dw.doctorId === doctor.id);
    if (!wallet) return toJson(errorResponse('Wallet not found', 404));

    const txns = doctorWalletTransactions
      .filter((t) => t.doctorId === doctor.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const control = paymentControls.find(
      (c) => c.entityType === 'doctor' && c.entityId === doctor.id,
    );

    const totalCredits    = txns.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const totalSettled    = txns.filter((t) => t.type === 'settlement').reduce((s, t) => s + t.amount, 0);
    const pendingThisWeek = txns
      .filter((t) => t.type === 'credit' && new Date(t.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .reduce((s, t) => s + t.amount, 0);

    return toJson(
      successResponse({
        wallet,
        transactions: txns,
        stats: {
          totalCredits,
          totalSettled,
          pendingThisWeek,
          txnCount: txns.length,
        },
        paymentPaused: control?.paused ?? false,
        pauseReason:   control?.pauseReason ?? null,
      }),
    );
  }

  return toJson(errorResponse('Forbidden', 403));
}
