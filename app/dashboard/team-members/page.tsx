'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  UserPlus, CheckCircle, XCircle, Pencil, Trash2, X, AlertCircle, Search, Copy, Check, Loader2 
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface AdminInvite {
  id: string;
  name?: string;
  email: string;
  role?: string;
  status: string;
  created_at: string;
}

export default function InvitedMembersPage() {
  const { token } = useAuth();
  const [members, setMembers] = useState<AdminInvite[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  // InviteAdminForm specific states inside modal
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/team', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMembers(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const openAdd = () => {
    setEmail('');
    setErrorMsg('');
    setInviteLink('');
    setShowModal(true);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInviteLink('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invite');

      setInviteLink(data.inviteLink);
      setEmail('');
      showToast('Invite created successfully!');
      fetchMembers(); // Refresh table
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        const res = await fetch(`/api/team/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Failed to remove');
        
        showToast('Member removed from team.');
        fetchMembers();
      } catch (err: any) {
        showToast(err.message, 'error');
      }
    }
  };

  const filteredMembers = members.filter(m => 
    m.email?.toLowerCase().includes(search.toLowerCase()) || 
    m.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invited Members & Roles</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage administrative members and generate secure portal invite links
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold shadow hover:opacity-90 transition bg-purple-600"
        >
          <UserPlus size={18} /> Invite Member
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
        />
      </div>

      {/* Members Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-muted-foreground text-xs uppercase font-semibold">
                <th className="px-5 py-3 text-left">Email Address</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Created At</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">Loading admin invites...</td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No records found in admin_invites table.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/50 transition">
                    <td className="px-5 py-3 font-semibold text-foreground">
                      {member.email}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold capitalize bg-purple-50 text-purple-700 border border-purple-200">
                        {member.role || 'Admin'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        member.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {member.status || 'invited'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                        title="Remove Member"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal with InviteAdminForm functionality */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center">
                  <UserPlus size={16} className="text-violet-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Invite New Admin</h2>
                  <p className="text-xs text-muted-foreground">Link expires in 48 hours</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5">
              {errorMsg && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle size={15} /> {errorMsg}
                </div>
              )}

              {inviteLink ? (
                <div className="space-y-4">
                  <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
                    <Check size={15} /> Invite created — send this link to the new admin
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={inviteLink}
                      className="flex-1 px-3 py-2 rounded-xl border border-border bg-muted text-sm text-foreground truncate"
                    />
                    <button
                      onClick={handleCopy}
                      className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-all flex-shrink-0"
                      title="Copy"
                    >
                      {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                    </button>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => setInviteLink('')}
                      className="text-sm text-primary hover:underline"
                    >
                      Invite another
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 rounded-xl bg-muted text-sm font-semibold hover:bg-muted/80 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInviteSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="partner@example.com"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition text-sm"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 text-sm"
                      style={{ background: submitting ? '#a5b4fc' : 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                      {submitting ? 'Sending…' : 'Send Invite'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}