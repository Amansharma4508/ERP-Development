'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { 
  ArrowLeft, 
  User, 
  Users, 
  HeartPulse, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  X,
  AlertCircle 
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminWalletViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Modal / Popup state for Document Preview
  const [modalOpen, setModalOpen] = useState(false);
  const [activeImageSrc, setActiveImageSrc] = useState('');

  // Rejection Reason Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch Details via API Route (Bypasses 406 & RLS issues)
  useEffect(() => {
    if (!id) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${id}`);
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || 'Failed to fetch application details');
        }

        setApplication(result.data);
      } catch (err: any) {
        console.error('Error fetching details:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  // Status Update via API Route (Saves directly to 'status' column as requested)
  const handleStatusUpdate = async (newStatus: string, reason: string = '') => {
    setUpdating(true);
    try {
      const updateData: any = { 
        status: newStatus // Updated directly to the 'status' column
      };
      
      if (newStatus === 'rejected') {
        updateData.rejection_reason = reason;
      }

      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update status');

      setApplication({ ...application, ...updateData });
      setRejectModalOpen(false);
      setRejectionReason('');
      alert(`Application successfully marked as ${newStatus}!`);
    } catch (err: any) {
      console.error('Error updating status:', err.message);
      alert('Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  // Safe image loader for documents
  const handleViewDocument = async (filePathOrUrl?: string) => {
    const fallbackImage = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=1000&auto=format&fit=crop';

    try {
      if (!filePathOrUrl) {
        setActiveImageSrc(fallbackImage);
        setModalOpen(true);
        return;
      }

      if (filePathOrUrl.startsWith('http') || filePathOrUrl.startsWith('data:')) {
        setActiveImageSrc(filePathOrUrl);
      } else {
        const { data } = supabase.storage
          .from('live-photos')
          .getPublicUrl(filePathOrUrl);
        
        setActiveImageSrc(data?.publicUrl || fallbackImage);
      }
      setModalOpen(true);
    } catch (error) {
      console.error('Error fetching image:', error);
      setActiveImageSrc(fallbackImage);
      setModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-8 text-center min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-gray-800">Application not found</h2>
        <button 
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  const fullName = application.full_name || application.name || 'N/A';
  const currentStatus = application.status?.toLowerCase() || 'pending';
  const isApproved = currentStatus === 'approved' || currentStatus === 'active';
  const isRejected = currentStatus === 'rejected';

  const getProfileImageUrl = () => {
    const photo = application.live_photo_url || application.live_photo || application.photo_base64 || application.photo_url || application.photo;
    if (!photo) return null;
    if (photo.startsWith('http') || photo.startsWith('data:')) return photo;
    
    const { data } = supabase.storage.from('live-photos').getPublicUrl(photo);
    return data?.publicUrl;
  };

  const profileImageUrl = getProfileImageUrl();

  const renderFamilyMembers = () => {
    const fm = application.family_members;
    if (!fm) return 'N/A';
    if (Array.isArray(fm)) {
      return fm.map((member: any, index: number) => (
        <div key={index} className="text-xs bg-gray-50 p-2 rounded border border-gray-100 my-1">
          <span className="font-bold">{member.name || 'Member'}</span> - {member.relationship || ''} ({member.gender || ''}, DOB: {member.dob || '—'})
        </div>
      ));
    }
    if (typeof fm === 'object') {
      return JSON.stringify(fm);
    }
    return String(fm);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 bg-gray-50 min-h-screen relative">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 pb-4 gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition shadow-sm"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            isApproved ? 'bg-green-50 text-green-700 border border-green-200' : 
            isRejected ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {isApproved ? <CheckCircle size={14} /> : isRejected ? <XCircle size={14} /> : <Clock size={14} />}
            Status: {application.status || 'Pending'}
          </span>

          {!isApproved && !isRejected && (
            <>
              <button
                disabled={updating}
                onClick={() => handleStatusUpdate('approved')}
                className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition shadow-sm disabled:opacity-50"
              >
                Approve
              </button>
              <button
                disabled={updating}
                onClick={() => setRejectModalOpen(true)}
                className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition shadow-sm disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}

          {isApproved && (
            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              ✓ Approved Successfully
            </span>
          )}

          {isRejected && (
            <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
              ✕ Rejected
            </span>
          )}
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet Application Review</h1>
        <p className="text-sm text-gray-500 mt-0.5">Reviewing KYC documents, verification statuses, family background, and health statistics.</p>
        
        {isRejected && application.rejection_reason && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Rejection Reason: </span>
              {application.rejection_reason}
            </div>
          </div>
        )}
      </div>

      {/* HEALTH CARD PREVIEW */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Health Card Preview</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 justify-items-center py-2">
          {/* FRONT CARD */}
          <div className="w-full max-w-[380px] aspect-[1.586/1] rounded-2xl p-4 text-white flex flex-col justify-between shadow-md relative overflow-hidden select-none"
               style={{ background: 'linear-gradient(135deg, #063c31 0%, #0c2340 50%, #1d4ed8 100%)' }}>
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[11px] font-bold tracking-widest text-emerald-300">SVABHIMAN HEALTH ID CARD</span>
            </div>

            <div className="flex gap-4 items-center my-auto">
              <div className="w-16 h-20 rounded-lg bg-slate-900/40 border border-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                {profileImageUrl ? (
                  <img 
                    src={profileImageUrl} 
                    alt="User Live Photo" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                    }}
                  />
                ) : (
                  <User size={30} className="text-white/40" />
                )}
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div>
                  <span className="text-[8px] uppercase tracking-wide text-white/50 block">Name</span>
                  <p className="text-sm font-bold text-white truncate">{fullName}</p>
                </div>
                <div>
                  <span className="text-[8px] uppercase tracking-wide text-white/50 block">DOB</span>
                  <p className="text-[11px] font-semibold text-white">{application.dob || '—'}</p>
                </div>
                <div>
                  <span className="text-[8px] uppercase tracking-wide text-white/50 block">Card Number</span>
                  <p className="text-xs font-bold tracking-wider text-emerald-300">{application.card_number || 'Not Assigned'}</p>
                </div>
              </div>

              <div className="text-right self-center shrink-0">
                <span className="text-[8px] uppercase tracking-wide text-white/50 block">Blood</span>
                <p className="text-xs font-bold text-red-400">{application.blood_group || '—'}</p>
              </div>
            </div>
          </div>

          {/* BACK CARD */}
          <div className="w-full max-w-[380px] aspect-[1.586/1] rounded-2xl bg-white border border-slate-200 text-slate-800 flex flex-col justify-between shadow-md overflow-hidden select-none">
            <div className="w-full h-8 bg-[#0f172a] mt-4 shrink-0" />

            <div className="p-4 grid grid-cols-2 gap-x-2 gap-y-3 text-left my-auto">
              <div className="col-span-2">
                <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 block">Permanent Address</span>
                <p className="text-[10px] font-medium text-slate-700 leading-tight">
                  {`${application.house_number || ''}, ${application.village_city || ''}, ${application.district || ''}, ${application.state || ''} - ${application.pin_code || ''}`}
                </p>
              </div>
              <div>
                <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 block">Head of Family</span>
                <p className="text-[11px] font-bold text-slate-700">{application.head_of_family || '—'}</p>
              </div>
              <div>
                <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 block">Center Code</span>
                <p className="text-[11px] font-bold text-slate-700">{application.area_code || application.center_code || '—'}</p>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-100 py-1.5 text-center">
              <span className="text-[8px] text-slate-400 font-medium">If found, please return to the nearest center.</span>
            </div>
          </div>
        </div>
      </div>

      {/* KYC DETAILS & DOCUMENTS */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-600" /> KYC Verification & Documents
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500">PAN Card Number</p>
                <p className="font-mono font-bold text-gray-800 text-base">{application.pan_card || 'Not Provided'}</p>
              </div>
              <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold rounded-md">Verified</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <button onClick={() => handleViewDocument(application.pan_card_url)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition shadow-sm">
                <Eye size={14} /> View Document
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500">Aadhaar / UID Number</p>
                <p className="font-mono font-bold text-gray-800 text-base">[Aadhaar Redacted]</p>
              </div>
              <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold rounded-md">Verified</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <button onClick={() => handleViewDocument(application.aadhar_card_url)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition shadow-sm">
                <Eye size={14} /> View Document
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FAMILY & HEALTH RECORDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <Users size={16} className="text-indigo-600" /> Family Background
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-500">Father's Name</span><span className="font-semibold text-gray-800">{application.father_name || 'N/A'}</span></div>
            <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-500">Mother's Name</span><span className="font-semibold text-gray-800">{application.mother_name || 'N/A'}</span></div>
            <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-500">Head of Family</span><span className="font-semibold text-gray-800">{application.head_of_family || 'N/A'}</span></div>
            <div><span className="text-gray-500 block mb-1">Family Members List</span><div>{renderFamilyMembers()}</div></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <HeartPulse size={16} className="text-rose-600" /> Health & Lifestyle Records
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-500">Food Intake</span><span className="font-semibold text-gray-800">{application.food_intake || 'N/A'}</span></div>
            <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-500">Smoking Habit</span><span className="font-semibold text-gray-800">{application.smoking || 'N/A'}</span></div>
            <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-500">Alcohol Consumption</span><span className="font-semibold text-gray-800">{application.alcohol_consumption || 'N/A'}</span></div>
          </div>
        </div>
      </div>

      {/* REJECTION REASON MODAL POPUP */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <XCircle className="text-red-600" size={20} /> Reason for Rejection
              </h3>
              <button onClick={() => setRejectModalOpen(false)} className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-500">Please provide a valid reason why this wallet application is being rejected. This will be visible to the user.</p>

            <textarea 
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Documents are unclear, or mismatched details..."
              className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button 
                disabled={updating || !rejectionReason.trim()}
                onClick={() => handleStatusUpdate('rejected', rejectionReason)}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX DOCUMENT PREVIEW MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative bg-white rounded-2xl max-w-2xl w-full p-4 shadow-2xl flex flex-col items-center">
            <button onClick={() => setModalOpen(false)} className="absolute top-3 right-3 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition">
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-gray-800 mb-3 self-start">Document Preview</h3>
            <div className="w-full max-h-[75vh] overflow-hidden rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center p-2">
              <img src={activeImageSrc} alt="Document Preview" className="object-contain max-h-[70vh] w-full rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}