'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, MapPin, Phone, ChevronLeft, ChevronRight, Maximize2, Users, Stethoscope } from 'lucide-react';

interface DoctorInfo {
  name: string;
  profession: string;
  experience?: string;
  fees?: string | number;
}

interface HospitalVendor {
  id: string;
  vendorId: string;
  name: string;
  vendorType: 'hospital';
  categoryName: string;
  contactPerson: string;
  phone: string;
  hospitalName?: string;
  licenseType?: string;
  state?: string;
  location?: string;
  totalAmbulances?: number;
  doctorsData?: DoctorInfo[];
  totalStaff?: number;
  hospitalImages?: string[];
  supplyStatus: 'active' | 'inactive' | 'suspended';
  amountGiven: number;
  amountUsed: number;
  dueAmount: number;
}

interface HospitalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: HospitalVendor | null;
  onExport: () => void;
}

export default function HospitalDetailModal({ isOpen, onClose, hospital, onExport }: HospitalDetailModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const galleryImages = React.useMemo(() => {
    if (hospital?.hospitalImages && hospital.hospitalImages.length > 0) {
      return hospital.hospitalImages;
    }
    return [
      "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=800&q=80"
    ];
  }, [hospital]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && hospital) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % galleryImages.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isOpen, hospital, galleryImages.length]);

  if (!isOpen || !hospital) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border bg-card">
            <div>
              <h2 className="text-lg font-bold text-foreground">{hospital.hospitalName || hospital.name}</h2>
              <p className="text-xs text-purple-600 font-medium">{hospital.state || 'N/A'} • ID: {hospital.vendorId}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onExport} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition">
                <Download size={14} /> Export PDF
              </button>
              <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border border-border">
              <div>
                <span className="text-xs text-muted-foreground block font-medium">Hospital Location / Address</span>
                <div className="flex items-center gap-1.5 font-medium text-foreground mt-0.5">
                  <MapPin size={15} className="text-purple-600 shrink-0" />
                  <span>{hospital.location || 'Location details not provided'}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block font-medium">Contact Details</span>
                <div className="flex items-center gap-1.5 font-medium text-foreground mt-0.5">
                  <Phone size={15} className="text-purple-600 shrink-0" />
                  <span>{hospital.contactPerson} ({hospital.phone})</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-border bg-card">
                <span className="text-xs text-muted-foreground block">Ambulances</span>
                <span className="text-base font-bold text-foreground mt-1 block">{hospital.totalAmbulances || 0} Units</span>
              </div>
              <div className="p-3 rounded-xl border border-border bg-card">
                <span className="text-xs text-muted-foreground block">Total Doctors</span>
                <span className="text-base font-bold text-purple-600 mt-1 block flex items-center gap-1">
                  <Stethoscope size={14} /> {hospital.doctorsData?.length || 0}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-border bg-card">
                <span className="text-xs text-muted-foreground block">Total Staff</span>
                <span className="text-base font-bold text-indigo-600 mt-1 block flex items-center gap-1">
                  <Users size={14} /> {hospital.totalStaff || 0}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-border bg-card">
                <span className="text-xs text-muted-foreground block">License Type</span>
                <span className="text-xs font-semibold text-foreground mt-1 block truncate">{hospital.licenseType || 'Standard'}</span>
              </div>
            </div>

            {/* Doctors & Professions List with Experience & Fees */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Stethoscope size={16} className="text-purple-600" />
                <span>Doctors & Specializations</span>
              </h3>
              {hospital.doctorsData && hospital.doctorsData.length > 0 ? (
  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
    {hospital.doctorsData.map((doc, idx) => (
      <div key={idx} className="p-3 rounded-xl border border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div>
          <div className="font-bold text-foreground text-sm">{doc.name || 'Unnamed Doctor'}</div>
          <div className="text-purple-700 font-medium mt-0.5">{doc.profession || doc.specialization || 'General'}</div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {doc.experience && (
            <span className="bg-card px-2.5 py-1 rounded-lg border border-border shadow-xs">
              Exp: <strong className="text-foreground">{doc.experience}</strong>
            </span>
          )}
          {doc.fees && (
            <span className="bg-card px-2.5 py-1 rounded-lg border border-border shadow-xs">
              Fee: <strong className="text-emerald-600">₹{doc.fees}</strong>
            </span>
          )}
        </div>
      </div>
    ))}
  </div>
                ) : (
                <div className="text-xs text-muted-foreground p-3 rounded-lg border border-dashed border-border bg-muted/20 text-center">
                    No individual doctors data recorded.
                </div>
                )}
            </div>

            {/* Gallery */}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center justify-between">
                <span>Hospital & Fleet Gallery</span>
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                  {currentSlide + 1} / {galleryImages.length}
                </span>
              </h3>
              
              <div className="relative group rounded-xl overflow-hidden border border-border bg-black/5 aspect-video h-48 w-full shadow-sm">
                <div
                  className="flex transition-transform duration-500 ease-out h-full"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {galleryImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="w-full h-full flex-shrink-0 relative cursor-zoom-in"
                      onClick={() => setLightboxImage(img)}
                    >
                      <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                           <Maximize2 size={24} className="text-white drop-shadow-md" />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCurrentSlide((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1)); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-gray-800 shadow-md opacity-0 group-hover:opacity-100 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCurrentSlide((prev) => (prev + 1) % galleryImages.length); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-gray-800 shadow-md opacity-0 group-hover:opacity-100 transition-all"
                >
                  <ChevronRight size={18} />
                </button>
                
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {galleryImages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }}
                      className={`w-2 h-2 rounded-full transition-all ${currentSlide === idx ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
            <button onClick={onClose} className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition">
              Close
            </button>
          </div>
        </div>
      </div>

      {lightboxImage && (
        <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
          <button type="button" className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors" onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }}>
            <X size={24} />
          </button>
          <img src={lightboxImage} alt="Enlarged view" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}