// Central in-memory data store for all ERP entities
// This simulates a real database for demo purposes

export interface User {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: 'user' | 'doctor' | 'admin';
  avatar?: string;
  createdAt: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  specialization: string;
  license: string;
  experience: number;
  rating: number;
  reviewCount: number;
  consultationFee: number;
  availableSlots: { day: string; startTime: string; endTime: string }[];
  bio: string;
  avatar?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  notes: string;
  consultationFee: number;
  createdAt: string;
}

export interface HealthRecord {
  id: string;
  userId: string;
  title: string;
  type: 'prescription' | 'lab_report' | 'diagnosis' | 'vaccination' | 'other';
  doctor: string;
  date: string;
  description: string;
  bloodGroup?: string;
  allergies?: string[];
  notes?: string;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  category: string;
  date: string;
}

export interface Wallet {
  userId: string;
  balance: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unitCost: number;
  supplier: string;
  lastUpdated: string;
}

export interface Order {
  id: string;
  orderId: string;
  supplierId: string;
  supplierName: string;
  items: { itemId: string; itemName: string; quantity: number; unitPrice: number }[];
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  orderDate: string;
  deliveryDate?: string;
}

export interface AccountingTransaction {
  id: string;
  transactionId: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  reference?: string;
}

// ── Users ────────────────────────────────────────────────────────────────────
export const users: User[] = [
  { id: '1', email: 'user@example.com', password: 'password123', fullName: 'John Carter', role: 'user', createdAt: '2024-01-15' },
  { id: '2', email: 'doctor@example.com', password: 'password123', fullName: 'Dr. Sarah Smith', role: 'doctor', createdAt: '2024-01-10' },
  { id: '3', email: 'admin@example.com', password: 'password123', fullName: 'Admin Manager', role: 'admin', createdAt: '2024-01-01' },
  { id: '4', email: 'doctor2@example.com', password: 'password123', fullName: 'Dr. James Wilson', role: 'doctor', createdAt: '2024-01-12' },
  { id: '5', email: 'doctor3@example.com', password: 'password123', fullName: 'Dr. Emily Chen', role: 'doctor', createdAt: '2024-01-13' },
];

// ── Doctors ──────────────────────────────────────────────────────────────────
export const doctors: DoctorProfile[] = [
  {
    id: 'd1', userId: '2', fullName: 'Dr. Sarah Smith', email: 'doctor@example.com',
    specialization: 'Cardiology', license: 'LIC-2024-001', experience: 8,
    rating: 4.8, reviewCount: 124, consultationFee: 150,
    bio: 'Specialized in cardiovascular diseases with 8+ years of clinical experience.',
    availableSlots: [
      { day: 'Monday', startTime: '09:00', endTime: '17:00' },
      { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
      { day: 'Friday', startTime: '09:00', endTime: '13:00' },
    ],
  },
  {
    id: 'd2', userId: '4', fullName: 'Dr. James Wilson', email: 'doctor2@example.com',
    specialization: 'Neurology', license: 'LIC-2024-002', experience: 12,
    rating: 4.9, reviewCount: 210, consultationFee: 200,
    bio: 'Expert neurologist focusing on brain and nervous system disorders.',
    availableSlots: [
      { day: 'Tuesday', startTime: '10:00', endTime: '18:00' },
      { day: 'Thursday', startTime: '10:00', endTime: '18:00' },
    ],
  },
  {
    id: 'd3', userId: '5', fullName: 'Dr. Emily Chen', email: 'doctor3@example.com',
    specialization: 'Dermatology', license: 'LIC-2024-003', experience: 6,
    rating: 4.7, reviewCount: 89, consultationFee: 120,
    bio: 'Skin specialist with expertise in cosmetic and medical dermatology.',
    availableSlots: [
      { day: 'Monday', startTime: '14:00', endTime: '18:00' },
      { day: 'Wednesday', startTime: '09:00', endTime: '13:00' },
      { day: 'Saturday', startTime: '09:00', endTime: '12:00' },
    ],
  },
];

// ── Appointments ─────────────────────────────────────────────────────────────
export const appointments: Appointment[] = [
  {
    id: 'a1', patientId: '1', patientName: 'John Carter',
    doctorId: 'd1', doctorName: 'Dr. Sarah Smith', specialization: 'Cardiology',
    date: '2025-07-15', time: '10:00', status: 'confirmed',
    notes: 'Regular checkup', consultationFee: 150, createdAt: '2025-07-01',
  },
  {
    id: 'a2', patientId: '1', patientName: 'John Carter',
    doctorId: 'd2', doctorName: 'Dr. James Wilson', specialization: 'Neurology',
    date: '2025-07-20', time: '11:00', status: 'pending',
    notes: 'Headache consultation', consultationFee: 200, createdAt: '2025-07-05',
  },
  {
    id: 'a3', patientId: '1', patientName: 'John Carter',
    doctorId: 'd3', doctorName: 'Dr. Emily Chen', specialization: 'Dermatology',
    date: '2025-06-10', time: '14:00', status: 'completed',
    notes: 'Skin allergy treatment', consultationFee: 120, createdAt: '2025-06-01',
  },
];

// ── Health Records ────────────────────────────────────────────────────────────
export const healthRecords: HealthRecord[] = [
  {
    id: 'hr1', userId: '1', title: 'Annual Blood Test', type: 'lab_report',
    doctor: 'Dr. Sarah Smith', date: '2025-06-15',
    description: 'Complete blood count - all values within normal range.', createdAt: '2025-06-15',
  },
  {
    id: 'hr2', userId: '1', title: 'Hypertension Diagnosis', type: 'diagnosis',
    doctor: 'Dr. Sarah Smith', date: '2025-05-20',
    description: 'Stage 1 hypertension. Prescribed lifestyle changes and medication.',
    bloodGroup: 'O+', allergies: ['Penicillin'], createdAt: '2025-05-20',
  },
  {
    id: 'hr3', userId: '1', title: 'COVID-19 Vaccination', type: 'vaccination',
    doctor: 'Clinic Nurse', date: '2025-03-10',
    description: 'Booster dose administered.', createdAt: '2025-03-10',
  },
];

// ── Wallets ───────────────────────────────────────────────────────────────────
export const wallets: Wallet[] = [
  { userId: '1', balance: 3250 },
  { userId: '2', balance: 12500 },
  { userId: '3', balance: 50000 },
];

export const walletTransactions: WalletTransaction[] = [
  { id: 'wt1', userId: '1', type: 'credit', amount: 500, description: 'Wallet top-up', category: 'Top-up', date: '2025-07-01' },
  { id: 'wt2', userId: '1', type: 'debit', amount: 150, description: 'Dr. Sarah Smith - Cardiology', category: 'Consultation', date: '2025-07-05' },
  { id: 'wt3', userId: '1', type: 'credit', amount: 1000, description: 'Refund from cancelled appointment', category: 'Refund', date: '2025-06-28' },
  { id: 'wt4', userId: '1', type: 'debit', amount: 120, description: 'Dr. Emily Chen - Dermatology', category: 'Consultation', date: '2025-06-10' },
  { id: 'wt5', userId: '1', type: 'credit', amount: 2000, description: 'Wallet top-up', category: 'Top-up', date: '2025-06-01' },
  { id: 'wt6', userId: '1', type: 'debit', amount: 80, description: 'Lab test - Blood work', category: 'Lab', date: '2025-05-25' },
];

// ── Inventory ─────────────────────────────────────────────────────────────────
export const inventoryItems: InventoryItem[] = [
  { id: 'inv1', name: 'Paracetamol 500mg', sku: 'MED-001', category: 'Medicine', quantity: 500, reorderLevel: 100, unitCost: 0.5, supplier: 'PharmaCo', lastUpdated: '2025-07-01' },
  { id: 'inv2', name: 'Surgical Gloves (Box)', sku: 'SUP-001', category: 'Supplies', quantity: 45, reorderLevel: 50, unitCost: 12, supplier: 'MediSupply', lastUpdated: '2025-07-02' },
  { id: 'inv3', name: 'Blood Pressure Monitor', sku: 'EQP-001', category: 'Equipment', quantity: 12, reorderLevel: 5, unitCost: 85, supplier: 'TechMed', lastUpdated: '2025-06-30' },
  { id: 'inv4', name: 'Insulin Syringes', sku: 'MED-002', category: 'Medicine', quantity: 20, reorderLevel: 100, unitCost: 1.2, supplier: 'PharmaCo', lastUpdated: '2025-07-01' },
  { id: 'inv5', name: 'Face Masks (Box)', sku: 'SUP-002', category: 'Supplies', quantity: 200, reorderLevel: 50, unitCost: 8, supplier: 'MediSupply', lastUpdated: '2025-07-03' },
  { id: 'inv6', name: 'Stethoscope', sku: 'EQP-002', category: 'Equipment', quantity: 8, reorderLevel: 3, unitCost: 45, supplier: 'TechMed', lastUpdated: '2025-06-25' },
];

// ── Orders ────────────────────────────────────────────────────────────────────
export const orders: Order[] = [
  {
    id: 'ord1', orderId: 'ORD-2025-001', supplierId: 'sup1', supplierName: 'PharmaCo',
    items: [{ itemId: 'inv1', itemName: 'Paracetamol 500mg', quantity: 200, unitPrice: 0.5 }],
    status: 'delivered', totalAmount: 100, orderDate: '2025-06-01', deliveryDate: '2025-06-05',
  },
  {
    id: 'ord2', orderId: 'ORD-2025-002', supplierId: 'sup2', supplierName: 'MediSupply',
    items: [
      { itemId: 'inv2', itemName: 'Surgical Gloves (Box)', quantity: 20, unitPrice: 12 },
      { itemId: 'inv5', itemName: 'Face Masks (Box)', quantity: 10, unitPrice: 8 },
    ],
    status: 'shipped', totalAmount: 320, orderDate: '2025-07-01', deliveryDate: '2025-07-10',
  },
  {
    id: 'ord3', orderId: 'ORD-2025-003', supplierId: 'sup3', supplierName: 'TechMed',
    items: [{ itemId: 'inv3', itemName: 'Blood Pressure Monitor', quantity: 5, unitPrice: 85 }],
    status: 'pending', totalAmount: 425, orderDate: '2025-07-05',
  },
];

// ── Accounting ────────────────────────────────────────────────────────────────
export const accountingTransactions: AccountingTransaction[] = [
  { id: 'acc1', transactionId: 'TXN-001', type: 'income', category: 'Consultation', amount: 3500, description: 'Dr. Sarah Smith consultations - June', date: '2025-06-30', reference: 'INV-2025-001' },
  { id: 'acc2', transactionId: 'TXN-002', type: 'income', category: 'Lab Services', amount: 1200, description: 'Lab tests revenue - June', date: '2025-06-30', reference: 'INV-2025-002' },
  { id: 'acc3', transactionId: 'TXN-003', type: 'expense', category: 'Supplies', amount: 320, description: 'Medical supplies order', date: '2025-07-01', reference: 'ORD-2025-002' },
  { id: 'acc4', transactionId: 'TXN-004', type: 'expense', category: 'Equipment', amount: 425, description: 'Equipment purchase - BP monitors', date: '2025-07-05', reference: 'ORD-2025-003' },
  { id: 'acc5', transactionId: 'TXN-005', type: 'income', category: 'Consultation', amount: 4200, description: 'July consultations revenue', date: '2025-07-07', reference: 'INV-2025-003' },
  { id: 'acc6', transactionId: 'TXN-006', type: 'expense', category: 'Salary', amount: 8000, description: 'Staff salary - June', date: '2025-06-30' },
];
