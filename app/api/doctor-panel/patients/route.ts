import { NextRequest } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return toJson(errorResponse('Unauthorized', 401));

  const payload = verifyToken(token);
  if (!payload || !payload.id) return toJson(errorResponse('Invalid token', 401));

  const { data, error } = await supabaseAdmin
    .from('patients')
    .select('*')
    .eq('doctor_id', payload.id)
    .order('created_at', { ascending: false });

  if (error) {
    return toJson(errorResponse(error.message, 500));
  }

  const formatted = (data ?? []).map((patient: any) => ({
    patientId: patient.id,
    name: patient.name || 'Unknown Patient',
    age: patient.age ?? 'N/A',
    gender: patient.gender || 'N/A',
    phone: patient.phone || 'N/A',
    email: patient.email || 'N/A',
    address: patient.address || 'N/A',
    createdAt: patient.created_at,
  }));

  return toJson(successResponse(formatted));
}

export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return toJson(errorResponse('Unauthorized', 401));

  const payload = verifyToken(token);
  if (!payload || !payload.id) return toJson(errorResponse('Invalid token', 401));

  const body = await request.json();
  const {
    name,
    age,
    gender,
    phone,
    email,
    address,
    healthRecords,
    previousHealthRecords,
    currentSymptoms,
    prescription,
  } = body ?? {};

  if (!name || !name.trim()) {
    return toJson(errorResponse('Patient name is required', 400));
  }

  const patientId = crypto.randomUUID();

  const { error: patientError } = await supabaseAdmin.from('patients').insert([
    {
      id: patientId,
      doctor_id: payload.id,
      name: name.trim(),
      age: age !== '' && age !== null && age !== undefined ? Number(age) : null,
      gender: gender || 'Male',
      phone: phone || null,
      email: email || null,
      address: address || null,
    },
  ]);

  if (patientError) {
    return toJson(errorResponse(patientError.message, 500));
  }

  const hasMedicalNotes =
    currentSymptoms || healthRecords || previousHealthRecords || prescription;

  if (hasMedicalNotes) {
    const { error: historyError } = await supabaseAdmin.from('medical_history').insert([
      {
        patient_id: patientId,
        doctor_id: payload.id,
        current_symptoms: currentSymptoms || null,
        health_records: healthRecords || null,
        previous_records: previousHealthRecords || null,
        prescription: prescription || null,
      },
    ]);

    if (historyError) {
      return toJson(errorResponse(historyError.message, 500));
    }
  }

  return toJson(successResponse({ patientId, message: 'Patient added successfully' }, 201));
}
