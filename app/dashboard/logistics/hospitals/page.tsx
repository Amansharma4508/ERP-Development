'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Building2, Plus, X, AlertCircle, CheckCircle, XCircle, Pencil, Trash2, Search, Eye, Download, MapPin, Phone, ChevronLeft, ChevronRight, Stethoscope 
} from 'lucide-react';
import HospitalModal from '@/components/HospitalModal';
import HospitalEditModal from '@/components/HospitalEditModal';

interface DoctorInfo {
  name: string;
  profession: string;
  experience?: string;
  fees?: string | number;
}

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
  location?: string;
  totalAmbulances?: number;
  doctorsData?: DoctorInfo[];
  totalStaff?: number;
  hospitalImages?: string[];
  supplyStatus: 'active' | 'inactive' | 'suspended';
  amountGiven: number;
  amountUsed: number;
  dueAmount: number;
}

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  suspended: 'bg-red-100 text-red-700 border-red-200',
};

const ITEMS_PER_PAGE = 20;
const API_ENDPOINT = '/api/logistics/vendors';

export default function HospitalNetworkPage() {
  const { token } = useAuth();
  const [hospitals, setHospitals] = useState<HospitalVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [viewHospital, setViewHospital] = useState<HospitalVendor | null>(null);
  const [editVendor, setEditVendor] = useState<HospitalVendor | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchHospitals = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_ENDPOINT}?type=hospital`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("API Full Response:", data);
      
      if (data.success && Array.isArray(data.data)) {
        const formattedData: HospitalVendor[] = data.data
          .filter((v: any) => v.vendorType === 'hospital' || v.type === 'hospital')
          .map((v: any) => {
            const rawDoctors = v.doctorsData || v.doctors_data || v.doctors || v.doctor_list || v.staff_doctors || v.staff;
            let parsedDoctors: DoctorInfo[] = [];

            if (Array.isArray(rawDoctors)) {
              parsedDoctors = rawDoctors.map((doc: any) => ({
                name: doc.name || doc.doctorName || doc.doctor_name || 'Unknown Doctor',
                profession: doc.profession || doc.specialization || doc.speciality || 'General',
                experience: doc.experience || doc.exp || '',
                fees: doc.fees || doc.fee || doc.consultationFee || ''
              }));
            } else if (typeof rawDoctors === 'string') {
              try {
                const parsed = JSON.parse(rawDoctors);
                if (Array.isArray(parsed)) {
                  parsedDoctors = parsed.map((doc: any) => ({
                    name: doc.name || doc.doctorName || 'Unknown Doctor',
                    profession: doc.profession || doc.specialization || 'General',
                    experience: doc.experience || '',
                    fees: doc.fees || ''
                  }));
                }
              } catch (e) {
                parsedDoctors = [];
              }
            }

            return {
              id: v.id || v._id,
              vendorId: v.vendorId || v.id,
              name: v.name || 'Unnamed Vendor',
              vendorType: 'hospital',
              categoryName: v.categoryName || 'General',
              contactPerson: v.contactPerson || v.contact || 'N/A',
              phone: v.phone || v.mobile || 'N/A',
              hospitalName: v.hospitalName || v.facilityName,
              licenseType: v.licenseType || 'Standard',
              state: v.state || v.locationState || 'N/A',
              location: v.location || v.address || '',
              totalAmbulances: v.totalAmbulances || v.ambulancesCount || 0,
              doctorsData: parsedDoctors,
              totalStaff: v.totalStaff || v.staffCount || 0,
              hospitalImages: v.hospitalImages || v.images || [],
              supplyStatus: v.supplyStatus || v.status || 'active',
              amountGiven: Number(v.amountGiven || v.given || 0),
              amountUsed: Number(v.amountUsed || v.used || 0),
              dueAmount: Number(v.dueAmount || v.due || 0),
            };
          });

        setHospitals(formattedData);
      }
    } catch (e) {
      console.error('Failed to fetch hospital network:', e);
      showToast('Failed to load hospital partners', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const openAdd = () => {
    setEditVendor(null);
    setShowAdd(true);
  };

  const openEdit = (v: HospitalVendor) => {
    setEditVendor(v);
    setShowAdd(true);
  };

  const handleSaveHospital = async (payload: any) => {
    if (!token) {
      throw new Error('Authentication token missing. Please relogin.');
    }
    const url = editVendor ? `${API_ENDPOINT}/${editVendor.id}` : API_ENDPOINT;
    const method = editVendor ? 'PATCH' : 'POST';

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
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!token) return;
    try {
      setHospitals(prev => prev.map(v => v.id === id ? { ...v, supplyStatus: newStatus as any } : v));

      const res = await fetch(`${API_ENDPOINT}/${id}`, {
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
      const res = await fetch(`${API_ENDPOINT}/${id}`, {
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

  const handleExport = async () => {
    try {
      const response = await fetch(`${API_ENDPOINT}/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hospital_vendors.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      showToast('Failed to export PDF', 'error');
    }
  };

  const filtered = useMemo(() => {
    return hospitals.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || 
                            v.hospitalName?.toLowerCase().includes(search.toLowerCase()) || 
                            v.state?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || v.supplyStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [hospitals, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-foreground font-semibold shadow-sm hover:bg-muted transition text-sm">
            <Download size={16} /> Export PDF
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold shadow hover:opacity-90 transition bg-purple-600 text-sm">
            <Plus size={18} /> Onboard Hospital Partner
          </button>
        </div>
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
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1150px] text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted text-muted-foreground text-xs uppercase font-semibold">
                <th className="px-4 py-3 whitespace-nowrap w-16">Sr. No.</th>
                <th className="px-4 py-3 whitespace-nowrap">Vendor & Facility</th>
                <th className="px-4 py-3 whitespace-nowrap">State</th>
                <th className="px-4 py-3 whitespace-nowrap">Contact</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Given (₹)</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Used (₹)</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Balance (₹)</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">Loading hospital partners...</td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">No hospital partners found.</td>
                </tr>
              ) : (
                currentItems.map((v, index) => {
                  const balance = (v.amountGiven || 0) - (v.amountUsed || 0);
                  const serialNumber = startIndex + index + 1;
                  return (
                    <tr key={v.id} className="hover:bg-muted/50 transition">
                      <td className="px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {serialNumber < 10 ? `0${serialNumber}` : serialNumber}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-foreground">{v.name}</div>
                        <div className="text-xs text-muted-foreground">{v.hospitalName || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-purple-700 whitespace-nowrap">{v.state || 'N/A'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{v.contactPerson} ({v.phone})</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground whitespace-nowrap">₹{v.amountGiven?.toLocaleString() || 0}</td>
                      <td className="px-4 py-3 text-right font-medium text-amber-600 whitespace-nowrap">₹{v.amountUsed?.toLocaleString() || 0}</td>
                      <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        ₹{balance.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
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
                      <td className="px-4 py-3 text-center whitespace-nowrap flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => setViewHospital(v)} 
                          className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition" 
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition" title="Delete">
                          <Trash2 size={14} />
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

  {/* View Modal */}
  <HospitalModal 
    isOpen={!!viewHospital} 
    onClose={() => setViewHospital(null)} 
    hospital={viewHospital} 
    onExport={handleExport}
  />

  {/* Edit / Add Modal - Yahan teeno props pass kar dein taaki empty na aaye */}
  {showAdd && (
    <HospitalEditModal 
      isOpen={showAdd}
      onClose={() => setShowAdd(false)}
      onSave={handleSaveHospital}
      editData={editVendor}
      initialData={editVendor}
      hospital={editVendor}
    />
  )}
</div>
  );
}