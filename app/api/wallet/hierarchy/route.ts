import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';
import { authorize, AppRole } from '../../../../lib/role-guard';
import { successResponse, errorResponse, toJson, ApiError } from '../../../../lib/api-utils';

async function fetchWalletHierarchy(db: any, payload: { userId: string; role: AppRole; stateId?: string; districtId?: string; centerId?: string; }) {
  const wallets = db.collection('wallets');

  if (payload.role === 'admin') {
    return wallets.find({}).toArray();
  }

  if (payload.role === 'state_officer') {
    if (!payload.stateId) {
      throw new ApiError(403, 'State access not assigned');
    }
    return wallets.find({ stateId: payload.stateId }).toArray();
  }

  if (payload.role === 'district_officer') {
    if (!payload.districtId) {
      throw new ApiError(403, 'District access not assigned');
    }
    return wallets.find({ districtId: payload.districtId }).toArray();
  }

  if (payload.role === 'center_staff') {
    if (!payload.centerId) {
      throw new ApiError(403, 'Center access not assigned');
    }
    return wallets.find({ centerId: payload.centerId }).toArray();
  }

  throw new ApiError(403, 'Forbidden');
}

export async function GET(request: NextRequest) {
  try {
    const payload = authorize(request, ['admin', 'state_officer', 'district_officer', 'center_staff']);
    const { db } = await connectToDatabase();

    const subtree = await fetchWalletHierarchy(db, payload);
    return toJson(successResponse({ data: subtree }));
  } catch (error: any) {
    const status = error?.statusCode || 500;
    return toJson(errorResponse(error?.message || 'Internal error', status));
  }
}
