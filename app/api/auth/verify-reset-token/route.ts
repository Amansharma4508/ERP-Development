import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/jwt-config';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Missing reset token.' }, { status: 400 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    if (!decoded || decoded.purpose !== 'password-reset' || !decoded.email) {
      return NextResponse.json({ valid: false, error: 'Invalid reset token.' }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      email: decoded.email,
      message: 'Reset token is valid.',
    });
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: 'This reset link is invalid or has expired. Please request a new one.' },
      { status: 401 },
    );
  }
}
