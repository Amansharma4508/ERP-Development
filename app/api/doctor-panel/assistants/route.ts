import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { doctorAssistants, DoctorAssistant, doctors } from '@/lib/store';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const doc = doctors.find(d => d.userId === user.id);
  const assistants = doc ? doctorAssistants.filter(a => a.doctorId === doc.id) : [];
  return NextResponse.json({ success: true, data: assistants });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const doc = doctors.find(d => d.userId === user.id);
  if (!doc) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  const body = await req.json();
  const assistant: DoctorAssistant = {
    id: `da${Date.now()}`, doctorId: doc.id,
    name: body.name, role: body.role, phone: body.phone,
    schedule: body.schedule || '', status: 'active',
  };
  doctorAssistants.push(assistant);
  return NextResponse.json({ success: true, data: assistant }, { status: 201 });
}
