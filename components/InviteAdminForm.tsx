'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { UserPlus, Loader2, Check, AlertCircle, Copy } from 'lucide-react';

// Initialize Supabase client for browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function InviteAdminForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInviteLink('');
    setLoading(true);
    
    try {
      // 1. Get fresh session token directly from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('Unauthorized: No active session found. Please login again.');
      }

      const accessToken = session.access_token;

      // 2. Make API call with valid Bearer Token
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invite');

      setInviteLink(data.inviteLink);
      setEmail('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 rounded-2xl border border-border bg-card max-w-md">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center">
          <UserPlus size={18} className="text-violet-600" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Invite New Admin</h3>
          <p className="text-xs text-muted-foreground">Link expires in 48 hours</p>
        </div>
      </div>

      {error && (
        <div className="mb-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {inviteLink ? (
        <div className="space-y-3">
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
          <button
            onClick={() => setInviteLink('')}
            className="text-sm text-primary hover:underline"
          >
            Invite another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="partner@example.com"
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
            style={{ background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {loading ? 'Sending…' : 'Send Invite'}
          </button>
        </form>
      )}
    </div>
  );
}