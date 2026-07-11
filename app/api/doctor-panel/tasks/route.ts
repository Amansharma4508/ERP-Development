import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { doctorTasks, DoctorTask, doctors } from '@/lib/store';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const doc = doctors.find(d => d.userId === user.id);
  const tasks = doc ? doctorTasks.filter(t => t.doctorId === doc.id) : [];
  return NextResponse.json({ success: true, data: tasks });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const doc = doctors.find(d => d.userId === user.id);
  if (!doc) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  const body = await req.json();
  const task: DoctorTask = {
    id: `dt${Date.now()}`, doctorId: doc.id,
    title: body.title, type: body.type || 'admin',
    priority: body.priority || 'medium', dueDate: body.dueDate,
    status: 'pending', notes: body.notes || '',
    createdAt: new Date().toISOString().split('T')[0],
  };
  doctorTasks.push(task);
  return NextResponse.json({ success: true, data: task }, { status: 201 });
}
