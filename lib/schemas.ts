import { z } from 'zod';

// Auth Schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  role: z.enum(['user', 'doctor', 'admin', 'logistics', 'wallet_user']),
});

// User Schemas
export const HealthRecordSchema = z.object({
  userId: z.string(),
  bloodGroup: z.string(),
  allergies: z.array(z.string()),
  medicalHistory: z.array(z.string()),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
});

export const WalletSchema = z.object({
  userId: z.string(),
  balance: z.number().default(0),
  transactions: z.array(
    z.object({
      type: z.enum(['credit', 'debit']),
      amount: z.number(),
      description: z.string(),
      date: z.date(),
    })
  ).default([]),
});

export const FamilyMemberSchema = z.object({
  name: z.string().min(1),
  dob: z.string().min(1),
  gender: z.enum(['male', 'female', 'other']),
  relationship: z.string().min(1),
  uid: z.string().min(1),
});

export const WalletUserApplicationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  role: z.literal('wallet_user'),
  fatherName: z.string().min(1),
  motherName: z.string().min(1),
  dob: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']),
  qualification: z.string().optional(),
  familyMembersCount: z.number().int().nonnegative().optional(),
  maleCount: z.number().int().nonnegative().optional(),
  femaleCount: z.number().int().nonnegative().optional(),
  familyMembers: z.array(FamilyMemberSchema).optional(),
  headOfFamily: z.string().optional(),
  spouseName: z.string().optional(),
  houseNumber: z.string().optional(),
  wardNumber: z.string().optional(),
  villageCity: z.string().optional(),
  gramPanchayat: z.string().optional(),
  block: z.string().optional(),
  district: z.string().min(1),
  state: z.string().min(1),
  pinCode: z.string().min(4),
  uidNumber: z.string().optional(),
  panCard: z.string().optional(),
  addressId: z.string().optional(),
  bloodGroup: z.string().optional(),
  foodIntake: z.enum(['vegetarian', 'non_vegetarian', 'vegan']).optional(),
  smoking: z.enum(['regular', 'irregular', 'party']).optional(),
  alcoholConsumption: z.enum(['regular', 'irregular', 'party']).optional(),
  occupation: z.string().optional(),
  medicalExpensesMonthly: z.number().nonnegative().optional(),
  drinkingWaterSource: z.string().optional(),
  foodSource: z.string().optional(),
  pollutionLevel: z.string().optional(),
  livePhotoUrl: z.string().url().optional(),
  applicationDate: z.string().optional(),
  place: z.string().optional(),
  time: z.string().optional(),
  coordinatorId: z.string().optional(),
  fieldOfficerId: z.string().optional(),
  areaCode: z.string().optional(),
  vendingId: z.string().optional(),
  consentGiven: z.boolean(),
  centerAssigned: z.enum(['S1', 'S2', 'S3', 'DHS']),
});

// Doctor Schemas
export const DoctorProfileSchema = z.object({
  userId: z.string(),
  specialization: z.string(),
  license: z.string(),
  experience: z.number(),
  rating: z.number().default(0),
  consultationFee: z.number(),
  availableSlots: z.array(
    z.object({
      day: z.string(),
      startTime: z.string(),
      endTime: z.string(),
    })
  ),
});

export const AppointmentSchema = z.object({
  doctorId: z.string(),
  userId: z.string(),
  date: z.date(),
  time: z.string(),
  status: z.enum(['scheduled', 'completed', 'cancelled']),
  notes: z.string().optional(),
});

// Logistics Schemas
export const InventorySchema = z.object({
  name: z.string(),
  sku: z.string(),
  quantity: z.number(),
  reorderLevel: z.number(),
  unitCost: z.number(),
  category: z.string(),
  supplier: z.string().optional(),
});

export const OrderSchema = z.object({
  orderId: z.string(),
  supplierId: z.string(),
  items: z.array(
    z.object({
      itemId: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
    })
  ),
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
  totalAmount: z.number(),
  orderDate: z.date(),
  deliveryDate: z.date().optional(),
});

// Accounting Schemas
export const TransactionSchema = z.object({
  transactionId: z.string(),
  type: z.enum(['income', 'expense']),
  category: z.string(),
  amount: z.number(),
  description: z.string(),
  date: z.date(),
  reference: z.string().optional(),
});

// Center Schemas
export const CenterSchema = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string().email(),
  managerId: z.string(),
  staff: z.array(z.string()).default([]),
});

// Vendor Schemas
export const VendorSchema = z.object({
  name: z.string(),
  contactPerson: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
  paymentTerms: z.string(),
  rating: z.number().default(0),
});
