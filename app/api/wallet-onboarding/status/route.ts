import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const p = verifyToken(token);
    if (!p) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Yahan aap database se user ka wallet status la sakte hain. 
    // Filhaal ke liye default 'approved' ya 'pending' return kar rahe hain:
    return NextResponse.json({ 
      success: true, 
      data: { status: 'approved' } // ya 'pending' / 'none'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}