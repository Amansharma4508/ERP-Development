import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { careBookings, CareBooking } from '@/lib/store';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const bookings = careBookings.filter(b => b.userId === user.id);
  return NextResponse.json({ success: true, data: bookings });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const booking: CareBooking = {
    id: `cb${Date.now()}`,
    userId: user.id,
    type: body.type,
    doctorName: body.doctorName || '',
    centerName: body.centerName,
    scheduledDate: body.scheduledDate,
    scheduledTime: body.scheduledTime,
    status: 'scheduled',
    notes: body.notes || '',
    fee: body.fee || 0,
    createdAt: new Date().toISOString().split('T')[0],
  };
  careBookings.push(booking);
  return NextResponse.json({ success: true, data: booking }, { status: 201 });
}
