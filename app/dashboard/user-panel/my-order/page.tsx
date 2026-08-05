'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { authenticatedFetch } from '@/lib/api';
import { Package, MapPin, Phone, User, FileText, Download, History, ShoppingBag } from 'lucide-react';

interface OrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  shippingAddress: string;
  sourceLocation?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export default function UserOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [selectedInvoice, setSelectedInvoice] = useState<OrderItem | null>(null);

  const fetchUserOrders = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await authenticatedFetch('/api/ecommerce/orders', token);
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUserOrders();
  }, [fetchUserOrders]);

  const getStatusBanner = (status: OrderItem['status']) => {
    switch (status) {
      case 'pending':
        return { text: '⏳ Order placed successfully and awaiting confirmation.', bg: 'bg-amber-500/15 text-amber-700 border-amber-500/30' };
      case 'processing':
        return { text: '🔄 Your order is being packed and prepared for shipment at the warehouse.', bg: 'bg-purple-500/15 text-purple-700 border-purple-500/30' };
      case 'shipped':
        return { text: '🚚 Your order is on the way! Out for delivery to your location.', bg: 'bg-blue-500/15 text-blue-700 border-blue-500/30' };
      case 'delivered':
        return { text: '✅ Order delivered successfully. Thank you for shopping with us!', bg: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' };
      case 'cancelled':
        return { text: '❌ This order has been cancelled.', bg: 'bg-red-500/15 text-red-600 border-red-500/30' };
      default:
        return { text: '📦 Processing your order details.', bg: 'bg-muted text-muted-foreground border-border' };
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const historyOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="text-primary" /> My Orders & History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track active live shipments and view completed order history with downloadable tax invoices.
          </p>
        </div>

        <div className="flex bg-muted p-1 rounded-2xl border border-border">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'active' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShoppingBag size={14} /> Active Orders ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'history' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <History size={14} /> Order History ({historyOrders.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-2xl w-full" />
          ))}
        </div>
      ) : activeTab === 'active' ? (
        activeOrders.length > 0 ? (
          <div className="space-y-6">
            {activeOrders.map((order) => {
              const banner = getStatusBanner(order.status);
              return (
                <div key={order.id} className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5 transition hover:shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Reference</span>
                      <h3 className="font-bold text-lg text-foreground">{order.orderNumber}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Amount</span>
                      <p className="font-bold text-primary text-lg">₹{order.totalAmount}</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-3 ${banner.bg}`}>
                    <span className="w-2.5 h-2.5 rounded-full animate-pulse bg-current" />
                    <span>{banner.text}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-2xl border border-border/60">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin size={13} className="text-primary" /> Dispatched From (Warehouse)
                      </span>
                      <p className="font-medium text-foreground text-xs sm:text-sm">
                        {order.sourceLocation || 'Central Medical Hub, Phase 7, SAS Nagar, Punjab'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <User size={13} className="text-primary" /> Delivery Address & Contact
                      </span>
                      <p className="font-medium text-foreground text-xs sm:text-sm">{order.shippingAddress}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 pt-0.5">
                        <Phone size={11} /> {order.customerName} ({order.customerEmail || 'Contact verified'})
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-card border border-border rounded-3xl">
            <Package size={48} className="mx-auto mb-3 opacity-30 text-muted-foreground" />
            <h3 className="font-semibold text-foreground text-lg">No Active Orders</h3>
            <p className="text-sm text-muted-foreground mt-1">You currently have no active or in-transit shipments.</p>
          </div>
        )
      ) : (
        historyOrders.length > 0 ? (
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="p-4 font-semibold">Order ID</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Source Store</th>
                    <th className="p-4 font-semibold">Delivery Address</th>
                    <th className="p-4 font-semibold">Total Paid</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Invoice / PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {historyOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition">
                      <td className="p-4 font-bold text-foreground">{order.orderNumber}</td>
                      <td className="p-4 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-xs text-muted-foreground">{order.sourceLocation || 'Central Medical Hub, SAS Nagar'}</td>
                      <td className="p-4 text-xs font-medium text-foreground max-w-xs truncate">{order.shippingAddress}</td>
                      <td className="p-4 font-bold text-primary">₹{order.totalAmount}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          order.status === 'delivered' ? 'bg-emerald-500/15 text-emerald-700' : 'bg-red-500/15 text-red-600'
                        }`}>
                          {order.status === 'delivered' ? '✅ Delivered' : '❌ Cancelled'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedInvoice(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition"
                        >
                          <FileText size={14} /> View Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-card border border-border rounded-3xl">
            <History size={48} className="mx-auto mb-3 opacity-30 text-muted-foreground" />
            <h3 className="font-semibold text-foreground text-lg">No Order History</h3>
            <p className="text-sm text-muted-foreground mt-1">Delivered or past completed orders will appear here.</p>
          </div>
        )
      )}

      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-card w-full max-w-xl rounded-3xl border border-border p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-bold text-lg text-foreground">Official Tax Invoice</h3>
                <p className="text-xs text-muted-foreground">Order ID: {selectedInvoice.orderNumber}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="space-y-4 text-sm bg-muted/20 p-4 rounded-2xl border border-border/60">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Billed To:</p>
                  <p className="font-bold text-foreground">{selectedInvoice.customerName}</p>
                  <p className="text-xs text-muted-foreground">{selectedInvoice.shippingAddress}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Dispatched From:</p>
                  <p className="text-xs text-foreground font-medium">{selectedInvoice.sourceLocation || 'Central Medical Hub, SAS Nagar'}</p>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Purchased Items & Price:</p>
                <div className="space-y-2">
                  {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                    selectedInvoice.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between bg-background p-2.5 rounded-xl border border-border">
                        <span>{item.name} (Qty: {item.quantity})</span>
                        <span className="font-semibold">₹{item.price * item.quantity}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between bg-background p-2.5 rounded-xl border border-border">
                      <span>Standard Order Billing</span>
                      <span className="font-semibold">₹{selectedInvoice.totalAmount}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center font-bold text-base pt-3 border-t border-border text-foreground">
                <span>Total Amount Paid:</span>
                <span className="text-primary">₹{selectedInvoice.totalAmount}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-md"
              >
                <Download size={16} /> Download / Print Invoice PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}