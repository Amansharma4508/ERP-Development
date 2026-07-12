import { z } from 'zod';

export const UserRole = z.enum([
  'admin',
  'state_officer',
  'district_officer',
  'center_staff',
  'doctor',
  'user',
]);

export const UserSchema = z.object({
  _id: z.string().optional(),
  fullName: z.string().min(1),
  email: z.string().email(),
  passwordHash: z.string().min(1),
  role: UserRole,
  stateId: z.string().nullable().optional(),
  districtId: z.string().nullable().optional(),
  centerId: z.string().nullable().optional(),
  walletId: z.string().nullable().optional(),
  assignedCenterId: z.string().nullable().optional(),
  status: z.enum(['pending', 'active', 'suspended']).default('pending'),
  profile: z.record(z.string(), z.any()).default({}),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type UserDocument = z.infer<typeof UserSchema>;
export type UserCreateInput = z.infer<typeof UserSchema>;
