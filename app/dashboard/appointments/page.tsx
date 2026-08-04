'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import {
  CalendarDays, Clock, CheckCircle, XCircle, Plus, DollarSign,
  Ban, Search, Target, FileText, Activity, Droplets, AlertTriangle,
} from 'lucide-react';

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  notes: string;
  consultationFee: number;
  createdAt: string;
  // --- New Health Record Fields ---
  symptoms?: string;
  medicalHistory?: string;
  bloodGroup?: string;
  allergies?: string;
}

export default function MyAppointmentsPage() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'pending' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // State for Health Records modal/form update (if needed)
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthData, setHealthData] = useState({
    symptoms: '',
    medicalHistory: '',
    bloodGroup: '',
    allergies: '',
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAppointments = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/appointments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data);
      } else {
        showToast(data.error || 'Failed to fetch appointments', 'error');
      }
    } catch (err) {
      showToast('Network error while fetching appointments', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCancel = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cancellation failed');

      setAppointments(prev => prev.map(a => (a.id === id ? data.data : a)));
      showToast('Appointment cancelled.');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Handler to update health records for an appointment
  const handleUpdateHealthRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    setActionLoading(selectedAppt.id);

    try {
      const res = await fetch(`/api/appointments/${selectedAppt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(healthData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update health records');

      setAppointments(prev => prev.map(a => (a.id === selectedAppt.id ? data.data : a)));
      showToast('Health records updated successfully.');
      setShowHealthModal(false);
      setSelectedAppt(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAppointments = appointments.filter(appt => {
    if (activeTab === 'pending' && appt.status !== 'pending') return false;
    if (activeTab === 'completed' && appt.status !== 'completed') return false;
    if (activeTab === 'cancelled' && appt.status !== 'cancelled' && appt.status !== 'rejected') return false;
    if (activeTab === 'upcoming') {
      const isUpcoming = appt.status === 'confirmed' && new Date(appt.date) >= new Date(new Date().toDateString());
      if (!isUpcoming) return false;
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      if (!appt.doctorName?.toLowerCase().includes(q)) return false;
    }

    if (filterDate && appt.date !== filterDate) return false;

    return true;
  });

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const summaryCards = [
    { label: 'Total', count: appointments.length, cls: 'bg-indigo-50 text-indigo-700', Icon: CalendarDays },
    { label: 'Pending', count: appointments.filter(a => a.status === 'pending').length, cls: 'bg-amber-50 text-amber-700', Icon: Clock },
    { label: 'Confirmed', count: appointments.filter(a => a.status === 'confirmed').length, cls: 'bg-emerald-50 text-emerald-700', Icon: CheckCircle },
    { label: 'Completed', count: appointments.filter(a => a.status === 'completed').length, cls: 'bg-blue-50 text-blue-700', Icon: Target },
  ];

  const STATUS_STYLE: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-emerald-100 text-emerald-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-rose-100 text-rose-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const STATUS_HELP: Record<string, string> = {
    pending: 'Waiting for doctor to confirm',
    confirmed: 'Doctor has confirmed this appointment',
    completed: 'Consultation completed',
    cancelled: 'You cancelled this appointment',
    rejected: 'Doctor was unable to accept this slot',
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />} {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Appointments</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your booked medical consultations and health records.</p>
        </div>
        <a
          href="/dashboard/doctors"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm"
        >
          <Plus size={16} /> Book New Appointment
        </a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.cls} flex items-center gap-3 shadow-sm`}>
            <s.Icon size={24} />
            <div>
              <p className="text-2xl font-bold">{s.count}</p>
              <p className="text-xs font-medium opacity-75">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card p-4 rounded-2xl border border-border space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex gap-1 bg-muted p-1 rounded-xl w-full md:w-fit overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === t.key ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search doctor name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {filterDate && (
              <button onClick={() => setFilterDate('')} className="text-xs text-indigo-600 hover:underline px-2">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="animate-pulse bg-muted h-32 rounded-2xl" />)}</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <CalendarDays size={48} className="mx-auto mb-3 opacity-20 text-muted-foreground" />
          <p className="font-semibold text-foreground">No appointments found</p>
          <p className="text-sm text-muted-foreground mt-1">You have no appointments matching this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map(appt => (
            <div key={appt.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-indigo-200 transition shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-50 text-indigo-600">
                    <CalendarDays size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground text-base">Dr. {appt.doctorName}</p>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_STYLE[appt.status] || 'bg-gray-100 text-gray-800'}`}>
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{appt.specialization || 'General Consultation'}</p>
                    
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarDays size={13} /> {appt.date}</span>
                      <span className="flex items-center gap-1"><Clock size={13} /> {appt.time}</span>
                      <span className="flex items-center gap-1"><DollarSign size={13} /> ${appt.consultationFee}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">{STATUS_HELP[appt.status]}</p>
                    {appt.notes && <p className="text-xs text-muted-foreground mt-1 italic">Notes: "{appt.notes}"</p>}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex sm:flex-col gap-2 flex-shrink-0">
                  {(appt.status === 'pending' || appt.status === 'confirmed') && (
                    <button
                      onClick={() => handleCancel(appt.id)}
                      disabled={!!actionLoading}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium transition disabled:opacity-50"
                    >
                      <Ban size={14} /> Cancel
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedAppt(appt);
                      setHealthData({
                        symptoms: appt.symptoms || '',
                        medicalHistory: appt.medicalHistory || '',
                        bloodGroup: appt.bloodGroup || '',
                        allergies: appt.allergies || '',
                      });
                      setShowHealthModal(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-sm font-medium transition"
                  >
                    <FileText size={14} /> {appt.symptoms ? 'Edit Health Info' : 'Add Health Info'}
                  </button>
                </div>
              </div>

              {/* Health Records Section Inside Card */}
              {(appt.symptoms || appt.medicalHistory || appt.bloodGroup || appt.allergies) && (
                <div className="mt-2 pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-muted/50 p-3 rounded-xl text-xs">
                  <div>
                    <span className="font-semibold flex items-center gap-1 text-foreground mb-0.5"><Activity size={13} className="text-indigo-600" /> Symptoms:</span>
                    <span className="text-muted-foreground">{appt.symptoms || 'None specified'}</span>
                  </div>
                  <div>
                    <span className="font-semibold flex items-center gap-1 text-foreground mb-0.5"><FileText size={13} className="text-indigo-600" /> Medical History:</span>
                    <span className="text-muted-foreground">{appt.medicalHistory || 'None specified'}</span>
                  </div>
                  <div>
                    <span className="font-semibold flex items-center gap-1 text-foreground mb-0.5"><Droplets size={13} className="text-red-500" /> Blood Group:</span>
                    <span className="text-muted-foreground">{appt.bloodGroup || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-semibold flex items-center gap-1 text-foreground mb-0.5"><AlertTriangle size={13} className="text-amber-500" /> Allergies:</span>
                    <span className="text-muted-foreground">{appt.allergies || 'None specified'}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Health Info Modal */}
      {showHealthModal && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground">Health Records / Details</h3>
              <button onClick={() => setShowHealthModal(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle size={20} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Provide relevant health information for Dr. {selectedAppt.doctorName}.</p>

            <form onSubmit={handleUpdateHealthRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Symptoms / Chief Complaints</label>
                <textarea
                  rows={2}
                  value={healthData.symptoms}
                  onChange={e => setHealthData({ ...healthData, symptoms: e.target.value })}
                  placeholder="e.g., Fever, headache for 2 days..."
                  className="w-full p-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Medical History</label>
                <textarea
                  rows={2}
                  value={healthData.medicalHistory}
                  onChange={e => setHealthData({ ...healthData, medicalHistory: e.target.value })}
                  placeholder="e.g., Hypertension, diabetes, past surgeries..."
                  className="w-full p-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Blood Group</label>
                  <select
                    value={healthData.bloodGroup}
                    onChange={e => setHealthData({ ...healthData, bloodGroup: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Allergies</label>
                  <input
                    type="text"
                    value={healthData.allergies}
                    onChange={e => setHealthData({ ...healthData, allergies: e.target.value })}
                    placeholder="e.g., Penicillin, dust..."
                    className="w-full p-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHealthModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:bg-muted text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === selectedAppt.id}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-50"
                >
                  {actionLoading === selectedAppt.id ? 'Saving...' : 'Save Health Info'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}