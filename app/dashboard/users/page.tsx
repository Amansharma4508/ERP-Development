'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Search, Plus, Pencil, Trash2, X, AlertCircle, User as UserIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  photoUrl: string;
  isBlocked: boolean;
  createdAt: string;
  amountGiven: number;
  amountUsed: number;
}

export default function UsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ fullName: '', email: '', password: '', phoneNumber: '', amountGiven: 35000 });
  const [addLoading, setAddLoading] = useState(false);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', phoneNumber: '', isBlocked: false, amountGiven: 35000 });
  const [editLoading, setEditLoading] = useState(false);

  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        const formatted = (data.data.users || []).map((u: any) => ({
          ...u,
          amountGiven: Number(u.amountGiven ?? u.amount_given ?? 35000),
          amountUsed: Number(u.amountUsed ?? u.amount_used ?? 0),
        }));
        setUsers(formatted);
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Reset pagination to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination Calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to add user');
      
      const newUser = {
        ...data.data.user,
        amountGiven: Number(data.data.user.amountGiven ?? data.data.user.amount_given ?? addForm.amountGiven),
        amountUsed: Number(data.data.user.amountUsed ?? data.data.user.amount_used ?? 0),
      };

      setUsers(prev => [newUser, ...prev]);
      setShowAddModal(false);
      setAddForm({ fullName: '', email: '', password: '', phoneNumber: '', amountGiven: 35000 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (u: AdminUser) => {
    setEditingUser(u);
    setEditForm({ 
      fullName: u.fullName, 
      email: u.email, 
      phoneNumber: u.phoneNumber, 
      isBlocked: u.isBlocked,
      amountGiven: u.amountGiven ?? 35000
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update user');
      
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...editForm } : u));
      setEditingUser(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete user');
      setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
      setDeletingUser(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Users & Wallet Management</h1>
          <p className="text-muted-foreground text-base mt-1">Manage platform patients, profile records, and financial allocation limits.</p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setError(''); }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
          style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
        >
          <Plus size={18} /> Add New User
        </button>
      </div>

      {error && !showAddModal && !editingUser && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3 shadow-sm">
          <AlertCircle size={18} className="shrink-0" /> 
          <span>{error}</span>
        </div>
      )}

      {/* Search Filter Bar */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users by name or email..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
      </div>

      {/* Table Container with X-Axis Scroll */}
      <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="w-full h-14 rounded-2xl bg-muted/60 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <UserIcon size={32} />
              </div>
              <p className="text-lg font-bold text-foreground">No users found</p>
              <p className="text-sm text-muted-foreground mt-1">Try searching with a different keyword or add a new user.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="border-b border-border bg-muted/35 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Sr. No.</th>
                  <th className="py-4 px-6">Photo</th>
                  <th className="py-4 px-6">Full Name</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Phone Number</th>
                  <th className="py-4 px-6 text-right">Given (₹)</th>
                  <th className="py-4 px-6 text-right">Used (₹)</th>
                  <th className="py-4 px-6 text-right">Balance (₹)</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {currentUsers.map((u, index) => {
                  const absoluteIndex = startIndex + index + 1;
                  const given = u.amountGiven ?? 35000;
                  const used = u.amountUsed ?? 0;
                  const balance = given - used;
                  return (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-6 text-muted-foreground font-medium">{absoluteIndex}</td>
                      <td className="py-4 px-6">
                        {u.photoUrl ? (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-sm border border-border">
                            <img 
                              src={u.photoUrl} 
                              alt={u.fullName} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                              }}
                            />
                            <div 
                              className="absolute inset-0 items-center justify-center text-white text-xs font-bold"
                              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'none' }}
                            >
                              {u.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                            </div>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                               style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                            {u.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 font-semibold text-foreground">{u.fullName}</td>
                      <td className="py-4 px-6 text-muted-foreground font-medium">{u.email}</td>
                      <td className="py-4 px-6 text-muted-foreground">{u.phoneNumber || '—'}</td>
                      <td className="py-4 px-6 text-right font-semibold text-foreground">₹{given.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right font-semibold text-amber-600">₹{used.toLocaleString()}</td>
                      <td className={`py-4 px-6 text-right font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        ₹{balance.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${u.isBlocked ? 'bg-red-50 text-red-600 border border-red-200/50' : 'bg-emerald-50 text-emerald-600 border border-emerald-200/50'}`}>
                          {u.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border/60">
                          <button 
                            onClick={() => openEdit(u)} 
                            className="w-8 h-8 rounded-lg hover:bg-card hover:text-indigo-600 flex items-center justify-center text-muted-foreground transition shadow-sm" 
                            title="Edit User"
                          >
                            <Pencil size={15} />
                          </button>
                          <button 
                            onClick={() => { setDeletingUser(u); setError(''); }} 
                            className="w-8 h-8 rounded-lg hover:bg-card hover:text-red-600 flex items-center justify-center text-muted-foreground transition shadow-sm" 
                            title="Delete User"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer Controls */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border bg-muted/10">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{startIndex + 1}</span> to <span className="font-semibold text-foreground">{Math.min(startIndex + itemsPerPage, filtered.length)}</span> of <span className="font-semibold text-foreground">{filtered.length}</span> entries
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/50 transition shadow-sm"
              >
                <ChevronLeft size={15} /> Previous
              </button>

              <div className="flex items-center gap-1 px-2">
                <span className="text-xs font-bold text-foreground">{currentPage}</span>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-xs font-semibold text-muted-foreground">{totalPages || 1}</span>
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/50 transition shadow-sm"
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card rounded-3xl shadow-2xl border border-border w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/25">
              <div>
                <h2 className="text-xl font-bold text-foreground">Add New User</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Create user login profile and set initial balance wallet.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-9 h-9 rounded-2xl hover:bg-muted flex items-center justify-center text-muted-foreground transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-5">
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" /> {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Full Name</label>
                  <input required value={addForm.fullName} onChange={e => setAddForm({ ...addForm, fullName: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-muted/40 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Email Address</label>
                  <input required type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-muted/40 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Phone Number</label>
                  <input value={addForm.phoneNumber} onChange={e => setAddForm({ ...addForm, phoneNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-muted/40 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="9876543210" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Initial Amount Given (₹)</label>
                  <input type="number" required value={addForm.amountGiven} onChange={e => setAddForm({ ...addForm, amountGiven: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-muted/40 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="35000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Password</label>
                  <input required minLength={6} type="password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-muted/40 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="Min 6 characters" />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={addLoading}
                  className="w-full py-3.5 rounded-2xl font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 active:scale-[0.99] disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                  {addLoading ? 'Creating User...' : 'Create User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card rounded-3xl shadow-2xl border border-border w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/25">
              <div>
                <h2 className="text-xl font-bold text-foreground">Edit User Account</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Modify profile info, wallet limit or account access status.</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="w-9 h-9 rounded-2xl hover:bg-muted flex items-center justify-center text-muted-foreground transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-5">
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" /> {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Full Name</label>
                  <input required value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-muted/40 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Email Address</label>
                  <input required type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-muted/40 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Phone Number</label>
                  <input value={editForm.phoneNumber} onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-muted/40 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="9876543210" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Total Amount Given (₹)</label>
                  <input type="number" required value={editForm.amountGiven} onChange={e => setEditForm({ ...editForm, amountGiven: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-muted/40 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Account Status</label>
                  <select value={editForm.isBlocked ? 'blocked' : 'active'}
                    onChange={e => setEditForm({ ...editForm, isBlocked: e.target.value === 'blocked' })}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-muted/40 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={editLoading}
                  className="w-full py-3.5 rounded-2xl font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 active:scale-[0.99] disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                  {editLoading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card rounded-3xl shadow-2xl border border-border w-full max-w-sm p-6 space-y-4">
            <h2 className="text-xl font-bold text-foreground">Delete User?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete <span className="font-semibold text-foreground">{deletingUser.fullName}</span>? This action is irreversible.
            </p>
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" /> {error}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeletingUser(null)} className="flex-1 py-3 rounded-2xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition shadow-md shadow-red-600/20 disabled:opacity-50">
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}