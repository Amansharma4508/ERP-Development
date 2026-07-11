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

// ════════════════════════════════════════════════════════════════════════════
// LOGISTICS & SUPPLY CHAIN — Panel C (Project Swabhiman Blueprint)
// ════════════════════════════════════════════════════════════════════════════

export interface LogisticsUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: 'logistics';
  pointId: string;   // e.g. S1 / S2 / S3 / DHS
  area: string;
  block: string;
  district: string;
  zone: string;
  createdAt: string;
}

export type ShipmentStatus = 'po_received' | 'prep' | 'in_transit' | 'delivered' | 'cancelled';

export interface Shipment {
  id: string;
  shipmentId: string;
  vendorId: string;
  vendorName: string;
  fromLocation: string;
  toLocation: string;       // Point / Center / Customer
  toType: 'point' | 'center' | 'customer';
  items: { itemName: string; quantity: number; unit: string }[];
  status: ShipmentStatus;
  carrierName: string;
  trackingNumber: string;
  dispatchDate: string;
  expectedDelivery: string;
  actualDelivery?: string;
  totalValue: number;
  createdAt: string;
}

export interface Vendor {
  id: string;
  vendorId: string;
  name: string;
  category: string;         // 1-15 per blueprint
  categoryName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  area: string;
  gstNo: string;
  licenseNo: string;
  paymentTerms: string;
  creditDays: number;
  rating: number;
  supplyStatus: 'active' | 'inactive' | 'suspended';
  totalOrders: number;
  paidAmount: number;
  dueAmount: number;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  pointId: string;   // S1 / S2 / S3 / DHS
  area: string;
  block: string;
  district: string;
  zone: string;
  totalCapacity: number;
  usedCapacity: number;
  managerName: string;
  phone: string;
  stock: { itemName: string; sku: string; quantity: number; unit: string; lastUpdated: string }[];
}

export interface LogisticsTeamMember {
  id: string;
  name: string;
  role: 'ward_boy' | 'nurse' | 'junior' | 'driver' | 'manager';
  pointId: string;
  area: string;
  phone: string;
  status: 'active' | 'on_leave' | 'inactive';
  joiningDate: string;
}

export interface DebitCredit {
  id: string;
  type: 'debit' | 'credit';
  category: 'supplier' | 'freight' | 'center' | 'customer' | 'refund' | 'maintenance';
  amount: number;
  description: string;
  reference: string;
  date: string;
}

// ── Logistics Users ───────────────────────────────────────────────────────────
export const logisticsUsers: LogisticsUser[] = [
  {
    id: 'lg1', email: 'logistics@example.com', password: 'password123',
    fullName: 'Rajesh Kumar', role: 'logistics',
    pointId: 'S1', area: 'North Zone', block: 'Block-A',
    district: 'Delhi', zone: 'Zone-1', createdAt: '2024-01-05',
  },
];

// ── Shipments ─────────────────────────────────────────────────────────────────
export const shipments: Shipment[] = [
  {
    id: 'sh1', shipmentId: 'SHP-2025-001', vendorId: 'v1', vendorName: 'PharmaCo',
    fromLocation: 'PharmaCo Warehouse, Mumbai',
    toLocation: 'S1 Center, Delhi', toType: 'center',
    items: [
      { itemName: 'Paracetamol 500mg', quantity: 500, unit: 'strips' },
      { itemName: 'Insulin Syringes', quantity: 200, unit: 'pcs' },
    ],
    status: 'delivered', carrierName: 'BlueDart',
    trackingNumber: 'BD-9923411', dispatchDate: '2025-06-28',
    expectedDelivery: '2025-07-01', actualDelivery: '2025-07-01',
    totalValue: 4500, createdAt: '2025-06-25',
  },
  {
    id: 'sh2', shipmentId: 'SHP-2025-002', vendorId: 'v2', vendorName: 'MediSupply',
    fromLocation: 'MediSupply Hub, Pune',
    toLocation: 'S2 Center, Noida', toType: 'center',
    items: [
      { itemName: 'Surgical Gloves', quantity: 100, unit: 'boxes' },
      { itemName: 'Face Masks', quantity: 200, unit: 'boxes' },
    ],
    status: 'in_transit', carrierName: 'DTDC',
    trackingNumber: 'DTDC-7841922', dispatchDate: '2025-07-04',
    expectedDelivery: '2025-07-10', totalValue: 3200, createdAt: '2025-07-01',
  },
  {
    id: 'sh3', shipmentId: 'SHP-2025-003', vendorId: 'v3', vendorName: 'TechMed',
    fromLocation: 'TechMed Factory, Hyderabad',
    toLocation: 'DHS Point, Gurugram', toType: 'point',
    items: [{ itemName: 'Blood Pressure Monitor', quantity: 10, unit: 'units' }],
    status: 'prep', carrierName: 'FedEx',
    trackingNumber: 'FX-4412098', dispatchDate: '2025-07-08',
    expectedDelivery: '2025-07-12', totalValue: 8500, createdAt: '2025-07-05',
  },
  {
    id: 'sh4', shipmentId: 'SHP-2025-004', vendorId: 'v1', vendorName: 'PharmaCo',
    fromLocation: 'PharmaCo Warehouse, Mumbai',
    toLocation: 'S3 Center, Faridabad', toType: 'center',
    items: [{ itemName: 'Vitamin D Capsules', quantity: 1000, unit: 'strips' }],
    status: 'po_received', carrierName: 'Delhivery',
    trackingNumber: 'DLV-5523109', dispatchDate: '2025-07-12',
    expectedDelivery: '2025-07-16', totalValue: 2100, createdAt: '2025-07-08',
  },
  {
    id: 'sh5', shipmentId: 'SHP-2025-005', vendorId: 'v4', vendorName: 'LabEquip Co',
    fromLocation: 'LabEquip Co, Chennai',
    toLocation: 'Customer: City Hospital', toType: 'customer',
    items: [{ itemName: 'Lab Test Kit', quantity: 50, unit: 'kits' }],
    status: 'cancelled', carrierName: 'Ekart',
    trackingNumber: 'EK-1190234', dispatchDate: '2025-06-20',
    expectedDelivery: '2025-06-25', totalValue: 1800, createdAt: '2025-06-18',
  },
];

// ── Vendors ───────────────────────────────────────────────────────────────────
export const vendors: Vendor[] = [
  {
    id: 'v1', vendorId: 'VND-001', name: 'PharmaCo', category: '2', categoryName: 'Medical Supply',
    contactPerson: 'Anil Sharma', email: 'anil@pharmaco.com', phone: '9811234567',
    address: 'MIDC, Andheri East, Mumbai', area: 'Mumbai', gstNo: '27AABCU9603R1ZM',
    licenseNo: 'LIC-PH-2024-001', paymentTerms: 'Net 30', creditDays: 30,
    rating: 4.7, supplyStatus: 'active', totalOrders: 48,
    paidAmount: 120000, dueAmount: 15000, createdAt: '2024-01-10',
  },
  {
    id: 'v2', vendorId: 'VND-002', name: 'MediSupply', category: '2', categoryName: 'Medical Supply',
    contactPerson: 'Priya Patel', email: 'priya@medisupply.com', phone: '9922345678',
    address: 'Pimpri, Pune', area: 'Pune', gstNo: '27AABCM7823R1ZP',
    licenseNo: 'LIC-MS-2024-002', paymentTerms: 'Net 15', creditDays: 15,
    rating: 4.5, supplyStatus: 'active', totalOrders: 32,
    paidAmount: 80000, dueAmount: 8000, createdAt: '2024-02-01',
  },
  {
    id: 'v3', vendorId: 'VND-003', name: 'TechMed', category: '4', categoryName: 'Medical Equipment',
    contactPerson: 'Suresh Reddy', email: 'suresh@techmed.com', phone: '9844556677',
    address: 'Hitech City, Hyderabad', area: 'Hyderabad', gstNo: '36AABCT1234R1ZT',
    licenseNo: 'LIC-EQ-2024-003', paymentTerms: 'Net 45', creditDays: 45,
    rating: 4.8, supplyStatus: 'active', totalOrders: 15,
    paidAmount: 250000, dueAmount: 42000, createdAt: '2024-01-20',
  },
  {
    id: 'v4', vendorId: 'VND-004', name: 'LabEquip Co', category: '4', categoryName: 'Medical Equipment',
    contactPerson: 'Kavitha Nair', email: 'kavitha@labequip.com', phone: '9966778899',
    address: 'Anna Nagar, Chennai', area: 'Chennai', gstNo: '33AABCL4567R1ZL',
    licenseNo: 'LIC-LB-2024-004', paymentTerms: 'Net 30', creditDays: 30,
    rating: 3.9, supplyStatus: 'inactive', totalOrders: 8,
    paidAmount: 35000, dueAmount: 0, createdAt: '2024-03-15',
  },
  {
    id: 'v5', vendorId: 'VND-005', name: 'SwiftMove Logistics', category: '5', categoryName: 'Transport & Logistics',
    contactPerson: 'Ravi Singh', email: 'ravi@swiftmove.com', phone: '9877665544',
    address: 'Sector 18, Noida', area: 'Noida', gstNo: '09AABCS8901R1ZS',
    licenseNo: 'LIC-TR-2024-005', paymentTerms: 'Net 7', creditDays: 7,
    rating: 4.6, supplyStatus: 'active', totalOrders: 64,
    paidAmount: 95000, dueAmount: 5500, createdAt: '2024-01-08',
  },
];

// ── Warehouses ────────────────────────────────────────────────────────────────
export const warehouses: Warehouse[] = [
  {
    id: 'wh1', name: 'S1 Main Warehouse', pointId: 'S1',
    area: 'North Delhi', block: 'Block-A', district: 'Delhi', zone: 'Zone-1',
    totalCapacity: 5000, usedCapacity: 3200,
    managerName: 'Ramesh Kumar', phone: '9812345670',
    stock: [
      { itemName: 'Paracetamol 500mg', sku: 'MED-001', quantity: 500, unit: 'strips', lastUpdated: '2025-07-01' },
      { itemName: 'Surgical Gloves', sku: 'SUP-001', quantity: 45, unit: 'boxes', lastUpdated: '2025-07-02' },
      { itemName: 'Face Masks', sku: 'SUP-002', quantity: 200, unit: 'boxes', lastUpdated: '2025-07-03' },
    ],
  },
  {
    id: 'wh2', name: 'S2 Distribution Hub', pointId: 'S2',
    area: 'Noida', block: 'Block-B', district: 'Gautam Buddha Nagar', zone: 'Zone-2',
    totalCapacity: 3000, usedCapacity: 1800,
    managerName: 'Sita Devi', phone: '9823456781',
    stock: [
      { itemName: 'Insulin Syringes', sku: 'MED-002', quantity: 150, unit: 'pcs', lastUpdated: '2025-07-01' },
      { itemName: 'Blood Pressure Monitor', sku: 'EQP-001', quantity: 8, unit: 'units', lastUpdated: '2025-06-30' },
    ],
  },
  {
    id: 'wh3', name: 'DHS Point Storage', pointId: 'DHS',
    area: 'Gurugram', block: 'Block-C', district: 'Gurugram', zone: 'Zone-3',
    totalCapacity: 2000, usedCapacity: 900,
    managerName: 'Mohan Lal', phone: '9834567892',
    stock: [
      { itemName: 'Stethoscope', sku: 'EQP-002', quantity: 8, unit: 'units', lastUpdated: '2025-06-25' },
      { itemName: 'Vitamin D Capsules', sku: 'MED-003', quantity: 300, unit: 'strips', lastUpdated: '2025-07-06' },
    ],
  },
];

// ── Team Members ──────────────────────────────────────────────────────────────
export const logisticsTeam: LogisticsTeamMember[] = [
  { id: 'tm1', name: 'Sunil Yadav',    role: 'driver',   pointId: 'S1', area: 'North Delhi',  phone: '9811100001', status: 'active',    joiningDate: '2023-06-01' },
  { id: 'tm2', name: 'Meena Gupta',    role: 'nurse',    pointId: 'S1', area: 'North Delhi',  phone: '9811100002', status: 'active',    joiningDate: '2023-08-15' },
  { id: 'tm3', name: 'Ramu Das',       role: 'ward_boy', pointId: 'S2', area: 'Noida',        phone: '9811100003', status: 'on_leave',  joiningDate: '2024-01-10' },
  { id: 'tm4', name: 'Anita Singh',    role: 'junior',   pointId: 'S2', area: 'Noida',        phone: '9811100004', status: 'active',    joiningDate: '2024-03-20' },
  { id: 'tm5', name: 'Vikas Sharma',   role: 'manager',  pointId: 'DHS',area: 'Gurugram',     phone: '9811100005', status: 'active',    joiningDate: '2023-05-01' },
  { id: 'tm6', name: 'Pooja Verma',    role: 'nurse',    pointId: 'DHS',area: 'Gurugram',     phone: '9811100006', status: 'inactive',  joiningDate: '2023-09-01' },
];

// ── Funds Ledger (Debit / Credit) ─────────────────────────────────────────────
export const logisticsLedger: DebitCredit[] = [
  { id: 'll1', type: 'debit',  category: 'supplier', amount: 15000, description: 'PharmaCo invoice payment', reference: 'INV-PC-2025-06', date: '2025-07-01' },
  { id: 'll2', type: 'credit', category: 'center',   amount: 18000, description: 'S1 Center stock delivery income', reference: 'DEL-S1-2025-001', date: '2025-07-02' },
  { id: 'll3', type: 'debit',  category: 'freight',  amount: 2200,  description: 'BlueDart freight charges', reference: 'BD-9923411', date: '2025-07-01' },
  { id: 'll4', type: 'credit', category: 'customer', amount: 8500,  description: 'City Hospital equipment payment', reference: 'SHP-2025-003', date: '2025-07-05' },
  { id: 'll5', type: 'debit',  category: 'maintenance', amount: 3500, description: 'Vehicle maintenance - Truck DL01', reference: 'MNT-2025-07', date: '2025-07-06' },
  { id: 'll6', type: 'debit',  category: 'supplier', amount: 8000,  description: 'MediSupply partial payment', reference: 'INV-MS-2025-07', date: '2025-07-07' },
];
