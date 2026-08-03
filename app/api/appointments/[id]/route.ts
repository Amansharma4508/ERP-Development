import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

// Helper function to calculate age from Date of Birth (DOB)
function calculateAge(dobString: string): number | null {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return null;
  
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

// PATCH /api/appointments/[id]
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
    allowedFromStatuses = status === 'completed' ? ['confirmed'] : ['pending'];
  } else if (payload.role === 'user') {
    if (appt.patient_id !== userId) return toJson(errorResponse('Forbidden', 403));
    if (status !== 'cancelled') return toJson(errorResponse('Patients can only cancel', 400));
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
    return toJson(errorResponse('This appointment was already updated by someone else. Please refresh.', 409));
  }

  // ── AUTOMATIC PATIENT SYNC ON CONFIRMATION ──────────────────
  if (payload.role === 'doctor' && status === 'confirmed' && updated.patient_id) {
    try {
      const patientUserId = updated.patient_id;
      const profileName = updated.patient?.full_name;

      // 1. Fetch demographics from wallet_applications by ID or Name fallback
      let { data: walletData } = await supabaseAdmin
        .from('wallet_applications')
        .select('*')
        .eq('id', patientUserId)
        .maybeSingle();

      if (!walletData && profileName) {
        const { data: walletByName } = await supabaseAdmin
          .from('wallet_applications')
          .select('*')
          .ilike('full_name', profileName.trim())
          .maybeSingle();
        walletData = walletByName;
      }

      // 2. Fetch contact info from profiles
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', patientUserId)
        .maybeSingle();

      const dobField = walletData?.dob || walletData?.date_of_birth || walletData?.birth_date;
      const calculatedAge = calculateAge(dobField) ?? walletData?.age ?? null;

      const patientAddress = [
        walletData?.village_city,
        walletData?.state,
        walletData?.pincode,
        walletData?.address
      ].filter(Boolean).join(', ') || null;

      // 3. Upsert into patients table mapping specifically with doctor_id
      const { error: upsertErr } = await supabaseAdmin
        .from('patients')
        .upsert({
          id: patientUserId,
          doctor_id: updated.doctor_id,
          name: walletData?.full_name || profileData?.full_name || updated.patient?.full_name || 'Unknown Patient',
          age: calculatedAge,
          gender: walletData?.gender || walletData?.sex || null,
          address: patientAddress,
          email: profileData?.email || walletData?.email || null,
          phone: profileData?.phone_number || walletData?.phone_number || updated.patient?.phone_number || null,
        }, { 
          onConflict: 'id,doctor_id' 
        });

      if (upsertErr) {
        console.error('Error upserting patient data:', upsertErr.message);
      }
    } catch (syncErr) {
      console.error('Error auto-syncing patient data:', syncErr);
    }
  }

  return toJson(successResponse(updated));
}

// DELETE: Handle both Single Delete (via params) and Bulk Delete (via body IDs) securely
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getTokenFromRequest(request);
  if (!token) return toJson(errorResponse('Unauthorized', 401));
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return toJson(errorResponse('Forbidden', 403));

  try {
    let bodyIds: string[] = [];
    
    // Check if request body has multiple IDs for bulk delete
    try {
      const body = await request.json();
      if (body && Array.isArray(body.ids)) {
        bodyIds = body.ids;
      }
    } catch {
      // Body can be empty if it's a standard single delete query
    }

    // BULK DELETE
    if (bodyIds.length > 0) {
      const { error } = await supabaseAdmin
        .from('appointments')
        .delete()
        .in('id', bodyIds);

      if (error) return toJson(errorResponse(error.message, 500));

      return toJson(successResponse({ message: `${bodyIds.length} appointments deleted successfully` }));
    }

    // SINGLE DELETE
    const { id } = await params;
    if (!id) {
      return toJson(errorResponse('Appointment ID is required', 400));
    }

    const { error } = await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) return toJson(errorResponse(error.message, 500));

    return toJson(successResponse({ message: 'Appointment deleted successfully' }));

  } catch (err: any) {
    return toJson(errorResponse(err.message, 500));
  }
}