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

// ════════════════════════════════════════════════════════════════════════════
// E-MEDICINE & PHARMACY
// ════════════════════════════════════════════════════════════════════════════
export interface PharmacyOrder {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  medicines: { name: string; quantity: number; price: number }[];
  deliveryType: '30min' | '24hr' | '72hr';
  deliveryMode: 'cod' | 'wallet' | 'walk_in';
  centerName: string;
  address: string;
  status: 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';
  totalAmount: number;
  prescriptionRequired: boolean;
  createdAt: string;
}

export const pharmacyOrders: PharmacyOrder[] = [
  {
    id: 'po1', orderId: 'PHARM-001', userId: '1', userName: 'John Carter',
    medicines: [{ name: 'Paracetamol 500mg', quantity: 2, price: 45 }, { name: 'Vitamin D3', quantity: 1, price: 120 }],
    deliveryType: '30min', deliveryMode: 'wallet', centerName: 'S1 Center, Delhi',
    address: '12, Lajpat Nagar, Delhi', status: 'delivered', totalAmount: 210,
    prescriptionRequired: false, createdAt: '2025-07-05',
  },
  {
    id: 'po2', orderId: 'PHARM-002', userId: '1', userName: 'John Carter',
    medicines: [{ name: 'Metformin 500mg', quantity: 1, price: 180 }],
    deliveryType: '24hr', deliveryMode: 'cod', centerName: 'Hub Center, Noida',
    address: '45, Sector 18, Noida', status: 'dispatched', totalAmount: 180,
    prescriptionRequired: true, createdAt: '2025-07-08',
  },
];

// ════════════════════════════════════════════════════════════════════════════
// YOUR DOCTOR & CARE
// ════════════════════════════════════════════════════════════════════════════
export interface CareBooking {
  id: string;
  userId: string;
  type: 'tele_visit' | 'center_visit' | 'home_collection' | 'lab_test' | 'therapy' | 'home_nurse' | 'counselor';
  doctorName: string;
  centerName?: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  fee: number;
  createdAt: string;
}

export const careBookings: CareBooking[] = [
  {
    id: 'cb1', userId: '1', type: 'tele_visit', doctorName: 'Dr. Sarah Smith',
    scheduledDate: '2025-07-15', scheduledTime: '10:00', status: 'confirmed',
    notes: 'Follow-up on BP medication', fee: 150, createdAt: '2025-07-10',
  },
  {
    id: 'cb2', userId: '1', type: 'home_collection', doctorName: 'Lab Technician',
    centerName: 'S1 Diagnostic Center', scheduledDate: '2025-07-16', scheduledTime: '07:00',
    status: 'scheduled', notes: 'Fasting blood sugar test', fee: 250, createdAt: '2025-07-10',
  },
];

// ════════════════════════════════════════════════════════════════════════════
// HEAL CENTRE (SUPPORT)
// ════════════════════════════════════════════════════════════════════════════
export interface SupportTicket {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  type: 'complaint' | 'query' | 'feedback';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  response?: string;
  createdAt: string;
  updatedAt: string;
}

export const supportTickets: SupportTicket[] = [
  {
    id: 'st1', ticketId: 'TKT-001', userId: '1', userName: 'John Carter',
    type: 'complaint', subject: 'Appointment not confirmed', priority: 'high',
    description: 'Booked appointment on July 10 but did not receive confirmation.',
    status: 'resolved', assignedTo: 'Support Team',
    response: 'Appointment confirmed. Sorry for the delay.',
    createdAt: '2025-07-08', updatedAt: '2025-07-09',
  },
  {
    id: 'st2', ticketId: 'TKT-002', userId: '1', userName: 'John Carter',
    type: 'query', subject: 'Wallet top-up not reflecting', priority: 'medium',
    description: 'Added ₹500 to wallet but balance not updated.',
    status: 'in_progress', createdAt: '2025-07-09', updatedAt: '2025-07-09',
  },
];

// ════════════════════════════════════════════════════════════════════════════
// EARN & ENJOY SYSTEM
// ════════════════════════════════════════════════════════════════════════════
export interface EarnActivity {
  id: string;
  userId: string;
  type: 'watch_ad' | 'referral' | 'volunteering';
  description: string;
  pointsEarned: number;
  status: 'pending' | 'credited';
  createdAt: string;
}

export const earnActivities: EarnActivity[] = [
  { id: 'ea1', userId: '1', type: 'referral', description: 'Referred Amit Kumar', pointsEarned: 200, status: 'credited', createdAt: '2025-07-01' },
  { id: 'ea2', userId: '1', type: 'watch_ad', description: 'Watched HealthCare Ad #1', pointsEarned: 10, status: 'credited', createdAt: '2025-07-02' },
  { id: 'ea3', userId: '1', type: 'volunteering', description: 'Blood Donation Camp', pointsEarned: 500, status: 'pending', createdAt: '2025-07-05' },
];

// ════════════════════════════════════════════════════════════════════════════
// MULTI-DEMOGRAPHICS
// ════════════════════════════════════════════════════════════════════════════
export interface Demographics {
  userId: string;
  family: { bioType: string; tribe: string; community: string };
  environment: { waterQuality: string; aqiLevel: string; industryNearby: string };
  financial: { category: 'ultra_luxury' | 'luxury' | 'middle' | 'low' | 'bpl' };
  social: { traumaHistory: string; narcoticExposure: string };
}

export const demographics: Demographics[] = [
  {
    userId: '1',
    family: { bioType: 'Nuclear', tribe: 'General', community: 'Urban' },
    environment: { waterQuality: 'Treated Municipal', aqiLevel: 'Moderate (AQI 120)', industryNearby: 'None' },
    financial: { category: 'middle' },
    social: { traumaHistory: 'None reported', narcoticExposure: 'None' },
  },
];

// ════════════════════════════════════════════════════════════════════════════
// DOCTOR PANEL — ADDITIONAL MODULES
// ════════════════════════════════════════════════════════════════════════════

export interface DoctorTask {
  id: string;
  doctorId: string;
  title: string;
  type: 'appointment' | 'report' | 'follow_up' | 'admin';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  status: 'pending' | 'in_progress' | 'done';
  notes: string;
  createdAt: string;
}

export const doctorTasks: DoctorTask[] = [
  { id: 'dt1', doctorId: 'd1', title: 'Review John Carter blood report', type: 'report', priority: 'high', dueDate: '2025-07-12', status: 'pending', notes: 'CBC results from June 15', createdAt: '2025-07-10' },
  { id: 'dt2', doctorId: 'd1', title: 'Follow up with hypertension patients', type: 'follow_up', priority: 'medium', dueDate: '2025-07-14', status: 'in_progress', notes: '3 patients due for monthly check', createdAt: '2025-07-08' },
  { id: 'dt3', doctorId: 'd1', title: 'Complete monthly performance report', type: 'admin', priority: 'low', dueDate: '2025-07-31', status: 'pending', notes: '', createdAt: '2025-07-01' },
];

export interface DoctorRemark {
  id: string;
  doctorId: string;
  to: 'management' | 'patient' | 'team' | 'self';
  subject: string;
  body: string;
  patientName?: string;
  createdAt: string;
}

export const doctorRemarks: DoctorRemark[] = [
  { id: 'dr1', doctorId: 'd1', to: 'patient', subject: 'Post consultation notes', body: 'Continue medication for 2 weeks. Avoid salt intake.', patientName: 'John Carter', createdAt: '2025-07-05' },
  { id: 'dr2', doctorId: 'd1', to: 'management', subject: 'Equipment request', body: 'Cardiology ward needs a new ECG machine urgently.', createdAt: '2025-07-08' },
  { id: 'dr3', doctorId: 'd1', to: 'self', subject: 'Reminder', body: 'Check AHA guidelines update for hypertension 2025.', createdAt: '2025-07-09' },
];

export interface LeaveRequest {
  id: string;
  doctorId: string;
  leaveType: 'casual' | 'medical' | 'annual' | 'leisure';
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export const leaveRequests: LeaveRequest[] = [
  { id: 'lr1', doctorId: 'd1', leaveType: 'annual', fromDate: '2025-08-01', toDate: '2025-08-05', reason: 'Family vacation', status: 'approved', createdAt: '2025-07-01' },
  { id: 'lr2', doctorId: 'd1', leaveType: 'casual', fromDate: '2025-07-20', toDate: '2025-07-20', reason: 'Personal work', status: 'pending', createdAt: '2025-07-09' },
];

export interface DoctorAssistant {
  id: string;
  doctorId: string;
  name: string;
  role: 'ward_boy' | 'nurse' | 'junior';
  phone: string;
  schedule: string;
  status: 'active' | 'inactive';
}

export const doctorAssistants: DoctorAssistant[] = [
  { id: 'da1', doctorId: 'd1', name: 'Meena Gupta', role: 'nurse', phone: '9811100002', schedule: 'Mon-Fri 9AM-5PM', status: 'active' },
  { id: 'da2', doctorId: 'd1', name: 'Ramu Das', role: 'ward_boy', phone: '9811100003', schedule: 'Mon-Sat 8AM-4PM', status: 'active' },
  { id: 'da3', doctorId: 'd1', name: 'Priya Rao', role: 'junior', phone: '9811100010', schedule: 'Tue-Sat 10AM-6PM', status: 'active' },
];

export interface TimeSlot {
  id: string;
  doctorId: string;
  date: string;
  time: string;
  type: 'online' | 'offline' | 'surgery';
  status: 'available' | 'booked' | 'blocked';
  patientName?: string;
}

export const timeSlots: TimeSlot[] = [
  { id: 'ts1', doctorId: 'd1', date: '2025-07-15', time: '09:00', type: 'online', status: 'booked', patientName: 'John Carter' },
  { id: 'ts2', doctorId: 'd1', date: '2025-07-15', time: '10:00', type: 'offline', status: 'available' },
  { id: 'ts3', doctorId: 'd1', date: '2025-07-15', time: '11:00', type: 'offline', status: 'booked', patientName: 'Amit Sharma' },
  { id: 'ts4', doctorId: 'd1', date: '2025-07-15', time: '14:00', type: 'surgery', status: 'blocked' },
  { id: 'ts5', doctorId: 'd1', date: '2025-07-16', time: '09:00', type: 'online', status: 'available' },
  { id: 'ts6', doctorId: 'd1', date: '2025-07-16', time: '10:00', type: 'online', status: 'available' },
];

export interface DoctorReport {
  id: string;
  doctorId: string;
  patientName: string;
  reportType: 'patient' | 'lab' | 'sample';
  title: string;
  findings: string;
  date: string;
  status: 'draft' | 'final';
}

export const doctorReportsList: DoctorReport[] = [
  { id: 'drp1', doctorId: 'd1', patientName: 'John Carter', reportType: 'lab', title: 'CBC Report Review', findings: 'All values within normal range. Hemoglobin slightly low at 11.8.', date: '2025-07-08', status: 'final' },
  { id: 'drp2', doctorId: 'd1', patientName: 'Sunita Devi', reportType: 'patient', title: 'Hypertension Follow-up', findings: 'BP stabilized at 130/85. Continue current medication.', date: '2025-07-05', status: 'final' },
  { id: 'drp3', doctorId: 'd1', patientName: 'Rahul Mehta', reportType: 'sample', title: 'Blood Sample Analysis', findings: 'Elevated LDL cholesterol. Recommend dietary changes and statins.', date: '2025-07-09', status: 'draft' },
];

// ════════════════════════════════════════════════════════════════════════════
// VIRTUAL WALLET CREDIT & FUND ALLOCATION (Section D)
// ════════════════════════════════════════════════════════════════════════════
export interface VirtualWalletAccount {
  userId: string;
  cardNumber: string;
  stateWalletBalance: number;
  masterLedgerBalance: number;
  activationDate: string;
  status: 'active' | 'pending' | 'suspended';
  offlineBalance: number;
  onlineBalance: number;
}

export const virtualWalletAccounts: VirtualWalletAccount[] = [
  {
    userId: '1', cardNumber: 'SWAB-1001-2025', stateWalletBalance: 35000,
    masterLedgerBalance: 35000, activationDate: '2025-01-15',
    status: 'active', offlineBalance: 20000, onlineBalance: 15000,
  },
];

export interface WalletLedgerEntry {
  id: string;
  userId: string;
  mode: 'offline' | 'online';
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  centerName?: string;
  creditNoteRef?: string;
  transactionRef: string;
  date: string;
}

export const walletLedgerEntries: WalletLedgerEntry[] = [
  { id: 'wle1', userId: '1', mode: 'offline', type: 'debit', amount: 500, description: 'S1 Center - OPD Consultation', centerName: 'S1 Center Delhi', transactionRef: 'TXN-OFF-001', date: '2025-07-01' },
  { id: 'wle2', userId: '1', mode: 'online', type: 'debit', amount: 150, description: 'Teleconsult - Dr. Sarah Smith', creditNoteRef: 'CN-001', transactionRef: 'TXN-ONL-001', date: '2025-07-05' },
  { id: 'wle3', userId: '1', mode: 'online', type: 'credit', amount: 1000, description: 'State Wallet top-up', transactionRef: 'TXN-CR-001', date: '2025-06-28' },
];

// ════════════════════════════════════════════════════════════════════════════
// CENTER REGISTRATION & APP DASHBOARD ECOSYSTEM (Section E)
// ════════════════════════════════════════════════════════════════════════════
export interface CenterRegistration {
  id: string;
  centerId: string;
  name: string;
  ownerName: string;
  idNo: string;
  state: string;
  district: string;
  block: string;
  village: string;
  ward: string;
  busStop: string;
  contactMobile: string;
  centerModel: 'S1' | 'S2' | 'S3';
  status: 'enquiry' | 'proposal' | 'verification' | 'approved' | 'live';
  // Infrastructure
  roadAccess: string;
  propertyDetails: string;
  totalArea: number;
  buildingType: string;
  // Environmental
  weatherData: string;
  sewageCondition: string;
  aqiLevel: string;
  waterPlantStatus: string;
  waterLogHistory: string;
  // Health Complexity
  nearbyMedicalStores: number;
  nearestHospitalDistance: number;
  hospitalTierType: string;
  createdAt: string;
}

export const centerRegistrations: CenterRegistration[] = [
  {
    id: 'cr1', centerId: 'CTR-S1-001', name: 'Swabhiman Health Center Delhi',
    ownerName: 'Ramesh Gupta', idNo: 'AADH-1234-5678', state: 'Delhi',
    district: 'Central Delhi', block: 'Karol Bagh', village: 'N/A',
    ward: 'Ward 12', busStop: 'Karol Bagh Metro', contactMobile: '9811000001',
    centerModel: 'S1', status: 'live',
    roadAccess: 'Paved Road', propertyDetails: 'Ground Floor Commercial', totalArea: 1200, buildingType: 'RCC',
    weatherData: 'Hot Semi-Arid', sewageCondition: 'Municipal Sewage', aqiLevel: '145 (Unhealthy)',
    waterPlantStatus: 'Operational', waterLogHistory: 'No flooding history',
    nearbyMedicalStores: 5, nearestHospitalDistance: 1.2, hospitalTierType: 'Tier-1',
    createdAt: '2024-06-01',
  },
  {
    id: 'cr2', centerId: 'CTR-S2-001', name: 'Swabhiman Center Noida',
    ownerName: 'Priya Sharma', idNo: 'AADH-8765-4321', state: 'Uttar Pradesh',
    district: 'Gautam Buddha Nagar', block: 'Sector 18', village: 'N/A',
    ward: 'Ward 5', busStop: 'Sector 18 Metro', contactMobile: '9922000002',
    centerModel: 'S2', status: 'approved',
    roadAccess: 'Paved Road', propertyDetails: 'First Floor Commercial', totalArea: 800, buildingType: 'RCC',
    weatherData: 'Hot Semi-Arid', sewageCondition: 'Municipal Sewage', aqiLevel: '110 (Moderate)',
    waterPlantStatus: 'Operational', waterLogHistory: 'Minor flooding 2023',
    nearbyMedicalStores: 3, nearestHospitalDistance: 2.5, hospitalTierType: 'Tier-2',
    createdAt: '2024-09-15',
  },
];

// ════════════════════════════════════════════════════════════════════════════
// WALLET CONTROL DASHBOARD — MULTI-ROLE WALLETS & PAYMENT CONTROL
// ════════════════════════════════════════════════════════════════════════════

// Payment flow control — allows admin to pause/resume payments for any entity
export interface PaymentControl {
  id: string;
  entityType: 'user' | 'doctor' | 'logistics' | 'system';
  entityId: string;         // userId / doctorId / 'logistics-global'
  entityName: string;
  paused: boolean;
  pausedAt?: string;
  pausedBy?: string;        // admin userId
  pauseReason?: string;
  resumedAt?: string;
  resumedBy?: string;
}

export const paymentControls: PaymentControl[] = [
  { id: 'pc1', entityType: 'user',      entityId: '1',              entityName: 'John Carter',      paused: false },
  { id: 'pc2', entityType: 'doctor',    entityId: 'd1',             entityName: 'Dr. Sarah Smith',  paused: false },
  { id: 'pc3', entityType: 'doctor',    entityId: 'd2',             entityName: 'Dr. James Wilson', paused: false },
  { id: 'pc4', entityType: 'doctor',    entityId: 'd3',             entityName: 'Dr. Emily Chen',   paused: false },
  { id: 'pc5', entityType: 'logistics', entityId: 'logistics-global', entityName: 'Logistics Dept', paused: false },
  { id: 'pc6', entityType: 'system',    entityId: 'system-global',  entityName: 'Global Payments',  paused: false },
];

// Doctor wallet — consultation earnings accumulate here
export interface DoctorWallet {
  doctorId: string;
  doctorName: string;
  specialization: string;
  balance: number;         // current earnings balance
  totalEarned: number;     // all-time gross
  totalWithdrawn: number;
  pendingSettlement: number;
}

export const doctorWallets: DoctorWallet[] = [
  { doctorId: 'd1', doctorName: 'Dr. Sarah Smith',  specialization: 'Cardiology',   balance: 4500,  totalEarned: 18000, totalWithdrawn: 12000, pendingSettlement: 1500 },
  { doctorId: 'd2', doctorName: 'Dr. James Wilson', specialization: 'Neurology',    balance: 8200,  totalEarned: 24000, totalWithdrawn: 14000, pendingSettlement: 1800 },
  { doctorId: 'd3', doctorName: 'Dr. Emily Chen',   specialization: 'Dermatology',  balance: 2100,  totalEarned: 9600,  totalWithdrawn: 7000,  pendingSettlement: 500  },
];

export interface DoctorWalletTransaction {
  id: string;
  doctorId: string;
  type: 'credit' | 'debit' | 'settlement';
  amount: number;
  description: string;
  patientName?: string;
  date: string;
}

export const doctorWalletTransactions: DoctorWalletTransaction[] = [
  { id: 'dwt1', doctorId: 'd1', type: 'credit',     amount: 150, description: 'Consultation — John Carter',    patientName: 'John Carter',    date: '2025-07-05' },
  { id: 'dwt2', doctorId: 'd1', type: 'credit',     amount: 150, description: 'Consultation — Sunita Devi',   patientName: 'Sunita Devi',    date: '2025-07-07' },
  { id: 'dwt3', doctorId: 'd1', type: 'settlement', amount: 2000, description: 'Weekly settlement payout',                                   date: '2025-07-06' },
  { id: 'dwt4', doctorId: 'd2', type: 'credit',     amount: 200, description: 'Consultation — Rahul Mehta',   patientName: 'Rahul Mehta',    date: '2025-07-08' },
  { id: 'dwt5', doctorId: 'd2', type: 'credit',     amount: 200, description: 'Consultation — Priya Singh',   patientName: 'Priya Singh',    date: '2025-07-09' },
  { id: 'dwt6', doctorId: 'd3', type: 'credit',     amount: 120, description: 'Consultation — Amit Kumar',    patientName: 'Amit Kumar',     date: '2025-07-05' },
];

// Logistics wallet — freight income/expense
export interface LogisticsWallet {
  id: string;
  balance: number;
  totalIncome: number;
  totalExpense: number;
  pendingPayouts: number;
  lastUpdated: string;
}

export const logisticsWallet: LogisticsWallet = {
  id: 'lw1',
  balance: 26500,
  totalIncome: 108500,
  totalExpense: 82000,
  pendingPayouts: 5500,
  lastUpdated: '2025-07-11',
};

// System-level wallet activity summary (aggregate across all)
export interface WalletActivityLog {
  id: string;
  entityType: 'user' | 'doctor' | 'logistics' | 'system';
  entityName: string;
  action: 'payment_paused' | 'payment_resumed' | 'top_up' | 'withdrawal' | 'settlement';
  amount?: number;
  performedBy: string;
  timestamp: string;
}

export const walletActivityLog: WalletActivityLog[] = [
  { id: 'wal1', entityType: 'user',      entityName: 'John Carter',      action: 'top_up',     amount: 2000,  performedBy: 'John Carter',   timestamp: '2025-07-01T09:00:00Z' },
  { id: 'wal2', entityType: 'doctor',    entityName: 'Dr. Sarah Smith',  action: 'settlement', amount: 2000,  performedBy: 'Admin Manager', timestamp: '2025-07-06T14:00:00Z' },
  { id: 'wal3', entityType: 'logistics', entityName: 'Logistics Dept',   action: 'withdrawal', amount: 15000, performedBy: 'Admin Manager', timestamp: '2025-07-07T10:00:00Z' },
  { id: 'wal4', entityType: 'user',      entityName: 'John Carter',      action: 'top_up',     amount: 1000,  performedBy: 'John Carter',   timestamp: '2025-07-08T11:30:00Z' },
];

// ════════════════════════════════════════════════════════════════════════════
// VIRTUAL WALLET SYSTEM — Section (D) Full Flow
// ════════════════════════════════════════════════════════════════════════════

export type EnrollmentStatus = 'enrolled' | 'processing' | 'card_printed' | 'dispatched' | 'active' | 'suspended';
export type CardScanStatus   = 'pending' | 'scanned' | 'verified';

export interface VirtualWalletUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: 'wallet_user';
  // Enrollment
  cardNumber: string;
  enrollmentDate: string;
  enrollmentStatus: EnrollmentStatus;
  cardScanStatus: CardScanStatus;
  centerAssigned: string;       // S1 / S2 / S3 / DHS
  dispatchDate?: string;
  activationDate?: string;
  fatherName?: string;
  motherName?: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  qualification?: string;
  familyMembersCount?: number;
  maleCount?: number;
  femaleCount?: number;
  familyMembers?: Array<{
    name: string;
    dob: string;
    gender: 'male' | 'female' | 'other';
    relationship: string;
    uid: string;
  }>;
  headOfFamily?: string;
  spouseName?: string;
  houseNumber?: string;
  wardNumber?: string;
  villageCity?: string;
  gramPanchayat?: string;
  block?: string;
  district?: string;
  state?: string;
  pinCode?: string;
  uidNumber?: string;
  panCard?: string;
  addressId?: string;
  bloodGroup?: string;
  foodIntake?: 'vegetarian' | 'non_vegetarian' | 'vegan';
  smoking?: 'regular' | 'irregular' | 'party';
  alcoholConsumption?: 'regular' | 'irregular' | 'party';
  occupation?: string;
  medicalExpensesMonthly?: number;
  drinkingWaterSource?: string;
  foodSource?: string;
  pollutionLevel?: string;
  livePhotoUrl?: string;
  applicationDate?: string;
  place?: string;
  time?: string;
  coordinatorId?: string;
  fieldOfficerId?: string;
  areaCode?: string;
  vendingId?: string;
  consentGiven?: boolean;
  // Fund allocation
  allocatedAmount: number;      // ₹35,000
  stateWalletBalance: number;
  masterLedgerBalance: number;
  offlineBalance: number;
  onlineBalance: number;
  createdAt: string;
}

export const virtualWalletUsers: VirtualWalletUser[] = [
  {
    id: 'vw1',
    email: 'wallet@example.com',
    password: 'password123',
    fullName: 'Priya Sharma',
    role: 'wallet_user',
    cardNumber: 'SWAB-1001-2025',
    enrollmentDate: '2025-01-10',
    enrollmentStatus: 'active',
    cardScanStatus: 'verified',
    centerAssigned: 'S1',
    dispatchDate: '2025-01-12',
    activationDate: '2025-01-15',
    allocatedAmount: 35000,
    stateWalletBalance: 35000,
    masterLedgerBalance: 35000,
    offlineBalance: 20000,
    onlineBalance: 15000,
    createdAt: '2025-01-10',
  },
  {
    id: 'vw2',
    email: 'wallet2@example.com',
    password: 'password123',
    fullName: 'Rajiv Patel',
    role: 'wallet_user',
    cardNumber: 'SWAB-1002-2025',
    enrollmentDate: '2025-02-05',
    enrollmentStatus: 'card_printed',
    cardScanStatus: 'pending',
    centerAssigned: 'S2',
    dispatchDate: '2025-02-07',
    allocatedAmount: 35000,
    stateWalletBalance: 35000,
    masterLedgerBalance: 35000,
    offlineBalance: 35000,
    onlineBalance: 0,
    createdAt: '2025-02-05',
  },
];

// ── Offline Transactions (Center visits — S1/S2/S3/DHS) ───────────────────
export interface OfflineTransaction {
  id: string;
  userId: string;
  center: 'S1' | 'S2' | 'S3' | 'DHS';
  centerName: string;
  serviceType: 'OPD' | 'IPD' | 'Lab' | 'Pharmacy' | 'Diagnostics' | 'Other';
  amount: number;
  description: string;
  innerNetRef: string;       // inner net detail reference
  attendedBy: string;
  date: string;
  familyMemberUid?: string;
  status: 'posted' | 'pending' | 'reversed';
}

export const offlineTransactions: OfflineTransaction[] = [
  { id: 'ot1', userId: 'vw1', center: 'S1', centerName: 'S1 Center Delhi',    serviceType: 'OPD',        amount: 500,  description: 'General OPD consultation',         innerNetRef: 'INET-S1-001', attendedBy: 'Dr. Meena',        date: '2025-07-01', status: 'posted',   familyMemberUid: 'UID-SHARMA-001' },
  { id: 'ot2', userId: 'vw1', center: 'S1', centerName: 'S1 Center Delhi',    serviceType: 'Lab',        amount: 850,  description: 'CBC + Lipid Profile',              innerNetRef: 'INET-S1-002', attendedBy: 'Lab Technician',  date: '2025-07-03', status: 'posted',   familyMemberUid: 'UID-SHARMA-002' },
  { id: 'ot3', userId: 'vw1', center: 'S2', centerName: 'S2 Hub Noida',       serviceType: 'Pharmacy',   amount: 320,  description: 'Paracetamol + Metformin',          innerNetRef: 'INET-S2-001', attendedBy: 'Pharmacist Raju', date: '2025-07-05', status: 'posted',   familyMemberUid: 'UID-SHARMA-003' },
  { id: 'ot4', userId: 'vw1', center: 'DHS',centerName: 'DHS Point Gurugram', serviceType: 'Diagnostics',amount: 1200, description: 'ECG + X-Ray chest',               innerNetRef: 'INET-DHS-001',attendedBy: 'Dr. Vikas',       date: '2025-07-08', status: 'posted',   familyMemberUid: 'UID-SHARMA-001' },
  { id: 'ot5', userId: 'vw1', center: 'S3', centerName: 'S3 Center Faridabad',serviceType: 'IPD',        amount: 4500, description: 'Day care procedure',              innerNetRef: 'INET-S3-001', attendedBy: 'Dr. Anita',       date: '2025-06-20', status: 'posted',   familyMemberUid: 'UID-SHARMA-004' },
  { id: 'ot6', userId: 'vw1', center: 'S1', centerName: 'S1 Center Delhi',    serviceType: 'Other',      amount: 150,  description: 'Administrative fee',              innerNetRef: 'INET-S1-003', attendedBy: 'Staff',           date: '2025-06-15', status: 'reversed', familyMemberUid: 'UID-SHARMA-001' },
];

// ── Online Transactions (Payment Gateway — Teleconsult / E-Medicine) ──────
export interface OnlineTransaction {
  id: string;
  userId: string;
  channel: 'teleconsult' | 'e_medicine' | 'lab_booking' | 'therapy';
  gateway: string;
  gatewayRef: string;
  amount: number;
  description: string;
  creditNoteRef?: string;
  familyMemberUid?: string;
  status: 'success' | 'failed' | 'refunded' | 'pending';
  date: string;
}

export const onlineTransactions: OnlineTransaction[] = [
  { id: 'ont1', userId: 'vw1', channel: 'teleconsult',  gateway: 'Razorpay', gatewayRef: 'RZP-20250705-001', amount: 150,  description: 'Teleconsult — Dr. Sarah Smith',    creditNoteRef: 'CN-001', status: 'success', date: '2025-07-05', familyMemberUid: 'UID-SHARMA-001' },
  { id: 'ont2', userId: 'vw1', channel: 'e_medicine',   gateway: 'Razorpay', gatewayRef: 'RZP-20250706-002', amount: 210,  description: 'E-Medicine order — PHARM-001',     creditNoteRef: 'CN-002', status: 'success', date: '2025-07-06', familyMemberUid: 'UID-SHARMA-002' },
  { id: 'ont3', userId: 'vw1', channel: 'lab_booking',  gateway: 'Razorpay', gatewayRef: 'RZP-20250708-003', amount: 650,  description: 'Lab booking — Thyroid panel',                       status: 'success', date: '2025-07-08', familyMemberUid: 'UID-SHARMA-003' },
  { id: 'ont4', userId: 'vw1', channel: 'teleconsult',  gateway: 'Razorpay', gatewayRef: 'RZP-20250709-004', amount: 200,  description: 'Teleconsult — Dr. James Wilson',                    status: 'pending', date: '2025-07-09', familyMemberUid: 'UID-SHARMA-001' },
  { id: 'ont5', userId: 'vw1', channel: 'therapy',      gateway: 'Razorpay', gatewayRef: 'RZP-20250703-005', amount: 500,  description: 'Mental health therapy session',    creditNoteRef: 'CN-003', status: 'refunded',date: '2025-07-03', familyMemberUid: 'UID-SHARMA-001' },
];

// ── Main Ledger Entry System ───────────────────────────────────────────────
export interface MainLedgerEntry {
  id: string;
  userId: string;
  entryType: 'debit' | 'credit';
  source: 'offline' | 'online' | 'allocation' | 'reversal' | 'settlement';
  amount: number;
  description: string;
  creditNoteRef?: string;
  masterCreditNoteRef?: string;
  relatedTxnId?: string;
  date: string;
  postedBy: string;
  status: 'posted' | 'pending' | 'reversed';
}

export const mainLedgerEntries: MainLedgerEntry[] = [
  { id: 'ml1',  userId: 'vw1', entryType: 'credit', source: 'allocation', amount: 35000, description: 'Initial fund allocation — State Wallet',    masterCreditNoteRef: 'MCN-2025-001', date: '2025-01-15', postedBy: 'Data Center', status: 'posted' },
  { id: 'ml2',  userId: 'vw1', entryType: 'debit',  source: 'offline',   amount: 500,   description: 'OPD consultation — S1 Center',              relatedTxnId: 'ot1', date: '2025-07-01', postedBy: 'S1 Center',   status: 'posted' },
  { id: 'ml3',  userId: 'vw1', entryType: 'debit',  source: 'offline',   amount: 850,   description: 'Lab tests — S1 Center',                     relatedTxnId: 'ot2', date: '2025-07-03', postedBy: 'S1 Center',   status: 'posted' },
  { id: 'ml4',  userId: 'vw1', entryType: 'debit',  source: 'online',    amount: 150,   description: 'Teleconsult — Dr. Sarah Smith',             creditNoteRef: 'CN-001', relatedTxnId: 'ont1', date: '2025-07-05', postedBy: 'Gateway', status: 'posted' },
  { id: 'ml5',  userId: 'vw1', entryType: 'debit',  source: 'offline',   amount: 320,   description: 'Pharmacy — S2 Hub',                         relatedTxnId: 'ot3', date: '2025-07-05', postedBy: 'S2 Center',   status: 'posted' },
  { id: 'ml6',  userId: 'vw1', entryType: 'debit',  source: 'online',    amount: 210,   description: 'E-Medicine order',                          creditNoteRef: 'CN-002', relatedTxnId: 'ont2', date: '2025-07-06', postedBy: 'Gateway', status: 'posted' },
  { id: 'ml7',  userId: 'vw1', entryType: 'credit', source: 'reversal',  amount: 150,   description: 'Reversal — Administrative fee',             creditNoteRef: 'CN-REV-001', relatedTxnId: 'ot6', date: '2025-06-16', postedBy: 'Admin', status: 'posted' },
  { id: 'ml8',  userId: 'vw1', entryType: 'debit',  source: 'offline',   amount: 1200,  description: 'ECG + X-Ray — DHS Point',                   relatedTxnId: 'ot4', date: '2025-07-08', postedBy: 'DHS Center',  status: 'posted' },
  { id: 'ml9',  userId: 'vw1', entryType: 'credit', source: 'reversal',  amount: 500,   description: 'Therapy session refund — online gateway',   creditNoteRef: 'CN-003', relatedTxnId: 'ont5', date: '2025-07-04', postedBy: 'Gateway', status: 'pending' },
  { id: 'ml10', userId: 'vw1', entryType: 'debit',  source: 'online',    amount: 650,   description: 'Lab booking — Thyroid panel',               creditNoteRef: 'CN-LAB-001', relatedTxnId: 'ont3', date: '2025-07-08', postedBy: 'Gateway', status: 'posted' },
  { id: 'ml11', userId: 'vw1', entryType: 'debit',  source: 'offline',   amount: 4500,  description: 'Day care procedure — S3 Center',            relatedTxnId: 'ot5', date: '2025-06-20', postedBy: 'S3 Center',   status: 'posted' },
];

// ── Credit Notes ──────────────────────────────────────────────────────────
export interface CreditNote {
  id: string;
  userId: string;
  noteRef: string;
  isMaster: boolean;
  amount: number;
  description: string;
  issuedBy: string;
  linkedLedgerIds: string[];
  date: string;
  // expanded status set — applied | issued | pending | rejected | expired
  status: 'issued' | 'applied' | 'expired' | 'pending' | 'rejected';
}

export const creditNotes: CreditNote[] = [
  // Master Credit Note — represents the ₹35,000 capital allocation. Excluded from "spend" totals.
  { id: 'cn1', userId: 'vw1', noteRef: 'MCN-2025-001', isMaster: true,  amount: 35000, description: 'Master Credit Note — Initial ₹35,000 allocation', issuedBy: 'State Data Center', linkedLedgerIds: ['ml1'], date: '2025-01-15', status: 'applied' },
  // Transaction-level credit notes (payment gateway acknowledgements)
  { id: 'cn2', userId: 'vw1', noteRef: 'CN-001',       isMaster: false, amount: 150,   description: 'Credit note — Teleconsult Razorpay',              issuedBy: 'Payment Gateway',  linkedLedgerIds: ['ml4'], date: '2025-07-05', status: 'applied'  },
  { id: 'cn3', userId: 'vw1', noteRef: 'CN-002',       isMaster: false, amount: 210,   description: 'Credit note — E-Medicine Razorpay',               issuedBy: 'Payment Gateway',  linkedLedgerIds: ['ml6'], date: '2025-07-06', status: 'applied'  },
  { id: 'cn4', userId: 'vw1', noteRef: 'CN-003',       isMaster: false, amount: 500,   description: 'Credit note — Therapy refund',                    issuedBy: 'Payment Gateway',  linkedLedgerIds: ['ml9'], date: '2025-07-03', status: 'pending'  },
  { id: 'cn5', userId: 'vw1', noteRef: 'CN-REV-001',   isMaster: false, amount: 150,   description: 'Credit note — Admin fee reversal',                issuedBy: 'S1 Center',        linkedLedgerIds: ['ml7'], date: '2025-06-16', status: 'applied'  },
  { id: 'cn6', userId: 'vw1', noteRef: 'CN-LAB-001',   isMaster: false, amount: 650,   description: 'Credit note — Lab booking Razorpay',              issuedBy: 'Payment Gateway',  linkedLedgerIds: ['ml10'],date: '2025-07-08', status: 'applied'  },
];

// ── Family Members (linked to primary Virtual Wallet card) ────────────────
export interface FamilyMember {
  id: string;
  primaryUserId: string;    // references VirtualWalletUser.id
  uid: string;              // unique government UID
  fullName: string;
  dob: string;              // YYYY-MM-DD
  gender: 'male' | 'female' | 'other';
  relationship: 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  bloodGroup?: string;
  phone?: string;
  isActive: boolean;
}

export const familyMembers: FamilyMember[] = [
  { id: 'fm1', primaryUserId: 'vw1', uid: 'UID-SHARMA-001', fullName: 'Priya Sharma',  dob: '1990-03-15', gender: 'female', relationship: 'self',    bloodGroup: 'B+', phone: '9811000001', isActive: true  },
  { id: 'fm2', primaryUserId: 'vw1', uid: 'UID-SHARMA-002', fullName: 'Rakesh Sharma', dob: '1988-07-22', gender: 'male',   relationship: 'spouse',  bloodGroup: 'O+', phone: '9811000002', isActive: true  },
  { id: 'fm3', primaryUserId: 'vw1', uid: 'UID-SHARMA-003', fullName: 'Aarav Sharma',  dob: '2015-11-08', gender: 'male',   relationship: 'child',   bloodGroup: 'B+', isActive: true  },
  { id: 'fm4', primaryUserId: 'vw1', uid: 'UID-SHARMA-004', fullName: 'Sunita Devi',   dob: '1962-05-30', gender: 'female', relationship: 'parent',  bloodGroup: 'A+', phone: '9811000004', isActive: true  },
  { id: 'fm5', primaryUserId: 'vw1', uid: 'UID-SHARMA-005', fullName: 'Rohit Sharma',  dob: '1993-02-14', gender: 'male',   relationship: 'sibling', bloodGroup: 'AB+',isActive: false },
];
