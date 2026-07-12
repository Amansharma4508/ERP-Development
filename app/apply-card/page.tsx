'use client';

import { useMemo, useState } from 'react';

const initialForm = {
  fullName: '',
  fatherName: '',
  motherName: '',
  email: '',
  password: '',
  dob: '',
  gender: 'female',
  qualification: '',
  familyMembersCount: '',
  maleCount: '',
  femaleCount: '',
  headOfFamily: '',
  spouseName: '',
  houseNumber: '',
  wardNumber: '',
  villageCity: '',
  gramPanchayat: '',
  block: '',
  district: '',
  state: '',
  pinCode: '',
  uidNumber: '',
  panCard: '',
  addressId: '',
  bloodGroup: '',
  foodIntake: 'vegetarian',
  smoking: 'regular',
  alcoholConsumption: 'regular',
  occupation: '',
  medicalExpensesMonthly: '',
  drinkingWaterSource: '',
  foodSource: '',
  pollutionLevel: '',
  livePhotoUrl: '',
  applicationDate: new Date().toISOString().slice(0, 10),
  place: '',
  time: new Date().toISOString().slice(11, 16),
  coordinatorId: '',
  fieldOfficerId: '',
  areaCode: '',
  vendingId: '',
  consentGiven: false,
  centerAssigned: 'S1',
};

export default function ApplyCardPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      form.fullName.trim() !== '' &&
      form.email.trim() !== '' &&
      form.password.trim().length >= 6 &&
      form.district.trim() !== '' &&
      form.state.trim() !== '' &&
      form.pinCode.trim().length >= 4 &&
      form.consentGiven
    );
  }, [form]);

  const handleChange = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!canSubmit) {
      setError('Please complete the required form fields and consent.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          role: 'wallet_user',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || 'Unable to submit application.');
      } else {
        setMessage('Card application submitted successfully. Check email for next steps.');
        setForm(initialForm);
      }
    } catch (err) {
      setError('Network error submitting form.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">SWAB Card Application</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Apply for your Government SWAB Health Card</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Fill in the details below to request your card. Once approved, the card will be created with ₹35,000 credit automatically.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-sm font-semibold text-slate-900">Required details</h2>
              <p className="mt-2 text-sm text-slate-600">Complete the applicant and address details.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-sm font-semibold text-slate-900">Card & center</h2>
              <p className="mt-2 text-sm text-slate-600">The card will use the center code and PIN-based series format.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Applicant Information</h2>
                <p className="text-sm text-slate-600">Basic fields required for SWAB card issuance.</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Required fields marked *</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: 'Full Name *', key: 'fullName', type: 'text' },
                { label: 'Father’s Name *', key: 'fatherName', type: 'text' },
                { label: 'Mother’s Name *', key: 'motherName', type: 'text' },
                { label: 'Date of Birth', key: 'dob', type: 'date' },
                { label: 'Gender *', key: 'gender', type: 'select', options: ['female', 'male', 'other'] },
                { label: 'Qualification', key: 'qualification', type: 'text' },
                { label: 'Email *', key: 'email', type: 'email' },
                { label: 'Password *', key: 'password', type: 'password' },
              ].map((field) => (
                <label key={field.key} className="block">
                  <span className="text-sm font-medium text-slate-700">{field.label}</span>
                  {field.type === 'select' ? (
                    <select
                      value={(form as any)[field.key]}
                      onChange={(event) => handleChange(field.key, event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    >
                      {field.options?.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={(form as any)[field.key]}
                      onChange={(event) => handleChange(field.key, event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  )}
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Family & Household</h2>
              <p className="text-sm text-slate-600">Optional details for household eligibility and family profiling.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">No. of family members</span>
                <input
                  type="number"
                  min="0"
                  value={form.familyMembersCount}
                  onChange={(event) => handleChange('familyMembersCount', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">No. of male members</span>
                <input
                  type="number"
                  min="0"
                  value={form.maleCount}
                  onChange={(event) => handleChange('maleCount', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">No. of female members</span>
                <input
                  type="number"
                  min="0"
                  value={form.femaleCount}
                  onChange={(event) => handleChange('femaleCount', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2 mt-4">
              {[
                { label: 'Head of Family', key: 'headOfFamily' },
                { label: 'Spouse Name', key: 'spouseName' },
                { label: 'UID Number', key: 'uidNumber' },
                { label: 'PAN Card', key: 'panCard' },
              ].map((field) => (
                <label key={field.key} className="block">
                  <span className="text-sm font-medium text-slate-700">{field.label}</span>
                  <input
                    type="text"
                    value={(form as any)[field.key]}
                    onChange={(event) => handleChange(field.key, event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Address & Center</h2>
              <p className="text-sm text-slate-600">Where the applicant lives and which center the card is issued for.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: 'House Name/No.', key: 'houseNumber' },
                { label: 'Ward No.', key: 'wardNumber' },
                { label: 'Village/Town/City', key: 'villageCity' },
                { label: 'Gram Panchayat / Nagar / Halka', key: 'gramPanchayat' },
                { label: 'Block / Tehsil / Taluka', key: 'block' },
                { label: 'District *', key: 'district' },
                { label: 'State *', key: 'state' },
                { label: 'PIN Code *', key: 'pinCode' },
              ].map((field) => (
                <label key={field.key} className="block">
                  <span className="text-sm font-medium text-slate-700">{field.label}</span>
                  <input
                    type={field.key === 'pinCode' ? 'text' : 'text'}
                    value={(form as any)[field.key]}
                    onChange={(event) => handleChange(field.key, event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
              ))}
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Center Assigned *</span>
                <select
                  value={form.centerAssigned}
                  onChange={(event) => handleChange('centerAssigned', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                >
                  {['S1', 'S2', 'S3', 'DHS'].map((center) => (
                    <option key={center} value={center}>{center}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Health & Lifestyle</h2>
              <p className="text-sm text-slate-600">Optional profile details for the welfare scheme.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Blood Group</span>
                <input
                  type="text"
                  value={form.bloodGroup}
                  onChange={(event) => handleChange('bloodGroup', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Food Intake</span>
                <select
                  value={form.foodIntake}
                  onChange={(event) => handleChange('foodIntake', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                >
                  {['vegetarian', 'non_vegetarian', 'vegan'].map((option) => (
                    <option key={option} value={option}>{option.replace('_', ' ')}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Smoking</span>
                <select
                  value={form.smoking}
                  onChange={(event) => handleChange('smoking', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                >
                  {['regular', 'irregular', 'party'].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mt-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Alcohol Consumption</span>
                <select
                  value={form.alcoholConsumption}
                  onChange={(event) => handleChange('alcoholConsumption', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                >
                  {['regular', 'irregular', 'party'].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Occupation</span>
                <input
                  type="text"
                  value={form.occupation}
                  onChange={(event) => handleChange('occupation', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Medical expenses monthly</span>
                <input
                  type="number"
                  min="0"
                  value={form.medicalExpensesMonthly}
                  onChange={(event) => handleChange('medicalExpensesMonthly', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Field & verification details</h2>
              <p className="text-sm text-slate-600">Use this section to capture coordinator and field officer metadata.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: 'Application Date', key: 'applicationDate', type: 'date' },
                { label: 'Place', key: 'place' },
                { label: 'Time', key: 'time', type: 'time' },
                { label: 'Coordinator ID', key: 'coordinatorId' },
                { label: 'Field Officer ID', key: 'fieldOfficerId' },
                { label: 'Area Code', key: 'areaCode' },
                { label: 'Vending ID', key: 'vendingId' },
                { label: 'Drinking water source', key: 'drinkingWaterSource' },
                { label: 'Source of food', key: 'foodSource' },
                { label: 'Level of pollution', key: 'pollutionLevel' },
                { label: 'Live photo URL', key: 'livePhotoUrl' },
              ].map((field) => (
                <label key={field.key} className="block">
                  <span className="text-sm font-medium text-slate-700">{field.label}</span>
                  <input
                    type={field.type || 'text'}
                    value={(form as any)[field.key]}
                    onChange={(event) => handleChange(field.key, event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Consent</h2>
                <p className="text-sm text-slate-600">Applicant must agree to data collection and card creation terms.</p>
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.consentGiven}
                  onChange={(event) => handleChange('consentGiven', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-slate-700">I consent to data collection for SWAB card processing.</span>
              </label>
            </div>
          </section>

          {error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">{error}</div>
          )}
          {message && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-sm text-emerald-700">{message}</div>
          )}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="inline-flex items-center justify-center rounded-3xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? 'Submitting...' : 'Submit Card Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
