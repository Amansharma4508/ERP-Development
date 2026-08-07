'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, HeartPulse, Stethoscope, Wallet, ShoppingBag, 
  ArrowRight, CheckCircle2, Menu, X, ChevronDown, Activity, Phone, Mail, MapPin, Pill, BarChart3, Clock 
} from 'lucide-react';

export default function SvabhimanHomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-['Poppins','Montserrat',sans-serif] flex flex-col justify-between">
      
      {/* ── Top Bar / Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Official Logo & Brand */}
          <div className="flex items-center gap-3">
            <img 
              src="/svabhiman-logo.jpeg"
              alt="Svabhiman Logo" 
              className="w-11 h-11 rounded-full object-cover border-2 border-[#005e9f] shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="flex items-center gap-2">
              <div>
                <span className="text-xl font-black tracking-wider text-[#005e9f]">
                  SVABHIMAN
                </span>
                <p className="text-[16px] text-slate-500 font-bold uppercase tracking-widest">- KENDRA-</p>
              </div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#about" className="hover:text-[#005e9f] transition">About Us</a>
            <a href="#services" className="hover:text-[#005e9f] transition">Services</a>
            <a href="#departments" className="hover:text-[#005e9f] transition">Departments</a>
            <a href="#testimonials" className="hover:text-[#005e9f] transition">Testimonials</a>
            <a href="#faq" className="hover:text-[#005e9f] transition">FAQ</a>
          </nav>

          {/* Auth Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link 
              href="/login" 
              className="text-sm font-bold text-[#005e9f] hover:text-[#00487d] px-4 py-2 transition"
            >
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="bg-[#005e9f] hover:bg-[#00487d] text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md transition"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3 shadow-lg">
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-slate-600">About Us</a>
            <a href="#services" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-slate-600">Services</a>
            <a href="#departments" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-slate-600">Departments</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-slate-600">Testimonials</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-slate-600">FAQ</a>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link href="/login" className="w-full text-center py-2.5 text-sm font-bold text-[#005e9f] bg-slate-100 rounded-xl">Sign In</Link>
              <Link href="/register" className="w-full text-center py-2.5 text-sm font-bold text-white bg-[#005e9f] rounded-xl shadow">Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Section 1: Hero Section with Background Image & Contact Us ────── */}
      <section className="relative pt-16 pb-28 md:pt-28 md:pb-36 overflow-hidden bg-slate-900 text-white">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1600&auto=format&fit=crop&q=80" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-25 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#00365e]/95 via-[#005e9f]/80 to-slate-950/90" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-8 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-300/40 px-4 py-1.5 rounded-full text-amber-200 text-[16px] font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Advanced Healthcare & Integrated Enterprise Ecosystem
              </div>
              
              <h1 className="text-[36px] sm:text-[46px] lg:text-[58px] font-black text-white tracking-tight leading-[1.12]">
                Empowering Health & <br className="hidden sm:inline" />
                <span className="text-amber-300">Digital Wellness</span> with Trust.
              </h1>
              
              <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                Svabhiman delivers an advanced unified platform combining expert clinical consultations, lightning-fast e-pharmacy delivery, secure health wallets, and comprehensive enterprise solutions.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link 
                  href="/register" 
                  className="w-full sm:w-auto bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-8 py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition"
                >
                  Get Started <ArrowRight className="w-5 h-5" />
                </Link>
                <a 
                  href="#faq" 
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/30 font-bold px-8 py-4 rounded-2xl backdrop-blur-sm flex items-center justify-center gap-2 transition"
                >
                  Contact Us
                </a>
              </div>
            </div>

            {/* Quick Info Card */}
            <div className="lg:col-span-4 hidden lg:block">
              <div className="bg-white/10 border border-white/20 backdrop-blur-md p-8 rounded-3xl space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-[20px] sm:text-[22px] lg:text-[24px] font-bold text-white">24/7 Emergency Support</h3>
                <p className="text-[16px] text-slate-300 leading-relaxed">
                  Our multidisciplinary healthcare desks are fully operational round-the-clock for instant patient assistance and emergency diagnostics.
                </p>
                <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-[16px] text-amber-300 font-semibold">
                  <span>Helpline: +91 (172) 456-7890</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 2: About Us & Core Vision (Light Grey/Subtle Theme) ──── */}
      <section id="about" className="py-20 bg-slate-100/70 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 rounded-3xl overflow-hidden shadow-lg border border-slate-200 bg-white">
              <img 
                src="https://svabhiman.com/storage/uploads/58kDSUEYFSzY8qJGoGvMpHoxywiLi1lFyZIdBWsX.jpg" 
                alt="About Svabhiman" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-block bg-amber-100 text-amber-900 text-[16px] font-bold px-3.5 py-1.5 rounded-lg uppercase tracking-wider">
                About Svabhiman
              </div>
              <h2 className="text-[26px] sm:text-[30px] lg:text-[34px] font-bold text-slate-900 tracking-tight">
                Redefining Healthcare Standards Through Transparency & Innovation
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Svabhiman is built on the core foundation of self-reliance, dignity, and superior healthcare access. We integrate digital health records, transparent wallet infrastructure, and fast medical distribution to empower individuals and enterprise networks alike.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[16px] sm:text-[17px] lg:text-[18px] font-bold text-slate-800">Patient-Centric Approach</h5>
                    <p className="text-[16px] text-slate-500 mt-0.5">Prioritizing individual health outcomes and data privacy.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[16px] sm:text-[17px] lg:text-[18px] font-bold text-slate-800">Enterprise Grade ERP</h5>
                    <p className="text-[16px] text-slate-500 mt-0.5">Seamless inventory, supply chain, and billing management.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Services (S1, S2, S3, DHS) ─────────────────────────── */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-[16px] font-bold uppercase tracking-[0.2em] text-[#005e9f]">Our Offerings</span>
            <h2 className="text-[26px] sm:text-[30px] lg:text-[34px] font-bold text-slate-900">Core Services & Solutions</h2>
            <p className="text-slate-600 text-sm sm:text-base">Explore our specialized tier-based services designed to cover all medical and enterprise requirements.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* S1 Service */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl transition flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#005e9f] text-white flex items-center justify-center font-black text-lg mb-4 shadow-xs">
                  S1
                </div>
                <h3 className="text-[20px] sm:text-[22px] lg:text-[24px] font-bold text-slate-900 mb-2">Primary Health Care</h3>
                <p className="text-[16px] text-slate-600 leading-relaxed">
                  Basic routine clinical checkups, immediate telehealth consultations, and preventive health tracking for families.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[16px] font-bold text-[#005e9f]">Standard Tier</span>
                <Link href="/auth/register" className="text-[16px] font-bold text-[#005e9f] hover:underline">Access →</Link>
              </div>
            </div>

            {/* S2 Service */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl transition flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#005e9f] text-white flex items-center justify-center font-black text-lg mb-4 shadow-xs">
                  S2
                </div>
                <h3 className="text-[20px] sm:text-[22px] lg:text-[24px] font-bold text-slate-900 mb-2">Advanced Pharmacy & Supply</h3>
                <p className="text-[16px] text-slate-600 leading-relaxed">
                  Fast 10-minute prescription medicine delivery, wellness kits, and inventory management for local pharmacies.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[16px] font-bold text-[#005e9f]">Express Tier</span>
                <Link href="/dashboard/user-panel/shop" className="text-[16px] font-bold text-[#005e9f] hover:underline">Shop →</Link>
              </div>
            </div>

            {/* S3 Service */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl transition flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#005e9f] text-white flex items-center justify-center font-black text-lg mb-4 shadow-xs">
                  S3
                </div>
                <h3 className="text-[20px] sm:text-[22px] lg:text-[24px] font-bold text-slate-900 mb-2">Specialized Consultation</h3>
                <p className="text-[16px] text-slate-600 leading-relaxed">
                  Direct appointment booking with expert specialist doctors, surgical planning, and second-opinion reports.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[16px] font-bold text-[#005e9f]">Expert Tier</span>
                <Link href="/auth/register" className="text-[16px] font-bold text-[#005e9f] hover:underline">Book →</Link>
              </div>
            </div>

            {/* DHS Service */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl transition flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#005e9f] text-white flex items-center justify-center font-black text-lg mb-4 shadow-xs">
                  DHS
                </div>
                <h3 className="text-[20px] sm:text-[22px] lg:text-[24px] font-bold text-slate-900 mb-2">Digital Health Stack</h3>
                <p className="text-[16px] text-slate-600 leading-relaxed">
                  Unified cloud storage for all patient medical histories, lab results, prescriptions, and secure health wallet integration.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[16px] font-bold text-[#005e9f]">Enterprise Core</span>
                <Link href="/auth/register" className="text-[16px] font-bold text-[#005e9f] hover:underline">Explore →</Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 4: Departments (6 Specific Departments with Reference Images) ── */}
      <section id="departments" className="py-20 bg-slate-100/70 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-[16px] font-bold uppercase tracking-[0.2em] text-[#005e9f]">Specialized Care</span>
            <h2 className="text-[26px] sm:text-[30px] lg:text-[34px] font-bold text-slate-900">Our Departments</h2>
            <p className="text-slate-600 text-sm sm:text-base">Health articles that keep you informed about good health practices and achieve your goals.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Dept 1: Emergency & ICU */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition flex flex-col">
              <div className="h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80" 
                  alt="Emergency & ICU" 
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
              </div>
              <div className="p-6 flex flex-col justify-between flex-grow space-y-3">
                <div>
                  <h3 className="text-[20px] sm:text-[22px] lg:text-[24px] font-bold text-slate-900 mb-1">Department of Emergency & ICU</h3>
                  <p className="text-[16px] text-slate-600 leading-relaxed">
                    Create your Health ID in minutes with mobile OTP and Aadhaar linking.
                  </p>
                </div>
                <Link href="/auth/register" className="text-[16px] font-bold text-[#005e9f] hover:underline pt-2">Learn More →</Link>
              </div>
            </div>

            {/* Dept 2: Pediatric */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition flex flex-col">
              <div className="h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80" 
                  alt="Pediatric" 
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
              </div>
              <div className="p-6 flex flex-col justify-between flex-grow space-y-3">
                <div>
                  <h3 className="text-[20px] sm:text-[22px] lg:text-[24px] font-bold text-slate-900 mb-1">Department of Pediatric</h3>
                  <p className="text-[16px] text-slate-600 leading-relaxed">
                    Create your Health ID in minutes with mobile OTP and Aadhaar linking.
                  </p>
                </div>
                <Link href="/auth/register" className="text-[16px] font-bold text-[#005e9f] hover:underline pt-2">Learn More →</Link>
              </div>
            </div>

            {/* Dept 3: Obstetrics & Gynaecology */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition flex flex-col">
              <div className="h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80" 
                  alt="Obstetrics & Gynaecology" 
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
              </div>
              <div className="p-6 flex flex-col justify-between flex-grow space-y-3">
                <div>
                  <h3 className="text-[20px] sm:text-[22px] lg:text-[24px] font-bold text-slate-900 mb-1">Department of Obstetrics & Gynaecology</h3>
                  <p className="text-[16px] text-slate-600 leading-relaxed">
                    Create your Health ID in minutes with mobile OTP and Aadhaar linking.
                  </p>
                </div>
                <Link href="/auth/register" className="text-[16px] font-bold text-[#005e9f] hover:underline pt-2">Learn More →</Link>
              </div>
            </div>

            {/* Dept 4: Cardiology */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition flex flex-col">
              <div className="h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80" 
                  alt="Cardiology" 
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
              </div>
              <div className="p-6 flex flex-col justify-between flex-grow space-y-3">
                <div>
                  <h3 className="text-[20px] sm:text-[22px] lg:text-[24px] font-bold text-slate-900 mb-1">Department of Cardiology</h3>
                  <p className="text-[16px] text-slate-600 leading-relaxed">
                    Create your Health ID in minutes with mobile OTP and Aadhaar linking.
                  </p>
                </div>
                <Link href="/auth/register" className="text-[16px] font-bold text-[#005e9f] hover:underline pt-2">Learn More →</Link>
              </div>
            </div>

            {/* Dept 5: Psychiatry & Mental Health */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition flex flex-col">
              <div className="h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80" 
                  alt="Psychiatry & Mental Health" 
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
              </div>
              <div className="p-6 flex flex-col justify-between flex-grow space-y-3">
                <div>
                  <h3 className="text-[20px] sm:text-[22px] lg:text-[24px] font-bold text-slate-900 mb-1">Department of Psychiatry & Mental Health</h3>
                  <p className="text-[16px] text-slate-600 leading-relaxed">
                    Create your Health ID in minutes with mobile OTP and Aadhaar linking.
                  </p>
                </div>
                <Link href="/auth/register" className="text-[16px] font-bold text-[#005e9f] hover:underline pt-2">Learn More →</Link>
              </div>
            </div>

            {/* Dept 6: Neurology */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition flex flex-col">
              <div className="h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=80" 
                  alt="Neurology" 
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
              </div>
              <div className="p-6 flex flex-col justify-between flex-grow space-y-3">
                <div>
                  <h3 className="text-[20px] sm:text-[22px] lg:text-[24px] font-bold text-slate-900 mb-1">Department of Neurology</h3>
                  <p className="text-[16px] text-slate-600 leading-relaxed">
                    Create your Health ID in minutes with mobile OTP and Aadhaar linking.
                  </p>
                </div>
                <Link href="/auth/register" className="text-[16px] font-bold text-[#005e9f] hover:underline pt-2">Learn More →</Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 5: Testimonials ───────────────────────────────────────── */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-[16px] font-bold uppercase tracking-[0.2em] text-[#005e9f]">User Feedback</span>
            <h2 className="text-[26px] sm:text-[30px] lg:text-[34px] font-bold text-slate-900">Trusted by Thousands of Patients</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl shadow-xs space-y-4">
              <p className="text-[16px] text-slate-600 leading-relaxed italic">
                "Svabhiman's e-pharmacy delivery is exceptionally fast. Ordering medicines and managing my prescriptions through the digital stack has made life so easy!"
              </p>
              <div className="pt-4 border-t border-slate-200/60 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-[16px]">RK</div>
                <div>
                  <h5 className="text-[16px] sm:text-[17px] lg:text-[18px] font-bold text-slate-900">Ramesh Kumar</h5>
                  <p className="text-[16px] text-slate-500">Verified Patient</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl shadow-xs space-y-4">
              <p className="text-[16px] text-slate-600 leading-relaxed italic">
                "The health wallet and S3 specialist consultations are top-tier. Booking appointments takes only a few seconds without any hassle."
              </p>
              <div className="pt-4 border-t border-slate-200/60 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-[16px]">PS</div>
                <div>
                  <h5 className="text-[16px] sm:text-[17px] lg:text-[18px] font-bold text-slate-900">Pooja Sharma</h5>
                  <p className="text-[16px] text-slate-500">Regular User</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl shadow-xs space-y-4">
              <p className="text-[16px] text-slate-600 leading-relaxed italic">
                "As an enterprise partner utilizing Svabhiman ERP, inventory control and financial accounting have never been more seamless."
              </p>
              <div className="pt-4 border-t border-slate-200/60 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-[16px]">AS</div>
                <div>
                  <h5 className="text-[16px] sm:text-[17px] lg:text-[18px] font-bold text-slate-900">Amit Singh</h5>
                  <p className="text-[16px] text-slate-500">Healthcare Vendor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 6: FAQ ────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 bg-slate-100/70 border-y border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <span className="text-[16px] font-bold uppercase tracking-[0.2em] text-[#005e9f]">Got Questions?</span>
            <h2 className="text-[26px] sm:text-[30px] font-bold text-slate-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {[
              { q: "What is Svabhiman and how does it work?", a: "Svabhiman is an integrated digital healthcare and enterprise platform providing telemedicine, fast e-pharmacy delivery, health wallets, and ERP management." },
              { q: "How fast is the e-pharmacy medicine delivery?", a: "We offer lightning-fast doorstep delivery within 10 to 15 minutes in supported service sectors." },
              { q: "What are S1, S2, S3, and DHS services?", a: "These represent our core tiers: S1 (Primary Care), S2 (Pharmacy & Supply), S3 (Specialist Consultation), and DHS (Digital Health Stack)." },
              { q: "Is my medical data secure?", a: "Yes, all health records and wallet transactions are stored with encrypted enterprise-grade security protocols." }
            ].map((faq, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <button 
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4 text-left font-bold text-sm sm:text-base text-slate-800 flex items-center justify-between"
                >
                  {faq.q}
                  <ChevronDown className={`w-5 h-5 text-[#005e9f] transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-4 text-[16px] text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comprehensive Footer with Services & Pages Links ──────────────── */}
      <footer className="bg-[#00365e] text-slate-300 pt-16 pb-12 border-t border-[#002440] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#00487d]">
            
            {/* Brand Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/svabhiman-logo.jpeg" 
                  alt="Svabhiman Logo" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                />
                <span className="text-xl font-black tracking-wider text-white">
                  SVABHIMAN
                </span>
              </div>
              <p className="text-[16px] text-slate-300 leading-relaxed max-w-sm">
                Empowering healthcare, diagnostics, e-pharmacy logistics, and digital wallet services with trust and technological precision.
              </p>
              <div className="space-y-2 text-[16px] text-slate-300">
                <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-amber-300 shrink-0" /> Sector 22-C, Chandigarh, India</p>
                <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-amber-300 shrink-0" /> +91 (172) 456-7890</p>
                <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-amber-300 shrink-0" /> support@svabhiman.com</p>
              </div>
            </div>

            {/* Quick Links / Pages */}
            <div className="space-y-4">
              <h4 className="text-[18px] sm:text-[19px] lg:text-[20px] font-bold text-white uppercase tracking-wider">Quick Pages</h4>
              <ul className="space-y-2.5 text-[16px]">
                <li><a href="#about" className="hover:text-amber-300 transition">About Us</a></li>
                <li><a href="#services" className="hover:text-amber-300 transition">Our Services</a></li>
                <li><a href="#departments" className="hover:text-amber-300 transition">Departments</a></li>
                <li><a href="#testimonials" className="hover:text-amber-300 transition">Testimonials</a></li>
                <li><a href="#faq" className="hover:text-amber-300 transition">FAQ</a></li>
              </ul>
            </div>

            {/* Services List (S1, S2, S3, DHS) */}
            <div className="space-y-4">
              <h4 className="text-[18px] sm:text-[19px] lg:text-[20px] font-bold text-white uppercase tracking-wider">Services</h4>
              <ul className="space-y-2.5 text-[16px]">
                <li><a href="#services" className="hover:text-amber-300 transition">S1 - Primary Care</a></li>
                <li><a href="#services" className="hover:text-amber-300 transition">S2 - Pharmacy & Supply</a></li>
                <li><a href="#services" className="hover:text-amber-300 transition">S3 - Specialist Doctors</a></li>
                <li><a href="#services" className="hover:text-amber-300 transition">DHS - Digital Health Stack</a></li>
                <li><Link href="/dashboard/user-panel/shop" className="hover:text-amber-300 transition">E-Pharmacy Store</Link></li>
              </ul>
            </div>

            {/* Account & Portal */}
            <div className="space-y-4">
              <h4 className="text-[18px] sm:text-[19px] lg:text-[20px] font-bold text-white uppercase tracking-wider">Portals</h4>
              <ul className="space-y-2.5 text-[16px]">
                <li><Link href="/login" className="hover:text-amber-300 transition">Sign In</Link></li>
                <li><Link href="/register" className="hover:text-amber-300 transition">Create Account</Link></li>
                <li><Link href="/dashboard/user-panel/shop" className="hover:text-amber-300 transition">User Shop</Link></li>
                <li><Link href="/dashboard/user-panel/checkout" className="hover:text-amber-300 transition">Secure Checkout</Link></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[16px] text-slate-400 gap-4">
            <p>© {new Date().getFullYear()} Svabhiman Healthcare & ERP Ecosystem. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}