// 'use client';

// import { useEffect, useState } from 'react';
// import { useAuth } from '@/lib/auth-context';
// import { Stethoscope, Truck, Check, X, Loader2, Inbox } from 'lucide-react';

// interface PendingUser {
//   id: string;
//   full_name: string;
//   email: string;
//   account_type: 'doctor' | 'logistics';
//   created_at: string;
// }

// const ROLE_META = {
//   doctor:    { label: 'Doctor',    Icon: Stethoscope, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
//   logistics: { label: 'Logistics', Icon: Truck,       color: 'text-amber-600 bg-amber-50 border-amber-200' },
// };

// export default function AdminUsersPage() {
//   const { token } = useAuth();
//   const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [actioningId, setActioningId] = useState<string | null>(null);
//   const [error, setError] = useState('');

//   const fetchPending = async () => {
//     setIsLoading(true);
//     setError('');
//     try {
//       const res = await fetch('/api/admin/approve-user', {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || 'Failed to load pending users');
//       setPendingUsers(data.data || []);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (token) fetchPending();
//   }, [token]);

//   const handleAction = async (userId: string, action: 'approve' | 'reject') => {
//     setActioningId(userId);
//     try {
//       const res = await fetch('/api/admin/approve-user', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ userId, action }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || 'Action failed');

//       // Remove from local list immediately — no need to refetch
//       setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setActioningId(null);
//     }
//   };

//   return (
//     <div className="p-6 max-w-4xl mx-auto">
//       <div className="mb-6">
//         <h1 className="text-2xl font-bold text-foreground">Pending Approvals</h1>
//         <p className="text-muted-foreground text-sm mt-1">
//           Doctor and logistics accounts need your approval before they can access their dashboard.
//         </p>
//       </div>

//       {error && (
//         <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
//           {error}
//         </div>
//       )}

//       {isLoading ? (
//         <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
//           <Loader2 size={18} className="animate-spin" />
//           Loading pending users…
//         </div>
//       ) : pendingUsers.length === 0 ? (
//         <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-2xl">
//           <Inbox size={32} className="text-muted-foreground mb-3" />
//           <p className="text-foreground font-medium">All caught up</p>
//           <p className="text-muted-foreground text-sm">No pending doctor or logistics approvals right now.</p>
//         </div>
//       ) : (
//         <div className="space-y-3">
//           {pendingUsers.map((u) => {
//             const meta = ROLE_META[u.account_type];
//             const isActioning = actioningId === u.id;
//             return (
//               <div
//                 key={u.id}
//                 className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card"
//               >
//                 <div className="flex items-center gap-4 min-w-0">
//                   <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${meta.color}`}>
//                     <meta.Icon size={18} />
//                   </div>
//                   <div className="min-w-0">
//                     <p className="font-semibold text-foreground truncate">{u.full_name}</p>
//                     <p className="text-sm text-muted-foreground truncate">{u.email}</p>
//                   </div>
//                   <span className={`text-xs font-medium px-2 py-1 rounded-full border flex-shrink-0 ${meta.color}`}>
//                     {meta.label}
//                   </span>
//                 </div>

//                 <div className="flex items-center gap-2 flex-shrink-0">
//                   <button
//                     onClick={() => handleAction(u.id, 'reject')}
//                     disabled={isActioning}
//                     className="w-9 h-9 rounded-xl border border-border text-muted-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex items-center justify-center disabled:opacity-50"
//                     title="Reject"
//                   >
//                     <X size={16} />
//                   </button>
//                   <button
//                     onClick={() => handleAction(u.id, 'approve')}
//                     disabled={isActioning}
//                     className="px-4 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
//                   >
//                     {isActioning ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
//                     Approve
//                   </button>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }
'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // wait for auth-context to finish reading localStorage

    if (!user) {
      // Not logged in at all
      router.replace('/login');
      return;
    }

    if (user.role !== 'admin') {
      // Logged in, but not an admin — bounce to their own dashboard
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  // While we're checking, or if the redirect hasn't kicked in yet, show a blocker
  // instead of flashing the admin UI to a non-admin user.
  if (isLoading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}