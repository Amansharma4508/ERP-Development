"use client";
import React, { useState, useEffect } from "react";
import { Ticket, Plus, Trash2, Edit3, Loader2, CheckCircle2, X } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: "percentage" | "flat";
  discount_value: number;
  min_order_value: number;
  expires_at: string;
  is_active: boolean;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage" as "percentage" | "flat",
    discount_value: "",
    min_order_value: "",
    expires_at: "",
    is_active: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ecommerce/coupons");
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error("Failed to load coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      min_order_value: "",
      expires_at: "",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_order_value: String(coupon.min_order_value || ""),
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : "",
      is_active: coupon.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmitCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      const url = "/api/ecommerce/coupons";
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { ...formData, id: editingId } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(editingId ? "Coupon updated successfully!" : "Coupon created successfully!");
        setIsModalOpen(false);
        fetchCoupons();
      } else {
        alert(`Error: ${data.error || "Operation failed"}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const res = await fetch(`/api/ecommerce/coupons?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons(prev => prev.filter(c => c.id !== id));
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Ticket className="w-7 h-7 text-indigo-600" /> Coupons & Rewards Manager
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage database discount coupons, edit or remove old ones.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-indigo-900 hover:bg-indigo-950 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> {successMessage}
        </div>
      )}

      {/* Coupons Grid */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
          <span>Active & Saved Coupons</span>
          <span className="text-xs bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-full font-bold">
            {coupons.length} Total
          </span>
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : coupons.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-indigo-900 text-white text-xs font-extrabold px-3 py-1 rounded-lg uppercase tracking-wide">
                      {coupon.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${coupon.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{coupon.description || "No description."}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200/60 text-xs space-y-1 text-gray-500 font-medium">
                  <div className="flex items-center justify-between">
                    <span>Discount:</span>
                    <span className="font-bold text-gray-800">
                      {coupon.discount_type === "percentage" ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Min Order:</span>
                    <span className="font-bold text-gray-800">₹{coupon.min_order_value || 0}</span>
                  </div>
                  {coupon.expires_at && (
                    <div className="flex items-center justify-between">
                      <span>Expires:</span>
                      <span className="font-bold text-gray-800">{new Date(coupon.expires_at).toLocaleDateString()}</span>
                    </div>
                  )}

                  {/* Edit & Delete Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 mt-2 border-t border-gray-200/40">
                    <button
                      onClick={() => openEditModal(coupon)}
                      className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition"
                      title="Edit Coupon"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
            <Ticket className="w-12 h-12 text-gray-300 mb-2" />
            <p className="font-semibold text-gray-700">No coupons found in database</p>
            <p className="text-xs text-gray-400 mt-1">Click on "Add Coupon" above to create one.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editingId ? "Edit Coupon" : "Create New Coupon"}
            </h2>

            <form onSubmit={handleSubmitCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Coupon Code</label>
                <input
                  type="text"
                  name="code"
                  required
                  placeholder="e.g. SAVE20"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm uppercase font-semibold text-gray-800 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="e.g. Get 20% off on your cart"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Type</label>
                  <select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-indigo-600 font-medium"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                    Value ({formData.discount_type === "percentage" ? "%" : "₹"})
                  </label>
                  <input
                    type="number"
                    name="discount_value"
                    required
                    placeholder="10"
                    value={formData.discount_value}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    name="min_order_value"
                    placeholder="0"
                    value={formData.min_order_value}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Expiry Date</label>
                  <input
                    type="date"
                    name="expires_at"
                    value={formData.expires_at}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">Active Coupon</label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-900 hover:bg-indigo-950 text-white py-3 rounded-xl font-bold transition shadow-md flex items-center justify-center gap-2 mt-4"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? "Update Coupon" : "Save Coupon")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}