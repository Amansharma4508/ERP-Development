'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client'; // Apne supabase client ka path check kar lein
import { useAuth } from '@/lib/auth-context';
import { Stethoscope, AlertCircle, Check } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DoctorOnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    age: '',
    dob: '',
    experience_years: '',
    consultation_fee: '',
    available_days: [] as string[],
    specialization: 'General Practice',
    license_no: '',
    bio: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDayToggle = (day: string) => {
    setForm((prev) => {
      const days = prev.available_days.includes(day)
        ? prev.available_days.filter((d) => d !== day)
        : [...prev.available_days, day];
      return { ...prev, available_days: days };
    });
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user) return;

  setLoading(true);
  try {
    const { error: dbError } = await supabase.from('doctor_profiles').upsert({
      id: user.id,
      specialization: form.specialization,
      license_no: form.license_no,
      experience_years: parseInt(form.experience_years) || 0,
      consultation_fee: parseFloat(form.consultation_fee) || 0,
      bio: `Name: ${form.name}, Age: ${form.age}, DOB: ${form.dob}, Bio: ${form.bio}`,
      available_slots: { days: form.available_days },
      is_approved: false,
    });

    if (dbError) throw dbError;

    router.push('/pending-approval');
  } catch (err: any) {
    setError(err.message || 'Failed to save doctor details.');
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-xl bg-card rounded-2xl shadow-xl border border-border p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Stethoscope size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Doctor Professional Details</h2>
            <p className="text-muted-foreground text-sm">Please complete your profile to proceed</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground"
                placeholder="Dr. John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Specialization</label>
              <input
                type="text"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground"
                placeholder="Cardiologist"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground"
                placeholder="35"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Date of Birth</label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Experience (Years)</label>
              <input
                type="number"
                value={form.experience_years}
                onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground"
                placeholder="5"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Consultation Fee (₹ per day/visit)</label>
              <input
                type="number"
                value={form.consultation_fee}
                onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground"
                placeholder="500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">License Number</label>
              <input
                type="text"
                value={form.license_no}
                onChange={(e) => setForm({ ...form, license_no: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground"
                placeholder="MED123456"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Appointment Days Available</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const selected = form.available_days.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => handleDayToggle(day)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                      selected ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-border text-muted-foreground'
                    }`}
                  >
                    <span>{day}</span>
                    {selected && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Short Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground"
              placeholder="Tell patients about your background..."
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
          >
            {loading ? 'Submitting Details...' : 'Submit & Request Approval'}
          </button>
        </form>
      </div>
    </div>
  );
}