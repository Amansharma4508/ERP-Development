'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { authenticatedFetch } from '@/lib/api';
import { Package, Plus, Store, X, Layers, UploadCloud, ArrowLeft, Edit3, Tag, Building2 } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  manufacturer?: string;
  category_id?: string;
  categories?: { name: string };
}

interface Category {
  id: string;
  name: string;
}

export default function EcommerceProductsPage() {
  const { token, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Views state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  // Selected product for Detail Page View
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Edit mode state for Admin
  const [isEditing, setIsEditing] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Product Form State (Manufacturer alag rakha hai description se)
  const [productId, setProductId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await authenticatedFetch('/api/ecommerce/products', token);
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Non-JSON response received");
        return;
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setProducts(data.products || []);
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Create or Update Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setSubmitting(true);
      const endpoint = '/api/ecommerce/products';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        id: productId,
        title,
        description,
        manufacturer,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        category_id: categoryId || null,
        image_url: imageUrl,
        seller_id: user?.id,
      };

      const res = await authenticatedFetch(endpoint, token, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response from server:", text);
        alert("Server error: Endpoint returned an invalid format.");
        return;
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setIsProductModalOpen(false);
        
        if (isEditing && productId) {
          const updatedProd: Product = {
            id: productId,
            title,
            description,
            manufacturer,
            price: parseFloat(price),
            stock: parseInt(stock, 10),
            category_id: categoryId || undefined,
            image_url: imageUrl,
            categories: categories.find(c => c.id === categoryId) ? { name: categories.find(c => c.id === categoryId)!.name } : selectedProduct?.categories
          };
          setSelectedProduct(updatedProd);
        }

        resetProductForm();
        fetchData();
      } else {
        alert(data.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Network or server error while saving product.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetProductForm = () => {
    setProductId(null);
    setTitle('');
    setDescription('');
    setManufacturer('');
    setPrice('');
    setStock('');
    setCategoryId('');
    setImageUrl('');
    setIsEditing(false);
  };

  const openEditModal = (product: Product) => {
    setProductId(product.id);
    setTitle(product.title);
    setDescription(product.description || '');
    setManufacturer(product.manufacturer || '');
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setCategoryId(product.category_id || '');
    setImageUrl(product.image_url || '');
    setIsEditing(true);
    setIsProductModalOpen(true);
  };

  const handleCancelForm = () => {
    const confirmDiscard = window.confirm("Discard changes? Unsaved edits will be lost.");
    if (confirmDiscard) {
      setIsProductModalOpen(false);
      resetProductForm();
    }
  };

  // Handle Category Creation
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setSubmitting(true);
      const res = await authenticatedFetch('/api/ecommerce/categories', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName, description: catDesc }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsCategoryModalOpen(false);
        setCatName(''); setCatDesc('');
        fetchData();
      } else {
        alert(data.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Bulk Excel File Upload (.xlsx)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const res = await authenticatedFetch('/api/ecommerce/import-products', token, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert(data.message);
        fetchData();
      } else {
        alert(`Import failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Something went wrong during bulk upload.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // =========================================================================
  // VIEW 1: ADMIN PRODUCT DETAIL PAGE
  // =========================================================================
  if (selectedProduct && !isProductModalOpen) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setSelectedProduct(null); resetProductForm(); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-foreground hover:bg-muted transition font-medium text-sm shadow-sm"
          >
            <ArrowLeft size={16} /> Back to Products
          </button>
          
          <button
            onClick={() => openEditModal(selectedProduct)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition font-medium text-sm shadow-sm"
          >
            <Edit3 size={16} /> Edit Product Details
          </button>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-muted/40 p-6 rounded-2xl border border-border/50">
            {selectedProduct.image_url ? (
              <img
                src={selectedProduct.image_url}
                alt={selectedProduct.title}
                className="max-h-96 w-full object-contain rounded-xl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground py-20">
                <Package size={64} className="opacity-30 mb-2" />
                <span className="text-sm">No Image Available</span>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary mb-3">
                <Tag size={12} /> {selectedProduct.categories?.name || 'Uncategorized'}
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{selectedProduct.title}</h1>
              <div className="text-3xl font-extrabold text-primary mt-2">₹{selectedProduct.price}</div>
            </div>

            {/* Manufacturer Display */}
            {selectedProduct.manufacturer && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 size={16} className="text-primary" />
                <span>Manufactured by: <strong className="text-foreground">{selectedProduct.manufacturer}</strong></span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${selectedProduct.stock > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {selectedProduct.stock > 0 ? `In Stock (${selectedProduct.stock} units available)` : 'Out of Stock'}
              </span>
            </div>

            <div className="space-y-2 pt-4 border-t border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line bg-muted/30 p-4 rounded-2xl border border-border/50">
                {selectedProduct.description || 'No description provided for this product.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: PRODUCTS LISTING & MANAGEMENT
  // =========================================================================
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Store className="text-primary" /> Store Products & Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your store catalog, categories, or perform bulk uploads.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className={`cursor-pointer inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium shadow transition ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <UploadCloud size={18} />
            {uploading ? 'Importing...' : 'Import File'}
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" disabled={uploading} />
          </label>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-xl font-medium shadow hover:opacity-90 transition"
          >
            <Layers size={18} /> Add Category
          </button>
          <button
            onClick={() => { resetProductForm(); setIsProductModalOpen(true); }}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium shadow hover:opacity-90 transition"
          >
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3 cursor-pointer hover:border-primary/50 transition group flex flex-col justify-between"
            >
              <div>
                {product.image_url && (
                  <div className="w-full h-40 rounded-xl overflow-hidden bg-muted mb-3 relative">
                    <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground text-lg line-clamp-1 group-hover:text-primary transition">{product.title}</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                    Stock: {product.stock}
                  </span>
                </div>
                {product.manufacturer && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Building2 size={12} /> {product.manufacturer}
                  </p>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
                <span className="text-xl font-bold text-foreground">₹{product.price}</span>
                <span className="text-xs text-primary font-medium bg-primary/10 px-2.5 py-1 rounded-lg">
                  View Details &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <Package size={48} className="mx-auto mb-3 opacity-30 text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-lg">No Products Found</h3>
          <p className="text-sm text-muted-foreground mt-1">Upload an Excel file or add products manually.</p>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-lg text-foreground">
                {isEditing ? 'Edit Product Details' : 'Add New Product'}
              </h3>
              <button onClick={handleCancelForm} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Product Title</label>
                <input 
                  type="text" 
                  required 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Paracetamol 500mg" 
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" 
                />
              </div>

              {/* Manufacturer Field (Alag se) */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Manufacturer / Brand</label>
                <input 
                  type="text" 
                  value={manufacturer} 
                  onChange={(e) => setManufacturer(e.target.value)} 
                  placeholder="e.g. LEKAR PHARMA LTD" 
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" 
                />
              </div>

              {/* Description Textarea */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
                <textarea 
                  rows={3} 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Enter detailed product or medicine description..." 
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Price (₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    placeholder="150" 
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" 
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock Qty</label>
                  <input 
                    type="number" 
                    required 
                    value={stock} 
                    onChange={(e) => setStock(e.target.value)} 
                    placeholder="50" 
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</label>
                <select 
                  value={categoryId} 
                  onChange={(e) => setCategoryId(e.target.value)} 
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Image URL</label>
                <input 
                  type="url" 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  placeholder="https://example.com/image.jpg" 
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button 
                  type="button" 
                  onClick={handleCancelForm} 
                  className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (isEditing ? 'Update Product' : 'Save Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-lg text-foreground">Add New Category</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category Name</label>
                <input type="text" required value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Medicines" className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description (Optional)</label>
                <textarea rows={2} value={catDesc} onChange={(e) => setCatDesc(e.target.value)} placeholder="Category details..." className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50">{submitting ? 'Saving...' : 'Save Category'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}