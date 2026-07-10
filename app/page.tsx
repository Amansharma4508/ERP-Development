'use client';

import Link from 'next/link';

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ERP System
          </h1>
          <div className="flex gap-4">
            <Link href="/login" className="inline-flex items-center justify-center px-4 py-2 border border-border bg-background text-foreground hover:bg-secondary rounded-lg font-medium transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="inline-flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Unified Business Management
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Complete Enterprise Resource Planning solution for healthcare providers, logistics companies, and business enterprises. Manage users, doctors, inventory, orders, and finances in one powerful platform.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register" className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors">
              Start Free Trial
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center px-6 py-3 border border-border bg-background text-foreground hover:bg-secondary rounded-lg font-medium transition-colors">
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          {/* User Dashboard */}
          <div className="bg-card border border-border/40 rounded-lg p-8 hover:border-primary/50 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-primary text-xl">👤</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">User Dashboard</h3>
            <p className="text-muted-foreground">
              Manage health profiles, track appointments, access wallet services, and maintain personal medical records.
            </p>
          </div>

          {/* Doctor Dashboard */}
          <div className="bg-card border border-border/40 rounded-lg p-8 hover:border-primary/50 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <span className="text-accent text-xl">⚕️</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Doctor Panel</h3>
            <p className="text-muted-foreground">
              View patient information, manage appointments, track performance metrics, and generate medical reports.
            </p>
          </div>

          {/* Logistics Dashboard */}
          <div className="bg-card border border-border/40 rounded-lg p-8 hover:border-primary/50 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-primary text-xl">📦</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Logistics & Supply</h3>
            <p className="text-muted-foreground">
              Track inventory, manage orders, monitor suppliers, and maintain complete accounting records.
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card/50 border border-border/40 rounded-lg p-8">
            <h4 className="text-lg font-semibold text-foreground mb-4">Core Features</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center gap-3">
                <span className="text-primary">✓</span> Role-based access control
              </li>
              <li className="flex items-center gap-3">
                <span className="text-primary">✓</span> Real-time data synchronization
              </li>
              <li className="flex items-center gap-3">
                <span className="text-primary">✓</span> Advanced analytics & reports
              </li>
              <li className="flex items-center gap-3">
                <span className="text-primary">✓</span> Secure JWT authentication
              </li>
            </ul>
          </div>

          <div className="bg-card/50 border border-border/40 rounded-lg p-8">
            <h4 className="text-lg font-semibold text-foreground mb-4">Modules</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center gap-3">
                <span className="text-accent">★</span> Health Management System
              </li>
              <li className="flex items-center gap-3">
                <span className="text-accent">★</span> Appointment Scheduling
              </li>
              <li className="flex items-center gap-3">
                <span className="text-accent">★</span> Inventory Management
              </li>
              <li className="flex items-center gap-3">
                <span className="text-accent">★</span> Financial Accounting
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border/40 mt-20 py-8 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>© 2024 Enterprise ERP System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
