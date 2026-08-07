"use client";
import React, { useState, useEffect } from "react";
import { Ticket, Sparkles, Copy, Check, Loader2 } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: "percentage" | "flat";
  discount_value: number;
  min_order_value: number;
  expires_at: string;
}

export default function UserRewardsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActiveCoupons() {
      try {
        setLoading(true);
        const res = await fetch("/api/ecommerce/coupons");
        const data = await res.json();
        if (res.ok && data.success) {
          // Sirf active coupons filter karna
          setCoupons(data.coupons.filter((c: any) => c.is_active));
        }
      } catch (error) {
        console.error("Failed to load rewards:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchActiveCoupons();
  }, []);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Exclusive Rewards & Offers</h1>
            <p className="text-indigo-200 text-sm mt-0.5">Apply these promo codes at checkout to save big on your orders.</p>
          </div>
        </div>
      </div>

      {/* Coupons List */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Available Coupons ({coupons.length})</h2>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : coupons.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-indigo-50 text-indigo-900 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase">
                  {coupon.discount_type === "percentage" ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket className="w-5 h-5 text-indigo-600" />
                    <span className="font-extrabold text-gray-900 tracking-wider text-sm">{coupon.code}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{coupon.description || "Special discount offer for your order."}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Min Order: <strong className="text-gray-700">₹{coupon.min_order_value || 0}</strong></span>
                  <button
                    onClick={() => copyToClipboard(coupon.code)}
                    className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 px-3 py-1.5 rounded-lg font-bold transition"
                  >
                    {copiedCode === coupon.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="font-bold text-gray-700">No active rewards available right now</p>
            <p className="text-xs text-gray-400 mt-1">Check back later for exciting new offers!</p>
          </div>
        )}
      </div>
    </div>
  );
}