import { NextRequest } from 'next/server';
import { appointments, doctors, wallets, walletTransactions, users } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

// GET /api/appointments - list appointments for current user
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload) return toJson(errorResponse('Invalid token', 401));

  let result;
  if (payload.role === 'doctor') {
    const doc = doctors.find((d) => d.userId === payload.userId);
    result = appointments.filter((a) => a.doctorId === doc?.id);
  } else if (payload.role === 'admin') {
    result = appointments;
  } else {
    result = appointments.filter((a) => a.patientId === payload.userId);
  }

  return toJson(successResponse(result));
}

// POST /api/appointments - book a new appointment
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload) return toJson(errorResponse('Invalid token', 401));

  const body = await request.json();
  const { doctorId, date, time, notes } = body;

  if (!doctorId || !date || !time) {
    return toJson(errorResponse('doctorId, date, and time are required', 400));
  }

  const doctor = doctors.find((d) => d.id === doctorId);
  if (!doctor) return toJson(errorResponse('Doctor not found', 404));

  // Check wallet balance
  const wallet = wallets.find((w) => w.userId === payload.userId);
  if (!wallet || wallet.balance < doctor.consultationFee) {
    return toJson(errorResponse('Insufficient wallet balance', 400));
  }

  // Deduct fee
  wallet.balance -= doctor.consultationFee;
  const txId = `wt${Date.now()}`;
  walletTransactions.push({
    id: txId,
    userId: payload.userId,
    type: 'debit',
    amount: doctor.consultationFee,
    description: `${doctor.fullName} - ${doctor.specialization}`,
    category: 'Consultation',
    date: new Date().toISOString().split('T')[0],
  });

  const patient = users.find((u) => u.id === payload.userId);
  const newAppointment = {
    id: `a${Date.now()}`,
    patientId: payload.userId,
    patientName: patient?.fullName ?? payload.email.split('@')[0],
    doctorId,
    doctorName: doctor.fullName,
    specialization: doctor.specialization,
    date,
    time,
    status: 'pending' as const,
    notes: notes || '',
    consultationFee: doctor.consultationFee,
    createdAt: new Date().toISOString().split('T')[0],
  };

  appointments.push(newAppointment);
  return toJson(successResponse(newAppointment, 201));
}
