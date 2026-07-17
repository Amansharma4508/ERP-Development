'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Search, Plus, Pencil, Trash2, X, AlertCircle, User as UserIcon } from 'lucide-react';

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  photoUrl: string;
  isBlocked: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ fullName: '', email: '', password: '', phoneNumber: '' });
  const [addLoading, setAddLoading] = useState(false);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', phoneNumber: '', isBlocked: false });
  const [editLoading, setEditLoading] = useState(false);

  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setUsers(data.data.users);
      else setError(data.error || 'Failed to load users');
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

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
      setUsers(prev => [data.data.user, ...prev]);
      setShowAddModal(false);
      setAddForm({ fullName: '', email: '', password: '', phoneNumber: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (u: AdminUser) => {
    setEditingUser(u);
    setEditForm({ fullName: u.fullName, email: u.email, phoneNumber: u.phoneNumber, isBlocked: u.isBlocked });
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

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage patient accounts</p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setError(''); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {error && !showAddModal && !editingUser && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <UserIcon size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-semibold text-foreground">No users found</p>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Sr.No.</th>
                <th className="px-4 py-3 font-medium">Photo</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Phone Number</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Joined</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, index) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition">
                  <td className="px-4 py-3.5 text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-3.5">
  {u.photoUrl ? (
    <div className="relative w-9 h-9">
      {/* Image Tag */}
      <img 
        src={u.photoUrl} 
        alt={u.fullName} 
        className="w-9 h-9 rounded-full object-cover"
        onError={(e) => {
          // Agar image 404 hai, to image tag ko hide karke 
          // uske bagal wale 'initials' div ko dikha do
          e.currentTarget.style.display = 'none';
          (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
        }}
      />
      
      {/* Initials Div (By default hidden) */}
      <div 
        className="absolute inset-0 rounded-full flex items-center justify-center text-white text-xs font-bold"
        style={{ 
          background: 'linear-gradient(135deg,#818cf8,#a78bfa)', 
          display: 'none' // Default hide rakhein
        }}
      >
        {/* Name se initials nikalne ka logic */}
        {u.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
      </div>
    </div>
  ) : (
    
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
         style={{ background: 'linear-gradient(135deg,#818cf8,#a78bfa)' }}>
      {u.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
    </div>
  )}
</td>
                  <td className="px-6 py-3.5 font-medium text-foreground">{u.fullName}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">{u.email}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">{u.phoneNumber || '—'}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.isBlocked ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {u.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(u)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => { setDeletingUser(u); setError(''); }} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Add User</h2>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition"><X size={16} /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle size={15} /> {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Full name</label>
                <input required value={addForm.fullName} onChange={e => setAddForm({ ...addForm, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="John Carter" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input required type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Phone number</label>
                <input value={addForm.phoneNumber} onChange={e => setAddForm({ ...addForm, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="9876543210" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <input required minLength={6} type="password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Min 6 characters" />
              </div>
              <button type="submit" disabled={addLoading}
                className="w-full py-3 rounded-xl font-semibold text-white transition hover:opacity-90"
                style={{ background: addLoading ? '#a5b4fc' : 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                {addLoading ? 'Adding…' : 'Add User'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Edit User</h2>
              <button onClick={() => setEditingUser(null)} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition"><X size={16} /></button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle size={15} /> {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Full name</label>
                <input required value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input required type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Phone number</label>
                <input value={editForm.phoneNumber} onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="9876543210" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
                <select value={editForm.isBlocked ? 'blocked' : 'active'}
                  onChange={e => setEditForm({ ...editForm, isBlocked: e.target.value === 'blocked' })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <button type="submit" disabled={editLoading}
                className="w-full py-3 rounded-xl font-semibold text-white transition hover:opacity-90"
                style={{ background: editLoading ? '#a5b4fc' : 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                {editLoading ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm animate-fade-in-up p-6">
            <h2 className="text-lg font-bold text-foreground mb-2">Delete User</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to permanently delete <span className="font-semibold text-foreground">{deletingUser.fullName}</span>? This cannot be undone.
            </p>
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <AlertCircle size={15} /> {error}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setDeletingUser(null)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition disabled:opacity-60">
                {deleteLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}