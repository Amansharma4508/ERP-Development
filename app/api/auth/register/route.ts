import { NextRequest } from 'next/server';
import { generateToken } from '@/lib/auth';
import { RegisterSchema } from '@/lib/schemas';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { users, wallets, logisticsUsers, virtualWalletUsers } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = RegisterSchema.parse(body);

    // check all pools
    const existingUser = users.find((u) => u.email === validatedData.email)
      ?? logisticsUsers.find((u) => u.email === validatedData.email)
      ?? virtualWalletUsers.find((u) => u.email === validatedData.email);
    if (existingUser) return toJson(errorResponse('An account with this email already exists', 409));

    const userId = `u${Date.now()}`;

    if (validatedData.role === 'logistics') {
      const newLg = {
        id: userId, email: validatedData.email, password: validatedData.password,
        fullName: validatedData.fullName, role: 'logistics' as const,
        pointId: 'S1', area: '', block: '', district: '', zone: '',
        createdAt: new Date().toISOString().split('T')[0],
      };
      logisticsUsers.push(newLg);
      const token = generateToken({ userId, email: newLg.email, role: 'logistics' as any });
      return toJson(successResponse({ token, user: { id: userId, email: newLg.email, fullName: newLg.fullName, role: 'logistics' } }, 201));
    }

    if (validatedData.role === 'wallet_user') {
      const cardNum = `SWAB-${String(virtualWalletUsers.length + 1001).padStart(4,'0')}-${new Date().getFullYear()}`;
      const today = new Date().toISOString().split('T')[0];
      const newVW = {
        id: userId, email: validatedData.email, password: validatedData.password,
        fullName: validatedData.fullName, role: 'wallet_user' as const,
        cardNumber: cardNum, enrollmentDate: today, enrollmentStatus: 'enrolled' as const,
        cardScanStatus: 'pending' as const, centerAssigned: 'S1',
        allocatedAmount: 35000, stateWalletBalance: 35000,
        masterLedgerBalance: 35000, offlineBalance: 35000, onlineBalance: 0,
        createdAt: today,
      };
      virtualWalletUsers.push(newVW);
      const token = generateToken({ userId, email: newVW.email, role: 'wallet_user' as any });
      return toJson(successResponse({ token, user: { id: userId, email: newVW.email, fullName: newVW.fullName, role: 'wallet_user' } }, 201));
    }

    const newUser = {
      id: userId, email: validatedData.email, password: validatedData.password,
      fullName: validatedData.fullName, role: validatedData.role,
      createdAt: new Date().toISOString().split('T')[0],
    };
    users.push(newUser);
    wallets.push({ userId, balance: 500 });

    const token = generateToken({ userId, email: newUser.email, role: newUser.role as any });
    return toJson(successResponse({ token, user: { id: userId, email: newUser.email, fullName: newUser.fullName, role: newUser.role } }, 201));
  } catch (error: any) {
    if (error.name === 'ZodError') return toJson(errorResponse(error.errors[0].message, 400));
    return toJson(errorResponse('Registration failed', 500));
  }
}
