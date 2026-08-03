'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Check, Eye, Loader2, Trash2, UserPlus, X } from 'lucide-react';

// 1. Custom Checkbox Component Creation
interface CustomCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  ariaLabel?: string;
}

function CustomCheckbox({ checked, indeterminate, onChange, id, ariaLabel }: CustomCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={ariaLabel}
      id={id}
      onClick={() => onChange(!checked)}
      className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-200 border cursor-pointer ${
        checked || indeterminate
          ? 'bg-purple-600 border-purple-600 text-white shadow-sm shadow-purple-500/30' 
          : 'bg-card border-border hover:border-purple-400'
      }`}
    >
      {checked && <Check size={13} strokeWidth={3} />}
      {indeterminate && !checked && (
        <div className="w-2.5 h-0.5 bg-white rounded-full" />
      )}
    </button>
  );
}

export default function DoctorDashboardMain() {
  const { user, token } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection & Modal states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    healthRecords: '',
    previousHealthRecords: '',
    currentSymptoms: '',
    prescription: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAcceptedPatients = async () => {
    if (!user && !token) return;
    try {
      setLoading(true);
      const doctorId = user?.id;
      if (!doctorId) return;

      const response = await fetch('/api/doctor-panel/patients', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        console.error('Error fetching patients:', result?.error || 'Unknown error');
        setPatients([]);
        return;
      }

      const formattedList = (result?.data || []).map((pt: any) => ({
        patientId: pt.patientId,
        name: pt.name || 'Unknown Patient',
        age: pt.age || 'N/A',
        gender: pt.gender || 'N/A',
        phone: pt.phone || 'N/A',
        email: pt.email || 'N/A',
        address: pt.address || 'N/A',
        createdAt: pt.createdAt,
      }));

      setPatients(formattedList);
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcceptedPatients();
  }, [user, token]);

  const isAllCurrentSelected = patients.length > 0 && selectedIds.length === patients.length;
  const isSomeCurrentSelected = selectedIds.length > 0 && selectedIds.length < patients.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(patients.map(p => p.patientId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this patient?')) return;

    try {
      const doctorId = user?.id;
      if (!doctorId) return;
      
      // 1. Delete associated medical history records first
      await supabase
        .from('medical_history')
        .delete()
        .in('patient_id', [id]);

      // 2. Delete the patient from the database table
      const { error } = await supabase
        .from('patients')
        .delete()
        .in('id', [id])
        .eq('doctor_id', doctorId);

      if (error) {
        alert('Error deleting patient from database: ' + error.message);
        return;
      }

      setPatients(prev => prev.filter(p => p.patientId !== id));
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    } catch (err) {
      console.error('Delete error:', err);
      alert('An unexpected error occurred while deleting from the database.');
    }
  };

  // Bulk Delete Handler
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected patients?`)) return;

    setIsBulkDeleting(true);
    try {
      const doctorId = user?.id;
      if (!doctorId) return;

      // 1. Delete associated medical history records first
      await supabase
        .from('medical_history')
        .delete()
        .in('patient_id', selectedIds);

      // 2. Delete the patients from the database table
      const { error } = await supabase
        .from('patients')
        .delete()
        .in('id', selectedIds)
        .eq('doctor_id', doctorId);

      if (error) {
        alert('Error bulk deleting patients: ' + error.message);
        return;
      }

      setPatients(prev => prev.filter(p => !selectedIds.includes(p.patientId)));
      setSelectedIds([]);
    } catch (err: any) {
      console.error('Bulk delete error:', err);
      alert('An unexpected error occurred during bulk deletion.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !token) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/doctor-panel/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newPatient.name,
          age: newPatient.age,
          gender: newPatient.gender,
          phone: newPatient.phone,
          email: newPatient.email,
          address: newPatient.address,
          healthRecords: newPatient.healthRecords,
          previousHealthRecords: newPatient.previousHealthRecords,
          currentSymptoms: newPatient.currentSymptoms,
          prescription: newPatient.prescription,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        alert('Error adding patient: ' + (result?.error || 'Unknown error'));
        return;
      }

      setIsAddModalOpen(false);
      setNewPatient({
        name: '',
        age: '',
        gender: 'Male',
        phone: '',
        email: '',
        address: '',
        healthRecords: '',
        previousHealthRecords: '',
        currentSymptoms: '',
        prescription: ''
      });
      await fetchAcceptedPatients();
    } catch (err) {
      console.error('Add patient error:', err);
      alert('An unexpected error occurred while saving patient.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Patients</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all your registered patients and their medical records.</p>
        </div>
        <div className="flex items-center gap-3">
        {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold shadow hover:opacity-95 transition bg-red-600 disabled:opacity-50 text-sm"
            >
              {isBulkDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Delete Selected ({selectedIds.length})
            </button>
          )}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold shadow hover:opacity-95 transition bg-purple-600 text-sm"
          >
            <UserPlus size={18} /> Add Patient
          </button>
        </div>
      </div>

      <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted border-b border-border text-sm text-muted-foreground">
                <th className="py-3 px-4 w-10">
                  {/* 2. CustomCheckbox component called in Header */}
                  <CustomCheckbox
                    checked={isAllCurrentSelected}
                    indeterminate={isSomeCurrentSelected}
                    onChange={handleSelectAll}
                    ariaLabel="Select all"
                  />
                </th>
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Patient Name</th>
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Age / Gender</th>
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Phone</th>
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Email</th>
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Address</th>
                <th className="py-3 px-4 font-semibold whitespace-nowrap text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                    Loading patients...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                    No patients found. Click "Add Patient" to add one.
                  </td>
                </tr>
              ) : (
                patients.map((item) => (
                  <tr key={item.patientId} className="border-b border-border hover:bg-muted/50 text-sm transition">
                    <td className="py-3 px-4">
                      {/* 3. CustomCheckbox component called in each Row */}
                      <CustomCheckbox 
                        checked={selectedIds.includes(item.patientId)}
                        onChange={() => handleSelectOne(item.patientId)}
                        ariaLabel={`Select ${item.name}`}
                      />
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">{item.name}</td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{item.age !== 'N/A' ? `${item.age} yrs` : 'N/A'} / {item.gender}</td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{item.phone}</td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{item.email}</td>
                    <td className="py-3 px-4 text-muted-foreground min-w-50">{item.address}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/dashboard/doctor-panel/patient/${item.patientId}`}
                          title="View / Edit Details"
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.patientId)}
                          title="Delete Patient"
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 shadow-xl relative my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-foreground">Add New Patient</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPatientSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={newPatient.name}
                  onChange={e => setNewPatient({...newPatient, name: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter patient name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Age</label>
                  <input 
                    type="number" 
                    value={newPatient.age}
                    onChange={e => setNewPatient({...newPatient, age: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. 28"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Gender</label>
                  <select 
                    value={newPatient.gender}
                    onChange={e => setNewPatient({...newPatient, gender: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={newPatient.phone}
                    onChange={e => setNewPatient({...newPatient, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Email</label>
                  <input 
                    type="email" 
                    value={newPatient.email}
                    onChange={e => setNewPatient({...newPatient, email: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Address</label>
                <textarea 
                  rows={2}
                  value={newPatient.address}
                  onChange={e => setNewPatient({...newPatient, address: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter full address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Current Symptoms & Problem</label>
                  <textarea 
                    rows={2}
                    value={newPatient.currentSymptoms}
                    onChange={e => setNewPatient({...newPatient, currentSymptoms: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Describe symptoms..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Health Records</label>
                  <textarea 
                    rows={2}
                    value={newPatient.healthRecords}
                    onChange={e => setNewPatient({...newPatient, healthRecords: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Vitals / Reports details..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Previous Health Records</label>
                  <textarea 
                    rows={2}
                    value={newPatient.previousHealthRecords}
                    onChange={e => setNewPatient({...newPatient, previousHealthRecords: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Past medical history..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Write Prescription & Treatment</label>
                  <textarea 
                    rows={2}
                    value={newPatient.prescription}
                    onChange={e => setNewPatient({...newPatient, prescription: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Medicines & dosages..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}