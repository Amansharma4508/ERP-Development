'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { authenticatedFetch } from '@/lib/api';
import { ShoppingCart, Search, Eye, Download, Package } from 'lucide-react';

interface OrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  shippingAddress: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export default function EcommerceOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  const fetchOrders = useCallback(async () => {
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
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderItem['status']) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

    if (!token) return;
    try {
      const res = await authenticatedFetch('/api/ecommerce/orders', token, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to update order status');
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const orderNum = o.orderNumber?.toLowerCase() || '';
    const custName = o.customerName?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return orderNum.includes(query) || custName.includes(query);
  });

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="text-primary" /> Order Management System (OMS)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track customer orders, manage fulfillment statuses, and generate tax invoices.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search order no, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl w-full" />
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-4 font-semibold">Order ID</th>
                  <th className="p-4 font-semibold">Customer</th>
                  <th className="p-4 font-semibold">Total Amount</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition">
                    <td className="p-4 font-medium text-foreground">{order.orderNumber}</td>
                    <td className="p-4">
                      <p className="font-semibold text-foreground">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                    </td>
                    <td className="p-4 font-semibold text-foreground">₹{order.totalAmount}</td>
                    <td className="p-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderItem['status'])}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
                          order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/40' :
                          order.status === 'shipped' ? 'bg-blue-500/20 text-blue-700 border-blue-500/40' :
                          order.status === 'processing' ? 'bg-purple-500/20 text-purple-700 border-purple-500/40' :
                          order.status === 'cancelled' ? 'bg-red-500/15 text-red-600 border-red-500/30' :
                          'bg-amber-500/15 text-amber-700 border-amber-500/30'
                        }`}
                      >
                        <option value="pending">⏳ Pending</option>
                        <option value="processing">🔄 Processing</option>
                        <option value="shipped">🚚 Shipped</option>
                        <option value="delivered">✅ Delivered</option>
                        <option value="cancelled">❌ Cancelled</option>
                      </select>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        title="View Invoice & Details"
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
          <Package size={48} className="mx-auto mb-3 opacity-30 text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-lg">No Orders Found</h3>
          <p className="text-sm text-muted-foreground mt-1">Customer orders will appear here automatically.</p>
        </div>
      )}

      {/* Invoice & Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-card w-full max-w-xl rounded-3xl border border-border p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-bold text-lg text-foreground">Tax Invoice / Receipt</h3>
                <p className="text-xs text-muted-foreground">Order ID: {selectedOrder.orderNumber}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="space-y-4 text-sm bg-muted/20 p-4 rounded-2xl border border-border/60">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Billed To:</p>
                  <p className="font-bold text-foreground text-base">{selectedOrder.customerName}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder.customerEmail}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Shipping Address:</p>
                  <p className="font-medium text-foreground max-w-xs">{selectedOrder.shippingAddress}</p>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Order Items:</p>
                <div className="space-y-2">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between bg-background p-2.5 rounded-xl border border-border">
                        <span>{item.name} (Qty: {item.quantity})</span>
                        <span className="font-semibold">₹{item.price * item.quantity}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No item details recorded, total amount billed directly.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center font-bold text-lg pt-3 border-t border-border text-foreground">
                <span>Grand Total:</span>
                <span className="text-primary">₹{selectedOrder.totalAmount}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                onClick={handlePrintInvoice}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-md"
              >
                <Download size={16} /> Download / Print PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}