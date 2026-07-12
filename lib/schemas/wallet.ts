import { z } from 'zod';

export const WalletType = z.enum(['master', 'state', 'district', 'center', 'user']);

export const WalletBaseSchema = z.object({
  _id: z.string().optional(),
  type: WalletType,
  name: z.string().min(1),
  code: z.string().min(1),
  parentWalletId: z.string().nullable().optional(),
  stateId: z.string().nullable().optional(),
  districtId: z.string().nullable().optional(),
  centerId: z.string().nullable().optional(),
  ownerUserId: z.string().nullable().optional(),
  currency: z.string().default('INR'),
  meta: z.record(z.string(), z.any()).default({}),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const WalletDocumentSchema = WalletBaseSchema.extend({
  balanceCached: z.number().nonnegative().default(0),
  totalReceivedCached: z.number().nonnegative().default(0),
  totalDisbursedCached: z.number().nonnegative().default(0),
});

export type WalletDocument = z.infer<typeof WalletDocumentSchema>;
export type WalletCreateInput = z.infer<typeof WalletBaseSchema>;
