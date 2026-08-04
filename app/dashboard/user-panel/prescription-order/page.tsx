"use client";
import React, { useState, useEffect } from "react";
import { CheckCircle, ShoppingBag, Pill, ArrowRight, ShieldCheck, Clock, Loader2 } from "lucide-react";

interface PrescribedMedicine {
  id: number;
  name: string;
  unit: string;
  price: number;
  dosage: string;
  duration: string;
}

interface Prescription {
  id: string;
  doctorName: string;
  hospital: string;
  date: string;
  diagnosis: string;
  notes: string;
  medicines: PrescribedMedicine[];
}

export default function UserPrescriptionOrderPage() {
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOrdered, setIsOrdered] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    async function fetchRx() {
      try {
        const res = await fetch("/api/prescriptions");
        const json = await res.json();
        if (json.success) {
          setPrescription(json.data);
        }
      } catch (err) {
        console.error("Failed to load prescription", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRx();
  }, []);

  const totalAmount = prescription?.medicines.reduce((acc, item) => acc + item.price, 0) || 0;

  const handleOrder = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prescriptionId: prescription?.id }),
      });
      const json = await res.json();
      if (json.success) {
        setIsOrdered(true);
      }
    } catch (err) {
      console.error("Order failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-12 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-900" />
          <p className="text-xs font-medium">Loading secure prescription from database...</p>
        </div>
      </div>
    );
  }

  if (!prescription) return null;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Doctor's Prescription & Quick Order</h1>
          <p className="text-xs text-gray-500">Verified digital prescription synced via backend API.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" /> Verified Rx
        </div>
      </div>

      {isOrdered ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm space-y-4">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
          <h2 className="text-lg font-bold text-gray-800">Order Placed & Saved to Database!</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Your order has been recorded. Store partners are packing your items for 10-minute delivery.
          </p>
          <div className="pt-4">
            <button
              onClick={() => setIsOrdered(false)}
              className="bg-indigo-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-950 transition"
            >
              View Prescription Details
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-10 -mt-10 pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-2">
              <div>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-900 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  {prescription.id}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-2">{prescription.doctorName}</h3>
                <p className="text-xs text-gray-500">{prescription.hospital}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 sm:text-right">
                <Clock className="w-4 h-4" /> {prescription.date}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Diagnosis</span>
                <p className="text-sm font-bold text-gray-800">{prescription.diagnosis}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Instructions</span>
                <p className="text-xs text-gray-600 leading-relaxed">{prescription.notes}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                  <Pill className="w-4 h-4 text-indigo-600" /> Prescribed Medicines ({prescription.medicines.length})
                </h4>
              </div>

              <div className="space-y-2.5">
                {prescription.medicines.map((med) => (
                  <div key={med.id} className="flex items-center justify-between bg-gray-50/60 p-3.5 rounded-xl border border-gray-100">
                    <div>
                      <h5 className="text-sm font-bold text-gray-800">{med.name}</h5>
                      <p className="text-xs text-gray-500">{med.unit} • <span className="font-semibold text-indigo-900">Dosage: {med.dosage}</span> ({med.duration})</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">₹{med.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-400">Total Estimated Cost</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-gray-900">₹{totalAmount}</span>
                  <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Free Delivery</span>
                </div>
              </div>

              <button
                onClick={handleOrder}
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-indigo-900 hover:bg-indigo-950 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold text-sm transition shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing Order...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" /> Order Prescribed Medicines <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}