"use client";
import React, { useState, useEffect } from "react";
import { Search, ShoppingBag, MapPin, Plus, Minus, Sparkles, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
}

interface Product {
  id: string | number;
  title: string;
  category_id?: string;
  categories?: { name: string };
  unit?: string;
  price: number;
  mrp?: number;
  image_url?: string;
  stock: number;
}

interface CartItem extends Product {
  qty: number;
}

export default function UserShopPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<Record<string | number, CartItem>>({});
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const currentPatientId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  // Fetch Products & Categories from Database API
  useEffect(() => {
    async function fetchStoreData() {
      try {
        setLoading(true);
        const res = await fetch('/api/ecommerce/products');
        const data = await res.json();
        if (res.ok && data.success) {
          // Dynamic categories list with 'All Items' at top
          const fetchedCategories = [
            { id: "all", name: "All Items", icon: "✨" },
            ...(data.categories || []).map((cat: any) => ({
              id: cat.id,
              name: cat.name,
              icon: "📦"
            }))
          ];
          setCategories(fetchedCategories);
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error("Failed to fetch store inventory:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStoreData();
  }, []);

  const updateCart = (product: Product, delta: number) => {
    setCart((prev) => {
      const currentQty = prev[product.id]?.qty || 0;
      const newQty = currentQty + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      }
      return { ...prev, [product.id]: { ...product, qty: newQty } };
    });
  };

  const totalCartItems = Object.values(cart).reduce((acc: number, item: CartItem) => acc + item.qty, 0);
  const totalCartAmount = Object.values(cart).reduce((acc: number, item: CartItem) => acc + item.price * item.qty, 0);

  // Filter products according to category and search query
  const filteredProducts = products.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category_id === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCheckout = async () => {
    const itemsArray = Object.values(cart);
    if (itemsArray.length === 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: currentPatientId,
          items: itemsArray,
          totalAmount: totalCartAmount,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert("Order successfully placed and saved to Supabase!");
        setCart({});
        setIsCartOpen(false);
      } else {
        alert(`Checkout failed: ${result.error || "Please try again."}`);
      }
    } catch (err) {
      console.error("Network or server error during checkout:", err);
      alert("Something went wrong. Please check your network connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Top Location & Header Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Delivery in 10 minutes</p>
              <h2 className="text-sm font-bold text-gray-800 truncate max-w-[200px] sm:max-w-xs">
                Home - Sector 22, Chandigarh
              </h2>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden md:flex items-center bg-gray-100/80 rounded-xl px-3 py-2 border border-transparent focus-within:border-indigo-500 transition">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search store inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent w-full text-sm outline-none text-gray-700 placeholder-gray-400"
            />
          </div>

          {/* Cart Trigger Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 bg-indigo-900 hover:bg-indigo-950 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-sm"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden sm:inline">Cart</span>
            {totalCartItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow">
                {totalCartItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Prescription Banner Prompt */}
        <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Have a Doctor's Prescription?</h3>
              <p className="text-indigo-200 text-sm">Upload it or check doctor recommendations to order medicines instantly.</p>
            </div>
          </div>
          <button className="bg-white text-indigo-950 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-semibold text-sm transition whitespace-nowrap shadow">
            View Prescriptions
          </button>
        </div>

        {/* Categories Section */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Shop by Category</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition border ${
                  selectedCategory === cat.id
                    ? "bg-indigo-900 text-white border-indigo-900 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 shadow-xs"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Explore Products</h3>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 h-64 animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredProducts.map((product) => {
                const qty = cart[product.id]?.qty || 0;
                return (
                  <div key={product.id} className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <div>
                      <div className="relative bg-gray-50 rounded-xl overflow-hidden h-36 mb-3 flex items-center justify-center">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.title} className="object-cover h-full w-full opacity-90 hover:opacity-100 transition" />
                        ) : (
                          <ShoppingBag className="w-8 h-8 text-gray-300" />
                        )}
                        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded text-indigo-900 uppercase">
                          {product.categories?.name || 'General'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-medium mb-1">Stock: {product.stock}</p>
                      <h4 className="text-sm font-bold text-gray-800 line-clamp-2 mb-2">{product.title}</h4>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                      <div>
                        <span className="text-sm font-bold text-gray-900">₹{product.price}</span>
                        {product.mrp && product.mrp > product.price && (
                          <span className="text-xs text-gray-400 line-through ml-1.5">₹{product.mrp}</span>
                        )}
                      </div>

                      {qty === 0 ? (
                        <button
                          onClick={() => updateCart(product, 1)}
                          className="bg-indigo-50 hover:bg-indigo-900 text-indigo-600 hover:text-white border border-indigo-200 text-xs font-bold px-3.5 py-1.5 rounded-lg transition"
                        >
                          ADD
                        </button>
                      ) : (
                        <div className="flex items-center bg-indigo-900 text-white rounded-lg px-2 py-1 gap-2">
                          <button onClick={() => updateCart(product, -1)} className="hover:bg-indigo-950 p-0.5 rounded">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold">{qty}</span>
                          <button onClick={() => updateCart(product, 1)} className="hover:bg-indigo-950 p-0.5 rounded">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <h4 className="font-bold text-gray-700">No products found</h4>
              <p className="text-xs text-gray-400 mt-1">Try switching categories or check back later.</p>
            </div>
          )}
        </div>
      </main>

      {/* Cart Slide-Over Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-xl flex flex-col">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="font-bold text-gray-800 text-lg">Your Quick Cart</h3>
                <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {Object.keys(cart).length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Your cart is empty</p>
                    <p className="text-xs mt-1">Add items from the store to start order.</p>
                  </div>
                ) : (
                  Object.values(cart).map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">{item.title}</h4>
                        <p className="text-xs text-gray-500">₹{item.price} x {item.qty}</p>
                      </div>
                      <div className="flex items-center bg-indigo-900 text-white rounded-lg px-2 py-1 gap-2">
                        <button onClick={() => updateCart(item, -1)}><Minus className="w-3 h-3" /></button>
                        <span className="text-xs font-bold">{item.qty}</span>
                        <button onClick={() => updateCart(item, 1)}><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {Object.keys(cart).length > 0 && (
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex justify-between mb-2 text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-900">₹{totalCartAmount}</span>
                  </div>
                  <div className="flex justify-between mb-4 text-sm text-gray-600">
                    <span>Delivery Charges</span>
                    <span className="font-bold text-indigo-600">FREE</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={isSubmitting}
                    className="w-full bg-indigo-900 hover:bg-indigo-950 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition shadow-md flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Processing Order...
                      </>
                    ) : (
                      <>
                        Proceed to Checkout (₹{totalCartAmount})
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}