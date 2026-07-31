import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

// PATCH /api/appointments/[id]
// body: { action: 'status', status: 'confirmed'|'rejected'|'completed'|'cancelled' }
// body: { action: 'reschedule', date: 'YYYY-MM-DD', time: 'HH:mm' }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getTokenFromRequest(request);
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload) return toJson(errorResponse('Invalid token', 401));

  const userId = payload.userId || payload.id;
  const { id } = await params;

  const { data: appt, error: fetchErr } = await supabaseAdmin
    .from('appointments')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchErr || !appt) return toJson(errorResponse('Appointment not found', 404));

  const body = await request.json();
  const { action, status, notes, date, time } = body;

  // ── RESCHEDULE ──────────────────────────────────────────────
  if (action === 'reschedule') {
    if (payload.role !== 'doctor' && payload.role !== 'admin') {
      return toJson(errorResponse('Only doctor/admin can reschedule', 403));
    }
    if (payload.role === 'doctor' && appt.doctor_id !== userId) {
      return toJson(errorResponse('Forbidden', 403));
    }
    if (!date || !time) return toJson(errorResponse('date and time are required to reschedule', 400));

    const { data: updated, error: updErr } = await supabaseAdmin
      .from('appointments')
      .update({ appointment_date: date, appointment_time: time, status: 'pending' })
      .eq('id', id)
      .select(`
        id, patient_id, doctor_id, specialization, appointment_date, appointment_time,
        status, notes, consultation_fee, created_at,
        patient:profiles!appointments_patient_id_fkey ( full_name, phone_number ),
        doctor:profiles!appointments_doctor_id_fkey ( full_name )
      `)
      .single();
    if (updErr) return toJson(errorResponse(updErr.message, 500));
    return toJson(successResponse(updated));
  }

  // ── STATUS CHANGE ───────────────────────────────────────────
  let allowedFromStatuses: string[] = [];

  if (payload.role === 'doctor') {
    if (appt.doctor_id !== userId) return toJson(errorResponse('Forbidden', 403));
    if (!['confirmed', 'rejected', 'completed'].includes(status)) {
      return toJson(errorResponse('Invalid status for doctor', 400));
    }
    // Doctor sirf pending -> confirmed/rejected, ya confirmed -> completed kar sakta hai
    allowedFromStatuses = status === 'completed' ? ['confirmed'] : ['pending'];
  } else if (payload.role === 'user') {
    if (appt.patient_id !== userId) return toJson(errorResponse('Forbidden', 403));
    if (status !== 'cancelled') return toJson(errorResponse('Patients can only cancel', 400));
    // Patient sirf pending ya confirmed appointment cancel kar sakta hai
    allowedFromStatuses = ['pending', 'confirmed'];
  } else if (payload.role !== 'admin') {
    return toJson(errorResponse('Forbidden', 403));
  }

  const updates: Record<string, any> = { status };
  if (notes) updates.notes = notes;

  let updateQuery = supabaseAdmin
    .from('appointments')
    .update(updates)
    .eq('id', id);

  // Race-condition guard: sirf tabhi update ho jab current status abhi bhi expected ho
  if (allowedFromStatuses.length > 0) {
    updateQuery = updateQuery.in('status', allowedFromStatuses);
  }

  const { data: updated, error: updErr } = await updateQuery
    .select(`
      id, patient_id, doctor_id, specialization, appointment_date, appointment_time,
      status, notes, consultation_fee, created_at,
      patient:profiles!appointments_patient_id_fkey ( full_name, phone_number ),
      doctor:profiles!appointments_doctor_id_fkey ( full_name )
    `)
    .maybeSingle();

  if (updErr) return toJson(errorResponse(updErr.message, 500));

  if (!updated) {
    // Matlab is beech mein status kisi aur action se already change ho chuka tha
    return toJson(errorResponse('This appointment was already updated by someone else. Please refresh.', 409));
  }

  return toJson(successResponse(updated));
}

// DELETE /api/appointments/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getTokenFromRequest(request);
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return toJson(errorResponse('Forbidden', 403));

  const { id } = await params;
  const { error } = await supabaseAdmin.from('appointments').delete().eq('id', id);
  if (error) return toJson(errorResponse(error.message, 500));

  return toJson(successResponse({ message: 'Deleted' }));
}