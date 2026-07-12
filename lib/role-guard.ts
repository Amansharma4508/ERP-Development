import { getTokenFromRequest, verifyToken } from './auth';
import { ApiError } from './api-utils';

export type AppRole = 'admin' | 'state_officer' | 'district_officer' | 'center_staff' | 'doctor' | 'user';

export interface AuthPayload {
  userId: string;
  email: string;
  role: AppRole;
  stateId?: string;
  districtId?: string;
  centerId?: string;
}

export function authorize(request: Request, allowedRoles: AppRole[]) {
  const token = getTokenFromRequest(request);
  if (!token) {
    throw new ApiError(401, 'Unauthorized');
  }

  const payload = verifyToken(token) as AuthPayload | null;
  if (!payload) {
    throw new ApiError(401, 'Invalid token');
  }

  if (!allowedRoles.includes(payload.role)) {
    throw new ApiError(403, 'Forbidden');
  }

  return payload;
}

export function requireAdmin(request: Request) {
  return authorize(request, ['admin']);
}

export function requireWalletAccess(request: Request) {
  return authorize(request, ['admin', 'state_officer', 'district_officer', 'center_staff', 'user']);
}
