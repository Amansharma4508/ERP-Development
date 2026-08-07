"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Ticket, Check, X, CreditCard, Wallet as WalletIcon, ShieldCheck, ShoppingBag, MapPin, Edit3, Calendar, Banknote } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { authenticatedFetch } from "@/lib/api";

interface CartItem {
  id: string | number;
  title: string;
  price: number;
  qty: number;
  image_url?: string;
}

export default function CheckoutPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDirectBuy = searchParams.get('mode') === 'direct';

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'wallet' | 'cod'>('wallet');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  // Wallet Balance State
  const [walletBalance, setWalletBalance] = useState<number>(35000); // Fallback balance

  // Card Input States
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Address Editing State
  const [address, setAddress] = useState<string>("House #123, Sector 22-C, Chandigarh, 160022");
  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(false);
  const [tempAddress, setTempAddress] = useState<string>(address);

  // Coupon States
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  const currentPatientId = user?.id || "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  const expectedDeliveryDate = new Date();
  expectedDeliveryDate.setMinutes(expectedDeliveryDate.getMinutes() + 15);
  const deliveryTimeString = expectedDeliveryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isDirectBuy) {
        const directSaved = localStorage.getItem("svabhiman_direct_buy");
        if (directSaved) {
          try { setCartItems(Object.values(JSON.parse(directSaved))); } catch (e) { setCartItems([]); }
        }
      } else {
        const saved = localStorage.getItem("svabhiman_user_cart");
        if (saved) {
          try { setCartItems(Object.values(JSON.parse(saved))); } catch (e) { setCartItems([]); }
        }
      }
    }

    // Fetch active coupons & real wallet balance if token exists
    async function fetchCheckoutData() {
      try {
        const couponRes = await fetch('/api/ecommerce/coupons');
        const couponData = await couponRes.json();
        if (couponRes.ok && couponData.success) {
          setAvailableCoupons((couponData.coupons || []).filter((c: any) => c.is_active));
        }

        if (token) {
          const walletRes = await authenticatedFetch('/api/health-card', token);
          const walletData = await walletRes.json();
          if (walletRes.ok && (walletData.success || walletData.walletBalance)) {
            setWalletBalance(walletData.walletBalance ?? walletData.data?.walletBalance ?? 35000);
          }
        }
      } catch (e) {
        console.error("Failed to load checkout initial data", e);
      }
    }
    fetchCheckoutData();
  }, [isDirectBuy, token]);

  const totalAmount = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  const handleApplyCoupon = (couponToApply?: any) => {
    const codeToCheck = couponToApply ? couponToApply.code : couponCodeInput.trim().toUpperCase();
    const found = availableCoupons.find(c => c.code.toUpperCase() === codeToCheck);

    if (!found) {
      setCouponMessage({ text: "Invalid or expired coupon code", type: 'error' });
      return;
    }

    if (totalAmount < (found.min_order_value || 0)) {
      setCouponMessage({ text: `Minimum order of ₹${found.min_order_value} required`, type: 'error' });
      return;
    }

    let calc = found.discount_type === "percentage" ? (totalAmount * found.discount_value) / 100 : found.discount_value;
    setAppliedCoupon(found);
    setDiscountAmount(calc);
    setCouponMessage({ text: `Success! Saved ₹${calc}`, type: 'success' });
    setCouponCodeInput("");
  };

  const finalPayable = Math.max(0, totalAmount - discountAmount);

  const handleSaveAddress = () => {
    if (tempAddress.trim()) {
      setAddress(tempAddress.trim());
      setIsEditingAddress(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (cartItems.length === 0) return;

    // Strict validation: Agar wallet select kiya hai aur balance kam hai toh order success mat hone do
    if (paymentMethod === 'wallet' && walletBalance < finalPayable) {
      alert("Insufficient wallet balance! Please choose another payment method or top up your wallet.");
      return;
    }

    // Strict validation: Agar Card select kiya hai toh card fields required hain
    if (paymentMethod === 'card') {
      if (!cardNumber || cardNumber.length < 16 || !cardExpiry || !cardCvv || cardCvv.length < 3) {
        alert("Please enter valid card details (16-digit card number, expiry date, and CVV).");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const formattedItems = cartItems.map(item => ({
        product_id: item.id,
        title: item.title,
        price: item.price,
        qty: item.qty
      }));

      const payload = {
        patientId: currentPatientId,
        items: formattedItems,
        totalAmount: finalPayable,
        discountApplied: discountAmount,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        paymentMethod: paymentMethod,
        shippingAddress: address
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && (result.success || result.orderId)) {
        setLastOrderId(result.orderId || "ORD-" + Math.floor(100000 + Math.random() * 900000));
        localStorage.removeItem("svabhiman_user_cart");
        localStorage.removeItem("svabhiman_direct_buy");
        setOrderSuccess(true);
      } else {
        alert(`Checkout failed: ${result.error || "Please try again."}`);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Network error during checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/dashboard/user-panel/shop')}
          className="flex items-center gap-2 text-indigo-900 font-semibold mb-6 hover:text-indigo-700 transition"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Product Store
        </button>

        {orderSuccess ? (
          <div className="bg-white border border-emerald-100 rounded-3xl p-8 text-center shadow-xl space-y-6">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <Check className="w-12 h-12 stroke-[3]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-emerald-900">
                {paymentMethod === 'cod' ? 'Order Placed Successfully!' : 'Payment Confirmed & Ordered!'}
              </h2>
              <p className="text-sm text-gray-600">Your order has been successfully saved to database.</p>
              {lastOrderId && <p className="text-xs font-mono bg-gray-100 py-1 px-4 rounded text-gray-700 inline-block">Order ID: {lastOrderId}</p>}
            </div>

            <div className="pt-4">
              <button
                onClick={() => router.push('/dashboard/user-panel/shop')}
                className="w-full bg-indigo-900 hover:bg-indigo-950 text-white font-bold py-4 rounded-2xl transition shadow-md text-center block"
              >
                Back to Product Store
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">Secure Checkout</h1>

            {/* Delivery Address Section */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                  <MapPin className="w-4 h-4" /> Delivery Address
                </div>
                {!isEditingAddress && (
                  <button onClick={() => { setTempAddress(address); setIsEditingAddress(true); }} className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                    <Edit3 className="w-3.5 h-3.5" /> Edit Address
                  </button>
                )}
              </div>

              {isEditingAddress ? (
                <div className="space-y-2 pt-2">
                  <textarea
                    value={tempAddress}
                    onChange={(e) => setTempAddress(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-indigo-300 rounded-xl outline-none focus:border-indigo-600"
                    rows={2}
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setIsEditingAddress(false)} className="px-3 py-1.5 text-xs text-gray-600 font-medium">Cancel</button>
                    <button onClick={handleSaveAddress} className="px-4 py-1.5 text-xs bg-indigo-900 text-white font-bold rounded-lg">Save Address</button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-700 leading-relaxed font-medium pl-6">{address}</p>
              )}
            </div>

            {/* Expected Delivery */}
            <div className="flex items-center gap-3 bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl">
              <Calendar className="w-5 h-5 text-amber-700 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-900">Lightning Fast Delivery</p>
                <p className="text-xs text-amber-700">Expected arrival today by <span className="font-extrabold">{deliveryTimeString}</span> (15 Mins)</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 space-y-3">
              <h3 className="font-bold text-indigo-900 text-sm">Order Items</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {cartItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-indigo-100">
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-12 h-12 object-cover rounded-lg border border-gray-100" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-gray-400" /></div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{item.title}</h4>
                        <p className="text-[11px] text-gray-500">Qty: {item.qty} · ₹{item.price} each</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-gray-900">₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-indigo-200 flex justify-between font-bold text-sm text-indigo-950">
                <span>Total Amount:</span>
                <span>₹{finalPayable}</span>
              </div>
            </div>

            {/* Coupons Section */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <Ticket className="w-4 h-4 text-indigo-900" /> Apply Coupon
              </h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                  <span className="text-xs font-bold text-emerald-800">{appliedCoupon.code} Applied (-₹{discountAmount})</span>
                  <button onClick={() => { setAppliedCoupon(null); setDiscountAmount(0); }} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs uppercase font-semibold text-gray-800 outline-none focus:border-indigo-600"
                  />
                  <button onClick={() => handleApplyCoupon()} className="bg-indigo-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl">
                    Apply
                  </button>
                </div>
              )}
              {couponMessage && (
                <p className={`text-xs font-medium ${couponMessage.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {couponMessage.text}
                </p>
              )}
            </div>

            {/* Payment Methods (With Wallet Balance & Card Fields) */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-800 text-sm">Select Payment Method</h3>
              
              {/* Svabhiman Wallet with Current Balance */}
              <label className={`flex flex-col p-4 rounded-2xl border cursor-pointer transition ${paymentMethod === 'wallet' ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <WalletIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Svabhiman Wallet</p>
                      <p className="text-xs text-gray-500">Available Balance: <span className="font-extrabold text-emerald-700">₹{walletBalance.toLocaleString()}</span></p>
                    </div>
                  </div>
                  <input type="radio" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} className="accent-indigo-900" />
                </div>
              </label>

              {/* Cash on Delivery */}
              <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${paymentMethod === 'cod' ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Cash on Delivery (COD)</p>
                    <p className="text-xs text-gray-500">Pay when your order arrives</p>
                  </div>
                </div>
                <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-indigo-900" />
              </label>

              {/* Credit / Debit Card Option with conditional expansion */}
              <div className={`p-4 rounded-2xl border transition ${paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' : 'border-gray-200 bg-white'}`}>
                <label className="flex items-center justify-between cursor-pointer" onClick={() => setPaymentMethod('card')}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Credit / Debit Card</p>
                      <p className="text-xs text-gray-500">Visa, Mastercard, RuPay</p>
                    </div>
                  </div>
                  <input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="accent-indigo-900" />
                </label>

                {/* Expanded Card Fields */}
                {paymentMethod === 'card' && (
                  <div className="mt-4 pt-4 border-t border-indigo-100 space-y-3 animate-fade-in-up">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Card Number</label>
                      <input
                        type="text"
                        maxLength={19}
                        placeholder="4532 •••• •••• 8900"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          maxLength={5}
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* UPI Option */}
              <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${paymentMethod === 'upi' ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">UPI / QR Code</p>
                    <p className="text-xs text-gray-500">Google Pay, PhonePe, Paytm</p>
                  </div>
                </div>
                <input type="radio" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} className="accent-indigo-900" />
              </label>
            </div>

            {/* Dynamic Button Text Based on Payment Method */}
            <button
              onClick={handleConfirmOrder}
              disabled={isSubmitting || cartItems.length === 0}
              className="w-full bg-indigo-900 hover:bg-indigo-950 disabled:opacity-50 text-white py-4 rounded-2xl font-bold transition shadow-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : paymentMethod === 'cod' ? (
                `Place Order (₹${finalPayable})`
              ) : (
                `Pay ₹${finalPayable} & Confirm Order`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}