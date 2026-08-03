'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import CustomCheckbox from '@/components/CustomCheckbox';
import {
  getWalletApplicationsCount,
  getWalletApplicationsRange,
  deleteWalletApplication,
  updateWalletApplication,
  getProfileAmountById,
  updateProfileAmountById,
} from '@/lib/supabase/db';

const ITEMS_PER_PAGE = 20;

export default function WalletControlPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Selection state for Checkboxes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [addAmount, setAddAmount] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Delete states
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);

    const { count, error: countError } = await getWalletApplicationsCount();
    console.log('Total records in DB (count):', count, countError);

    let allData: any[] = [];
    const pageSize = 1000;
    let from = 0;
    let keepFetching = true;

    while (keepFetching) {
      const to = from + pageSize - 1;
      const { data, error } = await getWalletApplicationsRange(from, to);

      if (error) {
        console.error('Fetch error:', error);
        keepFetching = false;
        break;
      }

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += pageSize;
        if (data.length < pageSize) {
          keepFetching = false;
        }
      } else {
        keepFetching = false;
      }
    }

    setApplications(allData);
    setLoading(false);
  };

  // Handle Single Delete (Backend + Frontend)
  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Kya aap sach mein is application ko delete karna chahte hain? Ye action database se bhi remove kar dega.'
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const { error } = await deleteWalletApplication(id);
      if (error) throw new Error(error.message || JSON.stringify(error));

      setApplications((prev) => prev.filter((app) => app.id !== id));
      setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));

      const newTotalPages = Math.ceil((applications.length - 1) / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }

      alert('Application deleted successfully from database!');
    } catch (err: any) {
      console.error('Error deleting application:', err);
      alert(`Failed to delete application: ${err.message || 'Unknown error'}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Handle Bulk Delete (Backend + Frontend)
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = window.confirm(
      `Kya aap sach mein ${selectedIds.length} selected applications ko database se delete karna chahte hain?`
    );
    if (!confirmed) return;

    try {
      for (const id of selectedIds) {
        const { error } = await deleteWalletApplication(id);
        if (error) console.error(`Failed to delete ID ${id}:`, error);
      }

      setApplications((prev) => prev.filter((app) => !selectedIds.includes(app.id)));
      setSelectedIds([]);
      alert('Selected applications deleted successfully from database!');
    } catch (err: any) {
      console.error('Error bulk deleting:', err);
      alert('Failed to delete selected applications.');
    }
  };

  // Checkbox Selection Logic
  const paginatedApplications = applications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isAllCurrentPageSelected = 
    paginatedApplications.length > 0 && 
    paginatedApplications.every((app) => selectedIds.includes(app.id));

  const isSomeCurrentPageSelected = 
    selectedIds.length > 0 && !isAllCurrentPageSelected;

  const handleSelectAllCurrentPage = () => {
    if (isAllCurrentPageSelected) {
      const pageIds = paginatedApplications.map(app => app.id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedApplications.map(app => app.id);
      const combined = Array.from(new Set([...selectedIds, ...pageIds]));
      setSelectedIds(combined);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Handle Edit Form Submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setSaving(true);
    try {
      const currentAppAmount = Number(selectedApp.amount || 0);
      const amountToAdd = Number(addAmount || 0);
      const newAppTotal = currentAppAmount + amountToAdd;

      let updatedHistory = selectedApp.amount_history || [];
      if (amountToAdd > 0) {
        const newLog = {
          amount_added: amountToAdd,
          date: new Date().toLocaleString(),
        };
        updatedHistory = [...updatedHistory, newLog];
      }

      const updateData: any = {
        full_name: selectedApp.full_name,
        blood_group: selectedApp.blood_group,
        status: selectedApp.status,
        district: selectedApp.district,
        state: selectedApp.state,
        amount: newAppTotal,
        amount_history: updatedHistory,
      };

      const { error: appError } = await updateWalletApplication(selectedApp.id, updateData);
      if (appError) throw new Error(appError.message || JSON.stringify(appError));

      if (amountToAdd > 0 && selectedApp.user_id) {
        const { data: profileData, error: fetchError } = await getProfileAmountById(selectedApp.user_id);
        if (fetchError) throw new Error(`Profile fetch failed: ${fetchError.message}`);

        const currentProfileAmount = Number(profileData?.amount_given || 0);
        const newProfileTotal = currentProfileAmount + amountToAdd;

        const { error: profileError } = await updateProfileAmountById(selectedApp.user_id, newProfileTotal);
        if (profileError) throw new Error(`Profile update failed: ${profileError.message}`);
      }

      alert('Application and Wallet updated successfully!');
      setIsEditModalOpen(false);
      setAddAmount('');
      fetchApplications();
    } catch (err: any) {
      console.error('Error updating application:', err);
      alert(`Failed to update application: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(applications.length / ITEMS_PER_PAGE));

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Wallet Applications Control</h1>
        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
          >
            <Trash2 size={16} /> Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10">Loading applications...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                <tr>
                  <th className="p-4 w-10">
                    <CustomCheckbox
                      checked={isAllCurrentPageSelected}
                      indeterminate={isSomeCurrentPageSelected}
                      onChange={handleSelectAllCurrentPage}
                      ariaLabel="Select all on current page"
                    />
                  </th>
                  <th className="p-4 w-16 text-center">Sr. No.</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">District</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {paginatedApplications.map((app, index) => {
                  const isSelected = selectedIds.includes(app.id);
                  const serialNumber = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                  return (
                    <tr key={app.id} className={`hover:bg-gray-50 transition ${isSelected ? 'bg-gray-50/80' : ''}`}>
                      <td className="p-4">
                        <CustomCheckbox
                          checked={isSelected}
                          onChange={() => handleSelectOne(app.id)}
                          ariaLabel={`Select ${app.full_name || 'application'}`}
                        />
                      </td>
                      <td className="p-4 text-center font-medium text-gray-500">{serialNumber}</td>
                      <td className="p-4 font-semibold text-gray-800">{app.full_name || app.name || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          app.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {app.status || 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{app.district || '—'}</td>
                      <td className="p-4 flex items-center justify-center gap-2">
                        <button 
                          onClick={() => { 
                            setSelectedApp(app); 
                            setAddAmount(''); 
                            setIsEditModalOpen(true); 
                          }}
                          className="p-1.5 bg-amber-50 text-amber-600 rounded-md hover:bg-amber-100 transition"
                          title="Quick Edit"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(app.id)}
                          disabled={deletingId === app.id}
                          className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition disabled:opacity-50"
                          title="Delete Application"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {paginatedApplications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-500">
                      Koi application nahi mili.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-gray-500">
              Showing {applications.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
              {' - '}
              {Math.min(currentPage * ITEMS_PER_PAGE, applications.length)} of {applications.length}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="text-xs font-semibold text-gray-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* EDIT MODAL POPUP */}
      {isEditModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Edit Application & Add Amount</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                <input 
                  type="text"
                  value={selectedApp.full_name || ''}
                  onChange={(e) => setSelectedApp({ ...selectedApp, full_name: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Blood Group</label>
                  <input 
                    type="text"
                    value={selectedApp.blood_group || ''}
                    onChange={(e) => setSelectedApp({ ...selectedApp, blood_group: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select 
                    value={selectedApp.status || 'pending'}
                    onChange={(e) => setSelectedApp({ ...selectedApp, status: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">District</label>
                  <input 
                    type="text"
                    value={selectedApp.district || ''}
                    onChange={(e) => setSelectedApp({ ...selectedApp, district: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">State</label>
                  <input 
                    type="text"
                    value={selectedApp.state || ''}
                    onChange={(e) => setSelectedApp({ ...selectedApp, state: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 space-y-1">
                <label className="block text-xs font-bold text-indigo-900">
                  Add Amount to Wallet (Current Total: ₹{selectedApp.amount || 0})
                </label>
                <input 
                  type="number"
                  placeholder="Enter amount to add (e.g. 500)"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="w-full p-2.5 border border-indigo-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-indigo-600">Nayi amount purani amount mein automatically jud jayegi.</p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}