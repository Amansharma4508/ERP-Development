import { NextRequest } from 'next/server';
import { appointments, doctors, wallets, walletTransactions, users } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

export interface PaymentRecord {
  id: string;
  appointmentId: string;
  userId: string;
  amount: number;
  method: 'wallet' | 'credit_card' | 'debit_card' | 'upi';
  methodDetails: string; // e.g. "•••• 4242" or "user@upi"
  status: 'success' | 'failed';
  transactionRef: string;
  paidAt: string;
}

// In-memory payment records
export const paymentRecords: PaymentRecord[] = [];

// Simulate card/UPI processing (always succeeds in demo)
function processPayment(method: string, amount: number): { success: boolean; ref: string } {
  // In real world: call Stripe / Razorpay / PayU here
  const ref = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return { success: true, ref };
}

// POST /api/payments  — create payment and book appointment atomically
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload) return toJson(errorResponse('Invalid token', 401));

  const body = await request.json();
  const { doctorId, date, time, notes, paymentMethod, cardNumber, cardExpiry, cardCvv, cardHolder, upiId } = body;

  // ── Validate required fields ──────────────────────────────────────────────
  if (!doctorId || !date || !time) {
    return toJson(errorResponse('doctorId, date and time are required', 400));
  }
  if (!paymentMethod) {
    return toJson(errorResponse('paymentMethod is required', 400));
  }

  const doctor = doctors.find((d) => d.id === doctorId);
  if (!doctor) return toJson(errorResponse('Doctor not found', 404));

  const patient = users.find((u) => u.id === payload.userId);
  const amount = doctor.consultationFee;

  // ── Payment method specific validation ───────────────────────────────────
  let methodDetails = '';

  if (paymentMethod === 'wallet') {
    const wallet = wallets.find((w) => w.userId === payload.userId);
    if (!wallet || wallet.balance < amount) {
      return toJson(errorResponse(`Insufficient wallet balance. Available: $${wallet?.balance ?? 0}, Required: $${amount}`, 400));
    }
    methodDetails = 'Wallet Balance';

    // Deduct wallet
    wallet.balance -= amount;
    walletTransactions.push({
      id: `wt${Date.now()}`,
      userId: payload.userId,
      type: 'debit',
      amount,
      description: `${doctor.fullName} — ${doctor.specialization} consultation`,
      category: 'Consultation',
      date: new Date().toISOString().split('T')[0],
    });

  } else if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
    if (!cardNumber || !cardExpiry || !cardCvv || !cardHolder) {
      return toJson(errorResponse('Card details are incomplete', 400));
    }

    // Card number: digits only, 13-19 chars, Luhn check
    const digits = cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(digits)) {
      return toJson(errorResponse('Invalid card number — must be 13–19 digits', 400));
    }
    // Luhn algorithm
    let sum = 0;
    let alternate = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let n = parseInt(digits[i], 10);
      if (alternate) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
      alternate = !alternate;
    }
    if (sum % 10 !== 0) {
      return toJson(errorResponse('Invalid card number — please check and try again', 400));
    }

    // Expiry: MM/YY format, not expired
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      return toJson(errorResponse('Invalid expiry format — use MM/YY', 400));
    }
    const [expMM, expYY] = cardExpiry.split('/').map(Number);
    if (expMM < 1 || expMM > 12) {
      return toJson(errorResponse('Invalid expiry month', 400));
    }
    const now = new Date();
    const expDate = new Date(2000 + expYY, expMM - 1, 1);
    if (expDate < new Date(now.getFullYear(), now.getMonth(), 1)) {
      return toJson(errorResponse('Card has expired', 400));
    }

    // CVV: 3–4 digits
    if (!/^\d{3,4}$/.test(cardCvv)) {
      return toJson(errorResponse('CVV must be 3 or 4 digits', 400));
    }

    // Cardholder name: at least two words, letters only
    if (!cardHolder || cardHolder.trim().split(/\s+/).length < 2) {
      return toJson(errorResponse('Enter full cardholder name (first and last)', 400));
    }
    if (!/^[a-zA-Z\s]+$/.test(cardHolder.trim())) {
      return toJson(errorResponse('Cardholder name must contain letters only', 400));
    }

    methodDetails = `•••• ${digits.slice(-4)}`;

  } else if (paymentMethod === 'upi') {
    // UPI: localpart@provider, localpart ≥ 3 chars, provider ≥ 2 chars
    const upiRegex = /^[a-zA-Z0-9.\-_]{3,}@[a-zA-Z]{2,}$/;
    if (!upiId || !upiRegex.test(upiId.trim())) {
      return toJson(errorResponse('Invalid UPI ID — format: yourname@bankcode (e.g. john@okaxis)', 400));
    }
    methodDetails = upiId.trim();

  } else {
    return toJson(errorResponse('Invalid payment method', 400));
  }

  // ── Process payment (simulate gateway) ───────────────────────────────────
  const { success, ref } = processPayment(paymentMethod, amount);

  if (!success) {
    return toJson(errorResponse('Payment failed. Please try again.', 402));
  }

  // ── Create appointment ────────────────────────────────────────────────────
  const appointmentId = `a${Date.now()}`;
  const newAppointment = {
    id: appointmentId,
    patientId: payload.userId,
    patientName: patient?.fullName ?? payload.email.split('@')[0],
    doctorId,
    doctorName: doctor.fullName,
    specialization: doctor.specialization,
    date,
    time,
    status: 'pending' as const,
    notes: notes || '',
    consultationFee: amount,
    createdAt: new Date().toISOString().split('T')[0],
  };
  appointments.push(newAppointment);

  // ── Record payment ────────────────────────────────────────────────────────
  const paymentRecord: PaymentRecord = {
    id: `pmt${Date.now()}`,
    appointmentId,
    userId: payload.userId,
    amount,
    method: paymentMethod,
    methodDetails,
    status: 'success',
    transactionRef: ref,
    paidAt: new Date().toISOString(),
  };
  paymentRecords.push(paymentRecord);

  return toJson(successResponse({
    appointment: newAppointment,
    payment: paymentRecord,
  }, 201));
}

// GET /api/payments — get payment history for current user
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload) return toJson(errorResponse('Invalid token', 401));

  const records = paymentRecords
    .filter((p) => p.userId === payload.userId)
    .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

  return toJson(successResponse(records));
}
