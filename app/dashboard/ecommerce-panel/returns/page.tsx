'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { authenticatedFetch } from '@/lib/api';
import { RotateCcw, Search, Eye, RefreshCw, PackageX } from 'lucide-react';

interface ReturnItem {
  id: string;
  returnNumber: string;
  orderNumber: string;
  customerName: string;
  reason: string;
  requestType: 'return' | 'replacement';
  status: 'requested' | 'approved' | 'rejected' | 'refunded' | 'replaced';
  createdAt: string;
}

export default function EcommerceReturnsPage() {
  const { token } = useAuth();
  const [returnsList, setReturnsList] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<ReturnItem | null>(null);

  const fetchReturns = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await authenticatedFetch('/api/ecommerce/returns', token);
      const data = await res.json();
      if (res.ok && data.success) {
        setReturnsList(data.returns);
      }
    } catch (error) {
      console.error('Failed to load return requests:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const handleStatusChange = async (returnId: string, newStatus: ReturnItem['status']) => {
    setReturnsList(returnsList.map(r => r.id === returnId ? { ...r, status: newStatus } : r));

    if (!token) return;
    try {
      const res = await authenticatedFetch('/api/ecommerce/returns', token, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: returnId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to update return status');
        fetchReturns();
      }
    } catch (error) {
      console.error('Error updating return status:', error);
    }
  };

  const filteredReturns = returnsList.filter((r) => {
    const retNum = r.returnNumber?.toLowerCase() || '';
    const ordNum = r.orderNumber?.toLowerCase() || '';
    const custName = r.customerName?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return retNum.includes(query) || ordNum.includes(query) || custName.includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <RotateCcw className="text-primary" /> Returns & Refunds (RMA)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage customer return requests, replacement workflows, and track refund statuses.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search return #, order #, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Returns Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl w-full" />
          ))}
        </div>
      ) : filteredReturns.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-4 font-semibold">Return ID</th>
                  <th className="p-4 font-semibold">Order ID</th>
                  <th className="p-4 font-semibold">Customer</th>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold">Reason</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredReturns.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition">
                    <td className="p-4 font-medium text-foreground">{item.returnNumber}</td>
                    <td className="p-4 font-medium text-muted-foreground">{item.orderNumber}</td>
                    <td className="p-4 font-semibold text-foreground">{item.customerName}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        item.requestType === 'replacement' ? 'bg-indigo-500/15 text-indigo-600' : 'bg-orange-500/15 text-orange-600'
                      }`}>
                        {item.requestType === 'replacement' ? <RefreshCw size={12} /> : <RotateCcw size={12} />}
                        {item.requestType.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground truncate max-w-xs">{item.reason}</td>
                    <td className="p-4">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as ReturnItem['status'])}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
                          item.status === 'refunded' ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/40' :
                          item.status === 'replaced' ? 'bg-blue-500/20 text-blue-700 border-blue-500/40' :
                          item.status === 'approved' ? 'bg-purple-500/20 text-purple-700 border-purple-500/40' :
                          item.status === 'rejected' ? 'bg-red-500/15 text-red-600 border-red-500/30' :
                          'bg-amber-500/15 text-amber-700 border-amber-500/30'
                        }`}
                      >
                        <option value="requested">⏳ Requested</option>
                        <option value="approved">✔️ Approved</option>
                        <option value="refunded">💰 Refunded</option>
                        <option value="replaced">🔄 Replaced</option>
                        <option value="rejected">❌ Rejected</option>
                      </select>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedReturn(item)}
                        title="View Details"
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition inline-block"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <PackageX size={48} className="mx-auto mb-3 opacity-30 text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-lg">No Return Requests</h3>
          <p className="text-sm text-muted-foreground mt-1">Customer return or replacement claims will appear here.</p>
        </div>
      )}

      {/* Details Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="font-bold text-lg text-foreground">Return Request Details</h3>
              <button onClick={() => setSelectedReturn(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <p><strong>Return ID:</strong> {selectedReturn.returnNumber}</p>
              <p><strong>Order ID:</strong> {selectedReturn.orderNumber}</p>
              <p><strong>Customer Name:</strong> {selectedReturn.customerName}</p>
              <p><strong>Request Type:</strong> <span className="uppercase font-semibold">{selectedReturn.requestType}</span></p>
              <div className="bg-muted/30 p-3 rounded-2xl border border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Reason for Claim:</p>
                <p className="text-foreground font-medium">{selectedReturn.reason}</p>
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-border">
              <button
                onClick={() => setSelectedReturn(null)}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}