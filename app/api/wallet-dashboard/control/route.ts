import { NextRequest } from 'next/server';
import { paymentControls, walletActivityLog, users } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { verifyToken } from '@/lib/auth';

function adminGuard(token: string | undefined) {
  if (!token) return null;
  const p = verifyToken(token);
  if (!p || p.role !== 'admin') return null;
  return p;
}

// POST /api/wallet-dashboard/control
// Body: { controlId, action: 'pause' | 'resume', reason? }
// Toggles the paused state for a wallet entity.
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  const payload = adminGuard(token);
  if (!payload) return toJson(errorResponse('Unauthorized — admin access required', 401));

  const body = await request.json();
  const { controlId, action, reason } = body as {
    controlId: string;
    action: 'pause' | 'resume';
    reason?: string;
  };

  if (!controlId || !action) {
    return toJson(errorResponse('controlId and action are required', 400));
  }
  if (action !== 'pause' && action !== 'resume') {
    return toJson(errorResponse('action must be "pause" or "resume"', 400));
  }

  const control = paymentControls.find((c) => c.id === controlId);
  if (!control) return toJson(errorResponse('Payment control record not found', 404));

  const admin = users.find((u) => u.id === payload.userId);
  const adminName = admin?.fullName ?? payload.email;
  const now = new Date().toISOString();

  if (action === 'pause') {
    if (control.paused) return toJson(errorResponse('Payments are already paused for this entity', 409));
    control.paused     = true;
    control.pausedAt   = now;
    control.pausedBy   = adminName;
    control.pauseReason = reason ?? 'No reason provided';
    control.resumedAt  = undefined;
    control.resumedBy  = undefined;
  } else {
    if (!control.paused) return toJson(errorResponse('Payments are not paused for this entity', 409));
    control.paused     = false;
    control.resumedAt  = now;
    control.resumedBy  = adminName;
    control.pauseReason = undefined;
  }

  // Log the activity
  walletActivityLog.push({
    id:          `wal${Date.now()}`,
    entityType:  control.entityType,
    entityName:  control.entityName,
    action:      action === 'pause' ? 'payment_paused' : 'payment_resumed',
    performedBy: adminName,
    timestamp:   now,
  });

  return toJson(
    successResponse({
      control,
      message: action === 'pause'
        ? `Payments paused for ${control.entityName}`
        : `Payments resumed for ${control.entityName}`,
    }),
  );
}

// GET /api/wallet-dashboard/control
// Returns all payment control records
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  const payload = adminGuard(token);
  if (!payload) return toJson(errorResponse('Unauthorized — admin access required', 401));

  const paused  = paymentControls.filter((c) => c.paused);
  const active  = paymentControls.filter((c) => !c.paused);

  return toJson(
    successResponse({
      all:    paymentControls,
      paused,
      active,
      stats: {
        total:       paymentControls.length,
        pausedCount: paused.length,
        activeCount: active.length,
      },
    }),
  );
}
