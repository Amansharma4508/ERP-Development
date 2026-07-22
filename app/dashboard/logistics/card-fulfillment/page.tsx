'use client';

import { useEffect, useState, useCallback } from 'react';
import { CreditCard, Search, Eye, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface CardPrintUserItem {
  id: string;
  batch_id: string;
  user_name: string;
  phone: string;
  card_number: string;
  digital_card_url?: string;
  status: 'assigned' | 'in-progress' | 'printed' | 'pending';
  printed_at?: string;
  created_at: string;
}

export default function CardFulfillmentPage() {
  const [cardItems, setCardItems] = useState<CardPrintUserItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'in-progress' | 'printed' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<CardPrintUserItem | null>(null);

  const fetchCardItems = useCallback(async () => {
    try {
      const res = await fetch('/api/logistics/card-items');
      const data = await res.json();
      if (data.success) setCardItems(data.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchCardItems();
  }, [fetchCardItems]);

  const filteredItems = cardItems.filter((item) => {
    const matchesSearch = 
      item.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.card_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalAssigned = cardItems.length;
  const printedCount = cardItems.filter(i => i.status === 'printed').length;
  const inProgressCount = cardItems.filter(i => i.status === 'in-progress').length;
  const pendingCount = cardItems.filter(i => i.status === 'pending' || i.status === 'assigned').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Card Fulfillment & Printing Tracker </h1>
        <p className="text-muted-foreground text-sm mt-1">Live beneficiary user print tracking and digital card inspection</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-2xl text-center">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Total Assigned</p>
          <p className="text-2xl font-bold text-foreground mt-1">{totalAssigned}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center">
          <p className="text-xs font-semibold text-emerald-800 uppercase">Printed (Completed)</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{printedCount}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-center">
          <p className="text-xs font-semibold text-blue-800 uppercase">In-Progress</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{inProgressCount}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-center">
          <p className="text-xs font-semibold text-amber-800 uppercase">Pending</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search User Name, Card No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        <div className="flex gap-1 bg-muted p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {(['all', 'assigned', 'in-progress', 'printed', 'pending'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize whitespace-nowrap ${
                filterStatus === status ? 'bg-white shadow text-purple-700 font-bold' : 'text-muted-foreground'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* User Wise Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-muted-foreground text-xs uppercase font-semibold">
                <th className="px-5 py-3 text-left">User Name</th>
                <th className="px-5 py-3 text-left">Phone</th>
                <th className="px-5 py-3 text-left">Card Number</th>
                <th className="px-5 py-3 text-left">Vendor B Partner</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-center">Digital Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">No records found for this view.</td>
                </tr>
              ) : (
                filteredItems.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50 transition">
                    <td className="px-5 py-3 font-semibold text-foreground">{user.user_name}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{user.phone || 'N/A'}</td>
                    <td className="px-5 py-3 font-mono text-xs font-bold text-purple-700">{user.card_number}</td>
                    <td className="px-5 py-3 text-xs font-medium text-foreground">CardCraft Logistics (Vendor B)</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border inline-block ${
                        user.status === 'printed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        user.status === 'in-progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        user.status === 'assigned' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {user.status === 'printed' ? (
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold transition inline-flex items-center gap-1 border border-purple-200"
                        >
                          <Eye size={13} /> View Digital Proof
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Printing Incomplete</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-border shadow-2xl text-center space-y-4">
            <h3 className="font-bold text-lg text-gray-900">Digital Proof Inspection</h3>
            <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-5 rounded-2xl shadow-lg text-left space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs tracking-wider uppercase opacity-80">Health Wallet Card</p>
                <CreditCard size={20} />
              </div>
              <div>
                <p className="text-lg font-bold">{selectedUser.user_name}</p>
                <p className="text-xs font-mono opacity-90">{selectedUser.card_number}</p>
              </div>
              <div className="flex justify-between items-end text-[10px] opacity-75">
                <p>Status: PRINTED & VERIFIED</p>
                <p>2026 ISSUED</p>
              </div>
            </div>
            <button onClick={() => setSelectedUser(null)} className="w-full bg-black text-white py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 transition">
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}