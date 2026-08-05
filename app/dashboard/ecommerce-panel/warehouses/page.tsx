'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { authenticatedFetch } from '@/lib/api';
import { Plus, AlertTriangle, CheckCircle, Search, Trash2, Warehouse, Eye, X, Phone, User, MapPin, FileText, Tag } from 'lucide-react';

interface WarehouseItem {
  id: string;
  name: string;
  ownerName: string;
  contactNumber: string;
  address: string;
  licenseNumber: string;
  warehouseType: string;
  status: 'active' | 'inactive' | 'hold';
}

export default function EcommerceWarehousesPage() {
  const { token } = useAuth();

  // Warehouses State with 2-3 Dummy/Initial records
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([
    {
      id: 'dummy-1',
      name: 'Apex Pharma Hub',
      ownerName: 'Rajesh Kumar',
      contactNumber: '+91 9876543210',
      address: 'Industrial Area Phase 7, Sahibzada Ajit Singh Nagar, Punjab',
      licenseNumber: 'PB-SAS-2024-9812',
      warehouseType: 'Pharmaceuticals & Surgical Items',
      status: 'active',
    },
    {
      id: 'dummy-2',
      name: 'MediCare Logistics',
      ownerName: 'Gurpreet Singh',
      contactNumber: '+91 9123456789',
      address: 'Transport Nagar, Ludhiana, Punjab',
      licenseNumber: 'PB-LDH-2023-4410',
      warehouseType: 'Cold Storage & Bulk Medicines',
      status: 'hold',
    },
    {
      id: 'dummy-3',
      name: 'Lifeline Distributors',
      ownerName: 'Amit Sharma',
      contactNumber: '+91 9988776655',
      address: 'G.T. Road, Jalandhar, Punjab',
      licenseNumber: 'PB-JAL-2025-1123',
      warehouseType: 'Over-the-Counter (OTC) & Cosmetics',
      status: 'active',
    }
  ]);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [viewWarehouseModal, setViewWarehouseModal] = useState<WarehouseItem | null>(null);
  const [warehouseSubmitting, setWarehouseSubmitting] = useState(false);

  // Warehouse Form State
  const [whName, setWhName] = useState('');
  const [whOwner, setWhOwner] = useState('');
  const [whContact, setWhContact] = useState('');
  const [whAddress, setWhAddress] = useState('');
  const [whLicense, setWhLicense] = useState('');
  const [whType, setWhType] = useState('');
  const [whStatus, setWhStatus] = useState<'active' | 'inactive' | 'hold'>('active');

  // Fetch Warehouses from DB
  const fetchWarehousesData = useCallback(async () => {
    if (!token) return;
    try {
      setWarehouseLoading(true);
      const res = await authenticatedFetch('/api/ecommerce/warehouses', token);
      const data = await res.json();
      if (res.ok && data.success && data.warehouses && data.warehouses.length > 0) {
        setWarehouses(data.warehouses);
      }
    } catch (error) {
      console.error('Failed to load warehouses data:', error);
    } finally {
      setWarehouseLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWarehousesData();
  }, [fetchWarehousesData]);

  // Handle Add Warehouse to DB
  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setWarehouseSubmitting(true);
      const res = await authenticatedFetch('/api/ecommerce/warehouses', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: whName,
          ownerName: whOwner,
          contactNumber: whContact,
          address: whAddress,
          licenseNumber: whLicense,
          warehouseType: whType,
          status: whStatus,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsWarehouseModalOpen(false);
        setWhName('');
        setWhOwner('');
        setWhContact('');
        setWhAddress('');
        setWhLicense('');
        setWhType('');
        setWhStatus('active');
        fetchWarehousesData();
      } else {
        const newWh: WarehouseItem = {
          id: Date.now().toString(),
          name: whName,
          ownerName: whOwner,
          contactNumber: whContact,
          address: whAddress,
          licenseNumber: whLicense,
          warehouseType: whType,
          status: whStatus,
        };
        setWarehouses([newWh, ...warehouses]);
        setIsWarehouseModalOpen(false);
        setWhName('');
        setWhOwner('');
        setWhContact('');
        setWhAddress('');
        setWhLicense('');
        setWhType('');
        setWhStatus('active');
      }
    } catch (error) {
      console.error('Error adding warehouse:', error);
    } finally {
      setWarehouseSubmitting(false);
    }
  };

  // Handle Delete Warehouse from DB
  const handleDeleteWarehouse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) return;
    
    if (id.startsWith('dummy-')) {
      setWarehouses(warehouses.filter(w => w.id !== id));
      return;
    }

    if (!token) return;

    try {
      const res = await authenticatedFetch('/api/ecommerce/warehouses', token, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fetchWarehousesData();
      } else {
        setWarehouses(warehouses.filter(w => w.id !== id));
      }
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      setWarehouses(warehouses.filter(w => w.id !== id));
    }
  };

  const filteredWarehouses = warehouses.filter((w) =>
    (w.name && w.name.toLowerCase().includes(warehouseSearch.toLowerCase())) ||
    (w.ownerName && w.ownerName.toLowerCase().includes(warehouseSearch.toLowerCase())) ||
    (w.warehouseType && w.warehouseType.toLowerCase().includes(warehouseSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Warehouse className="text-primary" /> Supply Warehouses Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage authorized sourcing warehouses, owner contacts, licenses, and product fulfillment statuses.
          </p>
        </div>
        <div>
          <button
            onClick={() => setIsWarehouseModalOpen(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium shadow hover:opacity-90 transition"
          >
            <Plus size={18} /> Add Warehouse
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search warehouse, owner, type..."
            value={warehouseSearch}
            onChange={(e) => setWarehouseSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Warehouses Table */}
      {warehouseLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl w-full" />
          ))}
        </div>
      ) : filteredWarehouses.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-4 font-semibold w-16">Sr. No.</th>
                  <th className="p-4 font-semibold">Warehouse Name</th>
                  <th className="p-4 font-semibold">Owner Name</th>
                  <th className="p-4 font-semibold">Contact Number</th>
                  <th className="p-4 font-semibold">Address</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredWarehouses.map((wh, index) => (
                  <tr key={wh.id} className="hover:bg-muted/30 transition">
                    <td className="p-4 font-medium text-muted-foreground">{index + 1}</td>
                    <td className="p-4 font-medium text-foreground">{wh.name}</td>
                    <td className="p-4 text-foreground">{wh.ownerName || <span className="text-muted-foreground italic">N/A</span>}</td>
                    <td className="p-4 text-muted-foreground">{wh.contactNumber || <span className="text-muted-foreground italic">N/A</span>}</td>
                    <td className="p-4 text-muted-foreground truncate max-w-xs">{wh.address || <span className="text-muted-foreground italic">N/A</span>}</td>
                    <td className="p-4">
                      {/* Interactive Status Dropdown with Highlighting Colors */}
                      <select
  value={wh.status}
  onChange={async (e) => {
    const newStatus = e.target.value as 'active' | 'inactive' | 'hold';
    
    // 1. Optimistic UI update (turant screen par reflect ho)
    setWarehouses(warehouses.map(item => item.id === wh.id ? { ...item, status: newStatus } : item));

    // 2. Dummy records ke liye database request skip karein
    if (wh.id.startsWith('dummy-')) return;

    // 3. Database mein status update karein via PATCH API
    if (!token) return;
    try {
      const res = await authenticatedFetch('/api/ecommerce/warehouses', token, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wh.id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to update status in database');
        fetchWarehousesData(); // Revert on failure
      }
    } catch (error) {
      console.error('Error updating warehouse status:', error);
    }
  }}
  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
    wh.status === 'active'
      ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/40 font-bold shadow-sm'
      : wh.status === 'inactive'
      ? 'bg-red-500/15 text-red-600 border-red-500/30'
      : 'bg-amber-500/15 text-amber-600 border-amber-500/30'
  }`}
>
  <option value="active" className="bg-background text-emerald-600 font-semibold">🟢 Active</option>
  <option value="inactive" className="bg-background text-red-600 font-semibold">🔴 Inactive</option>
  <option value="hold" className="bg-background text-amber-600 font-semibold">🟡 Products Hold</option>
</select>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setViewWarehouseModal(wh)}
                        title="View Details"
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition inline-block"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteWarehouse(wh.id)}
                        title="Delete Warehouse"
                        className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-xl transition inline-block"
                      >
                        <Trash2 size={16} />
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
          <Warehouse size={48} className="mx-auto mb-3 opacity-30 text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-lg">No Warehouses Found</h3>
          <p className="text-sm text-muted-foreground mt-1">Add sourcing warehouses to manage stock logistics.</p>
        </div>
      )}

      {/* Add Warehouse Modal */}
      {isWarehouseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Warehouse size={20} />
                </div>
                <h3 className="font-bold text-lg text-foreground">Add New Supply Warehouse</h3>
              </div>
              <button 
                onClick={() => setIsWarehouseModalOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddWarehouse} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Warehouse Name</label>
                <input
                  type="text"
                  required
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  placeholder="e.g. Apex Pharma Hub"
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Warehouse Owner Name</label>
                  <input
                    type="text"
                    required
                    value={whOwner}
                    onChange={(e) => setWhOwner(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Number</label>
                  <input
                    type="text"
                    required
                    value={whContact}
                    onChange={(e) => setWhContact(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Address</label>
                <textarea
                  required
                  rows={2}
                  value={whAddress}
                  onChange={(e) => setWhAddress(e.target.value)}
                  placeholder="Full warehouse location address..."
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Licence Number</label>
                  <input
                    type="text"
                    required
                    value={whLicense}
                    onChange={(e) => setWhLicense(e.target.value)}
                    placeholder="e.g. PB-SAS-2024-9812"
                    className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Warehouse Type (Products)</label>
                  <input
                    type="text"
                    required
                    value={whType}
                    onChange={(e) => setWhType(e.target.value)}
                    placeholder="e.g. Pharmaceuticals"
                    className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                <select
                  value={whStatus}
                  onChange={(e) => setWhStatus(e.target.value as 'active' | 'inactive' | 'hold')}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="hold">Products Hold</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsWarehouseModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={warehouseSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition shadow-md"
                >
                  {warehouseSubmitting ? 'Saving...' : 'Save Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Warehouse Detail Modal */}
      {viewWarehouseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <Warehouse size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{viewWarehouseModal.name}</h3>
                  <span className="text-xs text-muted-foreground">Detailed warehouse overview</span>
                </div>
              </div>
              <button 
                onClick={() => setViewWarehouseModal(null)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-muted/30 p-3.5 rounded-2xl border border-border/60 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User size={13} className="text-primary" /> Warehouse Owner
                </span>
                <p className="font-semibold text-foreground text-base pt-0.5">
                  {viewWarehouseModal.ownerName || <span className="text-muted-foreground italic font-normal text-sm">Not provided</span>}
                </p>
              </div>

              <div className="bg-muted/30 p-3.5 rounded-2xl border border-border/60 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Phone size={13} className="text-primary" /> Phone Number
                </span>
                <p className="font-semibold text-foreground text-base pt-0.5">
                  {viewWarehouseModal.contactNumber || <span className="text-muted-foreground italic font-normal text-sm">Not provided</span>}
                </p>
              </div>

              <div className="sm:col-span-2 bg-muted/30 p-3.5 rounded-2xl border border-border/60 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={13} className="text-primary" /> Complete Address
                </span>
                <p className="font-medium text-foreground pt-0.5 leading-relaxed">
                  {viewWarehouseModal.address || <span className="text-muted-foreground italic">Not provided</span>}
                </p>
              </div>

              <div className="bg-muted/30 p-3.5 rounded-2xl border border-border/60 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={13} className="text-primary" /> Licence Number
                </span>
                <p className="font-semibold text-foreground pt-0.5 font-mono text-xs">
                  {viewWarehouseModal.licenseNumber || <span className="text-muted-foreground italic font-normal font-sans">Not provided</span>}
                </p>
              </div>

              <div className="bg-muted/30 p-3.5 rounded-2xl border border-border/60 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Tag size={13} className="text-primary" /> Warehouse Type
                </span>
                <p className="font-semibold text-foreground pt-0.5">
                  {viewWarehouseModal.warehouseType || <span className="text-muted-foreground italic font-normal">Not provided</span>}
                </p>
              </div>

              <div className="sm:col-span-2 bg-muted/30 p-3.5 rounded-2xl border border-border/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Status</span>
                <div>
                  {viewWarehouseModal.status === 'active' && (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-700 border border-emerald-500/30">
                      <CheckCircle size={13} /> Active
                    </span>
                  )}
                  {viewWarehouseModal.status === 'inactive' && (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-600 border border-red-500/30">
                      <X size={13} /> Inactive
                    </span>
                  )}
                  {viewWarehouseModal.status === 'hold' && (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                      <AlertTriangle size={13} /> Products Hold
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <button
                onClick={() => setViewWarehouseModal(null)}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-md"
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