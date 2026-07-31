'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import {
  Search, Star, X, CheckCircle, CalendarDays, Award,
  DollarSign, FileBadge, Mail, Clock, CreditCard, Wallet, Smartphone,
} from 'lucide-react';

interface Doctor {
  id: string;
  fullName: string;
  email: string;
  licenseNo: string;
  specialization: string;
  consultationFee: number;
  experienceYears: number;
  rating: number;
  reviewsCount: number;
  bio: string;
  availableDays: string[];
}

const DAY_ABBR: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

export default function DoctorsPage() {
  const { token } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');

  // Profile view modal
  const [profileDoctor, setProfileDoctor] = useState<Doctor | null>(null);

  // Booking & Payment Step Modal
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingStep, setBookingStep] = useState<'form' | 'payment'>('form');
  
  // Booking Form Fields
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');

  // Payment Fields
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'wallet'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  
  // Wallet State (Allotted default ₹35,000)
  const [walletBalance, setWalletBalance] = useState<number>(35000);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDoctors = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDoctors(data.data);
      } else {
        showToast(data.error || 'Failed to fetch doctors', 'error');
      }
    } catch (err) {
      showToast('Network error while fetching doctors', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const openBookingFromProfile = (doc: Doctor) => {
    setProfileDoctor(null);
    setSelectedDoctor(doc);
    setBookingStep('form');
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !bookingDate || !bookingTime) {
      showToast('Please select date and time', 'error');
      return;
    }
    setBookingStep('payment');
  };

  const handleFinalConfirmBooking = async () => {
    if (!selectedDoctor) return;

    // Validation based on payment method
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardExpiry || !cardCvv) {
        showToast('Please fill complete card details', 'error');
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId) {
        showToast('Please enter a valid UPI ID', 'error');
        return;
      }
    } else if (paymentMethod === 'wallet') {
      if (walletBalance < selectedDoctor.consultationFee) {
        showToast('Insufficient wallet balance (₹35,000 limit reached/low)', 'error');
        return;
      }
    }

    try {
      setSubmitting(true);

      // If wallet is selected, deduct locally or via API
      if (paymentMethod === 'wallet') {
        setWalletBalance(prev => prev - selectedDoctor.consultationFee);
      }

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          date: bookingDate,
          time: bookingTime,
          notes: bookingNotes,
          paymentMethod,
          amountPaid: selectedDoctor.consultationFee,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book appointment');

      showToast('Appointment and Payment successful!');
      setSelectedDoctor(null);
      setBookingStep('form');
      setBookingDate('');
      setBookingTime('');
      setBookingNotes('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setUpiId('');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const specializations = ['All', 'Cardiology', 'Neurology', 'Dermatology', 'Orthopedics', 'Pediatrics', 'Gynecology'];

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpec = selectedSpecialization === 'All' || doc.specialization.toLowerCase() === selectedSpecialization.toLowerCase();
    return matchesSearch && matchesSpec;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          <CheckCircle size={16} /> {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Find Doctors</h1>
        <p className="text-muted-foreground text-sm mt-1">Browse our network of qualified healthcare professionals</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or specialization..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
        />
      </div>

      {/* Specialization Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {specializations.map(spec => (
          <button
            key={spec}
            onClick={() => setSelectedSpecialization(spec)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap shadow-sm ${selectedSpecialization === spec ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
          >
            {spec}
          </button>
        ))}
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-muted h-96 rounded-2xl" />
          ))}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <CalendarDays size={48} className="mx-auto mb-3 opacity-20 text-muted-foreground" />
          <p className="font-semibold text-foreground">No approved doctors found</p>
          <p className="text-sm text-muted-foreground mt-1">Make sure doctors are approved in database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map(doc => (
            <div key={doc.id} className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    🩺
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{doc.fullName}</h3>
                    <p className="text-sm font-medium text-indigo-600">{doc.specialization}</p>
                    <div className="flex items-center gap-1 text-xs text-amber-500 mt-1">
                      <Star size={14} fill="currentColor" />
                      <span className="font-semibold text-foreground">{doc.rating}</span>
                      <span className="text-muted-foreground">({doc.reviewsCount})</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4 line-clamp-2">
                  {doc.bio || `Specialized in ${doc.specialization} with extensive clinical experience.`}
                </p>

                {/* Stats boxes */}
                <div className="grid grid-cols-3 gap-2 my-5 text-center">
                  <div className="bg-muted/50 p-2.5 rounded-xl border border-border/50">
                    <p className="text-xs text-muted-foreground">Exp</p>
                    <p className="font-bold text-foreground text-sm">{doc.experienceYears}y</p>
                  </div>
                  <div className="bg-muted/50 p-2.5 rounded-xl border border-border/50">
                    <p className="text-xs text-muted-foreground">Fee</p>
                    <p className="font-bold text-foreground text-sm">${doc.consultationFee}</p>
                  </div>
                  <div className="bg-muted/50 p-2.5 rounded-xl border border-border/50">
                    <p className="text-xs text-muted-foreground">Days/wk</p>
                    <p className="font-bold text-foreground text-sm">{doc.availableDays.length}</p>
                  </div>
                </div>

                {/* Available Days pills */}
                {doc.availableDays.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {doc.availableDays.map(day => (
                      <span key={day} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600">
                        <CalendarDays size={11} /> {DAY_ABBR[day] || day}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setProfileDoctor(doc)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted font-medium text-sm transition text-center"
                >
                  View Profile
                </button>
                <button
                  onClick={() => { setSelectedDoctor(doc); setBookingStep('form'); }}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm text-center"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Doctor Profile Modal */}
      {profileDoctor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Doctor Profile</h2>
              <button onClick={() => setProfileDoctor(null)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
                🩺
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">{profileDoctor.fullName}</h3>
                <p className="text-sm font-medium text-indigo-600">{profileDoctor.specialization}</p>
                <div className="flex items-center gap-1 text-xs text-amber-500 mt-1">
                  <Star size={14} fill="currentColor" />
                  <span className="font-semibold text-foreground">{profileDoctor.rating}</span>
                  <span className="text-muted-foreground">· {profileDoctor.reviewsCount} reviews</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {profileDoctor.bio || `Specialized in ${profileDoctor.specialization} with extensive clinical experience.`}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Award size={12} /> Experience</p>
                <p className="font-semibold text-foreground text-sm mt-0.5">{profileDoctor.experienceYears} years</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign size={12} /> Consultation Fee</p>
                <p className="font-semibold text-foreground text-sm mt-0.5">${profileDoctor.consultationFee}</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><FileBadge size={12} /> License</p>
                <p className="font-semibold text-foreground text-sm mt-0.5 truncate">{profileDoctor.licenseNo}</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail size={12} /> Email</p>
                <p className="font-semibold text-foreground text-sm mt-0.5 truncate">{profileDoctor.email}</p>
              </div>
            </div>

            {profileDoctor.availableDays.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Available Days</p>
                <div className="space-y-2">
                  {profileDoctor.availableDays.map(day => (
                    <div key={day} className="flex items-center gap-2 bg-muted/50 p-3 rounded-xl border border-border/50 text-sm">
                      <CalendarDays size={14} className="text-indigo-600" />
                      <span className="text-foreground font-medium">{day}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Clock size={11} /> Exact time slots are confirmed after booking.
                </p>
              </div>
            )}

            <button
              onClick={() => openBookingFromProfile(profileDoctor)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 text-white font-semibold text-sm transition shadow-sm"
            >
              Book Appointment — ${profileDoctor.consultationFee}
            </button>
          </div>
        </div>
      )}

      {/* Booking & Payment Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                {bookingStep === 'form' ? 'Book Appointment' : 'Payment Details'}
              </h2>
              <button onClick={() => setSelectedDoctor(null)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="bg-muted/50 p-3.5 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">🩺</div>
              <div>
                <p className="font-semibold text-foreground text-sm">{selectedDoctor.fullName}</p>
                <p className="text-xs text-indigo-600">{selectedDoctor.specialization} • Fee: ${selectedDoctor.consultationFee}</p>
              </div>
            </div>

            {bookingStep === 'form' ? (
              <form onSubmit={handleProceedToPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Appointment Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setBookingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Appointment Time</label>
                  <input
                    type="time"
                    required
                    value={bookingTime}
                    onChange={e => setBookingTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Notes / Symptoms</label>
                  <textarea
                    rows={3}
                    value={bookingNotes}
                    onChange={e => setBookingNotes(e.target.value)}
                    placeholder="Describe your symptoms..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDoctor(null)}
                    className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Select Payment Method</p>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-medium transition ${paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600' : 'border-border text-muted-foreground hover:border-foreground'}`}
                  >
                    <CreditCard size={18} /> Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-medium transition ${paymentMethod === 'upi' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600' : 'border-border text-muted-foreground hover:border-foreground'}`}
                  >
                    <Smartphone size={18} /> UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-medium transition ${paymentMethod === 'wallet' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600' : 'border-border text-muted-foreground hover:border-foreground'}`}
                  >
                    <Wallet size={18} /> Wallet
                  </button>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-3 bg-muted/40 p-4 rounded-xl border border-border">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Card Number</label>
                      <input
                        type="text"
                        placeholder="4532 •••• •••• 8921"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={e => setCardExpiry(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">CVV</label>
                        <input
                          type="password"
                          placeholder="123"
                          maxLength={4}
                          value={cardCvv}
                          onChange={e => setCardCvv(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div className="space-y-3 bg-muted/40 p-4 rounded-xl border border-border">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">UPI ID</label>
                    <input
                      type="text"
                      placeholder="username@okhdfcbank / ybl"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                )}

                {paymentMethod === 'wallet' && (
                  <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 text-sm space-y-2">
                    <div className="flex justify-between items-center text-foreground font-medium">
                      <span>Allotted Wallet Card</span>
                      <span className="text-indigo-600 font-bold">Active</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Card Connected: <strong>****-****-****-W35K</strong></p>
                    <div className="flex justify-between items-center pt-2 border-t border-indigo-100">
                      <span className="text-xs text-muted-foreground">Available Balance:</span>
                      <span className="font-bold text-emerald-600">₹{walletBalance.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingStep('form')}
                    className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleFinalConfirmBooking}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-50"
                  >
                    {submitting ? 'Processing...' : `Pay $${selectedDoctor.consultationFee} & Confirm`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}