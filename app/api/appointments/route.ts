import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

function mapAppointment(row: any) {
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patient?.full_name ?? 'Unknown',
    patientPhone: row.patient?.phone_number ?? null,
    doctorId: row.doctor_id,
    doctorName: row.doctor?.full_name ?? 'Unknown',
    specialization: row.specialization,
    date: row.appointment_date,
    time: row.appointment_time,
    status: row.status,
    notes: row.notes,
    consultationFee: Number(row.consultation_fee),
    createdAt: row.created_at,
  };
}

// GET /api/appointments
export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload) return toJson(errorResponse('Invalid token', 401));

  const userId = payload.userId || payload.id;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const date = searchParams.get('date');
  const patientName = searchParams.get('patientName');
  const view = searchParams.get('view');

  let query = supabaseAdmin
    .from('appointments')
    .select(`
      id, patient_id, doctor_id, specialization, appointment_date, appointment_time,
      status, notes, consultation_fee, created_at,
      patient:profiles!appointments_patient_id_fkey ( full_name, email, phone_number ),
      doctor:profiles!appointments_doctor_id_fkey ( full_name )
    `)
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false });

  if (payload.role === 'doctor') {
    query = query.eq('doctor_id', userId);
  } else if (payload.role === 'admin') {
    // sees all
  } else {
    query = query.eq('patient_id', userId);
  }

  if (status) query = query.eq('status', status);
  if (date) query = query.eq('appointment_date', date);

  const today = new Date().toISOString().split('T')[0];
  if (view === 'upcoming') {
    query = query.gte('appointment_date', today).in('status', ['pending', 'confirmed']);
  } else if (view === 'past') {
    query = query.or(`appointment_date.lt.${today},status.eq.completed`);
  } else if (view === 'cancelled') {
    query = query.in('status', ['cancelled', 'rejected']);
  }

  const { data, error } = await query;
  if (error) return toJson(errorResponse(error.message, 500));

  // ── AUTO-CANCEL: agar pending appointment ka date+time nikal chuka hai
  // aur doctor ne confirm/reject nahi kiya, to usse cancelled kar do ──
  const now = new Date();
  const expiredPendingIds: string[] = [];

  (data ?? []).forEach((row: any) => {
    if (row.status === 'pending') {
      const apptDateTime = new Date(`${row.appointment_date}T${row.appointment_time}`);
      if (apptDateTime < now) {
        expiredPendingIds.push(row.id);
        row.status = 'cancelled'; // isi response mein turant reflect ho jaye
      }
    }
  });

  if (expiredPendingIds.length > 0) {
    await supabaseAdmin
      .from('appointments')
      .update({ status: 'cancelled' })
      .in('id', expiredPendingIds);
  }

  let result = (data ?? []).map(mapAppointment);

  if (patientName) {
    const q = patientName.toLowerCase();
    result = result.filter((a) => a.patientName.toLowerCase().includes(q));
  }

  return toJson(successResponse(result));
}

// POST /api/appointments - book a new appointment
export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload) return toJson(errorResponse('Invalid token', 401));

  const userId = payload.userId || payload.id;
  const body = await request.json();
  const { doctorId, date, time, notes } = body;

  if (!doctorId || !date || !time) {
    return toJson(errorResponse('doctorId, date, and time are required', 400));
  }

  const { data: doctor, error: doctorErr } = await supabaseAdmin
    .from('doctor_profiles')
    .select('id, specialization, consultation_fee')
    .eq('id', doctorId)
    .single();

  if (doctorErr || !doctor) return toJson(errorResponse('Doctor not found', 404));

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from('appointments')
    .insert({
      patient_id: userId,
      doctor_id: doctorId,
      specialization: doctor.specialization,
      appointment_date: date,
      appointment_time: time,
      status: 'pending',
      notes: notes || '',
      consultation_fee: doctor.consultation_fee,
    })
    .select(`
      id, patient_id, doctor_id, specialization, appointment_date, appointment_time,
      status, notes, consultation_fee, created_at,
      patient:profiles!appointments_patient_id_fkey ( full_name, phone_number ),
      doctor:profiles!appointments_doctor_id_fkey ( full_name )
    `)
    .single();

  if (insertErr) return toJson(errorResponse(insertErr.message, 500));

  return toJson(successResponse(mapAppointment(inserted), 201));
}