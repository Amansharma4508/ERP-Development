'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import { Search, Eye, Trash2, CheckCircle, ShieldCheck, ShieldAlert, X } from 'lucide-react';
import CustomCheckbox from '@/components/CustomCheckbox'; // Aapka reusable component

interface DoctorAdmin {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  licenseNo: string;
  experienceYears: number;
  consultationFee: number;
  rating: number;
  reviewsCount: number;
  bio: string;
  isApproved: boolean;
  isBlocked: boolean;
  createdAt: string;
}

export default function AdminDoctorsPage() {
  const { token } = useAuth();
  const [doctors, setDoctors] = useState<DoctorAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection State for Checkboxes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // View Details & Reject Modal States
  const [viewDoctor, setViewDoctor] = useState<DoctorAdmin | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDoctors = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/admin/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDoctors(data.data);
      } else {
        showToast(data.error || 'Failed to fetch doctors', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleUpdateStatus = async (doctorId: string, isApproved: boolean) => {
    try {
      const res = await fetch('/api/admin/doctors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ doctorId, isApproved }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      setDoctors(prev => prev.map(doc => doc.id === doctorId ? { ...doc, isApproved } : doc));
      showToast(`Doctor ${isApproved ? 'Approved' : 'Rejected'} successfully.`);
      setViewDoctor(null);
      setShowRejectInput(false);
      setRejectReason('');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (doctorId: string) => {
    if (!confirm('Are you sure you want to delete this doctor profile?')) return;
    try {
      const res = await fetch(`/api/admin/doctors?id=${doctorId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      setDoctors(prev => prev.filter(doc => doc.id !== doctorId));
      setSelectedIds(prev => prev.filter(id => id !== doctorId));
      showToast('Doctor deleted successfully.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Bulk Delete Handler
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected doctor(s)?`)) return;

    try {
      // Loop or send bulk IDs to backend based on your API setup
      for (const id of selectedIds) {
        await fetch(`/api/admin/doctors?id=${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setDoctors(prev => prev.filter(doc => !selectedIds.includes(doc.id)));
      setSelectedIds([]);
      showToast('Selected doctors deleted successfully.');
    } catch (err: any) {
      showToast('Failed to delete selected doctors', 'error');
    }
  };

  // Checkbox Selection Logic
  const filteredDoctors = doctors.filter(doc => 
    doc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAllSelected = filteredDoctors.length > 0 && filteredDoctors.every(doc => selectedIds.includes(doc.id));
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDoctors.map(doc => doc.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          <CheckCircle size={16} /> {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Doctors</h1>
          <p className="text-muted-foreground text-sm mt-1">Verify credentials, approve, or reject doctor registrations.</p>
        </div>
        {selectedIds.length > 0 && (
          <button 
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
          >
            <Trash2 size={16} /> Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search by name, email, specialization..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                <th className="p-4 w-10">
                  <CustomCheckbox 
                    checked={isAllSelected}
                    indeterminate={isSomeSelected}
                    onChange={handleSelectAll}
                    ariaLabel="Select all doctors"
                  />
                </th>
                <th className="p-4">Doctor Name</th>
                <th className="p-4">Specialization</th>
                <th className="p-4">Experience & Fee</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading doctors...</td></tr>
              ) : filteredDoctors.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No doctors found.</td></tr>
              ) : (
                filteredDoctors.map(doc => {
                  const isSelected = selectedIds.includes(doc.id);
                  return (
                    <tr key={doc.id} className={`hover:bg-muted/30 transition ${isSelected ? 'bg-muted/40' : ''}`}>
                      <td className="p-4">
                        <CustomCheckbox 
                          checked={isSelected}
                          onChange={() => handleSelectOne(doc.id)}
                          ariaLabel={`Select ${doc.fullName}`}
                        />
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-foreground">{doc.fullName}</p>
                        <p className="text-xs text-muted-foreground">{doc.email} • {doc.phone}</p>
                      </td>
                      <td className="p-4 text-foreground font-medium">{doc.specialization}</td>
                      <td className="p-4">
                        <p className="text-foreground">{doc.experienceYears} Years</p>
                        <p className="text-xs text-muted-foreground">${doc.consultationFee} / consult</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${doc.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {doc.isApproved ? <ShieldCheck size={14} /> : <ShieldAlert size5={14} />}
                          {doc.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button 
                          onClick={() => setViewDoctor(doc)} 
                          className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.id)} 
                          className="p-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition"
                          title="Delete Doctor"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal remains same as your code */}
      {viewDoctor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">{viewDoctor.fullName}</h2>
                <p className="text-xs text-indigo-600 font-medium">{viewDoctor.specialization}</p>
              </div>
              <button onClick={() => { setViewDoctor(null); setShowRejectInput(false); }} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-semibold text-foreground truncate">{viewDoctor.email}</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-semibold text-foreground">{viewDoctor.phone || 'N/A'}</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
                <p className="text-xs text-muted-foreground">License No</p>
                <p className="font-semibold text-foreground">{viewDoctor.licenseNo || 'N/A'}</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
                <p className="text-xs text-muted-foreground">Experience & Fee</p>
                <p className="font-semibold text-foreground">{viewDoctor.experienceYears} yrs | ${viewDoctor.consultationFee}</p>
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Biography / About</p>
              <p className="text-sm text-foreground italic">{viewDoctor.bio || 'No bio provided.'}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button 
                onClick={() => handleUpdateStatus(viewDoctor.id, false)}
                className="px-4 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 text-sm font-medium transition"
              >
                Reject
              </button>
              <button 
                onClick={() => handleUpdateStatus(viewDoctor.id, true)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition shadow-sm"
              >
                Approve Doctor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}