// app/dashboard/doctor-panel/patient/[patientId]/page.tsx
'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Trash2, ShoppingCart, Search, Check, ChevronDown } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  category_id?: string;
}

export default function PatientDetailView() {
  const params = useParams();
  const patientId = params.patientId as string;

  const [patient, setPatient] = useState<any>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [medicalHistories, setMedicalHistories] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Prescription form states
  const [prescription, setPrescription] = useState({
    medications_text: '',
    lab_tests: '',
    precautions: '',
    procedure_for_cure: '',
    doctor_remarks: '',
    attached_products: [] as Array<{ id: string; name: string; price: number; quantity: number }>
  });

  const [existingPrescriptionId, setExistingPrescriptionId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      if (!patientId) return;

      try {
        setLoading(true);

        // 1. Fetch Patient Info
        const { data: patientData } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .maybeSingle();
        
        setPatient(patientData || { name: 'Patient', age: 'N/A', gender: 'N/A', phone: 'N/A', email: 'N/A' });

        // 2. Fetch Consultations
        const { data: consultData } = await supabase
          .from('consultations')
          .select('*')
          .eq('patient_id', patientId);
        if (consultData) setConsultations(consultData);

        // 3. Fetch Medical History
        const { data: historyData } = await supabase
          .from('medical_history')
          .select('*')
          .eq('patient_id', patientId);
        if (historyData) setMedicalHistories(historyData);

        // 4. Fetch Products
        const { data: productsData } = await supabase
          .from('products')
          .select('*');
        
        if (productsData) {
          const formatted = productsData.map((p: any) => ({
            id: p.id,
            name: p.title || p.name || 'Unnamed Product',
            price: p.price || 0,
            category_id: p.category_id
          }));
          setAvailableProducts(formatted);
        }

        // 5. Fetch Existing Prescription
        const { data: prescriptionData } = await supabase
          .from('prescriptions')
          .select('*')
          .eq('patient_id', patientId)
          .maybeSingle();
        
        if (prescriptionData) {
          setExistingPrescriptionId(prescriptionData.id);
          setPrescription({
            medications_text: typeof prescriptionData.medications === 'string' ? prescriptionData.medications : '',
            lab_tests: prescriptionData.lab_tests || '',
            precautions: prescriptionData.precautions || '',
            procedure_for_cure: prescriptionData.procedure_for_cure || '',
            doctor_remarks: prescriptionData.doctor_remarks || '',
            attached_products: prescriptionData.attached_products || (Array.isArray(prescriptionData.medications) ? prescriptionData.medications : [])
          });
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [patientId]);

  // Toggle Product selection (Multi-Select)
  const handleToggleProductSelection = (prod: Product) => {
    const existingIndex = prescription.attached_products.findIndex(p => p.id === prod.id);
    if (existingIndex > -1) {
      const updated = prescription.attached_products.filter(p => p.id !== prod.id);
      setPrescription({ ...prescription, attached_products: updated });
    } else {
      setPrescription({
        ...prescription,
        attached_products: [
          ...prescription.attached_products,
          { id: prod.id, name: prod.name, price: prod.price, quantity: 1 }
        ]
      });
    }
  };

  const handleQuantityChange = (id: string, qty: number) => {
    const updated = prescription.attached_products.map(p => 
      p.id === id ? { ...p, quantity: Math.max(1, qty) } : p
    );
    setPrescription({ ...prescription, attached_products: updated });
  };

  const handleRemoveProduct = (id: string) => {
    setPrescription({
      ...prescription,
      attached_products: prescription.attached_products.filter(p => p.id !== id)
    });
  };

  // Handle Save or Update Prescription
  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      patient_id: patientId,
      medications: prescription.attached_products, 
      lab_tests: prescription.lab_tests,
      precautions: prescription.precautions,
      procedure_for_cure: prescription.procedure_for_cure,
      doctor_remarks: prescription.doctor_remarks,
      attached_products: prescription.attached_products,
      status: 'active'
    };

    let error;

    if (existingPrescriptionId) {
      const res = await supabase
        .from('prescriptions')
        .update(payload)
        .eq('id', existingPrescriptionId);
      error = res.error;
    } else {
      const res = await supabase
        .from('prescriptions')
        .insert([payload])
        .select()
        .single();
      
      error = res.error;
      if (res.data) {
        setExistingPrescriptionId(res.data.id);
      }
    }

    if (!error) {
      alert('Prescription saved successfully with selected medicines!');
    } else {
      alert('Error saving prescription: ' + error.message);
    }
  };

  const filteredProducts = availableProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-6 text-center text-muted-foreground font-medium">Loading patient details...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="mb-4">
        <Link 
          href="/dashboard/doctor-panel" 
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition bg-card border border-border px-3 py-1.5 rounded-xl shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Patients
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
        <h1 className="text-2xl font-bold text-gray-900">{patient?.name || 'Patient'}</h1>
        <p className="text-sm text-gray-600 mt-1">
          Age: {patient?.age} | Gender: {patient?.gender} | Phone: {patient?.phone} | Email: {patient?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Previous Medical History</h2>
            <div className="space-y-2">
              {medicalHistories.length > 0 ? (
                medicalHistories.map((item, index) => (
                  <p key={index} className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-border/60">
                    {item.previous_history || 'No details provided.'}
                  </p>
                ))
              ) : (
                <p className="text-sm text-gray-500">No previous history provided.</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Current Symptoms & Problem</h2>
            <div className="space-y-3">
              {consultations.length > 0 ? (
                consultations.map((consultation, index) => (
                  <div key={index} className="space-y-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-border/60">
                    <p><strong>Problem Specified:</strong> {consultation?.problem_specified || 'N/A'}</p>
                    <p><strong>Nature of Problem:</strong> {consultation?.nature_of_problem || 'N/A'}</p>
                    <p><strong>Symptoms:</strong> {consultation?.symptoms || 'N/A'}</p>
                    <p><strong>Current Progress:</strong> {consultation?.current_progress || 'N/A'}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No consultation details found.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Write Prescription & Treatment</h2>
          
          <form onSubmit={handleSavePrescription} className="space-y-4 text-sm">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Prescription Medication Notes</label>
              <textarea
                rows={3}
                className="w-full border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g., Take medicines after food..."
                value={prescription.medications_text}
                onChange={(e) => setPrescription({ ...prescription, medications_text: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">List of Tests Recommended</label>
              <input
                type="text"
                className="w-full border border-border rounded-xl p-2.5 focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g., CBC, Blood Sugar Test"
                value={prescription.lab_tests}
                onChange={(e) => setPrescription({ ...prescription, lab_tests: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Precautions for Patient</label>
              <input
                type="text"
                className="w-full border border-border rounded-xl p-2.5 focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g., Avoid cold water, rest for 3 days"
                value={prescription.precautions}
                onChange={(e) => setPrescription({ ...prescription, precautions: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Procedure for Cure</label>
              <textarea
                rows={2}
                className="w-full border border-border rounded-xl p-2.5 focus:ring-2 focus:ring-primary outline-none"
                placeholder="Step-by-step recovery procedure"
                value={prescription.procedure_for_cure}
                onChange={(e) => setPrescription({ ...prescription, procedure_for_cure: e.target.value })}
              />
            </div>

            {/* ATTACH MEDICINES & OTC PRODUCTS (Multi-Select & Search) */}
            <div className="bg-muted/30 p-4 rounded-2xl border border-border space-y-3" ref={dropdownRef}>
              <label className="block font-semibold text-gray-800">Attach Medicines & OTC Products</label>
              
              <div className="relative">
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full border border-border rounded-xl p-3 bg-background text-sm flex items-center justify-between cursor-pointer"
                >
                  <span className="text-muted-foreground">
                    {prescription.attached_products.length > 0
                      ? `${prescription.attached_products.length} medicine(s) selected`
                      : 'Select medicines from store...'}
                  </span>
                  <ChevronDown size={16} className="text-muted-foreground" />
                </div>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 p-3 space-y-2 max-h-60 overflow-y-auto">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search medicines..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border border-border rounded-lg bg-background text-xs outline-none focus:ring-1 focus:ring-primary"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="space-y-1">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((prod) => {
                          const isSelected = prescription.attached_products.some(p => p.id === prod.id);
                          return (
                            <div
                              key={prod.id}
                              onClick={() => handleToggleProductSelection(prod)}
                              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition ${
                                isSelected ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted/50 text-foreground'
                              }`}
                            >
                              <span>{prod.name} (₹{prod.price})</span>
                              {isSelected && <Check size={14} className="text-primary" />}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-2">No medicines found.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {prescription.attached_products.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selected Products ({prescription.attached_products.length}):</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {prescription.attached_products.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-background p-2.5 rounded-xl border border-border text-xs gap-2">
                        <div className="truncate flex-1">
                          <p className="font-bold text-foreground truncate">{item.name}</p>
                          <p className="text-muted-foreground">₹{item.price * item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                            className="w-16 border border-border rounded-lg p-1 text-center bg-background text-xs outline-none"
                            title="Quantity"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(item.id)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Doctor Remarks</label>
              <input
                type="text"
                className="w-full border border-border rounded-xl p-2.5 focus:ring-2 focus:ring-primary outline-none"
                placeholder="Any special notes or follow-up date"
                value={prescription.doctor_remarks}
                onChange={(e) => setPrescription({ ...prescription, doctor_remarks: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingCart size={16} /> Save & Attach Products to Prescription
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}