"tsx"
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js'; // Or use your project's pre-configured supabase client
import { 
  Eye, 
  Edit, 
  Trash2, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
// Initialize Supabase client (Ensure you replace these or import your shared client instance)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function WalletControlPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Edit form state
  const [editStatus, setEditStatus] = useState('');

// 1. Fetch applications from API route
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/wallet-applications');
      const result = await res.json();
      
      if (result.success) {
        setApplications(result.data || []);
      } else {
        console.error('API Error:', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

// 3. Delete application via API route
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this wallet application?')) return;
    
    try {
      const res = await fetch(`/api/admin/wallet-applications?id=${id}`, {
        method: 'DELETE',
      });
      
      const result = await res.json();
      if (result.success) {
        setApplications(applications.filter((app) => app.id !== id));
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting application:', error);
    }
  };

// 2. Update status via API route
  const handleUpdateStatus = async (id: string) => {
    try {
      const res = await fetch('/api/admin/wallet-applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: editStatus }),
      });
      
      const result = await res.json();
      if (result.success) {
        setApplications(applications.map(app => app.id === id ? { ...app, status: editStatus } : app));
        setIsEditModalOpen(false);
        alert('Status updated successfully!');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Filtered applications based on search
  const filteredApplications = applications.filter((app) => {
    const name = app.full_name || app.name || '';
    const cardNum = app.card_number || '';
    const phone = app.phone_number || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           cardNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
           phone.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Wallet Control & Approvals</h1>
          <p className="text-sm text-gray-500">Manage user wallet applications, KYC, and card statuses.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, card #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="py-4 px-4 font-semibold">Sr. No.</th>
                <th className="py-4 px-4 font-semibold">Photo</th>
                <th className="py-4 px-4 font-semibold">User Name</th>
                <th className="py-4 px-4 font-semibold">Card Number</th>
                <th className="py-4 px-4 font-semibold">Status</th>
                <th className="py-4 px-4 font-semibold">Created Date</th>
                <th className="py-4 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">Loading applications...</td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">No wallet applications found.</td>
                </tr>
              ) : (
                filteredApplications.map((app, index) => {
                  const isApproved = app.status?.toLowerCase() === 'approved' || app.status?.toLowerCase() === 'active';
                  return (
                    <tr key={app.id || index} className="hover:bg-gray-50/55 transition-colors">
                      <td className="py-3 px-4 text-gray-500 font-medium">{index + 1}</td>
                      <td className="py-3 px-4">
                        <img 
                          src={app.live_photo_url || app.photo_base64 || "https://via.placeholder.com/40"} 
                          alt="User" 
                          className="w-10 h-10 rounded-full object-cover border border-gray-200" 
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">{app.full_name || app.name || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-xs">{app.card_number || 'Not Assigned'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          isApproved ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {isApproved ? <CheckCircle size={12} /> : <Clock size={12} />}
                          {app.status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                        <button 
  onClick={() => router.push(`/dashboard/admin/wallet-control/${app.id}`)}
  className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition"
  title="View Details"
>
  <Eye size={16} />
</button>
                          <button 
                            onClick={() => { setSelectedApp(app); setEditStatus(app.status || 'pending'); setIsEditModalOpen(true); }}
                            className="p-1.5 bg-amber-50 text-amber-600 rounded-md hover:bg-amber-100 transition"
                            title="Edit Status"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(app.id)}
                            className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW MODAL */}
      {isViewModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Wallet Application & KYC Details</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Wallet Card Preview section */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-80">HealthERP Digital Wallet</p>
                    <h4 className="text-xl font-bold mt-1">{selectedApp.full_name || selectedApp.name || 'User Name'}</h4>
                  </div>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium uppercase">
                    {selectedApp.status || 'Pending'}
                  </span>
                </div>
                <div className="mt-8 flex justify-between items-end">
                  <div>
                    <p className="text-xs opacity-75">Card Number</p>
                    <p className="font-mono tracking-widest text-lg">{selectedApp.card_number || 'XXXX-XXXX-XXXX'}</p>
                  </div>
                  <p className="text-xs opacity-75">Exp: {selectedApp.created_at ? new Date(selectedApp.created_at).getFullYear() + 3 : '2028'}</p>
                </div>
              </div>

              {/* Registration Details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Registration Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User size={16} className="text-indigo-500" />
                    <span><strong>Name:</strong> {selectedApp.full_name || selectedApp.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={16} className="text-indigo-500" />
                    <span><strong>Email:</strong> {selectedApp.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={16} className="text-indigo-500" />
                    <span><strong>Phone:</strong> {selectedApp.phone_number || 'N/A'}</span>
                  </div>
                {/* Registration Details ke andar date wali line ko aise theek karein */}
<div className="flex items-center gap-2 text-gray-600">
  <Calendar size={16} className="text-indigo-500" />
  <span>
    <strong>Applied on:</strong>{' '}
    {selectedApp.created_at ? new Date(selectedApp.created_at).toLocaleString() : 'N/A'}
  </span>
</div>
                </div>
              </div>

              {/* KYC Details & Documents */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">KYC Verification Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">PAN Card Number</p>
                    <p className="font-mono font-bold text-gray-800">{selectedApp.pan_card || 'Not Provided'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Aadhaar / UID Number</p>
                    <p className="font-mono font-bold text-gray-800">{selectedApp.uid_number || selectedApp.aadhar_card || 'Not Provided'}</p>
                  </div>
                </div>

                {/* Uploaded Image previews */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Live Photo / Profile Image</p>
                    <img 
                      src={selectedApp.live_photo_url || "https://via.placeholder.com/150"} 
                      alt="Live Photo" 
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Document Image</p>
                    <img 
                      src={selectedApp.document_url || selectedApp.pan_card_url || "https://via.placeholder.com/150"} 
                      alt="Document" 
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-4 border-t border-gray-100 bg-gray-50">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Edit Application Status</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 uppercase mb-1">Applicant Name</label>
                <input 
                  type="text" 
                  disabled 
                  value={selectedApp.full_name || selectedApp.name || ''} 
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 uppercase mb-1">Update Status</label>
                <select 
                  value={editStatus} 
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="under_review">Under Review</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedApp.id)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}