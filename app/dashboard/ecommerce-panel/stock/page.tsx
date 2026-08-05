'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { authenticatedFetch } from '@/lib/api';
import { Package, Plus, AlertTriangle, CheckCircle, Search, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  manufacturer?: string;
  price: number;
  stock: number;
  categories?: { name: string };
}

export default function EcommerceStockPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Selection state for Bulk Delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal State for Adding Stock
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  const fetchStockData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await authenticatedFetch('/api/ecommerce/products', token);
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts(data.products || []);
        setSelectedIds([]); // Reset selection on fetch
      }
    } catch (error) {
      console.error('Failed to load stock data:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]);

  // Handle Manual Stock/Product Addition
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setSubmitting(true);
      const res = await authenticatedFetch('/api/ecommerce/products', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: manufacturer ? `Mfg: ${manufacturer}` : 'Stock item',
          manufacturer,
          price: parseFloat(price) || 0,
          stock: parseInt(stock, 10) || 0,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setTitle('');
        setManufacturer('');
        setPrice('');
        setStock('');
        fetchStockData();
      } else {
        alert(data.error || 'Failed to add stock');
      }
    } catch (error) {
      console.error('Error adding stock:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Single or Bulk Products from Database
  const handleDelete = async (idsToDelete: string[]) => {
    if (idsToDelete.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${idsToDelete.length} product(s) from database?`)) return;

    if (!token) return;

    try {
      const res = await authenticatedFetch('/api/ecommerce/products', token, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsToDelete }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fetchStockData();
      } else {
        alert(data.error || 'Failed to delete products');
      }
    } catch (error) {
      console.error('Error deleting products:', error);
    }
  };

  // Filter products based on search term and low-stock filter
  const filteredProducts = products.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.manufacturer && item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()));
    const isLow = item.stock <= 10;
    if (filterLowStock) {
      return matchesSearch && isLow;
    }
    return matchesSearch;
  });

  // Handle Select All Checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Handle Individual Checkbox
  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="text-primary" /> Medicine Stock & Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor stock levels, track manufacturer details, manage low-stock alerts, and delete unwanted items.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={() => handleDelete(selectedIds)}
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl font-medium shadow hover:bg-red-700 transition"
            >
              <Trash2 size={18} /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium shadow hover:opacity-90 transition"
          >
            <Plus size={18} /> Add Stock / Product
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search medicine or manufacturer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition border flex items-center gap-2 ${
              filterLowStock
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-background text-foreground border-border hover:bg-muted'
            }`}
          >
            <AlertTriangle size={16} />
            {filterLowStock ? 'Showing Low Stock Only' : 'Filter Low Stock'}
          </button>
        </div>
      </div>

      {/* Stock Table Grid */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl w-full" />
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      style={{ accentColor: '#38bdf8', backgroundColor: '#e0f2fe', colorScheme: 'light' }}
                      className="w-4 h-4 rounded border border-sky-400 bg-sky-100 text-sky-500 focus:ring-sky-400 cursor-pointer appearance-none checked:appearance-auto checked:bg-sky-500"
                      checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="p-4 font-semibold w-16">Sr. No.</th>
                  <th className="p-4 font-semibold">Medicine Name</th>
                  <th className="p-4 font-semibold">Manufacturer</th>
                  <th className="p-4 font-semibold">Price (MRP)</th>
                  <th className="p-4 font-semibold">Stock Quantity</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredProducts.map((item, index) => {
                  const isLowStock = item.stock <= 10;
                  const isChecked = selectedIds.includes(item.id);
                  return (
                    <tr key={item.id} className={`hover:bg-muted/30 transition ${isChecked ? 'bg-primary/5' : ''}`}>
                      <td className="p-4">
                        <input
                          type="checkbox"
                          style={{ accentColor: '#38bdf8', backgroundColor: '#e0f2fe', colorScheme: 'light' }}
                          className="w-4 h-4 rounded border border-sky-400 bg-sky-100 text-sky-500 focus:ring-sky-400 cursor-pointer appearance-none checked:appearance-auto checked:bg-sky-500"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(item.id)}
                        />
                      </td>
                      <td className="p-4 font-medium text-muted-foreground">{index + 1}</td>
                      <td className="p-4 font-medium text-foreground">{item.title}</td>
                      <td className="p-4 text-muted-foreground">{item.manufacturer || 'N/A'}</td>
                      <td className="p-4 font-semibold text-foreground">₹{item.price}</td>
                      <td className="p-4 text-foreground font-semibold">{item.stock} units</td>
                      <td className="p-4">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            <AlertTriangle size={13} /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <CheckCircle size={13} /> In Stock
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete([item.id])}
                          title="Delete Product"
                          className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-xl transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <Package size={48} className="mx-auto mb-3 opacity-30 text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-lg">No Stock Records Found</h3>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filter or add new stock items.</p>
        </div>
      )}

      {/* Add Stock Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-lg text-foreground">Add New Stock / Medicine</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground font-bold">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Medicine Name</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Paracetamol 500mg"
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Manufacturer Name</label>
                <input
                  type="text"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="e.g. Cipla, Sun Pharma"
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Price / MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="120"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="8"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}