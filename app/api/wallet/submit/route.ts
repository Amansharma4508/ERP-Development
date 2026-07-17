import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Ab ye dynamic environment variables se real keys uthayega jo aapne Vercel me daali hain
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
});

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ success: false, error: 'Invalid JSON body payload received.' }, { status: 400 });
    }

    const { userId, formData, photoBase64, photoName } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID missing' }, { status: 400 });
    }

    let finalPhotoUrl = '';

    // 1. Storage Bucket Upload
    if (photoBase64 && photoName) {
      const buffer = Buffer.from(photoBase64.split(',')[1], 'base64');
      const fileExt = photoName.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      const { data: storageData, error: storageError } = await supabaseAdmin
        .storage
        .from('live-photos')
        .upload(fileName, buffer, {
          contentType: `image/${fileExt}`,
          upsert: true
        });

      if (storageError) {
        return NextResponse.json({ success: false, error: `Storage upload rejected: ${storageError.message}` }, { status: 500 });
      }

      const { data: urlData } = supabaseAdmin
        .storage
        .from('live-photos')
        .getPublicUrl(fileName);

      finalPhotoUrl = urlData.publicUrl;
    }

    const cleanFamilyMembers = (formData.familyMembers || []).map((member: any) => ({
      name: member.name,
      dob: member.dob,
      gender: member.gender,
      relationship: member.relationship, 
      uid_provided: !!member.uid 
    }));

    // 2. Database Insertion (Bypassing RLS with Admin privileges securely)
    const { data, error } = await supabaseAdmin
      .from('wallet_applications')
      .insert([
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

          live_photo_url: finalPhotoUrl || null, 
          application_date: formData.applicationDate || new Date().toISOString().split('T')[0],
          place: formData.place,
          application_time: formData.applicationTime || formData.time || new Date().toISOString().split('T')[1].substring(0,8), 
          
          coordinator_id: formData.coordinatorId,
          field_officer_id: formData.fieldOfficerId,
          area_code: formData.areaCode,
          vending_id: formData.vendingId,

          consent_given: formData.consentGiven === undefined ? true : !!formData.consentGiven, 
          status: formData.status || 'submitted'
        }
      ])
      .select();

    if (error) {
      return NextResponse.json({ success: false, error: `Database entry failed: ${error.message}` }, { status: 400 });
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
    return NextResponse.json({ success: false, error: error.message || 'Fatal Internal Server Error' }, { status: 500 });
  }
}