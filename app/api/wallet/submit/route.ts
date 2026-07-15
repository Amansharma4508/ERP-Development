import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase Project configuration (Bypassing external env vars safely)
const supabaseUrl = 'https://ffpetzczpewaptgjwvz.supabase.co';

/**
 * !!! IMPORTANT !!!
 * Apne Supabase Dashboard -> Project Settings -> API Keys par jayein.
 * Wahan se 'service_role' (secret) key copy karein aur niche paste karein.
 * Ye key RLS policies ko bypass karke serverless route se data strictly insert hone degi.
 */
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmcGV0emN6cGV3YXB0Z3Bqd3Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAyMDMwOCwiZXhwIjoyMDk5NTk2MzA4fQ.duSFMLMAOuPkPZjdXn_VgXUrevFBLxqoTAPXKu7tpnM'; 

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
});

export async function POST(request: Request) {
  try {
    // 1. Safe JSON parsing handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Payload parse error:', parseError);
      return NextResponse.json({ success: false, error: 'Invalid or empty JSON body payload received.' }, { status: 400 });
    }

    const { userId, formData, photoBase64, photoName } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID missing' }, { status: 400 });
    }

    if (!formData) {
      return NextResponse.json({ success: false, error: 'Form data package missing' }, { status: 400 });
    }

    let finalPhotoUrl = '';

    // 2. Storage Bucket Upload using Admin Privileges
    if (photoBase64 && photoName) {
      try {
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
          console.error('Storage Engine Failure:', storageError);
          return NextResponse.json({ success: false, error: `Storage upload rejected: ${storageError.message}. Make sure 'live-photos' bucket exists.` }, { status: 500 });
        }

        const { data: urlData } = supabaseAdmin
          .storage
          .from('live-photos')
          .getPublicUrl(fileName);

        finalPhotoUrl = urlData.publicUrl;
      } catch (uploadException: any) {
        console.error('Exception during photo processing:', uploadException);
        return NextResponse.json({ success: false, error: `Photo processing crash: ${uploadException.message}` }, { status: 500 });
      }
    }

    const cleanFamilyMembers = (formData.familyMembers || []).map((member: any) => ({
      name: member.name,
      dob: member.dob,
      gender: member.gender,
      relationship: member.relationship, 
      uid_provided: !!member.uid 
    }));

    // 3. Strict Database Insertion with full constraints matching
    const { data, error } = await supabaseAdmin
      .from('wallet_applications')
      .insert([
        {
          user_id: userId,
          
          // Personal Details
          full_name: formData.fullName,
          father_name: formData.fatherName,
          mother_name: formData.motherName,
          dob: formData.dob, 
          gender: formData.gender,
          qualification: formData.qualification,
          spouse_name: formData.spouseName || null, 
          blood_group: formData.bloodGroup,
          occupation: formData.occupation,

          // Family Details
          family_members_count: Number(formData.familyMembersCount || 0),
          male_count: Number(formData.maleCount || 0),
          female_count: Number(formData.femaleCount || 0),
          head_of_family: formData.headOfFamily,
          family_members: cleanFamilyMembers, 

          // Address Details
          house_number: formData.houseNumber,
          ward_number: formData.wardNumber,
          village_city: formData.villageCity,
          gram_panchayat: formData.gramPanchayat,
          block: formData.block,
          district: formData.district,
          state: formData.state,
          pin_code: formData.pinCode,
          address_id: formData.addressId,

          // Identity & Security Omissions
          uid_number: formData.uidNumber ? '[UID Provided]' : '[Not Provided]', 
          pan_card: formData.panCard || '[PAN Omitted]', 
          food_intake: formData.foodIntake,
          smoking: formData.smoking,
          alcohol_consumption: formData.alcoholConsumption,
          medical_expenses_monthly: Number(formData.medicalExpensesMonthly || 0),
          drinking_water_source: formData.drinkingWaterSource,
          food_source: formData.foodSource,
          pollution_level: formData.pollutionLevel,

          // Metadata verification tracker
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
      console.error('Supabase DB Engine Rejected Insertion:', error);
      return NextResponse.json({ success: false, error: `Database entry failed: ${error.message}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (error: any) {
    console.error('Unhandled Server Runtime Exception:', error);
    return NextResponse.json({ success: false, error: error.message || 'Fatal Internal Server Error occurred.' }, { status: 500 });
  }
}