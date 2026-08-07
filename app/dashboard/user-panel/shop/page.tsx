"use client";
import React, { useState, useEffect } from "react";
import { Search, ShoppingBag, MapPin, Plus, Minus, Sparkles, Loader2, ArrowLeft, Ticket, Check, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug?: string;
}

interface Product {
  id: string | number;
  title: string;
  description?: string;
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
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => { setToastMessage(null); }, 4000);
  };
  
  const [cart, setCart] = useState<Record<string | number, CartItem>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("svabhiman_user_cart");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { return {}; }
      }
    }
    return {};
  });

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("svabhiman_user_cart", JSON.stringify(cart));
    }
  }, [cart]);

  useEffect(() => {
    async function fetchStoreData() {
      try {
        setLoading(true);
        const res = await fetch('/api/ecommerce/products');
        const data = await res.json();
        if (res.ok && data.success) {
          const fetchedCategories = [
            { id: "all", name: "All Items" },
            ...(data.categories || []).map((cat: any) => ({
              id: cat.id,
              name: cat.name
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
        showNotification(`"${product.title}" removed from cart`);
        return copy;
      }
      showNotification(`"${product.title}" quantity updated to ${newQty}`);
      return { ...prev, [product.id]: { ...product, qty: newQty } };
    });
  };

  const removeFromCart = (productId: string | number, productTitle: string) => {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      showNotification(`"${productTitle}" removed successfully`);
      return copy;
    });
  };

  const totalCartItems = Object.values(cart).reduce((acc: number, item: CartItem) => acc + item.qty, 0);
  const totalCartAmount = Object.values(cart).reduce((acc: number, item: CartItem) => acc + item.price * item.qty, 0);

  const filteredProducts = products.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category_id === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const relatedProducts = selectedProduct
    ? products.filter(p => p.category_id === selectedProduct.category_id && p.id !== selectedProduct.id).slice(0, 4)
    : [];

  const handleBuyNow = (product: Product) => {
    const directBuyItem = { [product.id]: { ...product, qty: 1 } };
    localStorage.setItem("svabhiman_direct_buy", JSON.stringify(directBuyItem));
    showNotification(`Proceeding to direct checkout for "${product.title}"`);
    router.push('/dashboard/user-panel/checkout?mode=direct');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 relative">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900/95 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-gray-800 animate-fade-in-up backdrop-blur-md">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <p className="text-xs font-semibold tracking-wide">{toastMessage}</p>
        </div>
      )}

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

      <main className="max-w-7xl mx-auto px-4 py-6">
        {selectedProduct ? (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <button
                onClick={() => setSelectedProduct(null)}
                className="flex items-center gap-2 text-indigo-900 font-semibold mb-6 hover:text-indigo-700 transition"
              >
                <ArrowLeft className="w-5 h-5" /> Back to Store
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 rounded-2xl h-80 flex items-center justify-center overflow-hidden border border-gray-100">
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt={selectedProduct.title} className="object-cover h-full w-full" />
                  ) : (
                    <ShoppingBag className="w-16 h-16 text-gray-300" />
                  )}
                </div>

                <div className="flex flex-col justify-between">
                  <div>
                    <span className="bg-indigo-50 text-indigo-900 text-xs font-bold px-3 py-1 rounded-full uppercase">
                      {selectedProduct.categories?.name || 'General'}
                    </span>
                    <h1 className="text-2xl font-bold text-gray-800 mt-2">{selectedProduct.title}</h1>
                    <p className="text-sm text-gray-400 mt-1">Stock available: {selectedProduct.stock}</p>
                    
                    <div className="flex items-center gap-3 mt-4">
                      <span className="text-2xl font-bold text-gray-900">₹{selectedProduct.price}</span>
                      {selectedProduct.mrp && selectedProduct.mrp > selectedProduct.price && (
                        <span className="text-sm text-gray-400 line-through">₹{selectedProduct.mrp}</span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mt-4 leading-relaxed">
                      {selectedProduct.description || "No additional description available."}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 mt-8 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => updateCart(selectedProduct, 1)}
                      className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 py-3 rounded-xl font-bold transition text-center"
                    >
                      Add to Cart {cart[selectedProduct.id]?.qty ? `(${cart[selectedProduct.id].qty})` : ''}
                    </button>
                    <button
                      onClick={() => handleBuyNow(selectedProduct)}
                      className="flex-1 bg-indigo-900 hover:bg-indigo-950 text-white py-3 rounded-xl font-bold transition shadow-md flex items-center justify-center gap-2"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {relatedProducts.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Related Products</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {relatedProducts.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => setSelectedProduct(prod)}
                      className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                    >
                      <div className="bg-gray-50 rounded-xl overflow-hidden h-28 mb-2 flex items-center justify-center">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.title} className="object-cover h-full w-full" />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-gray-300" />
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{prod.title}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-bold text-gray-900">₹{prod.price}</span>
                        <span className="text-[10px] text-indigo-600 font-semibold hover:underline">View details</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Shop by Category</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition border ${
                      selectedCategory === cat.id
                        ? "bg-indigo-900 text-white border-indigo-900 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 shadow-xs"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Explore Products</h3>
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 h-64 animate-pulse border border-gray-100" />
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => {
                    const qty = cart[product.id]?.qty || 0;
                    return (
                      <div 
                        key={product.id} 
                        onClick={() => setSelectedProduct(product)}
                        className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm hover:shadow-md transition flex flex-col justify-between cursor-pointer"
                      >
                        <div>
                          <div className="relative bg-gray-50 rounded-xl overflow-hidden h-36 mb-3 flex items-center justify-center">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.title} className="object-cover h-full w-full" />
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
                          </div>
                          <span className="text-xs font-bold text-indigo-600 hover:underline">View Details</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <h4 className="font-bold text-gray-700">No products found</h4>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-xl flex flex-col">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="font-bold text-gray-800 text-lg">Your Cart</h3>
                <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {Object.keys(cart).length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Your cart is empty</p>
                  </div>
                ) : (
                  Object.values(cart).map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} className="w-12 h-12 object-cover rounded-lg" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center"><ShoppingBag className="w-6 h-6 text-gray-400" /></div>
                        )}
                        <div>
                          <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{item.title}</h4>
                          <p className="text-xs text-gray-500">₹{item.price} each</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-indigo-900 text-white rounded-lg px-2 py-1 gap-2">
                          <button onClick={() => updateCart(item, -1)}><Minus className="w-3 h-3" /></button>
                          <span className="text-xs font-bold">{item.qty}</span>
                          <button onClick={() => updateCart(item, 1)}><Plus className="w-3 h-3" /></button>
                        </div>
                        <button onClick={() => removeFromCart(item.id, item.title)} className="text-red-500 hover:text-red-700 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {Object.keys(cart).length > 0 && (
                <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-3">
                  <div className="flex justify-between text-base font-bold text-gray-900">
                    <span>Subtotal</span>
                    <span>₹{totalCartAmount}</span>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem("svabhiman_direct_buy");
                      setIsCartOpen(false);
                      router.push('/dashboard/user-panel/checkout');
                    }}
                    className="w-full bg-indigo-900 hover:bg-indigo-950 text-white py-3.5 rounded-xl font-bold transition shadow-md text-center block"
                  >
                    Proceed to Checkout
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