import { NextRequest } from 'next/server';
import { generateToken } from '@/lib/auth';
import { RegisterSchema } from '@/lib/schemas';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { users, wallets } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = RegisterSchema.parse(body);

    const existing = users.find((u) => u.email === validatedData.email);
    if (existing) return toJson(errorResponse('An account with this email already exists', 409));

    const userId = `u${Date.now()}`;
    const newUser = {
      id: userId,
      email: validatedData.email,
      password: validatedData.password,
      fullName: validatedData.fullName,
      role: validatedData.role,
      createdAt: new Date().toISOString().split('T')[0],
    };

    users.push(newUser);
    // Give new users a starter wallet balance
    wallets.push({ userId, balance: 500 });

    const token = generateToken({ userId, email: newUser.email, role: newUser.role as any });

    return toJson(
      successResponse(
        { token, user: { id: userId, email: newUser.email, fullName: newUser.fullName, role: newUser.role } },
        201,
      ),
    );
  } catch (error: any) {
    if (error.name === 'ZodError') return toJson(errorResponse(error.errors[0].message, 400));
    return toJson(errorResponse('Registration failed', 500));
  }
}
