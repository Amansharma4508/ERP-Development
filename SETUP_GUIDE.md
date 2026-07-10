# ERP System - Setup & Testing Guide

## System Overview

This is a complete Enterprise Resource Planning (ERP) system built with:
- **Frontend**: React + Next.js 16 + Tailwind CSS
- **Backend**: Next.js API Routes
- **Authentication**: JWT with demo mode enabled
- **Database**: Ready for MongoDB integration (currently using demo/in-memory storage)

## What Was Fixed

**Login Issue Resolution**: The login system now works in **demo mode**, allowing immediate testing without database configuration. Demo accounts are pre-seeded with sample data for testing different user roles.

## Quick Start - Demo Testing

### 1. Access the Application
- Open your browser and navigate to `http://localhost:3000`
- You'll see the ERP system homepage with three demo dashboards highlighted

### 2. Login with Demo Accounts

Click on the demo credentials shown on the login page, or use these:

**User Account:**
- Email: `user@example.com`
- Password: `password123`
- Role: Regular user with access to health profile, appointments, wallet

**Doctor Account:**
- Email: `doctor@example.com`
- Password: `password123`
- Role: Healthcare provider with patient and performance dashboards

**Admin Account:**
- Email: `admin@example.com`
- Password: `password123`
- Role: System administrator with full access

### 3. Navigate the System

Once logged in, you'll have access to:

#### User Dashboard (`/dashboard`)
- Health Records - Track medical history
- Appointments - Schedule and manage doctor visits
- Wallet - View payment history and balances
- Doctors - Browse available healthcare providers

#### Doctor Dashboard
- Performance metrics
- Patient information
- Medical reports
- Appointment management

#### Logistics & Logistics Dashboard
- Inventory management
- Order tracking
- Accounting ledger
- Vendor management

## File Structure

```
app/
├── (auth)/
│   ├── login/page.tsx          # Login page with demo credentials
│   └── register/page.tsx        # Registration page
├── api/
│   └── auth/
│       ├── login/route.ts       # Fixed login endpoint (demo mode)
│       └── register/route.ts    # Registration endpoint (demo mode)
├── dashboard/
│   ├── layout.tsx               # Dashboard wrapper with navigation
│   ├── page.tsx                 # Main dashboard
│   ├── health/page.tsx          # Health records
│   ├── appointments/page.tsx    # Appointment booking
│   ├── wallet/page.tsx          # Wallet & payments
│   ├── doctors/page.tsx         # Doctor directory
│   ├── inventory/page.tsx       # Inventory management
│   ├── orders/page.tsx          # Order management
│   └── accounting/page.tsx      # Financial records
├── layout.tsx                   # Root layout with AuthProvider
├── page.tsx                     # Landing page (fixed - no auth required)
└── globals.css                  # Professional ERP color scheme
```

## Authentication Details

### Demo Mode Features
- **No database required** - Works out of the box
- **Three pre-configured accounts** - User, Doctor, Admin
- **JWT token generation** - Tokens stored in localStorage
- **Auto-redirect** - Logged-in users redirected to `/dashboard`

### API Endpoints
```
POST /api/auth/login      - Login with email/password
POST /api/auth/register   - Create new account
```

## Key Fixes Applied

1. **Home Page Auth Error** - Removed unnecessary `useAuth` hook from landing page that was breaking before AuthProvider mounted
2. **Button Component Warnings** - Removed `asChild` prop from Button components and replaced with styled Link elements
3. **Demo Mode** - Added in-memory user storage to bypass MongoDB dependency during development
4. **Demo UI** - Added clickable demo credentials on login page for quick testing

## Database Integration (Optional)

When you're ready to connect MongoDB:

1. Set up MongoDB connection string as `MONGODB_URI` environment variable
2. Uncomment the database calls in:
   - `app/api/auth/login/route.ts`
   - `app/api/auth/register/route.ts`
3. Create indexes on `users` collection for email field
4. Seed initial data if needed

## Color Scheme

- **Primary**: Blue (#005FCC) - Main actions, headers
- **Accent**: Orange (#FF9A00) - Highlights, calls-to-action
- **Background**: Light gray (#F8FAFB) / Dark (#0F1419)
- **Neutral**: Grays for borders and secondary text

## Testing Checklist

- [x] Home page loads without errors
- [x] Login page displays demo credentials
- [x] Demo login works with all three accounts
- [x] Dashboard loads after successful login
- [x] Navigation between dashboard pages works
- [x] Logout functionality clears session
- [x] Responsive design on mobile/tablet
- [x] Dark/light mode support

## Next Steps

1. **Connect MongoDB** - Replace demo mode with real database
2. **Add more features** - Implement API endpoints for CRUD operations
3. **Real-time updates** - Add WebSocket for live notifications
4. **Advanced reports** - Build analytics and export features
5. **Mobile app** - Consider React Native version

## Support

For issues:
1. Check browser console for errors (`F12` → Console tab)
2. Check server logs in terminal
3. Verify all dependencies installed: `pnpm install`
4. Restart dev server: Stop with `Ctrl+C`, then `pnpm dev`

Happy coding! 🚀
