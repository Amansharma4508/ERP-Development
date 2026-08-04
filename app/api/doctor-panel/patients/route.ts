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

  try {
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

    // 1. Insert into patients table
   // 1. Insert into patients table
    const { data: insertedPatient, error: patientError } = await supabaseAdmin
      .from('patients')
      .insert([
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
      ])
      .select()
      .single();

    if (patientError) {
      console.error('Patient Insert Failed:', patientError.message);
      return toJson(errorResponse('Patient Insert Failed: ' + patientError.message, 500));
    }

    // 2. Insert into medical_history table (Slight safety check)
    const hasMedicalNotes =
      currentSymptoms || healthRecords || previousHealthRecords || prescription;

    if (hasMedicalNotes && insertedPatient) {
      // Thoda sa gap ya direct insert jo ki ensure karega ki patient ID available hai
      const { error: historyError } = await supabaseAdmin.from('medical_history').insert([
        {
          patient_id: patientId,
          previous_history: previousHealthRecords || null,
          pre_treatment_records: healthRecords || null,
          review_notes: currentSymptoms || prescription || null,
        },
      ]);

      if (historyError) {
        console.error('Medical History Insert Failed:', historyError.message);
        // Agar history insert me koi issue aaye toh bhi patient successfully save ho chuka hai,
        // isliye hum chahein toh yaha alert rok sakte hain ya proper response bhej sakte hain.
      }
    }
    // Check for duplicate patient by phone number (if phone is provided) or exact name for this doctor
    if (phone && phone.trim() !== '') {
      const { data: existingPhonePatient } = await supabaseAdmin
        .from('patients')
        .select('id')
        .eq('doctor_id', payload.id)
        .eq('phone', phone.trim())
        .maybeSingle();

      if (existingPhonePatient) {
        return toJson(errorResponse('A patient with this phone number is already registered.', 400));
      }
    }

    return toJson(successResponse({ patientId, message: 'Patient added successfully' }, 201));
  } catch (err: any) {
    console.error('API CATCH ERROR:', err);
    return toJson(errorResponse(err.message || 'Internal Server Error', 500));
  }
}