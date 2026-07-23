'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import { 
  Building2, Plus, X, AlertCircle, CheckCircle, XCircle, Pencil, Trash2, Search, IndianRupee
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
  state?: string;
  supplyStatus: 'active' | 'inactive' | 'suspended';
  amountGiven: number;
  amountUsed: number;
  dueAmount: number;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  suspended: 'bg-red-100 text-red-700 border-red-200',
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
    state: '', 
    amountGiven: '' as string | number,
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
    setForm({ name: '', contactPerson: '', phone: '', hospitalName: '', licenseType: '', state: '', amountGiven: '', categoryName: 'Medical Services' });
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
      state: v.state || '',
      amountGiven: v.amountGiven || 0,
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
    if (!form.state) {
      setFormError('Please select a state.');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      const url = editVendor ? `/api/logistics/vendors/${editVendor.id}` : '/api/logistics/vendors';
      const method = editVendor ? 'PATCH' : 'POST';

      const payload = { 
        ...form, 
        vendorType: 'hospital',
        amountGiven: Number(form.amountGiven) || 0
      };

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

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!token) return;
    try {
      setHospitals(prev => prev.map(v => v.id === id ? { ...v, supplyStatus: newStatus as any } : v));

      const res = await fetch(`/api/logistics/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ supplyStatus: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      showToast('Status updated successfully');
    } catch (err: any) {
      showToast(err.message, 'error');
      fetchHospitals();
    }
  };

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
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || 
                          v.hospitalName?.toLowerCase().includes(search.toLowerCase()) || 
                          v.state?.toLowerCase().includes(search.toLowerCase());
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
            placeholder="Search Hospital Name, State..."
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
                <th className="px-4 py-3 text-left">Vendor & Facility</th>
                <th className="px-4 py-3 text-left">State</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-right">Given (₹)</th>
                <th className="px-4 py-3 text-right">Used (₹)</th>
                <th className="px-4 py-3 text-right">Balance (₹)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">No hospital partners found.</td>
                </tr>
              ) : (
                filtered.map(v => {
                  const balance = (v.amountGiven || 0) - (v.amountUsed || 0);
                  return (
                    <tr key={v.id} className="hover:bg-muted/50 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{v.name}</div>
                        <div className="text-xs text-muted-foreground">{v.hospitalName || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-purple-700">{v.state || 'N/A'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{v.contactPerson} <br />{v.phone}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">₹{v.amountGiven?.toLocaleString() || 0}</td>
                      <td className="px-4 py-3 text-right font-medium text-amber-600">₹{v.amountUsed?.toLocaleString() || 0}</td>
                      <td className={`px-4 py-3 text-right font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        ₹{balance.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={v.supplyStatus}
                          onChange={(e) => handleStatusChange(v.id, e.target.value)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border cursor-pointer outline-none transition ${STATUS_COLOR[v.supplyStatus] || STATUS_COLOR.active}`}
                        >
                          <option value="active" className="bg-white text-emerald-700 font-medium">Active</option>
                          <option value="inactive" className="bg-white text-gray-700 font-medium">Inactive</option>
                          <option value="suspended" className="bg-white text-red-700 font-medium">Suspended</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition" title="Edit">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition" title="Delete">
                          <Trash2 size={13} />
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

      {/* 📝 Onboard/Edit Hospital Modal (Without Used Amount) */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="text-lg font-bold text-foreground">
                {editVendor ? 'Edit Hospital Partner & Funds' : 'Onboard Hospital Partner & Allocate Funds'}
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">State</label>
                <select
                  required
                  value={form.state}
                  onChange={e => setForm({ ...form, state: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 text-foreground"
                >
                  <option value="" disabled>Select State</option>
                  {INDIAN_STATES.map((stateName) => (
                    <option key={stateName} value={stateName}>
                      {stateName}
                    </option>
                  ))}
                </select>
              </div>

              {/* ✅ Amount Given Section Only */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Total Amount Given (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 50000"
                  value={form.amountGiven}
                  onChange={e => setForm({ ...form, amountGiven: e.target.value })}
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