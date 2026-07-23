'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import { 
  Building2, Plus, X, AlertCircle, CheckCircle, XCircle, Pencil, Trash2, Search
} from 'lucide-react';

interface HospitalVendor {
  id: string;
  vendorId: string;
  name: string;
  vendorType: 'hospital';
  categoryName: string;
  contactPerson: string;
  phone: string;
  hospitalName?: string;
  licenseType?: string;
  supplyStatus: 'active' | 'inactive' | 'suspended';
  dueAmount: number;
}

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
};

export default function HospitalNetworkPage() {
  const { token } = useAuth();
  const [hospitals, setHospitals] = useState<HospitalVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editVendor, setEditVendor] = useState<HospitalVendor | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    hospitalName: '',
    licenseType: '',
    categoryName: 'Medical Services',
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchHospitals = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/logistics/vendors?type=hospital', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setHospitals(data.data.filter((v: any) => v.vendorType === 'hospital'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  const openAdd = () => {
    setEditVendor(null);
    setForm({ name: '', contactPerson: '', phone: '', hospitalName: '', licenseType: '', categoryName: 'Medical Services' });
    setFormError('');
    setShowAdd(true);
  };

  const openEdit = (v: HospitalVendor) => {
    setEditVendor(v);
    setForm({
      name: v.name,
      contactPerson: v.contactPerson,
      phone: v.phone,
      hospitalName: v.hospitalName || '',
      licenseType: v.licenseType || '',
      categoryName: v.categoryName || 'Medical Services',
    });
    setFormError('');
    setShowAdd(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setFormError('Authentication token missing. Please relogin.');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      const url = editVendor ? `/api/logistics/vendors/${editVendor.id}` : '/api/logistics/vendors';
      const method = editVendor ? 'PATCH' : 'POST';

      const payload = { ...form, vendorType: 'hospital' };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      showToast(editVendor ? 'Hospital Partner updated' : 'Hospital Partner onboarded');
      setShowAdd(false);
      fetchHospitals();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ✅ Delete Handler Added
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hospital partner?')) return;
    if (!token) {
      showToast('Authentication token missing', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/logistics/vendors/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      showToast('Hospital Partner deleted successfully');
      fetchHospitals();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filtered = hospitals.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.hospitalName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.supplyStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Empaneled Medical Centers</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage affiliations, operational agreements, and medical center onboarding.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold shadow hover:opacity-90 transition bg-purple-600">
          <Plus size={18} /> Onboard Hospital Partner
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search Hospital Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {['all', 'active', 'inactive', 'suspended'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${statusFilter === s ? 'bg-white shadow text-purple-700 font-bold' : 'text-muted-foreground'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-muted-foreground text-xs uppercase font-semibold">
                <th className="px-5 py-3 text-left">Vendor Details</th>
                <th className="px-5 py-3 text-left">Hospital Facility</th>
                <th className="px-5 py-3 text-left">Contact Person</th>
                <th className="px-5 py-3 text-left">License Type</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">No hospital partners found.</td>
                </tr>
              ) : (
                filtered.map(v => (
                  <tr key={v.id} className="hover:bg-muted/50 transition">
                    <td className="px-5 py-3 font-semibold text-foreground">{v.name}</td>
                    <td className="px-5 py-3 text-xs text-foreground font-medium">{v.hospitalName || 'N/A'}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{v.contactPerson} ({v.phone})</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{v.licenseType || 'Standard Hospital'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${STATUS_COLOR[v.supplyStatus]}`}>
                        {v.supplyStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition" title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📝 Onboard/Edit Hospital Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                {editVendor ? 'Edit Hospital Partner' : 'Onboard Hospital Partner (Vendor A)'}
              </h2>
              <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle size={15} />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Vendor Name / Partner Entity</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HealthCare Logistics Pvt Ltd"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Hospital Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. City General Hospital"
                  value={form.hospitalName}
                  onChange={e => setForm({ ...form, hospitalName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="Manager Name"
                    value={form.contactPerson}
                    onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">License / Accreditation Type</label>
                <input
                  type="text"
                  placeholder="e.g. NABH Accredited / State Medical Board"
                  value={form.licenseType}
                  onChange={e => setForm({ ...form, licenseType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}