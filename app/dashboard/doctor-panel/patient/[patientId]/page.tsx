// app/dashboard/doctor-panel/patient/[patientId]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PatientDetailView() {
  const params = useParams();
  const patientId = params.patientId as string;

  const [patient, setPatient] = useState<any>(null);
  const [consultation, setConsultation] = useState<any>(null);
  const [medicalHistory, setMedicalHistory] = useState<any>(null);
  
  // Prescription form states
  const [prescription, setPrescription] = useState({
    medications: '',
    lab_tests: '',
    precautions: '',
    procedure_for_cure: '',
    doctor_remarks: ''
  });

  useEffect(() => {
    async function loadPatientData() {
      if (!patientId) return;

      // 1. Fetch Patient Info
      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();
      setPatient(patientData);

      // 2. Fetch Consultation / Symptoms info
      const { data: consultData } = await supabase
        .from('consultations')
        .select('*')
        .eq('patient_id', patientId)
        .single();
      if (consultData) setConsultation(consultData);

      // 3. Fetch Medical History
      const { data: historyData } = await supabase
        .from('medical_history')
        .select('*')
        .eq('patient_id', patientId)
        .single();
      if (historyData) setMedicalHistory(historyData);

      // 4. Fetch Existing Prescription (Agar pehle se bani hai)
      const { data: prescriptionData } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .single();
      
      if (prescriptionData) {
        setPrescription({
          medications: prescriptionData.medications || '',
          lab_tests: prescriptionData.lab_tests || '',
          precautions: prescriptionData.precautions || '',
          procedure_for_cure: prescriptionData.procedure_for_cure || '',
          doctor_remarks: prescriptionData.doctor_remarks || ''
        });
      }
    }

    loadPatientData();
  }, [patientId]);

  // Handle Prescription Save/Update
  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('prescriptions').upsert({
      patient_id: patientId,
      ...prescription
    }, { onConflict: 'patient_id' }); // Agar pehle se hai toh update ho jayega

    if (!error) {
      alert('Prescription saved successfully!');
    } else {
      alert('Error saving prescription: ' + error.message);
    }
  };

  if (!patient) return <div className="p-6">Loading patient details...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="mb-4">
        <Link 
          href="/dashboard/doctor-panel" 
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition bg-card border border-border px-3 py-1.5 rounded-xl shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Patients
        </Link>
      </div>

      {/* Header Profile Info */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
        <p className="text-sm text-gray-600 mt-1">
          Age: {patient.age} | Gender: {patient.gender} | Phone: {patient.phone} | Email: {patient.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: History & Symptoms (Read-Only) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Previous Medical History</h2>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
              {medicalHistory?.previous_history || 'No previous history provided.'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Current Symptoms & Problem</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Problem Specified:</strong> {consultation?.problem_specified || 'N/A'}</p>
              <p><strong>Nature of Problem:</strong> {consultation?.nature_of_problem || 'N/A'}</p>
              <p><strong>Symptoms:</strong> {consultation?.symptoms || 'N/A'}</p>
              <p><strong>Current Progress:</strong> {consultation?.current_progress || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Right Side: Doctor Prescription & Treatment Form (Write / Edit) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Write Prescription & Treatment</h2>
          
          <form onSubmit={handleSavePrescription} className="space-y-4 text-sm">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Prescription Medication</label>
              <textarea
                rows={3}
                className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., Tab Paracetamol 650mg - Twice a day"
                value={prescription.medications}
                onChange={(e) => setPrescription({ ...prescription, medications: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">List of Tests Recommended</label>
              <input
                type="text"
                className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., CBC, Blood Sugar Test"
                value={prescription.lab_tests}
                onChange={(e) => setPrescription({ ...prescription, lab_tests: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Precautions for Patient</label>
              <input
                type="text"
                className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., Avoid cold water, rest for 3 days"
                value={prescription.precautions}
                onChange={(e) => setPrescription({ ...prescription, precautions: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Procedure for Cure</label>
              <textarea
                rows={2}
                className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Step-by-step recovery procedure"
                value={prescription.procedure_for_cure}
                onChange={(e) => setPrescription({ ...prescription, procedure_for_cure: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Doctor Remarks</label>
              <input
                type="text"
                className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Any special notes or follow-up date"
                value={prescription.doctor_remarks}
                onChange={(e) => setPrescription({ ...prescription, doctor_remarks: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition"
            >
              Save & Update Prescription
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}