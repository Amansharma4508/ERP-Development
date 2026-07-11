import { NextRequest } from 'next/server';
import { generateToken } from '@/lib/auth';
import { LoginSchema } from '@/lib/schemas';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { users, logisticsUsers, virtualWalletUsers } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = LoginSchema.parse(body);

    // check all user pools
    const user = users.find((u) => u.email === validatedData.email)
      ?? logisticsUsers.find((u) => u.email === validatedData.email)
      ?? virtualWalletUsers.find((u) => u.email === validatedData.email);

    if (!user || user.password !== validatedData.password) {
      return toJson(errorResponse('Invalid email or password', 401));
    }

    const token = generateToken({ userId: user.id, email: user.email, role: user.role as any });

    return toJson(
      successResponse({
        token,
        user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      }),
    );
  } catch (error: any) {
    if (error.name === 'ZodError') return toJson(errorResponse(error.errors[0].message, 400));
    return toJson(errorResponse('Login failed', 500));
  }
}
