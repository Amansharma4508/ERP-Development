import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { leaveRequests, LeaveRequest, doctors } from '@/lib/store';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const doc = doctors.find(d => d.userId === user.id);
  const leaves = doc ? leaveRequests.filter(l => l.doctorId === doc.id) : [];
  return NextResponse.json({ success: true, data: leaves });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const doc = doctors.find(d => d.userId === user.id);
  if (!doc) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  const body = await req.json();
  const leave: LeaveRequest = {
    id: `lr${Date.now()}`, doctorId: doc.id,
    leaveType: body.leaveType, fromDate: body.fromDate,
    toDate: body.toDate, reason: body.reason, status: 'pending',
    createdAt: new Date().toISOString().split('T')[0],
  };
  leaveRequests.push(leave);
  return NextResponse.json({ success: true, data: leave }, { status: 201 });
}
