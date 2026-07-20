import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Ab ye dynamic environment variables se real keys uthayega jo aapne Vercel me daali hain
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

export async function POST(request: Request) {
  try {
    // ---- Ab client FormData (multipart) bhejta hai, base64 JSON nahi ----
    // Isse large photo uploads par "Request Entity Too Large" wala issue nahi aata,
    // aur agar aa bhi jaaye to neeche hamesha valid JSON response return hota hai.
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: 'Expected multipart/form-data request.' },
        { status: 400 },
      );
    }

    const incoming = await request.formData();

    const userId = incoming.get('userId') as string | null;
    const formDataRaw = incoming.get('formData') as string | null;
    const photoFile = incoming.get('photo') as File | null;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID missing' }, { status: 400 });
    }

    let formData: any;
    try {
      formData = formDataRaw ? JSON.parse(formDataRaw) : {};
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid form data payload received.' },
        { status: 400 },
      );
    }

    let finalPhotoUrl = '';

    // 1. Storage Bucket Upload
    if (photoFile) {
      const arrayBuffer = await photoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileExt = (photoFile.name.split('.').pop() || 'jpg').toLowerCase();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      const { error: storageError } = await supabaseAdmin.storage
        .from('live-photos')
        .upload(fileName, buffer, {
          contentType: photoFile.type || `image/${fileExt}`,
          upsert: true,
        });

      if (storageError) {
        return NextResponse.json(
          { success: false, error: `Storage upload rejected: ${storageError.message}` },
          { status: 500 },
        );
      }

      const { data: urlData } = supabaseAdmin.storage.from('live-photos').getPublicUrl(fileName);
      finalPhotoUrl = urlData.publicUrl;
    }

    const cleanFamilyMembers = (formData.familyMembers || []).map((member: any) => ({
      name: member.name,
      dob: member.dob,
      gender: member.gender,
      relationship: member.relationship,
      uid_provided: !!member.uid,
    }));

    // 2. Database Upsert (INSERT ki jagah UPSERT — agar user_id already exist karta hai
    //    to row UPDATE ho jaayegi, "duplicate key value violates unique constraint" nahi aayega)
    const { data, error } = await supabaseAdmin
      .from('wallet_applications')
      .upsert(
        [
          {
            user_id: userId,
            full_name: formData.fullName,
            father_name: formData.fatherName,
            mother_name: formData.motherName,
            dob: formData.dob,
            gender: formData.gender,
            qualification: formData.qualification,
            spouse_name: formData.spouseName || null,
            blood_group: formData.bloodGroup,
            occupation: formData.occupation,

            family_members_count: Number(formData.familyMembersCount || 0),
            male_count: Number(formData.maleCount || 0),
            female_count: Number(formData.femaleCount || 0),
            head_of_family: formData.headOfFamily,
            family_members: cleanFamilyMembers,

            house_number: formData.houseNumber,
            ward_number: formData.wardNumber,
            village_city: formData.villageCity,
            gram_panchayat: formData.gramPanchayat,
            block: formData.block,
            district: formData.district,
            state: formData.state,
            pin_code: formData.pinCode,
            address_id: formData.addressId,

            uid_number: formData.uidNumber ? '[UID Provided]' : '[Not Provided]',
            pan_card: formData.panCard || '[PAN Omitted]',
            food_intake: formData.foodIntake,
            smoking: formData.smoking,
            alcohol_consumption: formData.alcoholConsumption,
            medical_expenses_monthly: Number(formData.medicalExpensesMonthly || 0),
            drinking_water_source: formData.drinkingWaterSource,
            food_source: formData.foodSource,
            pollution_level: formData.pollutionLevel,

            // Naya photo mile to hi URL update karo, warna purana URL mat udaao
            ...(finalPhotoUrl ? { live_photo_url: finalPhotoUrl } : {}),
            application_date: formData.applicationDate || new Date().toISOString().split('T')[0],
            place: formData.place,
            application_time:
              formData.applicationTime ||
              formData.time ||
              new Date().toISOString().split('T')[1].substring(0, 8),

            coordinator_id: formData.coordinatorId,
            field_officer_id: formData.fieldOfficerId,
            area_code: formData.areaCode,
            vending_id: formData.vendingId,

            consent_given: formData.consentGiven === undefined ? true : !!formData.consentGiven,
            status: formData.status || 'submitted',
          },
        ],
        { onConflict: 'user_id' },
      )
      .select();

    if (error) {
      return NextResponse.json(
        { success: false, error: `Database entry failed: ${error.message}` },
        { status: 400 },
      );
    }

    if (finalPhotoUrl) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ photo_url: finalPhotoUrl }) // Yahan pura URL save ho jayega
        .eq('id', userId);

      if (profileError) {
        console.error('Profile update failed:', profileError.message);
      }
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    // Yahan bhi hamesha valid JSON hi return hota hai — client kabhi
    // "Unexpected token ... is not valid JSON" jaisa error nahi dekhega
    return NextResponse.json(
      { success: false, error: error?.message || 'Fatal Internal Server Error' },
      { status: 500 },
    );
  }
}