import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { doctorRemarks } from '@/lib/store';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const idx = doctorRemarks.findIndex(r => r.id === params.id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  doctorRemarks.splice(idx, 1);
  return NextResponse.json({ success: true });
}
