import { NextRequest } from 'next/server';
import { generateToken } from '@/lib/auth';
import { RegisterSchema, WalletUserApplicationSchema } from '@/lib/schemas';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';
import { users, wallets, logisticsUsers, virtualWalletUsers } from '@/lib/store';

function buildSwabCardNumber(pinCode: string, centerAssigned: string, sequence: number) {
  const prefix = '9990';
  const cleanedPin = pinCode.replace(/\D/g, '').padStart(4, '0').slice(0, 4);
  const centerMap: Record<string, string> = { S1: '001', S2: '002', S3: '003', DHS: '004' };
  const centerCode = centerMap[centerAssigned] ?? '000';
  const seq = String(sequence).padStart(4, '0');
  return `${prefix}-${cleanedPin}-${centerCode}-${seq}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = RegisterSchema.parse(body);

    // check all pools
    const existingUser = users.find((u) => u.email === validatedData.email)
      ?? logisticsUsers.find((u) => u.email === validatedData.email)
      ?? virtualWalletUsers.find((u) => u.email === validatedData.email);
    if (existingUser) return toJson(errorResponse('An account with this email already exists', 409));

    const userId = `u${Date.now()}`;

    if (validatedData.role === 'logistics') {
      const newLg = {
        id: userId, email: validatedData.email, password: validatedData.password,
        fullName: validatedData.fullName, role: 'logistics' as const,
        pointId: 'S1', area: '', block: '', district: '', zone: '',
        createdAt: new Date().toISOString().split('T')[0],
      };
      logisticsUsers.push(newLg);
      const token = generateToken({ userId, email: newLg.email, role: 'logistics' as any });
      return toJson(successResponse({ token, user: { id: userId, email: newLg.email, fullName: newLg.fullName, role: 'logistics' } }, 201));
    }

    if (validatedData.role === 'wallet_user') {
      const application = WalletUserApplicationSchema.parse(body);
      const sequence = virtualWalletUsers.length + 1;
      const cardNum = buildSwabCardNumber(application.pinCode, application.centerAssigned, sequence);
      const today = new Date().toISOString().split('T')[0];
      const newVW = {
        id: userId,
        email: application.email,
        password: application.password,
        fullName: application.fullName,
        role: 'wallet_user' as const,
        cardNumber: cardNum,
        enrollmentDate: application.applicationDate ?? today,
        enrollmentStatus: 'enrolled' as const,
        cardScanStatus: 'pending' as const,
        centerAssigned: application.centerAssigned,
        allocatedAmount: 35000,
        stateWalletBalance: 35000,
        masterLedgerBalance: 35000,
        offlineBalance: 35000,
        onlineBalance: 0,
        fatherName: application.fatherName,
        motherName: application.motherName,
        dob: application.dob,
        gender: application.gender,
        qualification: application.qualification,
        familyMembersCount: application.familyMembersCount,
        maleCount: application.maleCount,
        femaleCount: application.femaleCount,
        familyMembers: application.familyMembers,
        headOfFamily: application.headOfFamily,
        spouseName: application.spouseName,
        houseNumber: application.houseNumber,
        wardNumber: application.wardNumber,
        villageCity: application.villageCity,
        gramPanchayat: application.gramPanchayat,
        block: application.block,
        district: application.district,
        state: application.state,
        pinCode: application.pinCode,
        uidNumber: application.uidNumber,
        panCard: application.panCard,
        addressId: application.addressId,
        bloodGroup: application.bloodGroup,
        foodIntake: application.foodIntake,
        smoking: application.smoking,
        alcoholConsumption: application.alcoholConsumption,
        occupation: application.occupation,
        medicalExpensesMonthly: application.medicalExpensesMonthly,
        drinkingWaterSource: application.drinkingWaterSource,
        foodSource: application.foodSource,
        pollutionLevel: application.pollutionLevel,
        livePhotoUrl: application.livePhotoUrl,
        applicationDate: application.applicationDate ?? today,
        place: application.place,
        time: application.time,
        coordinatorId: application.coordinatorId,
        fieldOfficerId: application.fieldOfficerId,
        areaCode: application.areaCode,
        vendingId: application.vendingId,
        consentGiven: application.consentGiven,
        createdAt: today,
      };
      virtualWalletUsers.push(newVW);
      const token = generateToken({ userId, email: newVW.email, role: 'wallet_user' as any });
      return toJson(successResponse({ token, user: { id: userId, email: newVW.email, fullName: newVW.fullName, role: 'wallet_user' } }, 201));
    }

    const newUser = {
      id: userId, email: validatedData.email, password: validatedData.password,
      fullName: validatedData.fullName, role: validatedData.role,
      createdAt: new Date().toISOString().split('T')[0],
    };
    users.push(newUser);
    wallets.push({ userId, balance: 500 });

    const token = generateToken({ userId, email: newUser.email, role: newUser.role as any });
    return toJson(successResponse({ token, user: { id: userId, email: newUser.email, fullName: newUser.fullName, role: newUser.role } }, 201));
  } catch (error: any) {
    if (error.name === 'ZodError') return toJson(errorResponse(error.errors[0].message, 400));
    return toJson(errorResponse('Registration failed', 500));
  }
}
