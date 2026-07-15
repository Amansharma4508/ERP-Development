'use client';

import { useState } from 'react';
import { Camera, CheckCircle, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type FamilyMember = {
  name: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  relationship: string;
  uid: string;
};

const createEmptyFamilyMember = (): FamilyMember => ({
  name: '',
  dob: '',
  gender: 'male',
  relationship: '',
  uid: '',
});

const initialDate = () => new Date().toISOString().split('T')[0];
const initialTime = () => new Date().toLocaleTimeString('en-GB', { hour12: false });

export default function WalletOnboardingForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const { setWalletOnboardingStatus, user } = useAuth(); // user को भी निकाल लिया
  
  // फोटो की एक्चुअल फाइल और प्रीव्यू ट्रैक करने के लिए स्टेट्स
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const [form, setForm] = useState({
    fullName: '',
    fatherName: '',
    motherName: '',
    dob: '',
    gender: 'female' as 'male' | 'female' | 'other',
    qualification: '',
    spouseName: '',
    bloodGroup: '',
    occupation: '',
    familyMembersCount: '',
    maleCount: '',
    femaleCount: '',
    familyMembers: [createEmptyFamilyMember()],
    headOfFamily: '',
    houseNumber: '',
    wardNumber: '',
    villageCity: '',
    gramPanchayat: '',
    block: '',
    district: '',
    state: '',
    pinCode: '',
    addressId: '',
    uidNumber: '',
    panCard: '',
    foodIntake: 'vegetarian' as 'vegetarian' | 'non_vegetarian' | 'vegan',
    smoking: 'regular' as 'regular' | 'irregular' | 'party',
    alcoholConsumption: 'regular' as 'regular' | 'irregular' | 'party',
    medicalExpensesMonthly: '',
    drinkingWaterSource: '',
    foodSource: '',
    pollutionLevel: '',
    livePhotoName: '',
    applicationDate: initialDate(),
    place: '',
    time: initialTime(),
    coordinatorId: '',
    fieldOfficerId: '',
    areaCode: '',
    vendingId: '',
    consentGiven: false,
  });
  
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateField = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // फोटो इनपुट चेंज होने पर फ़ाइल और नाम दोनों स्टोर करने के लिए
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      updateField('livePhotoName', file.name); // पुराना वैलिडेशन पास करने के लिए नाम अपडेट किया
    }
  };

  // फ़ाइल को Base64 में बदलने का हेल्पर फंक्शन
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result as string);
      fileReader.onerror = (error) => reject(error);
    });
  };

  const updateFamilyMember = (index: number, key: keyof FamilyMember, value: string) => {
    setForm((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.map((member, memberIndex) =>
        memberIndex === index ? { ...member, [key]: value } : member,
      ),
    }));
  };

  const addFamilyMember = () => {
    setForm((prev) => ({ ...prev, familyMembers: [...prev.familyMembers, createEmptyFamilyMember()] }));
  };

  const validateForm = () => {
    const requiredFields: Array<[string, string]> = [
      ['Name', form.fullName],
      ['Father’s Name', form.fatherName],
      ['Mother’s Name', form.motherName],
      ['Date of Birth', form.dob],
      ['Gender', form.gender],
      ['Qualification', form.qualification],
      ['Spouse Name', form.spouseName],
      ['Blood Group', form.bloodGroup],
      ['Occupation', form.occupation],
      ['Number of Family Members', form.familyMembersCount],
      ['Number of Male Members', form.maleCount],
      ['Number of Female Members', form.femaleCount],
      ['Head of Family', form.headOfFamily],
      ['House Name/No.', form.houseNumber],
      ['Ward No.', form.wardNumber],
      ['Village/Town/City', form.villageCity],
      ['Gram Panchayat/Nagar/Halka', form.gramPanchayat],
      ['Block/Tahsil/Taluka', form.block],
      ['District', form.district],
      ['State', form.state],
      ['PIN Code', form.pinCode],
      ['Address ID', form.addressId],
      ['UID No.', form.uidNumber],
      ['PAN Card', form.panCard],
      ['Monthly Medical Expenses', form.medicalExpensesMonthly],
      ['Source of Drinking Water', form.drinkingWaterSource],
      ['Source of Food', form.foodSource],
      ['Level of Pollution', form.pollutionLevel],
      ['Place', form.place],
      ['Coordinator ID', form.coordinatorId],
      ['Field Officer ID', form.fieldOfficerId],
      ['Area Code', form.areaCode],
      ['Vending ID', form.vendingId],
    ];

    const missingField = requiredFields.find(([, value]) => !String(value).trim());
    if (missingField) {
      return `Please complete the ${missingField[0]} field.`;
    }

    const incompleteFamilyMember = form.familyMembers.find((member) => !member.name.trim() || !member.dob.trim() || !member.relationship.trim() || !member.uid.trim());
    if (incompleteFamilyMember) {
      return 'Please complete every family member entry.';
    }

    if (!form.livePhotoName.trim()) {
      return 'Please capture a live photo before submitting.';
    }

    if (!form.consentGiven) {
      return 'Please accept the consent checkbox to continue.';
    }

    return null;
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      let photoBase64 = '';
      let photoName = '';

      // अगर इमेज फाइल सेलेक्टेड है तो उसे बेस64 में बदलें
      if (selectedFile) {
        photoBase64 = await convertToBase64(selectedFile);
        photoName = selectedFile.name;
      }

      // आपके कस्टम सबमिट API Route पर डेटा भेजना
      const response = await fetch('/api/wallet/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          formData: form,
          photoBase64,
          photoName
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Submission failed');

      // सबमिट होने के बाद आपके ओरिजिनल प्रोजेक्ट के स्टेट्स अपडेट
      setWalletOnboardingStatus('in-progress');
      onSubmitted?.();
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong while saving data.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submitForm} className="space-y-6">
      <div className="rounded-3xl border border-border bg-background/80 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-teal-600" />
          <p className="text-sm font-semibold text-foreground">Wallet onboarding details</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Name *</span>
            <input value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Father’s Name *</span>
            <input value={form.fatherName} onChange={(event) => updateField('fatherName', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Mother’s Name *</span>
            <input value={form.motherName} onChange={(event) => updateField('motherName', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Date of Birth *</span>
            <input type="date" value={form.dob} onChange={(event) => updateField('dob', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Gender *</span>
            <select value={form.gender} onChange={(event) => updateField('gender', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm">
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Qualification *</span>
            <input value={form.qualification} onChange={(event) => updateField('qualification', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Spouse Name *</span>
            <input value={form.spouseName} onChange={(event) => updateField('spouseName', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Blood Group *</span>
            <input value={form.bloodGroup} onChange={(event) => updateField('bloodGroup', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Occupation *</span>
            <input value={form.occupation} onChange={(event) => updateField('occupation', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-background/80 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">Family Details *</p>
          <button type="button" onClick={addFamilyMember} className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
            <Plus size={14} /> Add member
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Number of Family Members *</span>
            <input type="number" min="1" value={form.familyMembersCount} onChange={(event) => updateField('familyMembersCount', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Number of Male Members *</span>
            <input type="number" min="0" value={form.maleCount} onChange={(event) => updateField('maleCount', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Number of Female Members *</span>
            <input type="number" min="0" value={form.femaleCount} onChange={(event) => updateField('femaleCount', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-foreground">Head of Family *</span>
            <input value={form.headOfFamily} onChange={(event) => updateField('headOfFamily', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
        </div>
        <div className="mt-4 space-y-4">
          {form.familyMembers.map((member, index) => (
            <div key={index} className="rounded-2xl border border-border bg-muted/50 p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">Family Member {index + 1}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-foreground">Name *</span>
                  <input value={member.name} onChange={(event) => updateFamilyMember(index, 'name', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-foreground">DOB *</span>
                  <input type="date" value={member.dob} onChange={(event) => updateFamilyMember(index, 'dob', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-foreground">Gender *</span>
                  <select value={member.gender} onChange={(event) => updateFamilyMember(index, 'gender', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-foreground">Relationship *</span>
                  <input value={member.relationship} onChange={(event) => updateFamilyMember(index, 'relationship', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-foreground">UID *</span>
                  <input value={member.uid} onChange={(event) => updateFamilyMember(index, 'uid', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-background/80 p-5">
        <p className="mb-4 text-sm font-semibold text-foreground">Address Details *</p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-foreground">House Name/No. *</span>
            <input value={form.houseNumber} onChange={(event) => updateField('houseNumber', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Ward No. *</span>
            <input value={form.wardNumber} onChange={(event) => updateField('wardNumber', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Village/Town/City *</span>
            <input value={form.villageCity} onChange={(event) => updateField('villageCity', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Gram Panchayat / Nagar / Halka *</span>
            <input value={form.gramPanchayat} onChange={(event) => updateField('gramPanchayat', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Block / Tahsil / Taluka *</span>
            <input value={form.block} onChange={(event) => updateField('block', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">District *</span>
            <input value={form.district} onChange={(event) => updateField('district', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">State *</span>
            <input value={form.state} onChange={(event) => updateField('state', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">PIN Code *</span>
            <input value={form.pinCode} onChange={(event) => updateField('pinCode', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-foreground">Address ID *</span>
            <input value={form.addressId} onChange={(event) => updateField('addressId', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-background/80 p-5">
        <p className="mb-4 text-sm font-semibold text-foreground">Identity & Lifestyle *</p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-foreground">UID No. (Aadhaar) *</span>
            <input value={form.uidNumber} onChange={(event) => updateField('uidNumber', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">PAN Card *</span>
            <input value={form.panCard} onChange={(event) => updateField('panCard', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Food Intake *</span>
            <select value={form.foodIntake} onChange={(event) => updateField('foodIntake', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm">
              <option value="vegetarian">Vegetarian</option>
              <option value="non_vegetarian">Non-Vegetarian</option>
              <option value="vegan">Vegan</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Smoking *</span>
            <select value={form.smoking} onChange={(event) => updateField('smoking', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm">
              <option value="regular">Regular</option>
              <option value="irregular">Irregular</option>
              <option value="party">Party Prop</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Alcohol Consumption *</span>
            <select value={form.alcoholConsumption} onChange={(event) => updateField('alcoholConsumption', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm">
              <option value="regular">Regular</option>
              <option value="irregular">Irregular</option>
              <option value="party">Party Prop</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Monthly Medical Expenses *</span>
            <input type="number" min="0" value={form.medicalExpensesMonthly} onChange={(event) => updateField('medicalExpensesMonthly', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Source of Drinking Water *</span>
            <input value={form.drinkingWaterSource} onChange={(event) => updateField('drinkingWaterSource', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Source of Food *</span>
            <input value={form.foodSource} onChange={(event) => updateField('foodSource', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-foreground">Level of Pollution *</span>
            <input value={form.pollutionLevel} onChange={(event) => updateField('pollutionLevel', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-background/80 p-5">
        <p className="mb-4 text-sm font-semibold text-foreground">Verification & Meta Details *</p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-foreground">Live Photo of Applicant *</span>
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3">
              <Camera size={18} className="text-teal-600" />
              {/* handleFileChange को यहाँ कनेक्ट किया ताकि इमेज कैप्चर हो सके */}
              <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-teal-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white" />
            </div>
            {/* लाइव फोटो प्रीव्यू स्क्रीन पर दिखने के लिए */}
            {previewUrl && (
              <div className="mt-3 relative w-28 h-28 border border-border rounded-2xl overflow-hidden bg-muted shadow-inner">
                <img src={previewUrl} alt="Live Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Date</span>
            <input readOnly value={form.applicationDate} className="mt-2 w-full rounded-2xl border border-border bg-muted px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Time</span>
            <input readOnly value={form.time} className="mt-2 w-full rounded-2xl border border-border bg-muted px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Place *</span>
            <input value={form.place} onChange={(event) => updateField('place', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Coordinator ID *</span>
            <input value={form.coordinatorId} onChange={(event) => updateField('coordinatorId', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Field Officer ID *</span>
            <input value={form.fieldOfficerId} onChange={(event) => updateField('fieldOfficerId', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Area Code *</span>
            <input value={form.areaCode} onChange={(event) => updateField('areaCode', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Vending ID *</span>
            <input value={form.vendingId} onChange={(event) => updateField('vendingId', event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
          </label>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm text-foreground">
        <input type="checkbox" checked={form.consentGiven} onChange={(event) => updateField('consentGiven', event.target.checked)} className="mt-1 h-4 w-4 rounded border-border text-teal-600" />
        <span>I consent to wallet application and data processing for onboarding.</span>
      </label>

      {formError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
      )}

      <button type="submit" disabled={submitting} className="inline-flex items-center justify-center rounded-3xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">
        {submitting ? 'Submitting…' : 'Submit Wallet Application'}
      </button>
    </form>
  );
}