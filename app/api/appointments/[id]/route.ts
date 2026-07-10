import { NextRequest } from 'next/server';
import { appointments, doctors, wallets, walletTransactions } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

// PATCH /api/appointments/[id] - update status (doctor: confirm/reject, patient: cancel)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload) return toJson(errorResponse('Invalid token', 401));

  const { id } = await params;
  const appt = appointments.find((a) => a.id === id);
  if (!appt) return toJson(errorResponse('Appointment not found', 404));

  const body = await request.json();
  const { status, notes } = body;

  if (payload.role === 'doctor') {
    const doc = doctors.find((d) => d.userId === payload.userId);
    if (appt.doctorId !== doc?.id) return toJson(errorResponse('Forbidden', 403));
    if (!['confirmed', 'rejected', 'completed'].includes(status)) {
      return toJson(errorResponse('Invalid status for doctor', 400));
    }
    // Refund if rejected
    if (status === 'rejected') {
      const wallet = wallets.find((w) => w.userId === appt.patientId);
      if (wallet) {
        wallet.balance += appt.consultationFee;
        walletTransactions.push({
          id: `wt${Date.now()}`,
          userId: appt.patientId,
          type: 'credit',
          amount: appt.consultationFee,
          description: `Refund: ${appt.doctorName} appointment rejected`,
          category: 'Refund',
          date: new Date().toISOString().split('T')[0],
        });
      }
    }
  } else if (payload.role === 'user') {
    if (appt.patientId !== payload.userId) return toJson(errorResponse('Forbidden', 403));
    if (status !== 'cancelled') return toJson(errorResponse('Patients can only cancel', 400));
    // Refund on cancel
    const wallet = wallets.find((w) => w.userId === payload.userId);
    if (wallet) {
      wallet.balance += appt.consultationFee;
      walletTransactions.push({
        id: `wt${Date.now()}`,
        userId: payload.userId,
        type: 'credit',
        amount: appt.consultationFee,
        description: `Refund: appointment cancelled`,
        category: 'Refund',
        date: new Date().toISOString().split('T')[0],
      });
    }
  } else if (payload.role !== 'admin') {
    return toJson(errorResponse('Forbidden', 403));
  }

  appt.status = status;
  if (notes) appt.notes = notes;

  return toJson(successResponse(appt));
}

// DELETE /api/appointments/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return toJson(errorResponse('Forbidden', 403));

  const { id } = await params;
  const idx = appointments.findIndex((a) => a.id === id);
  if (idx === -1) return toJson(errorResponse('Appointment not found', 404));

  appointments.splice(idx, 1);
  return toJson(successResponse({ message: 'Deleted' }));
}
