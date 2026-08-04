'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import {
  CalendarDays, Clock, CheckCircle, XCircle, DollarSign,
  Check, X, Target, Search, Phone, Inbox, FileText, Activity, Droplets, AlertTriangle, Eye, Printer, Filter
} from 'lucide-react';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string | null;
  patientEmail?: string | null;
  specialization: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  notes: string;
  symptoms?: string;
  medicalHistory?: string;
  bloodGroup?: string;
  allergies?: string;
  prescriptionUrls?: string[];
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

  // Health Record Modal State
  const [selectedHealthRecord, setSelectedHealthRecord] = useState<Appointment | null>(null);

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

  const handlePrintRecord = () => {
    window.print();
  };

  // Quick date filter presets
  const setQuickDate = (type: 'today' | 'tomorrow' | 'clear') => {
    const today = new Date();
    if (type === 'clear') {
      setFilterDate('');
      return;
    }
    if (type === 'tomorrow') {
      today.setDate(today.getDate() + 1);
    }
    setFilterDate(today.toISOString().split('T')[0]);
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
    { label: 'Pending / Upcoming', count: appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length, cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400', Icon: Inbox },
    { label: 'Completed', count: appointments.filter(a => a.status === 'completed').length, cls: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400', Icon: Target },
    { label: 'Cancelled / Rejected', count: appointments.filter(a => a.status === 'cancelled' || a.status === 'rejected').length, cls: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400', Icon: XCircle },
    { label: 'Total Appointments', count: appointments.length, cls: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400', Icon: CalendarDays },
  ];

  const STATUS_STYLE: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    confirmed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  };

  const STATUS_HELP: Record<string, string> = {
    pending: 'Awaiting your review — check health record & accept/reject',
    confirmed: 'Confirmed — patient slot scheduled successfully',
    completed: 'Consultation completed successfully',
    cancelled: 'Cancelled by patient or slot expired',
    rejected: 'You rejected this request',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />} {toast.msg}
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointment Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review incoming consultation requests, evaluate patient vitals, and manage your daily clinical schedule.
          </p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(s => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.cls} flex items-center gap-4 shadow-xs border border-border/40`}>
            <div className="p-2.5 rounded-xl bg-white/60 dark:bg-black/20 shadow-xs">
              <s.Icon size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{s.count}</p>
              <p className="text-xs font-medium opacity-80">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Navigation Controls */}
      <div className="bg-card p-4 rounded-2xl border border-border space-y-4 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="flex gap-1 bg-muted p-1 rounded-xl w-full lg:w-fit overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === t.key ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search patient name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-muted/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-muted/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button 
                onClick={() => setQuickDate('today')} 
                className="px-2.5 py-2 rounded-xl border border-border text-xs font-medium bg-muted/50 hover:bg-muted transition"
              >
                Today
              </button>
              {filterDate && (
                <button 
                  onClick={() => setQuickDate('clear')} 
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline px-2 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="animate-pulse bg-muted h-28 rounded-2xl" />)}</div>
      ) : sortedAppointments.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <CalendarDays size={52} className="mx-auto mb-3 opacity-20 text-muted-foreground" />
          <p className="font-semibold text-foreground text-base">No consultation requests match this filter.</p>
          <p className="text-sm text-muted-foreground mt-1">Try switching tabs or resetting your search criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAppointments.map(appt => (
            <div key={appt.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition shadow-xs">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
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
                  
                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2.5 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1.5"><CalendarDays size={13} className="text-indigo-500" /> {appt.date}</span>
                    <span className="flex items-center gap-1.5"><Clock size={13} className="text-indigo-500" /> {appt.time}</span>
                    <span className="flex items-center gap-1.5"><DollarSign size={13} className="text-emerald-500" /> ${appt.consultationFee}</span>
                    {appt.patientPhone && (
                      <span className="flex items-center gap-1.5"><Phone size={13} className="text-blue-500" /> {appt.patientPhone}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/80 mt-1.5 italic">{STATUS_HELP[appt.status]}</p>
                  
                  {/* View Health Record Button */}
                  <div className="mt-3.5">
                    <button
                      onClick={() => setSelectedHealthRecord(appt)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 hover:bg-indigo-100 transition shadow-2xs"
                    >
                      <Eye size={14} /> View Health Record & Vitals
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
                {appt.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction(appt.id, 'confirmed')}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition disabled:opacity-50 shadow-xs cursor-pointer"
                    >
                      <Check size={14} /> Accept
                    </button>
                    <button
                      onClick={() => handleAction(appt.id, 'rejected')}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition disabled:opacity-50 shadow-xs cursor-pointer"
                    >
                      <X size={14} /> Reject
                    </button>
                  </>
                )}
                {appt.status === 'confirmed' && (
                  <button
                    onClick={() => handleAction(appt.id, 'completed')}
                    disabled={!!actionLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition disabled:opacity-50 shadow-xs cursor-pointer"
                  >
                    <Target size={14} /> Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Health Record Modal */}
      {selectedHealthRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl w-full max-w-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Patient Health Record</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedHealthRecord.patientName} • Scheduled for {selectedHealthRecord.date} at {selectedHealthRecord.time}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintRecord}
                  title="Print Health Record"
                  className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition"
                >
                  <Printer size={18} />
                </button>
                <button
                  onClick={() => setSelectedHealthRecord(null)}
                  className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Contact Information Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-muted/40 p-3 rounded-2xl border border-border/50">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase">Phone Contact</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{selectedHealthRecord.patientPhone || 'Not provided'}</p>
                </div>
                <div className="bg-muted/40 p-3 rounded-2xl border border-border/50">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase">Email Address</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{selectedHealthRecord.patientEmail || 'Not provided'}</p>
                </div>
              </div>

              {/* Symptoms */}
              <div className="bg-muted/40 p-4 rounded-2xl border border-border/50">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                  <Activity size={14} /> Symptoms / Chief Complaints
                </p>
                <p className="text-sm text-foreground leading-relaxed">{selectedHealthRecord.symptoms || 'No specific symptoms provided by patient.'}</p>
              </div>

              {/* Medical History */}
              <div className="bg-muted/40 p-4 rounded-2xl border border-border/50">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                  <FileText size={14} /> Past Medical History
                </p>
                <p className="text-sm text-foreground leading-relaxed">{selectedHealthRecord.medicalHistory || 'No prior medical history records logged.'}</p>
              </div>

              {/* Blood Group & Allergies */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/40 p-3.5 rounded-2xl border border-border/50">
                  <p className="text-xs font-semibold text-rose-500 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                    <Droplets size={14} /> Blood Group
                  </p>
                  <p className="text-sm font-bold text-foreground">{selectedHealthRecord.bloodGroup || 'Not specified'}</p>
                </div>
                <div className="bg-muted/40 p-3.5 rounded-2xl border border-border/50">
                  <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                    <AlertTriangle size={14} /> Known Allergies
                  </p>
                  <p className="text-sm font-bold text-foreground">{selectedHealthRecord.allergies || 'None specified'}</p>
                </div>
              </div>

              {/* Attached Documents / Reports Preview Grid */}
              {selectedHealthRecord.prescriptionUrls && selectedHealthRecord.prescriptionUrls.length > 0 ? (
                <div className="bg-muted/40 p-4 rounded-2xl border border-border/50 space-y-3">
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
                    <FileText size={14} /> Attached Reports & Prescriptions ({selectedHealthRecord.prescriptionUrls.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedHealthRecord.prescriptionUrls.map((url, index) => {
                      const isPdf = url.toLowerCase().includes('.pdf');
                      return (
                        <div key={index} className="relative group rounded-xl overflow-hidden border border-border bg-background p-2 flex flex-col items-center justify-between shadow-2xs">
                          {isPdf ? (
                            <div className="w-full h-24 flex flex-col items-center justify-center bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-lg">
                              <FileText size={28} />
                              <span className="text-[10px] font-semibold mt-1">PDF Document</span>
                            </div>
                          ) : (
                            <div className="w-full h-24 relative rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                              <img src={url} alt={`Report ${index + 1}`} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium text-center transition"
                          >
                            View File
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-muted/40 p-4 rounded-2xl border border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-1">
                    <FileText size={14} /> Attached Reports & Prescriptions
                  </p>
                  <p className="text-sm text-muted-foreground italic">No medical files or scanned reports were attached to this booking.</p>
                </div>
              )}

              {/* Additional Notes */}
              {selectedHealthRecord.notes && (
                <div className="bg-muted/40 p-4 rounded-2xl border border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Additional Notes</p>
                  <p className="text-sm italic text-foreground">"{selectedHealthRecord.notes}"</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-3 border-t border-border">
              {selectedHealthRecord.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleAction(selectedHealthRecord.id, 'rejected');
                      setSelectedHealthRecord(null);
                    }}
                    className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition text-center shadow-xs"
                  >
                    Reject Request
                  </button>
                  <button
                    onClick={() => {
                      handleAction(selectedHealthRecord.id, 'confirmed');
                      setSelectedHealthRecord(null);
                    }}
                    className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition text-center shadow-xs"
                  >
                    Accept & Confirm
                  </button>
                </>
              )}
              {selectedHealthRecord.status !== 'pending' && (
                <button
                  onClick={() => setSelectedHealthRecord(null)}
                  className="w-full py-3 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition text-center"
                >
                  Close Record
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}