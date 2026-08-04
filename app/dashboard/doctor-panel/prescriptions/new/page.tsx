"use client";
import React, { useState } from "react";
import { Plus, Trash2, Search, CheckCircle, Pill, FileText } from "lucide-react";

interface Medicine {
  id: number;
  name: string;
  unit: string;
  price: number;
  dosage?: string;
  duration?: string;
}

const availableMedicinesCatalog: Medicine[] = [
  { id: 1, name: "Paracetamol 650mg", unit: "15 Tablets", price: 35 },
  { id: 2, name: "Amoxicillin 500mg", unit: "10 Capsules", price: 120 },
  { id: 3, name: "Pantoprazole 40mg", unit: "10 Tablets", price: 55 },
  { id: 4, name: "Cetzine 10mg", unit: "10 Tablets", price: 20 },
  { id: 5, name: "Multivitamin Syrup", unit: "200 ml", price: 180 },
];

export default function DoctorPrescriptionBuilder() {
  const [patientName, setPatientName] = useState<string>("Amanpreet Kaur");
  const [diagnosis, setDiagnosis] = useState<string>("Viral Fever & Weakness");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [prescribedMedicines, setPrescribedMedicines] = useState<Medicine[]>([]);
  const [notes, setNotes] = useState<string>("Take medicines after meals. Rest for 3 days.");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Add medicine to prescription
  const handleAddMedicine = (med: Medicine) => {
    if (!prescribedMedicines.some((item) => item.id === med.id)) {
      setPrescribedMedicines([...prescribedMedicines, { ...med, dosage: "1-0-1", duration: "5 Days" }]);
    }
  };

  // Remove medicine
  const handleRemoveMedicine = (id: number) => {
    setPrescribedMedicines(prescribedMedicines.filter((item) => item.id !== id));
  };

  // Update dosage or duration
  const handleUpdateItem = (id: number, field: "dosage" | "duration", value: string) => {
    setPrescribedMedicines(
      prescribedMedicines.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmitPrescription = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitted(true);
    // Yahan Supabase mein prescription data + attached medicines save hongi
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create Digital Prescription</h1>
          <p className="text-xs text-gray-500">Attach store medicines directly for instant quick-commerce ordering by patient.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-900 px-3 py-1.5 rounded-xl text-xs font-semibold">
          <FileText className="w-4 h-4" /> Rx Generator
        </div>
      </div>

      {isSubmitted ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-800">Prescription Sent Successfully!</h2>
          <p className="text-sm text-gray-500 mt-1">Patient can now view and order these prescribed items instantly from their dashboard.</p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="mt-6 bg-indigo-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-950 transition"
          >
            Create Another Prescription
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmitPrescription} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Patient Info & Selected Medicines */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Patient Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Diagnosis / Illness</label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Attached Medicines Table */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Attached Store Medicines</h3>
                <span className="text-xs font-medium bg-indigo-50 text-indigo-900 px-2.5 py-1 rounded-lg">
                  {prescribedMedicines.length} Selected
                </span>
              </div>

              {prescribedMedicines.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-xl text-gray-400">
                  <Pill className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No medicines attached yet</p>
                  <p className="text-xs text-gray-400 mt-0.5">Select medicines from the catalog on the right.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {prescribedMedicines.map((med) => (
                    <div key={med.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">{med.name}</h4>
                        <p className="text-xs text-gray-500">{med.unit} • ₹{med.price}</p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <input
                          type="text"
                          value={med.dosage || ""}
                          onChange={(e) => handleUpdateItem(med.id, "dosage", e.target.value)}
                          placeholder="Dosage (e.g. 1-0-1)"
                          className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none"
                        />
                        <input
                          type="text"
                          value={med.duration || ""}
                          onChange={(e) => handleUpdateItem(med.id, "duration", e.target.value)}
                          placeholder="Duration"
                          className="w-20 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(med.id)}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">General Instructions / Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={prescribedMedicines.length === 0}
              className="w-full bg-indigo-900 hover:bg-indigo-950 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition shadow-md"
            >
              Issue Prescription & Enable Quick Order
            </button>
          </div>

          {/* Right Column: Medicine Catalog Search */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4 h-fit sticky top-20">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Store Inventory Catalog</h3>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent w-full text-xs outline-none text-gray-700"
              />
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {availableMedicinesCatalog
                .filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((med) => {
                  const isAdded = prescribedMedicines.some((item) => item.id === med.id);
                  return (
                    <div key={med.id} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition">
                      <div>
                        <h4 className="text-xs font-bold text-gray-800">{med.name}</h4>
                        <p className="text-[10px] text-gray-500">{med.unit} • ₹{med.price}</p>
                      </div>
                      <button
                        type="button"
                        disabled={isAdded}
                        onClick={() => handleAddMedicine(med)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                          isAdded
                            ? "bg-emerald-100 text-emerald-700 cursor-not-allowed"
                            : "bg-indigo-50 hover:bg-indigo-900 text-indigo-600 hover:text-white"
                        }`}
                      >
                        <Plus className="w-3 h-3" /> {isAdded ? "Added" : "Add"}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}