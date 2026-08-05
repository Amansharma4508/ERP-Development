import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  try {
    // 1. Get user session or authorization token from headers
    const authHeader = request.headers.get('Authorization');
    
    // For testing/development: agar patient table mein email 'pooja@gmail.com' hai ya current user ki email match karni hai
    // Aap yahan user ki email ya patient_id filter laga sakte hain.
    
    // Fetch prescriptions along with patient details
    const { data: prescriptionsData, error: presError } = await supabase
      .from('prescriptions')
      .select(`
        id,
        created_at,
        lab_tests,
        precautions,
        procedure_for_cure,
        doctor_remarks,
        attached_products,
        status,
        patients (
          id,
          name,
          email,
          phone
        )
      `);

    if (presError) {
      console.error('Supabase fetch error:', presError.message);
    }

    // Map prescriptions to health records format
    const formattedPrescriptions = (prescriptionsData || []).map((p: any) => ({
      id: p.id,
      title: `Prescription by Doctor`,
      type: 'prescription',
      doctor: 'Dr. Subash',
      doctor_profession: 'General Practitioner',
      date: new Date(p.created_at).toISOString().split('T')[0],
      description: `Tests: ${p.lab_tests || 'N/A'} | Remarks: ${p.doctor_remarks || 'None'}`,
      bloodGroup: '',
      allergies: [],
      notes: p.procedure_for_cure || '',
      createdAt: p.created_at,
      attached_products: p.attached_products || []
    }));

    return NextResponse.json({
      success: true,
      data: formattedPrescriptions
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}