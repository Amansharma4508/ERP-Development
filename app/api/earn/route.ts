import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { earnActivities, EarnActivity } from '@/lib/store';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const activities = earnActivities.filter(a => a.userId === user.id);
  const totalPoints = activities.filter(a => a.status === 'credited').reduce((s, a) => s + a.pointsEarned, 0);
  return NextResponse.json({ success: true, data: { activities, totalPoints } });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const user = auth ? verifyToken(auth.replace('Bearer ', '')) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const activity: EarnActivity = {
    id: `ea${Date.now()}`,
    userId: user.id,
    type: body.type,
    description: body.description,
    pointsEarned: body.type === 'watch_ad' ? 10 : body.type === 'referral' ? 200 : 500,
    status: 'pending',
    createdAt: new Date().toISOString().split('T')[0],
  };
  earnActivities.push(activity);
  return NextResponse.json({ success: true, data: activity }, { status: 201 });
}
