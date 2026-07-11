import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supportTickets, SupportTicket } from '@/lib/store';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tickets = user.role === 'admin'
    ? supportTickets
    : supportTickets.filter(t => t.userId === user.id);
  return NextResponse.json({ success: true, data: tickets });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const ticket: SupportTicket = {
    id: `st${Date.now()}`,
    ticketId: `TKT-${String(supportTickets.length + 1).padStart(3, '0')}`,
    userId: user.id,
    userName: user.fullName,
    type: body.type || 'query',
    subject: body.subject,
    description: body.description,
    status: 'open',
    priority: body.priority || 'medium',
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  };
  supportTickets.push(ticket);
  return NextResponse.json({ success: true, data: ticket }, { status: 201 });
}
