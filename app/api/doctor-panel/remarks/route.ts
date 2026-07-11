import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { doctorRemarks, DoctorRemark, doctors } from '@/lib/store';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const doc = doctors.find(d => d.userId === user.id);
  const remarks = doc ? doctorRemarks.filter(r => r.doctorId === doc.id) : [];
  return NextResponse.json({ success: true, data: remarks });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const doc = doctors.find(d => d.userId === user.id);
  if (!doc) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  const body = await req.json();
  const remark: DoctorRemark = {
    id: `dr${Date.now()}`, doctorId: doc.id,
    to: body.to, subject: body.subject, body: body.body,
    patientName: body.patientName,
    createdAt: new Date().toISOString().split('T')[0],
  };
  doctorRemarks.push(remark);
  return NextResponse.json({ success: true, data: remark }, { status: 201 });
}
