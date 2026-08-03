import { NextRequest } from 'next/server';
import { doctors } from '@/lib/store';
import { successResponse, errorResponse, toJson } from '@/lib/api-utils';

// DELETE /api/admin/doctors?id=[id]
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return toJson(errorResponse('Doctor ID is required', 400));
  }

  // Agar aap array/mock store use kar rahe hain:
  const index = doctors.findIndex((d) => d.id === id);
  if (index === -1) {
    return toJson(errorResponse('Doctor not found', 404));
  }

  doctors.splice(index, 1);

  /* 
    NOTE: Agar aap Supabase use kar rahe hain, toh upar wale store code ki jagah ye likhein:
    const { error } = await supabaseAdmin.from('doctors').delete().eq('id', id);
    if (error) return toJson(errorResponse(error.message, 400));
  */

  return toJson(successResponse({ success: true, message: 'Doctor deleted successfully from database' }));
}