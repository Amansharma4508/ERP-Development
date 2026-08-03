'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import {
  CalendarDays, Clock, CheckCircle, XCircle, DollarSign,
  Check, X, Target, Search, Phone, Inbox,
} from 'lucide-react';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string | null;
  specialization: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  notes: string;
  consultationFee: number;
  createdAt: string;
}

export default function DoctorAppointmentsPage() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'pendingUpcoming' | 'completed' | 'cancelled' | 'all'>('pendingUpcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

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

  const handleAction = async (id: string, status: string) => {
    setActionLoading(id + status);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'status', status }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          showToast(data.error, 'error');
          fetchAppointments();
          return;
        }
        throw new Error(data.error || 'Action failed');
      }

      setAppointments(prev => prev.map(a => (a.id === id ? data.data : a)));
      showToast(
        status === 'confirmed' ? 'Appointment confirmed & patient data synced.' :
        status === 'rejected' ? 'Appointment rejected.' :
        'Marked as completed.'
      );
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAppointments = appointments.filter(appt => {
    if (activeTab === 'pendingUpcoming' && appt.status !== 'pending' && appt.status !== 'confirmed') return false;
    if (activeTab === 'completed' && appt.status !== 'completed') return false;
    if (activeTab === 'cancelled' && appt.status !== 'cancelled' && appt.status !== 'rejected') return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      if (!appt.patientName?.toLowerCase().includes(q)) return false;
    }

    if (filterDate && appt.date !== filterDate) return false;

    return true;
  });

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    if (activeTab === 'pendingUpcoming') {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
    }
    return 0;
  });

  const tabs = [
    { key: 'pendingUpcoming', label: 'Pending / Upcoming' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled / Rejected' },
    { key: 'all', label: 'All History' },
  ];

  const summaryCards = [
    { label: 'Pending / Upcoming', count: appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length, cls: 'bg-amber-50 text-amber-700', Icon: Inbox },
    { label: 'Completed', count: appointments.filter(a => a.status === 'completed').length, cls: 'bg-blue-50 text-blue-700', Icon: Target },
    { label: 'Cancelled / Rejected', count: appointments.filter(a => a.status === 'cancelled' || a.status === 'rejected').length, cls: 'bg-rose-50 text-rose-700', Icon: XCircle },
    { label: 'Total', count: appointments.length, cls: 'bg-indigo-50 text-indigo-700', Icon: CalendarDays },
  ];

  const STATUS_STYLE: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-emerald-100 text-emerald-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-rose-100 text-rose-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const STATUS_HELP: Record<string, string> = {
    pending: 'Awaiting your response — accept or reject before the slot passes',
    confirmed: 'Confirmed — patient synced to dashboard & will auto-move to Completed after visit',
    completed: 'Consultation completed',
    cancelled: 'Cancelled (patient cancelled, or slot expired without your response)',
    rejected: 'You rejected this request',
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />} {toast.msg}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-foreground">Appointment Requests</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review incoming consultation requests and manage your patient schedule.
        </p>
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
                placeholder="Search patient name..."
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
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="animate-pulse bg-muted h-24 rounded-2xl" />)}</div>
      ) : sortedAppointments.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <CalendarDays size={48} className="mx-auto mb-3 opacity-20 text-muted-foreground" />
          <p className="font-semibold text-foreground">No consultation requests match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAppointments.map(appt => (
            <div key={appt.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-indigo-200 transition shadow-sm">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-50 text-indigo-600">
                  <CalendarDays size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground text-base">{appt.patientName}</p>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_STYLE[appt.status] || 'bg-gray-100 text-gray-800'}`}>
                      {appt.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{appt.specialization || 'General Consultation'}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays size={13} /> {appt.date}</span>
                    <span className="flex items-center gap-1"><Clock size={13} /> {appt.time}</span>
                    <span className="flex items-center gap-1"><DollarSign size={13} /> ${appt.consultationFee}</span>
                    {appt.patientPhone && (
                      <span className="flex items-center gap-1"><Phone size={13} /> {appt.patientPhone}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{STATUS_HELP[appt.status]}</p>
                  {appt.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{appt.notes}"</p>}
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                {appt.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction(appt.id, 'confirmed')}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition disabled:opacity-50 shadow-sm"
                    >
                      <Check size={14} /> Accept
                    </button>
                    <button
                      onClick={() => handleAction(appt.id, 'rejected')}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-50 shadow-sm"
                    >
                      <X size={14} /> Reject
                    </button>
                  </>
                )}
                {appt.status === 'confirmed' && (
                  <button
                    onClick={() => handleAction(appt.id, 'completed')}
                    disabled={!!actionLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition disabled:opacity-50 shadow-sm"
                  >
                    <Target size={14} /> Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}